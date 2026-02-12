# Work log

- 2026-02-12: Cloned repo and created refresh branch; added ROADMAP/STATUS/WORKLOG scaffolding.
- 2026-02-12: Inspected repo structure (Hugo site using the Academic/Wowchemy theme via `themes/` submodule) and documented exact local preview/build commands.
- 2026-02-12: M1: Refreshed homepage/about positioning copy (author bio/intro) and verified a clean production build with Hugo extended v0.62.1.

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
