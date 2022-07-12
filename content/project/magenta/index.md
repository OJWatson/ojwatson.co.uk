---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "magenta"
summary: "An individual-based simulation model of malaria epidemiology and parasite genetics"
authors: []
tags: [rpackage, malaria]
categories: [r]
date: 2019-10-09T08:00:20-07:00

# Optional external URL for project (replaces project detail page).
# external_link: "https://ojwatson.github.io/magenta/index.html"

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
# Focal points: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight.
image:
  caption: ""
  focal_point: "Center"
  preview_only: false

# Custom links (optional).
#   Uncomment and edit lines below to show custom links.
links:
- name: GitHub
  url: https://ojwatson.github.io/magenta/index.html
  icon_pack: fab
  icon: github

url_code: ""
url_pdf: ""
url_slides: ""
url_video: ""

# Slides (optional).
#   Associate this project with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides = "example-slides"` references `content/slides/example-slides.md`.
#   Otherwise, set `slides = ""`.
slides: ""
---

`magenta` is an individual-based simulation model of malaria epidemiology and parasite genetics, which was designed to extends the Imperial malaria model by tracking the infection history of individuals. With this addition, genetic characteristics of the parasite can be assessed for looking at both neutral genetic variation as well as loci under selection.

The first and main research paper based on this project was published in MBE[^1], which showed the extenet to which parasite genetic traits could be used to infer malaria transmission intensity. 

[^1]: Oliver J Watson, Lucy C Okell, Joel Hellewell, Hannah C Slater, H Juliette T Unwin, Irene Omedo, Philip Bejon, Robert W Snow, Abdisalan M Noor, Kirk Rockett, Christina Hubbart, Joaniter I Nankabirwa, Bryan Greenhouse, Hsiao-Han Chang, Azra C Ghani, Robert Verity, Evaluating the Performance of Malaria Genetics for Inferring Changes in Transmission Intensity Using Transmission Modeling, Molecular Biology and Evolution, Volume 38, Issue 1, January 2021, Pages 274–289, https://doi.org/10.1093/molbev/msaa225