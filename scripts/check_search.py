#!/usr/bin/env python3
"""Check that generated search includes curated YAML and visible research text.

Run after Hugo: python3 scripts/check_search.py [public_directory]
This checks the generated artifact, independently of Hugo template internals.
"""

from __future__ import annotations

import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit

from contentcheck import read_yaml


def normalized(value):
    return " ".join(re.findall(r"\w+", html.unescape(value).casefold()))


class ResearchText(HTMLParser):
    """Collect the visible article text, excluding navigation and the footer."""

    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}

    def __init__(self):
        super().__init__()
        self.depth = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in self.VOID:
            return
        if self.depth:
            self.depth += 1
        elif dict(attrs).get("id") == "main-content":
            self.depth = 1

    def handle_endtag(self, tag):
        if self.depth and tag not in self.VOID:
            self.depth -= 1

    def handle_startendtag(self, tag, attrs):
        pass

    def handle_data(self, data):
        if self.depth:
            self.parts.append(data)


def search_errors(index, works, people_names, research_text):
    if not isinstance(index, list) or not all(isinstance(record, dict) for record in index):
        return ["index.json must contain a list of search records"]
    errors = []
    for work in works:
        object_id = f"selected-{work['id']}"
        expected_url = f"/outputs/#{work['id']}"
        records = [record for record in index if record.get("objectID") == object_id]
        targets = [record for record in index if record.get("relpermalink") == expected_url]
        if len(records) != 1 or len(targets) != 1 or records != targets:
            errors.append(f"{work['id']}: expected exactly one selected record at {expected_url}")
            continue
        record = records[0]
        parsed = urlsplit(record.get("permalink", ""))
        if f"{parsed.path}#{parsed.fragment}" != expected_url:
            errors.append(f"{work['id']}: absolute permalink points to the wrong output anchor")
        searchable = normalized(" ".join(str(record.get(key, "")) for key in ("title", "summary", "content")))
        if normalized(work["citation_title"]) not in searchable:
            errors.append(f"{work['id']}: exact citation title is missing from searchable fields")
        if record.get("type") != "publication":
            errors.append(f"{work['id']}: selected output must be indexed as a publication")
    expected_ids = {f"selected-{work['id']}" for work in works}
    for record in index:
        object_id = str(record.get("objectID", ""))
        if object_id.startswith("selected-") and object_id not in expected_ids:
            errors.append(f"{object_id}: stale selected-output search record")

    for route, label in (("/team/", "People"), ("/research/", "Research")):
        records = [record for record in index if record.get("relpermalink") == route]
        if len(records) != 1:
            errors.append(f"{label}: expected exactly one search record at {route}")
            continue
        searchable = normalized(str(records[0].get("content", "")))
        if route == "/team/":
            if not people_names:
                errors.append("People: source roster is empty")
            for name in people_names:
                if normalized(name) not in searchable:
                    errors.append(f"People: {name} is missing from search content")
        elif not normalized(research_text):
            errors.append("Research: no rendered article text found to verify")
        elif normalized(research_text) not in searchable:
            errors.append("Research: visible active article text is missing from search content")
    return errors


def main():
    root = Path(__file__).resolve().parent.parent
    public = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "public"
    works = read_yaml((root / "data/selected_work.yaml").read_text())["works"]
    people = read_yaml((root / "data/people.yaml").read_text())["groups"]
    names = [person["name"] for group in people for person in group["people"]]
    research = ResearchText()
    research.feed((public / "research/index.html").read_text())
    index = json.loads((public / "index.json").read_text())
    errors = search_errors(index, works, names, " ".join(research.parts))
    if errors:
        print("Generated search checks failed:\n" + "\n".join(f"- {error}" for error in errors), file=sys.stderr)
        return 1
    print(f"OK: search includes {len(works)} unique selected outputs with citation titles, {len(names)} people and active research text")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
