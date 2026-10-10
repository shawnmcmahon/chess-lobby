const crypto = require('node:crypto');
const fs = require('node:fs');
const cp = require('node:child_process');

const PROVIDER = { login: 'chatgpt-codex-connector[bot]', id: 199175422 };
const MARKER = '<!-- codex-review-followup:v1 ';
const trusted = (user) => user?.login === PROVIDER.login && user?.id === PROVIDER.id && user?.type === 'Bot';
const actionable = (body) => /\bP[012]\b|\b(?:Critical|High|Medium)\b/i.test(body || '');
const clean = (text) => String(text || '').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, '').slice(0, 6000);
const fingerprint = (head, findings) => crypto.createHash('sha256').update(JSON.stringify([head, findings.map(f => f.id).sort()])).digest('hex').slice(0, 24);
const eligible = (pr, repository) => pr.state === 'open' && !pr.draft && pr.head.repo?.full_name === repository && pr.user.login === 'shawnmcmahon' && !pr.head.ref.startsWith('codex/review-fix-');
function completedSummaryAt(body, head) {
  const match = String(body || '').match(/<!-- codex-security-review:v1 (\{[^\n]*\}) -->/);
  if (!match) return false;
  try { const metadata=JSON.parse(match[1]);return metadata.status === 'completed' && metadata.headSha === head; } catch {return false;}
}
function states(comments) {
  return comments.filter(c => c.user.login === 'github-actions[bot]' && c.user.type === 'Bot').flatMap(c => {
    const start = c.body.indexOf(MARKER);
    if (start < 0) return [];
    try { return [{ ...JSON.parse(c.body.slice(start + MARKER.length).split(' -->')[0]), comment_id: c.id }]; } catch { return []; }
  });
}
function canAttempt(history, head) {
  const attempts = history.filter(s => s.attempt === true);
  return attempts.length < 2 && !attempts.some(s => s.head === head);
}
async function getFindings(github, repo, number, head) {
  const findings = [];
  let cursor = null;
  do {
    const result = await github.graphql(`query($owner:String!,$repo:String!,$number:Int!,$cursor:String) {
      repository(owner:$owner,name:$repo) { pullRequest(number:$number) {
        reviewThreads(first:100,after:$cursor) { pageInfo { hasNextPage endCursor } nodes {
          id isResolved isOutdated path line comments(first:100) { pageInfo { hasNextPage } nodes {
            databaseId body author { login } commit { oid } originalCommit { oid }
          } }
        } }
      } }
    }`, { ...repo, number, cursor });
    const connection = result.repository.pullRequest.reviewThreads;
    for (const thread of connection.nodes) {
      if (thread.isResolved || thread.isOutdated || thread.comments.pageInfo.hasNextPage) continue;
      for (const comment of thread.comments.nodes) {
        if (![PROVIDER.login, PROVIDER.login.replace(/\[bot\]$/, '')].includes(comment.author?.login) || comment.commit?.oid !== head || !actionable(comment.body)) continue;
        // REST confirms the numeric bot identity; a display name alone is not trusted.
        const { data: original } = await github.rest.pulls.getReviewComment({ ...repo, comment_id: comment.databaseId });
        if (!trusted(original.user) || original.commit_id !== head) continue;
        findings.push({ id: comment.databaseId, thread_id: thread.id, path: thread.path, line: thread.line, body: clean(comment.body), url: original.html_url });
      }
    }
    cursor = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;
    if (findings.length > 20) throw new Error('More than 20 findings require human triage.');
  } while (cursor);
  return findings;
}
async function gate({ github, context, core, enabled, hasKey }) {
  const event = context.payload;
  const manual = context.eventName === 'workflow_dispatch';
  const source = event.review || event.comment;
  if (!manual && !trusted(source?.user)) { core.info('Ignored untrusted review provider.'); return null; }
  if (manual) {
    const { data } = await github.rest.repos.getCollaboratorPermissionLevel({ ...context.repo, username: context.actor });
    if (!['admin', 'maintain', 'write'].includes(data.permission)) throw new Error('Manual replay requires repository write permission.');
  }
  const number = Number(event.pull_request?.number || event.issue?.number || event.inputs?.pull_request);
  if (!Number.isSafeInteger(number) || number < 1 || (!manual && context.eventName === 'issue_comment' && !event.issue?.pull_request)) return null;
  const { data: pr } = await github.rest.pulls.get({ ...context.repo, pull_number: number });
  if (pr.state !== 'open') { core.info('Closed PRs are not acknowledged.'); return null; }
  const repairEligible = eligible(pr, `${context.repo.owner}/${context.repo.repo}`);
  if (event.review && event.review.commit_id !== pr.head.sha) { core.info('Ignored a stale review.'); return null; }
  if (!manual && context.eventName === 'issue_comment' && !completedSummaryAt(source.body, pr.head.sha)) { core.info('Waiting for a completed summary at the current head.'); return null; }
  const comments = await github.paginate(github.rest.issues.listComments, { ...context.repo, issue_number: number, per_page: 100 });
  if (manual) {
    const reviews = await github.paginate(github.rest.pulls.listReviews, { ...context.repo, pull_number: number, per_page: 100 });
    if (!reviews.some(r => trusted(r.user) && r.commit_id === pr.head.sha && r.state !== 'DISMISSED') && !comments.some(c => trusted(c.user) && completedSummaryAt(c.body, pr.head.sha))) { core.info('The current head needs a completed provider review before replay.'); return null; }
  }
  const findings = await getFindings(github, context.repo, number, pr.head.sha);
  if (!findings.length) { await core.summary.addRaw(`PR #${number}: no current, unresolved findings from the configured provider.`).write(); return null; }
  const history = states(comments);
  const key = fingerprint(pr.head.sha, findings);
  const attempt = repairEligible && enabled && hasKey && canAttempt(history, pr.head.sha);
  const previous = history.find(s => s.key === key && s.attempt === attempt);
  if (previous) { core.info('This finding set has already been acknowledged.'); return null; }
  const reason = !repairEligible ? 'These findings need a maintainer: automatic repair applies only to open, ready, same-repository PRs authored by Shawn.' : !enabled ? 'Automatic repair is disabled. A maintainer can address the findings manually; the linked-account @codex fix trigger also requires a configured legacy cloud environment.' : !hasKey ? 'Automatic repair is waiting for a repository OPENAI_API_KEY secret. No API request was made.' : !canAttempt(history, pr.head.sha) ? 'The repair limit was reached (one attempt per head, two per PR). A maintainer must review the remaining findings.' : 'A bounded repair attempt is starting. A small patch can be pushed to this PR only after project validation and a current-head check.';
  const marker = `${MARKER}${JSON.stringify({ key, head: pr.head.sha, attempt, run: context.runId })} -->`;
  const { data: receipt } = await github.rest.issues.createComment({ ...context.repo, issue_number: number, body: `${marker}\nCodex review follow-up: ${findings.length} current finding(s) at \`${pr.head.sha}\`.\n\n${reason}\n\n${findings.map(f => `- [Finding ${f.id}](${f.url})`).join('\n')}\n\n[Workflow audit](https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}). Findings remain open until a maintainer verifies the result. This hook never merges pull requests.` });
  const snapshot = { number, head: pr.head.sha, branch: pr.head.ref, findings, key, comment_id: receipt.id, run_fix: attempt };
  core.setOutput('snapshot', JSON.stringify(snapshot)); core.setOutput('run_fix', String(attempt)); core.setOutput('head', pr.head.sha);
  await core.summary.addRaw(reason).write();
  return snapshot;
}
function git(args, cwd) { return cp.execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 }); }
function validatePath(path) {
  if (!path || /[\x00-\x1f\\]/.test(path) || path.startsWith('/') || path.split('/').includes('..')) throw new Error('Invalid patch path.');
  if (/^(?:\.github|\.codex|\.cursor|infra)(?:\/|$)|(?:^|\/)(?:AGENTS\.md|\.env(?:\..*)?|.*\.(?:pem|key))$/i.test(path)) throw new Error(`Protected path requires human review: ${path}`);
}
function applyResult(result, cwd) {
  if (result.decision !== 'patch') throw new Error('Codex deferred this finding for human judgment.');
  if (typeof result.patch !== 'string' || !result.patch || Buffer.byteLength(result.patch) > 100000) throw new Error('Missing or oversized patch.');
  if (/GIT binary patch|Binary files|(?:new|old|new file|deleted file) mode (?!100644)/.test(result.patch)) throw new Error('Binary, symlink, and executable mode changes require human review.');
  const patchPath = require('node:path').join(require('node:os').tmpdir(), `codex-${crypto.randomUUID()}.patch`);
  fs.writeFileSync(patchPath, result.patch);
  try { git(['-c', 'core.hooksPath=/dev/null', 'apply', '--index', '--whitespace=error-all', patchPath], cwd); } finally { fs.unlinkSync(patchPath); }
  // Enumerate a rename as its deletion and addition so the REST tree matches the
  // validated Git index exactly, even if rename detection is configured globally.
  const paths = git(['diff', '--cached', '--name-only', '-z'], cwd).split('\0').filter(Boolean);
  if (!paths.length || paths.length > 20) throw new Error('A patch must change between one and twenty files.');
  for (const path of paths) {
    validatePath(path);
    const entries = git(['ls-files', '--stage', '--', path], cwd);
    if (entries && !entries.startsWith('100644 ')) throw new Error(`Unsupported file mode: ${path}`);
  }
  git(['diff', '--cached', '--check'], cwd);
  return paths;
}
async function publish({ github, context, core, snapshot, result, cwd, expectedDigest }) {
  const { data: pr } = await github.rest.pulls.get({ ...context.repo, pull_number: snapshot.number });
  if (!eligible(pr, `${context.repo.owner}/${context.repo.repo}`) || pr.head.sha !== snapshot.head) throw new Error('PR changed while repair was running; refusing to push.');
  const paths = applyResult(result, cwd);
  const patch = git(['diff', '--cached', '--binary'], cwd);
  if (crypto.createHash('sha256').update(patch).digest('hex') !== expectedDigest) throw new Error('The patch does not match the validated digest.');
  const tree = [];
  for (const path of paths) {
    const entry = git(['ls-files', '--stage', '--', path], cwd);
    if (!entry) { tree.push({path, mode:'100644', type:'blob', sha:null}); continue; }
    const blob = await github.rest.git.createBlob({ ...context.repo, content: fs.readFileSync(require('node:path').join(cwd, path)).toString('base64'), encoding:'base64' });
    tree.push({path, mode:'100644', type:'blob', sha:blob.data.sha});
  }
  const parent = await github.rest.git.getCommit({ ...context.repo, commit_sha:snapshot.head });
  const newTree = await github.rest.git.createTree({ ...context.repo, base_tree:parent.data.tree.sha, tree });
  const commit = await github.rest.git.createCommit({ ...context.repo, message:`Address Codex review findings (${snapshot.key})`, tree:newTree.data.sha, parents:[snapshot.head] });
  // A concurrent push makes this update non-fast-forward, so GitHub rejects it.
  await github.rest.git.updateRef({ ...context.repo, ref:`heads/${snapshot.branch}`, sha:commit.data.sha, force:false });
  core.setOutput('commit', commit.data.sha);
  return commit.data.sha;
}
async function finish({ github, context, core, snapshot, result, validation, publishedCommit, artifactUrl }) {
  const { data: pr } = await github.rest.pulls.get({ ...context.repo, pull_number: snapshot.number });
  const current = eligible(pr, `${context.repo.owner}/${context.repo.repo}`) && pr.head.sha === snapshot.head;
  const explanation = clean(result?.explanation || 'The generation or validation job failed. Inspect the workflow logs.').replace(/@/g, '@\u200b');
  const status = publishedCommit ? `Validated repair pushed as [\`${publishedCommit.slice(0,7)}\`](https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${publishedCommit}). Check the latest CI and verify the behavior before resolving findings. GitHub may require approval for workflows caused by its Actions token.` : validation === 'success' && current ? `A validated patch is available in the [workflow artifacts](${artifactUrl}), but publishing failed. Inspect the logs before applying it to this exact head.` : !current ? 'The PR head or eligibility changed. The patch must not be applied; replay against the latest review.' : 'No validated patch is available. This finding needs human attention; inspect the workflow logs.';
  await github.rest.issues.createComment({ ...context.repo, issue_number: snapshot.number, body: `Codex repair result for \`${snapshot.head}\`: ${status}\n\n${explanation}\n\nFindings remain unresolved. This hook never merges pull requests.` });
  await core.summary.addRaw(status).write();
}
module.exports = { PROVIDER, trusted, actionable, clean, fingerprint, eligible, completedSummaryAt, states, canAttempt, getFindings, gate, validatePath, applyResult, publish, finish };
