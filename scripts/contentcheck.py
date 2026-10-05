#!/usr/bin/env python3
"""Offline editorial guardrails; this does not verify external URLs or facts.

Usage: python3 scripts/contentcheck.py [repository_root]
Dependencies: python3 -m pip install -r requirements-checks.txt
"""

from __future__ import annotations

import datetime as dt
import hashlib
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlparse

import yaml

try:
    import tomllib
except ImportError:  # Python 3.10 development environments
    import tomli as tomllib


FOOTER_SHA256 = "09defb30f351f453eebf6e6421a5b94b592b65001a55c19fef5fcb2ba377828f"
THEMES = {"malaria", "vaccines", "humanitarian"}
REQUIRED = {"id", "title", "citation_title", "authors", "year", "venue", "description", "paper_url", "theme"}
OPTIONAL = {"code_url", "reviewed", "evidence_urls"}


class UniqueSafeLoader(yaml.SafeLoader):
    """Reject accidental duplicate YAML keys instead of silently losing data."""


def unique_mapping(loader, node, deep=False):
    mapping = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in mapping:
            raise ValueError(f"duplicate YAML key: {key}")
        mapping[key] = loader.construct_object(value_node, deep=deep)
    return mapping


UniqueSafeLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping)


def read_yaml(text):
    return yaml.load(text, Loader=UniqueSafeLoader)


def frontmatter(text):
    lines = text.splitlines()
    if not lines or lines[0] not in {"---", "+++"}:
        return {}, text
    marker = lines[0]
    end = lines.index(marker, 1)
    source = "\n".join(lines[1:end])
    data = read_yaml(source) if marker == "---" else tomllib.loads(source)
    if not isinstance(data, dict):
        raise ValueError("front matter must be a mapping")
    return data, "\n".join(lines[end + 1:])


def valid_url(value):
    if not isinstance(value, str) or re.search(r"\s", value):
        return False
    try:
        parsed = urlparse(value)
        host = parsed.hostname
    except ValueError:
        return False
    return (parsed.scheme == "https" and bool(host) and "." in host
            and not parsed.username and not parsed.password
            and not re.search(r"(?:^|\.)example\.(?:com|org|net)$", host))


def normalize_doi(value):
    if not isinstance(value, str):
        return ""
    value = unquote(value.strip()).lower()
    value = re.sub(r"^(?:https?://(?:dx\.)?doi\.org/|doi:\s*)", "", value)
    return value.rstrip("/")


