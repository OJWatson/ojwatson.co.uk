# Maintenance

This first release makes the personal site easier to use as a group site, with
curated, source-checked examples of research. It is not a comprehensive audited
bibliography or a declaration that every historical collaboration belongs to the
current group. Continue using Hugo Academic and **Hugo extended 0.62.1**.

## Where to edit

| Change | Source |
| --- | --- |
| Homepage introduction and three research themes | `data/homepage.yaml` |
| Selected papers and their associated code | `data/selected_work.yaml` |
| Research descriptions | `content/research/` |
| Project/package explanations and links | `content/project/<name>/index.md` |
| Personal biography, education and appointments | `content/authors/ojwatson/_index.md`, `content/about/` |
| People, roles and roster groups | `data/people.yaml` |
| Navigation and site settings | `config/_default/menus.toml`, `config/_default/params.toml`, `config.toml` |
| Local theme overrides | `layouts/`, `assets/` |
| Personal footer | `layouts/partials/site_footer.html` — preserve exactly |

The homepage, People, Outputs and software catalogue use local templates under
`layouts/`; the research and personal pages retain the theme's widget structure.
Change ordinary homepage copy in `data/homepage.yaml`, including the three theme
links and their visible labels. Fixed section headings live in `layouts/index.html`.
The order of `works` in `data/selected_work.yaml` controls the Outputs page; its
first three entries also appear on the homepage.

In `data/people.yaml`, each group has a `title` and a `people` list. Each person has
`name`, `role`, `description` and an optional `url`. Move former appointments into
the previous-appointments group instead of silently treating them as current.
Keep factual evidence in comments or this document; ask OJ about private or
ambiguous appointment details. The rendered roster uses this YAML, not the older
`content/team/team.md` widget, which remains disabled as historical source content.

For a new selected output, copy an existing entry under `works`. Keep a stable,
unique lowercase hyphenated `id`, readable editorial `title`, exact published
`citation_title`, concise `authors` string, integer `year`, `venue`, one-paragraph
`description`, `paper_url`, and one `theme`:
`malaria`, `vaccines` or `humanitarian`. Prefer canonical DOI links. Include
`code_url` only when the manuscript or repository establishes the association;
otherwise omit it. Record a `reviewed: "YYYY-MM-DD"` and primary-source
`evidence_urls` so a later agent can recheck the facts. Do not reuse a DOI under a
new ID when a preprint becomes a journal article: update the existing record and
explain the change. Related publications can share a repository.
Keep the exact citation title even when the shorter editorial title is easier
to scan: search indexes the publication metadata and points to `/outputs/#id`.

For project pages, distinguish software functionality, the paper it supports,
contribution to another team's package, and ongoing work. Verify title, year,
journal, publication status and code provenance against the paper and repository.
Public project metadata includes `title`, `summary`, `project_type`, `url_code`
and named `links`; provenance is recorded with `evidence_checked` and
`evidence_sources`. This is a small curated catalogue, not a full relational
bibliography: project records and selected outputs are not automatically joined
by IDs or kept in sync. Review both places when a linked study changes status.
Label preprints as preprints. A search result or a plausible repository name is
not sufficient evidence of an exact analysis release. Keep dated historical
posts as historical posts rather than silently converting them into current news.

## Checks and preview

Use Python 3.10 or newer and the pinned extended Hugo release. Install checker
dependencies once in your normal project Python environment:

```sh
python3 -m pip install -r requirements-checks.txt
hugo version
bash scripts/regression.sh
hugo server --disableFastRender
```

The regression script checks selected-output fields and duplicate IDs/DOIs,
published example publications, placeholder links, malformed `hhttps://` links,
and the footer checksum; runs regression fixtures for those checks; builds Hugo
with `--cleanDestinationDir` into the generated-only `public/` directory;
and checks root-relative and same-origin links in the generated site. Disabled
widgets and draft content are excluded from publication checks. External URL
availability, relative links, anchors, factual accuracy and visual layout still
need review. A passing check is not a full factual audit.

Inspect the homepage, Research, Outputs, People, About OJ and Contact at desktop
and narrow mobile widths. Check navigation, image cropping, text contrast,
keyboard focus, reading order and the footer. Open selected paper/code links and
spot-check project links. Do not upgrade Hugo merely because a newer local
installation reports a template error.

Always work on a branch. Netlify uses `netlify.toml`; review builds use
`DEPLOY_PRIME_URL` as their base URL. Push only the review branch and use the
resulting branch/deploy-preview URL, or a Netlify draft deploy if branch previews
are unavailable. Verify the deployed pages and return that URL. Do not merge or
publish to production without explicit approval. Record the branch/commit,
preview URL, checks actually run locally, and hosted CI result separately.

## Confirmed facts and remaining provenance work

- **User confirmations, 5 October 2026:** Cambridge degree is **MRes**; Annabelle
  Piot is a **Research Assistant**; Arran Hamlet's March–August 2025 contract is a
  **previous appointment**. These have been applied. Do not reintroduce the older
  MSc/MSci wording or treat these confirmed roles as unresolved.
- **Humanitarian mortality work:** distinguish the `vrcmort` repository's general
  purpose from the exact analysis/code release supporting a named paper. Keep the
  manuscript-to-release association unclaimed until established by a primary
  source (paper code statement, archived release or author confirmation).
- **Complete archive:** selected outputs have explicit sources; the CV, older
  project pages, full publication history and all equal-contribution statements
  have not thereby received a complete independent audit.

Resolve these in a later factual pass and record the evidence. Older
`docs/agent/` automation state and February 2026 completion labels are historical,
not a current deployment approval or a substitute for these checks.
