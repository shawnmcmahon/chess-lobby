const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const e = require('./review-engine.cjs');
test('provider identity cannot be spoofed by a matching login', () => {
  assert.equal(e.trusted({ ...e.PROVIDER, type:'Bot' }), true);
  assert.equal(e.trusted({ ...e.PROVIDER, id:1, type:'Bot' }), false);
  assert.equal(e.trusted({ ...e.PROVIDER, type:'User' }), false);
});
test('forks, drafts, closed PRs, other authors and repair branches cannot start repair', () => {
  const pr = { state:'open', draft:false, user:{login:'shawnmcmahon'}, head:{repo:{full_name:'owner/repo'},ref:'feature'} };
  assert.equal(e.eligible(pr,'owner/repo'),true);
  for (const changed of [{state:'closed'},{draft:true},{user:{login:'outsider'}},{head:{repo:{full_name:'fork/repo'},ref:'feature'}},{head:{repo:{full_name:'owner/repo'},ref:'codex/review-fix-1'}}]) assert.equal(e.eligible({...pr,...changed},'owner/repo'),false);
});
test('repair attempts are limited per head and per PR, independent of finding IDs', () => {
  assert.equal(e.canAttempt([{attempt:false,head:'a'}],'a'),true);
  assert.equal(e.canAttempt([{attempt:true,head:'a'}],'a'),false);
  assert.equal(e.canAttempt([{attempt:true,head:'a'},{attempt:true,head:'b'}],'c'),false);
});
test('finding keys deduplicate reordered events and change for a new head', () => {
  assert.equal(e.fingerprint('a',[{id:2},{id:1}]),e.fingerprint('a',[{id:1},{id:2}]));
  assert.notEqual(e.fingerprint('a',[{id:1}]),e.fingerprint('b',[{id:1}]));
});
test('audit state is accepted only from the workflow bot', () => {
  const body='<!-- codex-review-followup:v1 {"head":"a","attempt":true} -->';
  assert.equal(e.states([{id:1,body,user:{login:'shawnmcmahon',type:'User'}}]).length,0);
  assert.equal(e.states([{id:2,body,user:{login:'github-actions[bot]',type:'Bot'}}])[0].comment_id,2);
});
test('patches cannot change automation, agent instructions, credentials or infrastructure', () => {
  for (const p of ['.github/workflows/test.yml','AGENTS.md','src/AGENTS.md','.codex/config.toml','.env.production','infra/app.ts','cert.key','../outside','a\nb']) assert.throws(()=>e.validatePath(p));
  for (const p of ['src/app.ts','tests/app.test.ts','README.md']) assert.doesNotThrow(()=>e.validatePath(p));
});
test('patch applies exactly to the supplied base and stale patches fail', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'codex-review-test-'));
  const git=(...args)=>cp.execFileSync('git',args,{cwd:dir,encoding:'utf8'});
  try {
    git('init','-q'); git('config','user.email','test@example.com'); git('config','user.name','Test');
    fs.writeFileSync(path.join(dir,'app.txt'),'old\n'); git('add','.'); git('commit','-qm','base');
    fs.writeFileSync(path.join(dir,'app.txt'),'new\n'); const patch=git('diff'); git('checkout','--','app.txt');
    assert.deepEqual(e.applyResult({decision:'patch',patch},dir),['app.txt']);
    assert.throws(()=>e.applyResult({decision:'patch',patch},dir));
    assert.throws(()=>e.applyResult({decision:'patch',patch:'GIT binary patch'},dir));
    assert.throws(()=>e.applyResult({decision:'needs_human',patch:''},dir));
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
test('GraphQL bot names omit the suffix; REST still verifies numeric identity', async () => {
  const comment={databaseId:12,body:'[P1] Breaks writes',author:{login:'chatgpt-codex-connector'},commit:{oid:'head'}};
  const thread={id:'thread',path:'src/app.ts',line:4,isResolved:false,isOutdated:false,comments:{pageInfo:{hasNextPage:false},nodes:[comment]}};
  let reads=0;
  const github={graphql:async()=>({repository:{pullRequest:{reviewThreads:{pageInfo:{hasNextPage:false},nodes:[thread,{...thread,isResolved:true},{...thread,isOutdated:true},{...thread,comments:{pageInfo:{hasNextPage:false},nodes:[{...comment,commit:{oid:'old'}}]}}]}}}}),rest:{pulls:{getReviewComment:async()=>{reads++;return {data:{user:{...e.PROVIDER,type:'Bot'},commit_id:'head',html_url:'https://example.test/finding'}};}}}};
  const findings=await e.getFindings(github,{owner:'owner',repo:'repo'},1,'head');
  assert.equal(findings.length,1);assert.equal(reads,1);
});
test('missing API credentials acknowledge real findings without starting repair', async () => {
  const provider={...e.PROVIDER,type:'Bot'};
  const pr={state:'open',draft:false,number:1,user:{login:'shawnmcmahon'},head:{sha:'head',ref:'feature',repo:{full_name:'owner/repo'}}};
  const comment={databaseId:12,body:'[P1] Breaks writes',author:{login:e.PROVIDER.login},commit:{oid:'head'}};
  const thread={id:'thread',path:'src/app.ts',line:4,isResolved:false,isOutdated:false,comments:{pageInfo:{hasNextPage:false},nodes:[comment]}};
  const receipts=[];const outputs={};
  const github={graphql:async()=>({repository:{pullRequest:{reviewThreads:{pageInfo:{hasNextPage:false},nodes:[thread]}}}}),paginate:async()=>[],rest:{pulls:{get:async()=>({data:pr}),getReviewComment:async()=>({data:{user:provider,commit_id:'head',html_url:'https://example.test/finding'}})},issues:{listComments(){},createComment:async(data)=>{receipts.push(data.body);return {data:{id:20}};}}}};
  const core={info(){},setOutput:(name,value)=>outputs[name]=value,summary:{addRaw(){return this;},async write(){}}};
  const context={repo:{owner:'owner',repo:'repo'},eventName:'pull_request_review',runId:30,payload:{pull_request:{number:1},review:{user:provider,commit_id:'head'}}};
  const snapshot=await e.gate({github,context,core,enabled:true,hasKey:false});
  assert.equal(snapshot.run_fix,false);assert.equal(outputs.run_fix,'false');assert.match(receipts[0],/waiting for a repository OPENAI_API_KEY/);
  assert.equal(await e.gate({github,context:{...context,payload:{...context.payload,review:{user:provider,commit_id:'old'}}},core,enabled:true,hasKey:true}),null);
  assert.equal(receipts.length,1);
});
test('publishing aborts before writes when the PR head changed', async () => {
  const github={rest:{pulls:{get:async()=>({data:{state:'open',draft:false,user:{login:'shawnmcmahon'},head:{sha:'new',ref:'feature',repo:{full_name:'owner/repo'}}}})}}};
  await assert.rejects(()=>e.publish({github,context:{repo:{owner:'owner',repo:'repo'}},snapshot:{number:1,head:'old'},result:{},cwd:'.',core:{}}),/refusing to push/);
});
