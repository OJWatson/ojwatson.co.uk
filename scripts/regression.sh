#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Build the site (matches TaskGraph acceptance default)
hugo --gc --minify

# Route guardrail: ensure key pages are still built
[[ -f public/teaching/index.html ]]

# Basic internal link check over generated output
python3 scripts/linkcheck.py public config.toml
