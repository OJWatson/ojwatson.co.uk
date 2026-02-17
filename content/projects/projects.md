+++
# A Projects section created with the Portfolio widget.
widget = "portfolio"  # See https://sourcethemes.com/academic/docs/page-builder/
headless = true  # This file represents a page section.
active = true  # Activate this widget? true/false
weight = 65  # Order that this section will appear.

title = "Projects"
subtitle = "Major software outputs, packages, and modelling tools."

[content]
  page_type = "project"
  filter_default = 0

  [[content.filter_button]]
    name = "All"
    tag = "*"

  [[content.filter_button]]
    name = "R Packages"
    tag = "rpackage"

  [[content.filter_button]]
    name = "Malaria"
    tag = "malaria"

  [[content.filter_button]]
    name = "COVID-19"
    tag = "covid"

  [[content.filter_button]]
    name = "AI/ML"
    tag = "ai"

  [[content.filter_button]]
    name = "Humanitarian"
    tag = "humanitarian"

  [[content.filter_button]]
    name = "Other"
    tag = "other"

[design]
  columns = "1"
  view = 3
  flip_alt_rows = false

[design.background]

[advanced]
 css_style = ""
 css_class = "projects"
+++
