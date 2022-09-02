---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "nimue"
summary: "Vaccination model of SARS-CoV-2 transmission."
authors: []
tags: [rpackage, R, covid]
categories: [R, covid]
date: 2022-07-12T08:38:28-07:00

# Optional external URL for project (replaces project detail page).
# external_link: "https://docs.ropensci.org/rdhs/"

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
# Focal points: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight.
image:
  caption: ""
  focal_point: "Top"
  preview_only: false

# Custom links (optional).
#   Uncomment and edit lines below to show custom links.

url_code: "https://github.com/mrc-ide/nimue"
url_pdf: "https://www.thelancet.com/journals/laninf/article/PIIS1473-3099(22)00320-6/fulltext"
url_slides: ""
url_video: ""

# Slides (optional).
#   Associate this project with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides = "example-slides"` references `content/slides/example-slides.md`.
#   Otherwise, set `slides = ""`.
slides: ""
---

`nimue` is an extension to the [squire package](https://mrc-ide.github.io/squire/) that allows vaccination to be included. For detailed information on the base model structure and parameterisation please visit the [squire webpage](https://mrc-ide.github.io/squire/). The model has been used for vaccine delivery optimisation[^1] and as part of model trajectories in support of the WHO Essential Supplies Forecasting Tool. 

nimue has also been used for the first estimates of the global impact of the COVID-19 vaccinations, showing almost 20 million deaths were averted due to vaccination during the first of vaccinations[^2].

 [^1]: A. B. Hogan, P. Winskill, **O. J. Watson**, P. G. T. Walker, C. Whittaker, M. Baguelin, N. F. Brazeau, G. D. Charles, K. A. M. Gaythorpe, A. Hamlet, E. Knock, D. J. Laydon, J. A. Lees, A. Løchen, R. Verity, L. K. Whittles, F. Muhib, K. Hauck, N. M. Ferguson, A. C. Ghani, Within-country age-based prioritisation, global allocation, and public health impact of a vaccine against SARS-CoV-2: A mathematical modelling analysis. Vaccine. 39, 2995–3006 (2021). (https://www.sciencedirect.com/science/article/pii/S0264410X21004278?via%3Dihub)

[^2]: **O. J. Watson**, G. Barnsley, J. Toor, A. B. Hogan, P. Winskill, A. C. Ghani, Global impact of the first year of COVID-19 vaccination: a mathematical modelling study. Lancet Infect. Dis. (2022). (https://www.thelancet.com/journals/laninf/article/PIIS1473-3099(22)00320-6/fulltext).
