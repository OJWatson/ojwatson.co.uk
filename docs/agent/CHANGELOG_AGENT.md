# CHANGELOG_AGENT

Agent-authored change log (high level).

- 2026-02-16: CI.FIX.M4 — verified regression checks (hugo build + linkcheck) remain green after M4 boundary.
- 2026-02-16: M5.2 — QA: validated /post/ list renders and RSS feeds are generated (root + section), via `hugo --minify --gc` and inspecting `public/*/index.xml`.
- 2026-02-17: CI.FIX.M5 — revalidated CI boundary (`hugo --gc --minify` + `scripts/regression.sh`) after M5 completion.
- 2026-02-17: M6.0/M6.1/M6.2 — added four research-programme project entries; updated Projects filters; added Research ↔ Projects cross-links.
- 2026-02-17: M7.0/M7.1 — completed QA sweep including full local regression and link checks; no regressions detected.
- 2026-02-17: CI.FIX.M6/CI.FIX.M7 — CI-equivalent local checks remain green at M6 and M7 boundaries.
