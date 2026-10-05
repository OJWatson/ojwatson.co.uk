+++
# Hero widget.
widget = "hero"  # See https://sourcethemes.com/academic/docs/page-builder/
headless = true  # This file represents a page section.
active = true  # Activate this widget? true/false
weight = 10  # Order that this section will appear.

title = "Infectious disease modelling for public-health decision-making"

# Hero image (optional). Enter filename of an image in the `static/img/` folder.

[design.background]
  # Apply a background color, gradient, or image.
  #   Uncomment (by removing `#`) an option to apply it.
  #   Choose a light or dark text color by setting `text_color_light`.
  #   Any HTML color name or Hex value is valid.

  # Background color.
  # color = "navy"
  
  # Background gradient.
  # gradient_start = "#4bb4e3"
  # gradient_end = "#2b94c3"
  color = "#f7faf9"
  
  # Background image.
  # image = ""  # Name of image in `static/img/`.
  # image_darken = 0.6  # Darken the image? Range 0-1 where 0 is transparent and 1 is opaque.

  # Text color (true=light or false=dark).
  text_color_light = false

# Call to action links (optional).
#   Display link(s) by specifying a URL and label below. Icon is optional for `[cta]`.
#   Remove a link/note by deleting a cta/note block.
[cta]
  url = "/research/"
  label = "Research"
  icon_pack = "fas"
  icon = "microscope"
  
[cta_alt]
  url = "/team/"
  label = "Team"

# Note. An optional note to show underneath the links.
[cta_note]
  label = '<a href="/projects/">Projects</a> · <a href="/files/cv.pdf">CV</a> · <a href="/contact/">Contact</a>'

[advanced]
 css_class = "mission-hero"
+++

I develop open, reproducible methods at the intersection of infectious disease modelling, mortality estimation, and AI for public health.

My group works on evidence that can support decisions under uncertainty, with recent applications across malaria, COVID-19, vaccine preparedness, and humanitarian crises.
