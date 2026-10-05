# RUNBOOK

The current workflow is in [AGENTS.md](../../AGENTS.md) and
[MAINTENANCE.md](../MAINTENANCE.md). Older automation state in this directory is
historical context.

- Work on a dedicated branch; never commit directly to the default branch.
- Run `bash scripts/regression.sh` with Hugo extended 0.62.1, resolve failures,
  and inspect desktop and mobile previews.
- Deploy review work to a Netlify branch/deploy preview or draft deploy and
  return its URL. Merge and production deployment require explicit user approval.
- Preserve the personal footer and record unresolved factual claims for review.