def selected_work_errors(data):
    errors = []
    if not isinstance(data, dict) or set(data) != {"works"} or not isinstance(data["works"], list):
        return ["expected a single top-level works list"]
    if not data["works"]:
        return ["works must contain at least one selected output"]
    ids, dois = set(), set()
    for index, work in enumerate(data["works"], 1):
        label = f"work {index}"
        if not isinstance(work, dict):
            errors.append(f"{label}: must be a mapping")
            continue
        for key in sorted(REQUIRED - set(work)):
            errors.append(f"{label}: missing {key}")
        for key in sorted(set(work) - REQUIRED - OPTIONAL):
            errors.append(f"{label}: unexpected field {key}")
        for key in sorted((REQUIRED - {"year"}) & set(work)):
            if not isinstance(work[key], str) or not work[key].strip():
                errors.append(f"{label}: {key} must be a non-empty string")
        work_id = work.get("id")
        if not isinstance(work_id, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", work_id):
            errors.append(f"{label}: id must use lowercase letters, digits and single hyphens")
        elif work_id in ids:
            errors.append(f"{label}: duplicate id {work_id}")
        else:
            ids.add(work_id)
        if type(work.get("year")) is not int or not 1900 <= work["year"] <= 2099:
            errors.append(f"{label}: year must be a four-digit integer from 1900 to 2099")
        if not isinstance(work.get("theme"), str) or work["theme"] not in THEMES:
            errors.append(f"{label}: theme must be one of {', '.join(sorted(THEMES))}")
        for key in ("paper_url", "code_url"):
            if key in work and not valid_url(work[key]):
                errors.append(f"{label}: {key} must be a complete HTTPS URL; omit unused code_url")
        doi = normalize_doi(work.get("paper_url"))
        if doi.startswith("10."):
            if doi in dois:
                errors.append(f"{label}: duplicate selected DOI {doi}")
            dois.add(doi)
        if "reviewed" in work:
            try:
                dt.date.fromisoformat(str(work["reviewed"]))
            except (TypeError, ValueError):
                errors.append(f"{label}: reviewed must be YYYY-MM-DD")
        if "evidence_urls" in work:
            evidence = work["evidence_urls"]
            if not isinstance(evidence, list) or not evidence or not all(valid_url(url) for url in evidence):
                errors.append(f"{label}: evidence_urls must be a non-empty list of HTTPS URLs")
    return errors


def placeholder_values(value, key=""):
    if isinstance(value, dict):
        return [item for child_key, child in value.items() for item in placeholder_values(child, str(child_key))]
    if isinstance(value, list):
        return [item for child in value for item in placeholder_values(child, key)]
    if isinstance(value, str) and (key == "url" or key.startswith("url_")) and value.strip() == "#":
        return [f"{key} is a placeholder '#'; use an empty value or a real destination"]
    return []


def check_repository(root):
    errors = []
    footer = root / "layouts/partials/site_footer.html"
    if not footer.is_file() or hashlib.sha256(footer.read_bytes()).hexdigest() != FOOTER_SHA256:
        errors.append("layouts/partials/site_footer.html: protected footer changed")
    selected = root / "data/selected_work.yaml"
    try:
        errors.extend(f"data/selected_work.yaml: {error}" for error in selected_work_errors(read_yaml(selected.read_text())))
    except (OSError, ValueError, yaml.YAMLError) as exc:
        errors.append(f"data/selected_work.yaml: {exc}")
    publication_dois = {}
    for path in sorted((root / "content").rglob("*")):
        if path.suffix not in {".md", ".html"}:
            continue
        relative = path.relative_to(root)
        text = path.read_text(encoding="utf-8")
        try:
            metadata, body = frontmatter(text)
        except (ValueError, yaml.YAMLError) as exc:
            errors.append(f"{relative}: invalid front matter: {exc}")
            continue
        if metadata.get("draft") is True or metadata.get("active") is False:
            continue
        if re.search(r"\bhhttps?://", text, re.I):
            errors.append(f"{relative}: malformed hhttps:// link")
        # Check published source content; vendored theme demos are deliberately excluded.
        if re.search(r"https?://(?:[\w-]+\.)?example\.(?:org|com|net)\b", text, re.I):
            errors.append(f"{relative}: example-domain placeholder link")
        if re.search(r"\]\(\s*#\s*\)", body):
            errors.append(f"{relative}: placeholder Markdown link '(#)'")
        errors.extend(f"{relative}: {error}" for error in placeholder_values(metadata))
        if "publication" in relative.parts or "publications" in relative.parts:
            if re.search(r"\ban example (?:preprint|working paper|journal article|conference paper)\b|lorem ipsum", text, re.I):
                errors.append(f"{relative}: published example publication")
            doi = normalize_doi(metadata.get("doi"))
            if doi:
                if not re.fullmatch(r"10\.\d{4,9}/\S+", doi):
                    errors.append(f"{relative}: invalid DOI {doi}")
                elif doi in publication_dois:
                    errors.append(f"{relative}: duplicate publication DOI {doi} also in {publication_dois[doi]}")
                else:
                    publication_dois[doi] = relative
    return errors


def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
    errors = check_repository(root)
    if errors:
        print("Content checks failed:\n" + "\n".join(f"- {error}" for error in errors), file=sys.stderr)
        return 1
    print("OK: selected outputs, publication DOI uniqueness, placeholder checks and protected footer")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
