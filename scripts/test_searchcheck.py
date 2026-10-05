"""Protect discoverability when content is stored outside ordinary Hugo pages."""

import copy
from pathlib import Path
import tempfile
import unittest

from check_search import ResearchText, search_errors
from check_author_pages import author_errors


WORKS = [{"id": "forecast-study", "citation_title": "Enhancing epidemic forecast usability"}]
INDEX = [
    {"objectID": "selected-forecast-study", "type": "publication", "title": "Useful forecasts",
     "relpermalink": "/outputs/#forecast-study", "permalink": "https://preview.netlify.app/outputs/#forecast-study",
     "content": "Enhancing epidemic forecast usability. Watson et al."},
    {"objectID": "team", "relpermalink": "/team/", "content": "OJ Watson. Annabelle Piot. Research staff."},
    {"objectID": "research", "relpermalink": "/research/", "content": "Research. Models support decisions. Vaccines prevent disease."},
]
NAMES = ["OJ Watson", "Annabelle Piot"]
RESEARCH = "Models support decisions. Vaccines prevent disease."


class SearchChecks(unittest.TestCase):
    def test_complete_index_works_with_a_preview_origin(self):
        self.assertEqual([], search_errors(INDEX, WORKS, NAMES, RESEARCH))

    def test_silent_yaml_or_widget_omission_is_detected(self):
        for field, target, marker in (("content", 0, "citation title"),
                                      ("content", 1, "Annabelle Piot"),
                                      ("content", 2, "active article text")):
            with self.subTest(target=target):
                broken = copy.deepcopy(INDEX)
                broken[target][field] = ""
                self.assertTrue(any(marker in error for error in search_errors(broken, WORKS, NAMES, RESEARCH)))
        self.assertTrue(any("exactly one selected" in error for error in search_errors(INDEX[1:], WORKS, NAMES, RESEARCH)))

    def test_duplicate_records_and_wrong_anchors_fail(self):
        duplicated = copy.deepcopy(INDEX) + [copy.deepcopy(INDEX[0])]
        self.assertTrue(any("exactly one selected" in error for error in search_errors(duplicated, WORKS, NAMES, RESEARCH)))
        for field in ("relpermalink", "permalink"):
            with self.subTest(field=field):
                broken = copy.deepcopy(INDEX)
                broken[0][field] = "https://preview.netlify.app/outputs/#wrong" if field == "permalink" else "/outputs/#wrong"
                self.assertTrue(search_errors(broken, WORKS, NAMES, RESEARCH))

    def test_rendered_research_excludes_navigation_and_footer(self):
        parser = ResearchText()
        parser.feed('<nav>Menu</nav><main id="main-content"><section><h2>Models</h2><p>Support <em>decisions</em>.<br>Vaccines.</p></section></main><footer>Footer</footer>')
        self.assertEqual("Models Support  decisions . Vaccines.", " ".join(parser.parts))

    def test_author_profiles_do_not_return_as_search_hits_or_cards(self):
        duplicate_profile = {"objectID": "profile", "relpermalink": "/authors/ojwatson/", "content": "Biography"}
        self.assertTrue(any("Author profiles" in error for error in search_errors(INDEX + [duplicate_profile], WORKS, NAMES, RESEARCH)))
        with tempfile.TemporaryDirectory() as temporary:
            public = Path(temporary)
            page = public / "index.html"
            page.write_text('<p>Watson et al.</p>')
            self.assertEqual([], author_errors(public))
            page.write_text('<div class="media author-card">OJ</div><a href="/authors/ojwatson/">OJ</a>')
            self.assertTrue(any("profile link or repeated author card" in error for error in author_errors(public)))
            page.unlink()
            profile = public / "authors/ojwatson/index.html"
            profile.parent.mkdir(parents=True)
            profile.write_text('<meta name="robots" content="noindex, follow"><meta http-equiv="refresh" content="0; url=https://preview.netlify.app/about/">')
            self.assertEqual([], author_errors(public))
            profile.write_text('<h1>Duplicate biography</h1>')
            self.assertTrue(any("old author URL" in error for error in author_errors(public)))


if __name__ == "__main__":
    unittest.main()
