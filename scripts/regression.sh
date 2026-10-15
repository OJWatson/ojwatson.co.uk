#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Build the site (matches TaskGraph acceptance default)
hugo --gc --minify --cleanDestinationDir

# Route guardrail: ensure key pages are still built
for page in about team research projects contact; do
  [[ -f "public/$page/index.html" ]]
done
[[ ! -e public/teaching/index.html ]]
[[ ! -e public/post/index.html ]]
for project in roiv vece vpdsus; do
  [[ ! -e "public/project/$project/index.html" ]]
done
[[ -f public/project/metis/index.html ]]

# Basic internal link check over generated output
python3 scripts/linkcheck.py public config.toml
