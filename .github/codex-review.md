# GitHub review hook

Native Codex Code Review and Security Review are each enabled for all pull requests on every push in this repository. These are repository-specific settings in ChatGPT Settings → Code Review; global preferences and credit overage are unchanged.

The `Codex review follow-up` GitHub workflow acknowledges current, unresolved findings from the verified Codex bot. It runs offline from the desktop, deduplicates review events, links findings and preserves an audit trail. It excludes forks, drafts, stale findings and PRs by other authors from automatic repair. It never resolves findings or merges PRs.

Automatic repair is credential-gated and disabled at installation. Securely add a dedicated `OPENAI_API_KEY` Actions secret and set the repository variable `CODEX_REVIEW_REPAIR_ENABLED=true` to enable separately billed API usage. Adding a key alone does not enable it. The enabled engine can push a small patch to Shawn's same-repository PR only after project checks and an unchanged-head check, once per head and at most twice per PR. Ambiguous or protected-file changes need human attention. The hook attaches a Codex repair validation status to the exact tested tree before pushing. GitHub suppresses ordinary CI from Actions-token pushes; run any additional required checks manually and verify behavior before resolving findings or merging.

Disable repair with `CODEX_REVIEW_REPAIR_ENABLED=false`; cancel already-running attempts in Actions. Disable the entire follow-up workflow in Actions to stop receipts. Native review switches are independent. A maintainer can replay the hook through Run workflow with a PR number, or use the documented linked-account comment `@codex fix the findings` after configuring a legacy cloud environment for the repository.

Shared source, validation profiles, usage implications and recovery details: [engine guide](https://github.com/shawnmcmahon/chess-lobby/blob/67fbfdba199f1a8a617e27d9d7fcad93086e403d/.github/codex/README.md). The workflow pins that immutable source commit; later engine updates require an explicit reviewed pin update.
