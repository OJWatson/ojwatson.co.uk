#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

hugo_version="$(hugo version)"
case "$hugo_version" in
  *v0.62.1-*/extended*|*v0.62.1/extended*) ;;
  *) echo "Expected Hugo extended 0.62.1; found: $hugo_version" >&2; exit 1 ;;
esac

# Check source data and editorial guardrails before building.
python3 scripts/contentcheck.py
python3 -m unittest discover -s scripts -p 'test_*.py'

# public/ is generated-only. Clean it so deleted pages cannot survive a rebuild.
hugo --destination public --cleanDestinationDir --gc --minify

# Ensure all main routes survive changes, including the legacy teaching page.
for route in research outputs team about contact projects teaching; do
  [[ -f "public/$route/index.html" ]]
done

# The theme's example publications must not reappear in deployable output.
for example in preprint conference-paper journal-article; do
  [[ ! -e "public/publication/$example" ]]
done

# Basic internal link check over generated output
python3 scripts/linkcheck.py public config.toml

# YAML-backed outputs/people and widget prose must remain discoverable in search.
python3 scripts/check_search.py public

# Keep the old theme profile surface hidden while preserving citation authors.
python3 scripts/check_author_pages.py public
