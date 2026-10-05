"""Regression tests for editorial mistakes the offline checks must reject."""

import copy
from pathlib import Path
import tempfile
import unittest

import contentcheck
import linkcheck


REPO = Path(__file__).resolve().parent.parent
WORK = {
    "id": "real-study-2025", "title": "A real study", "citation_title": "The full published study title", "authors": "Watson et al.",
    "year": 2025, "venue": "Journal", "description": "What the study found.",
    "paper_url": "https://doi.org/10.1234/study", "theme": "malaria",
}


class EditorialChecks(unittest.TestCase):
    def test_duplicate_ids_and_doi_variants_are_rejected(self):
        second = dict(WORK, paper_url="https://doi.org/10.1234/STUDY/")
        errors = contentcheck.selected_work_errors({"works": [WORK, second]})
        self.assertTrue(any("duplicate id" in error for error in errors))
        self.assertTrue(any("duplicate selected DOI" in error for error in errors))

    def test_optional_code_link_cannot_be_a_placeholder(self):
        self.assertEqual([], contentcheck.selected_work_errors({"works": [WORK]}))
        for url in ("#", "", "hhttps://github.com/user/repo", "https://example.org/repo"):
            with self.subTest(url=url):
                errors = contentcheck.selected_work_errors({"works": [dict(WORK, code_url=url)]})
                self.assertTrue(any("code_url" in error for error in errors))

    def test_missing_and_mistyped_fields_fail(self):
        bad = copy.deepcopy(WORK)
        del bad["title"]
        del bad["citation_title"]
        bad.update(year="2025", theme="unknown", id="bad id")
        errors = contentcheck.selected_work_errors({"works": [bad]})
        for field in ("title", "citation_title", "year", "theme", "id"):
            self.assertTrue(any(field in error for error in errors))

    def test_duplicate_yaml_key_is_not_silently_discarded(self):
        with self.assertRaises(ValueError):
            contentcheck.read_yaml("works: []\nworks: []\n")

    def test_source_guardrails_detect_real_regressions(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            footer = root / "layouts/partials/site_footer.html"
            footer.parent.mkdir(parents=True)
            footer.write_bytes((REPO / "layouts/partials/site_footer.html").read_bytes())
            data = root / "data/selected_work.yaml"
            data.parent.mkdir()
            data.write_text(contentcheck.yaml.safe_dump({"works": [WORK]}))
            publications = root / "content/publication"
            publications.mkdir(parents=True)
            first = publications / "first.md"
            second = publications / "second.md"
            first.write_text('---\ntitle: First\ndoi: 10.1234/Study\n---\n')
            second.write_text('+++\ntitle = "Second"\ndoi = "https://doi.org/10.1234/study"\n+++\n')
            errors = contentcheck.check_repository(root)
            self.assertTrue(any("duplicate publication DOI" in error for error in errors))
            second.write_text('---\ndraft: true\ntitle: An example preprint\n---\nhttps://example.org\n')
            self.assertEqual([], contentcheck.check_repository(root))
            second.write_text('---\ntitle: An example preprint\nurl_code: "#"\n---\nhhttps://journal.org\n')
            errors = contentcheck.check_repository(root)
            for phrase in ("published example", "malformed hhttps", "placeholder '#'"):
                self.assertTrue(any(phrase in error for error in errors))
            footer.write_text("Changed footer")
            self.assertTrue(any("protected footer changed" in error for error in contentcheck.check_repository(root)))

    def test_lowercase_baseurl_enables_same_origin_link_checks(self):
        with tempfile.TemporaryDirectory() as temporary:
            config = Path(temporary) / "config.toml"
            config.write_text('baseurl = "https://ojwatson.co.uk/" # canonical site\n')
            self.assertEqual("https://ojwatson.co.uk/", linkcheck._read_baseurl(str(config)))
            self.assertFalse(linkcheck._is_probably_external("https://ojwatson.co.uk/missing/", "ojwatson.co.uk"))
            self.assertEqual(str(Path(temporary) / "missing/index.html"),
                             linkcheck._target_to_path(temporary, "https://ojwatson.co.uk/missing/", "ojwatson.co.uk"))


if __name__ == "__main__":
    unittest.main()
