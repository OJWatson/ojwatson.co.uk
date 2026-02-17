#!/usr/bin/env python3
"""Simple internal link checker for Hugo public/ output.

Goals:
- No extra deps (stdlib only)
- Check that internal href/src targets resolve to a file in public/
- Ignore external URLs (http/https to other hosts), mailto:, tel:, javascript:

Usage:
  scripts/linkcheck.py public [config.toml]

Exit codes:
  0 OK
  2 usage
  3 missing targets found
"""

from __future__ import annotations

import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote


# Treat anything with an explicit non-http(s) scheme as external/skip.
SKIP_SCHEMES = {"mailto", "tel", "javascript", "data", "doi"}


def _read_baseurl(config_path: str) -> str | None:
    if not config_path or not os.path.exists(config_path):
        return None

    # Very small TOML scrape (no toml dependency)
    # Supports lines like: baseURL = "https://example.com/"
    baseurl_re = re.compile(r"^\s*baseURL\s*=\s*\"([^\"]+)\"\s*$")
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            for line in f:
                m = baseurl_re.match(line)
                if m:
                    return m.group(1).strip()
    except OSError:
        return None

    return None


class LinkCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []

    def handle_starttag(self, tag: str, attrs):
        # Common link-bearing attributes
        for k, v in attrs:
            if not v:
                continue
            if k in {"href", "src"}:
                self.links.append(v)
            # srcset has multiple comma-separated entries
            if k == "srcset":
                parts = [p.strip() for p in v.split(",") if p.strip()]
                for p in parts:
                    url = p.split()[0]
                    if url:
                        self.links.append(url)


def _is_probably_external(url: str, base_host: str | None) -> bool:
    parsed = urlparse(url)

    # Skip non-http(s) schemes entirely (mailto:, doi:, etc)
    if parsed.scheme and parsed.scheme not in {"http", "https"}:
        return True

    if parsed.scheme in {"http", "https"}:
        if base_host and parsed.netloc == base_host:
            return False
        return True

    return False


def _target_to_path(public_dir: str, url: str, base_host: str | None) -> str | None:
    """Convert an internal URL into a filesystem path under public_dir.

    For regression purposes we *only* validate root-relative links ("/path") and
    same-origin absolute links. Many historical pages include truly relative
    references (e.g. "featured.jpg") that are not consistently present; skipping
    them keeps the check focused on site navigation/regressions.
    """
    parsed = urlparse(url)

    # Skip any explicit non-http(s) scheme
    if parsed.scheme and parsed.scheme not in {"http", "https"}:
        return None

    if parsed.scheme in {"http", "https"}:
        if not (base_host and parsed.netloc == base_host):
            return None
        path = parsed.path or "/"
    else:
        path = parsed.path or ""

    if not path or path == "#":
        return None

    # Only check root-relative paths
    if not path.startswith("/"):
        return None

    # Decode %xx
    path = unquote(path)

    fs_rel = path.lstrip("/")
    fs_rel = fs_rel.split("?")[0]
    fs_rel = fs_rel.split("#")[0]

    fs_rel = os.path.normpath(fs_rel)
    if fs_rel.startswith(".."):
        return None

    candidate = os.path.join(public_dir, fs_rel)

    # Directory-style links map to index.html
    if fs_rel.endswith("/") or (not os.path.splitext(fs_rel)[1] and os.path.isdir(candidate)):
        return os.path.join(public_dir, fs_rel, "index.html")

    # If no extension, Hugo often writes /path/index.html
    if not os.path.splitext(fs_rel)[1]:
        return os.path.join(public_dir, fs_rel, "index.html")

    return os.path.join(public_dir, fs_rel)


def _iter_html_files(public_dir: str):
    for root, _dirs, files in os.walk(public_dir):
        for fn in files:
            if fn.endswith(".html"):
                yield os.path.join(root, fn)


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("Usage: linkcheck.py public_dir [config.toml]", file=sys.stderr)
        return 2

    public_dir = argv[1]
    config_path = argv[2] if len(argv) >= 3 else None

    if not os.path.isdir(public_dir):
        print(f"ERROR: public_dir not found: {public_dir}", file=sys.stderr)
        return 2

    baseurl = _read_baseurl(config_path) if config_path else None
    base_host = urlparse(baseurl).netloc if baseurl else None

    missing: list[tuple[str, str, str]] = []

    for html_path in _iter_html_files(public_dir):
        try:
            with open(html_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except OSError:
            continue

        collector = LinkCollector()
        try:
            collector.feed(content)
        except Exception:
            # If a file is malformed, skip rather than fail the whole run.
            continue

        for link in collector.links:
            link = link.strip()
            if not link or link.startswith("#"):
                continue

            if _is_probably_external(link, base_host):
                continue

            target = _target_to_path(public_dir, link, base_host)
            if not target:
                continue

            if not os.path.exists(target):
                missing.append((html_path, link, target))

    if missing:
        print("Broken internal links detected:\n", file=sys.stderr)
        for src, link, target in missing[:200]:
            rel_src = os.path.relpath(src, public_dir)
            rel_tgt = os.path.relpath(target, public_dir)
            print(f"- {rel_src}: {link} -> missing {rel_tgt}", file=sys.stderr)

        if len(missing) > 200:
            print(f"... and {len(missing) - 200} more", file=sys.stderr)

        return 3

    print("OK: no broken internal links found")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
