#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Build the site (matches TaskGraph acceptance default)
hugo --gc --minify

# Basic internal link check over generated output
python3 scripts/linkcheck.py public config.toml
