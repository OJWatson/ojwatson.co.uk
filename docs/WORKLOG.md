# Work log

- 2026-02-12: Cloned repo and created refresh branch; added ROADMAP/STATUS/WORKLOG scaffolding.
- 2026-02-12: Inspected repo structure (Hugo site using the Academic/Wowchemy theme via `themes/` submodule) and documented exact local preview/build commands.
- 2026-02-12: M1: Refreshed homepage/about positioning copy (author bio/intro) and verified a clean production build with Hugo extended v0.62.1.
- 2026-02-13: M1: Tightened the homepage intro/bio wording to read more crisply in the SCS PhD context; verified a clean `hugo --minify` build with Hugo extended v0.62.1.
- 2026-02-13: M1: Normalised homepage interest tags to sentence case for consistency; verified a clean `hugo --minify` build.
- 2026-02-13T04:58:45Z M1: Made the homepage/about widget intro copy consistent ("working within" phrasing); verified a clean `hugo --minify` build.

## Local development (preview/build)

### 0) One-time: fetch theme submodule

```bash
git submodule update --init --recursive
```

### 1) Install Hugo (extended) v0.62.1

This site requires **Hugo extended** (SCSS pipeline).

**Option A (exact + easiest): Docker**

```bash
docker run --rm -it \
  -p 1313:1313 \
  -v "$PWD":/src \
  klakegg/hugo:0.62.1-ext \
  server --bind 0.0.0.0 --buildDrafts --buildFuture --disableFastRender
```

**Option B (Linux x86_64): download the official release tarball**

```bash
HUGO_V=0.62.1
curl -fsSL -o /tmp/hugo.tgz \
  "https://github.com/gohugoio/hugo/releases/download/v${HUGO_V}/hugo_extended_${HUGO_V}_Linux-64bit.tar.gz"
mkdir -p /tmp/hugo_${HUGO_V}
tar -xzf /tmp/hugo.tgz -C /tmp/hugo_${HUGO_V}
/tmp/hugo_${HUGO_V}/hugo version
```

### 2) Local preview

```bash
hugo server --buildDrafts --buildFuture --disableFastRender
# then open http://localhost:1313/
```

### 3) Production build

```bash
hugo --minify
# output: ./public/
```

### Notes

- Netlify build config lives in `netlify.toml` (publish `public/`, command `hugo`).
- `config.toml` sets `theme = "hugo-academic"`; theme assets are in `themes/` (git submodule).
- 2026-02-13T03:50:58Z M1: set booking link + update primary email to Imperial; previewed locally.
- 2026-02-13T08:00:55+00:00 W1.1 complete (job b77c0372-f7d2-49ea-b607-e4723a9a0685): updated profile/about
