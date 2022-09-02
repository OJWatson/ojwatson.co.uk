---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "squire"
summary: "Compartmental model of SARS-CoV-2 transmission."
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

url_code: "https://github.com/mrc-ide/squire"
url_pdf: "https://www.science.org/doi/10.1126/science.abc0035"
url_slides: ""
url_video: ""

# Slides (optional).
#   Associate this project with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides = "example-slides"` references `content/slides/example-slides.md`.
#   Otherwise, set `slides = ""`.
slides: ""
---

`squire` enables users to simulate models of SARS-CoV-2 epidemics. This is done using an age-structured SEIR model that also explicitly considers healthcare capacity and disease severity. The model has been used for epidemic modelling in low- and middle-income countries (LMICs) for the Imperial College COVID-19 Response Team, producing trajectories for the potential global burden of COVID-19[^1]. 

squire has been used throughout the pandemic to provide projections for every country to the World Health Organization (WHO) as part of the first costing for a global response to COVID-19[^2]  and the WHO Essential Supplies Forecasting Tool. 

 [^1]: P. G. T. Walker, C. Whittaker, **O. J. Watson**, M. Baguelin, P. Winskill, A. Hamlet, B. A. Djafaara, Z. Cucunubá, D. Olivera Mesa, W. Green, H. Thompson, S. Nayagam, K. E. C. Ainslie, S. Bhatia, S. Bhatt, A. Boonyasiri, O. Boyd, N. F. Brazeau, L. Cattarino, G. Cuomo-Dannenburg, A. Dighe, C. A. Donnelly, I. Dorigatti, S. L. van Elsland, R. FitzJohn, H. Fu, K. A. M. Gaythorpe, L. Geidelberg, N. Grassly, D. Haw, S. Hayes, W. Hinsley, N. Imai, D. Jorgensen, E. Knock, D. Laydon, S. Mishra, G. Nedjati-Gilani, L. C. Okell, H. J. Unwin, R. Verity, M. Vollmer, C. E. Walters, H. Wang, Y. Wang, X. Xi, D. G. Lalloo, N. M. Ferguson, A. C. Ghani, The impact of COVID-19 and strategies for mitigation and suppression in low- and middle-income countries. Science. 369, 413–422 (2020). (https://www.science.org/doi/10.1126/science.abc0035)

[^2]: T. Tan-Torres Edejer, O. Hanssen, A. Mirelman, P. Verboom, G. Lolong, **O. J. Watson**, L. L. Boulanger, A. Soucat, Projected health-care resource needs for an effective response to COVID-19 in 73 low-income and middle-income countries: a modelling study. Lancet Glob Health. 8, e1372–e1379 (2020).

