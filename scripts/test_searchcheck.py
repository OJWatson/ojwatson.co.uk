"""Protect discoverability when content is stored outside ordinary Hugo pages."""

import copy
import unittest

from check_search import ResearchText, search_errors


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


if __name__ == "__main__":
    unittest.main()
