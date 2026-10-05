# Working on ojwatson.co.uk

Read [docs/MAINTENANCE.md](docs/MAINTENANCE.md) before editing. This is a Hugo
Academic site pinned to **Hugo extended 0.62.1**. Keep the existing theme and
override templates locally; do not upgrade the framework during content work.

- Work on a dedicated branch. The current review branch is
  `codex/group-site-preview`. Never commit directly to the default branch.
- Publish review work only to a Netlify branch deploy, deploy preview or draft
  deploy. Return its URL for review. Merging and deploying to production require
  the user's explicit approval; do not use `netlify deploy --prod` for previews.
- Preserve `layouts/partials/site_footer.html` byte-for-byte. It is intentionally
  personal; its hash is checked by `scripts/contentcheck.py`.
- Keep homepage copy in `data/homepage.yaml`, the roster in `data/people.yaml`,
  and selected outputs in `data/selected_work.yaml`. Verify claims against
  primary sources and record evidence URLs. Do not infer group membership,
  authorship contribution or manuscript-to-repository provenance from names.
- The current release is a curated first release, not a fully audited publication
  archive. Do not describe historical collaborations as current group outputs.
- Read confirmed facts and remaining provenance work in MAINTENANCE.md before changing biography, people
  or the humanitarian project. Keep uncertainty explicit; do not invent a fix.
- Run `bash scripts/regression.sh` with the pinned Hugo version, then inspect
  desktop and mobile previews. Report local results separately from hosted CI.
- Keep source and notes here. Do not commit generated `public/` or `resources/`,
  credentials, or temporary build files. No ZIP export is needed for normal work.

Older `docs/agent/` files and February 2026 milestone logs are historical context;
they do not authorize current work, default-branch commits or production deploys.
