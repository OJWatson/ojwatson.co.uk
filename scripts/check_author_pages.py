#!/usr/bin/env python3
"""Keep theme author cards/profiles from competing with the About page."""

from html.parser import HTMLParser
from pathlib import Path
import sys
from urllib.parse import urlsplit


class AuthorSurfaces(HTMLParser):
    def __init__(self):
        super().__init__()
        self.profile_links = []
        self.cards = False
        self.noindex = False
        self.redirect = ""

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == "a" and urlsplit(attrs.get("href", "")).path.startswith("/authors/"):
            self.profile_links.append(attrs["href"])
        if "author-card" in attrs.get("class", "").split():
            self.cards = True
        if tag == "meta" and attrs.get("name", "").lower() == "robots":
            self.noindex = "noindex" in attrs.get("content", "").lower()
        if tag == "meta" and attrs.get("http-equiv", "").lower() == "refresh":
            self.redirect = attrs.get("content", "").partition("url=")[2].strip()


def author_errors(public):
    errors = []
    for page in public.rglob("*.html"):
        parsed = AuthorSurfaces()
        parsed.feed(page.read_text())
        relative = page.relative_to(public)
        if parsed.profile_links or parsed.cards:
            errors.append(f"{relative}: unexpected author profile link or repeated author card")
        if relative.parts[0] == "authors":
            if not parsed.noindex or urlsplit(parsed.redirect).path != "/about/":
                errors.append(f"{relative}: old author URL must redirect to About with noindex")
    return errors


if __name__ == "__main__":
    public = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("public")
    errors = author_errors(public)
    if errors:
        print("Author page checks failed:\n" + "\n".join(f"- {error}" for error in errors), file=sys.stderr)
        raise SystemExit(1)
    print("OK: no repeated author cards/profile links; old author URLs redirect to About")
