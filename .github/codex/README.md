# PR review follow-up engine

This repository hosts the shared, commit-pinned GitHub workflow used by Shawn's six existing GitHub projects saved in Codex. The per-repository caller is `.github/workflows/codex-review-followup.yml`. Updating this engine does not silently update its callers: review a new engine commit and update the immutable pin in each caller.

## What runs

Native Codex Code Review and Security Review are configured separately in ChatGPT Settings → Code Review → the selected repository. Code Review and Security Review each cover all PRs on every push. Account-wide preferences, credit overage, required approvals, deployments and merge rules are unchanged. Native review usage counts against the connected ChatGPT account's review limits.

The GitHub hook accepts submitted reviews and created/edited PR summary comments only from `chatgpt-codex-connector[bot]` (GitHub user ID `199175422`). It reads unresolved, current-head inline findings, confirms the bot's numeric identity through GitHub, and posts an audit receipt with links. Event delivery is serialized per PR and repeated finding sets are acknowledged once. A maintainer can replay the hook in Actions with a PR number; replay still fetches and validates real provider findings. It does not accept a human comment containing a forged bot name or priority.

Repairs apply only to open, ready PRs authored by Shawn in the same repository. Forks, drafts, closed PRs, stale/outdated/resolved findings, and repair branches are excluded. Review coverage still applies to other PRs. Large finding sets, ambiguous changes, protected automation/infrastructure/credential files, binaries and executable mode changes require human attention.

## Automatic repair activation

Installation enables the audit hook. API-backed repair remains disabled until both of these repository settings exist:

1. Add an `OPENAI_API_KEY` Actions secret through GitHub's secure secret-entry UI. Use a dedicated OpenAI project key with a budget appropriate for this automation. Never use a copied desktop/session credential, and never put the key in a PR, file, comment or chat.
2. Set the repository Actions variable `CODEX_REVIEW_REPAIR_ENABLED` to `true` after accepting the separate OpenAI API usage. GitHub runner minutes may also be charged after the account's included allowance, especially for private repositories.

No API request is made with the default settings. Adding the key alone does not activate repair. Native reviews continue using the connected account and do not need this key. The documented human-linked cloud fix trigger, `@codex fix the findings`, also requires a legacy cloud environment for the repository. During installation, the Chess Lobby control request returned "create an environment for this repo"; no cloud coding environment was created by this setup. A GitHub Actions bot mention is not treated as a supported replacement for the API-backed action.

When enabled, at most one repair attempt runs per head commit and two per PR. Codex runs in a protected runner job with a read-only repository token, no persisted Git credentials, and no deployment secrets. The action is pinned and runs last. Its bounded textual patch is applied in a separate job, which has no API key or deployment credentials, and runs the project's build/type/test profile. A third job verifies the same patch digest and unchanged head, then makes a non-force GitHub commit on the existing PR branch. Concurrent pushes cause the update to fail rather than overwrite new work. Generation, validation or publishing failures leave an explanation and workflow logs; successful validation retains a patch artifact for 14 days.

Findings are never automatically resolved. Review the final commit, current CI, and affected behavior before resolving them. This hook never merges a PR. GitHub's Actions token can cause follow-up CI runs to require a maintainer's approval or suppress some event-triggered runs; the validation job therefore runs project checks before publishing, and the result comment points out this limitation. A new GitHub App credential would be needed to change that behavior; this installation creates none.

## Disable and recover

- Set `CODEX_REVIEW_REPAIR_ENABLED=false` to stop new repair attempts, while keeping review receipts. Cancel an already-running repair in Actions if necessary.
- Disable the `Codex review follow-up` workflow in Actions to stop the entire follow-up hook. Native Code Review and Security Review remain controlled by their own repository switches.
- If a repair fails or the two-attempt limit is reached, inspect its audit receipt and logs and make a manual fix. A new reviewed head can run once, subject to the PR-wide limit; do not delete receipts merely to create an unbounded loop.
- Use Actions → Codex review follow-up → Run workflow with a PR number to acknowledge existing unresolved findings after activation. Duplicate successful acknowledgements and previously consumed repair attempts stay bounded.
- To revert an applied repair, use a normal Git revert on its commit and review the resulting PR diff. No branch protection or deployment setting was changed by the hook.

## Validation profiles

Chess Lobby: web build, computer-engine regressions, Lambda deployment unit tests, .NET engine tests. Community Tier List: typecheck, tests, lint, build. Adonea and Tollgate: typecheck, verification scripts, build. Portfolio: TypeScript check and build (its legacy `next lint` script is not supported by its current Next.js version). Pristine: lint, build, typecheck, tests, and both CDK synth checks. These are offline checks; deployed integration, Docker/Lambda smoke tests, and live Convex checks still require the existing CI or a maintainer. The hook never deploys anything.

Sources: [native GitHub reviews](https://learn.chatgpt.com/docs/third-party/github), [Codex GitHub Action](https://learn.chatgpt.com/docs/github-action), [GitHub token event behavior](https://docs.github.com/en/actions/concepts/security/github_token).
