#!/usr/bin/env bash
# Netlify exit status: 0 skips the build; 1 builds the academic website.
set -u

if [[ -z "${CACHED_COMMIT_REF:-}" || -z "${COMMIT_REF:-}" ]]; then
  exit 1
fi
if ! git cat-file -e "${CACHED_COMMIT_REF}^{commit}" 2>/dev/null || ! git cat-file -e "${COMMIT_REF}^{commit}" 2>/dev/null; then
  exit 1
fi

# Everything outside these AIRef paths can affect the Hugo site. Unknown refs
# or comparison errors always build, rather than silently suppressing a release.
if git diff --quiet --no-renames "$CACHED_COMMIT_REF" "$COMMIT_REF" -- . \
  ':(exclude)apps/airef/**' \
  ':(exclude).github/workflows/airef.yml' \
  ':(exclude)docs/AIREF.md'; then
  echo 'AIRef-only changes: skipping the unrelated Hugo/Netlify deployment.'
  exit 0
fi
exit 1
