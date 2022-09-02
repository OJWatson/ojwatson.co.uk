---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "McCOILR"
summary: "Rcpp implementation of [THEREALMcCOIL](https://github.com/Greenhouse-Lab/THEREALMcCOIL)."
authors: []
tags: [rpackage, R, malaria]
categories: [R, malaria]
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

url_code: "https://github.com/OJWatson/mccoilr"
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

`McCOILR` is an Rcpp wrapper for [THE REAL McCOIL](https://github.com/Greenhouse-Lab/THEREALMcCOIL) software 
developed by the [Greenhouse Lab](https://github.com/Greenhouse-Lab) that estimates complexity of infection 
and population allele frequencies using SNP data obtained from Sequenom or similar types of SNP assays. It was
simply created to aid incorporating COI estimation more easily within distributed computing pipelines, and I
claim no ownership over the original source code, and all attribution and acknowledgement should be referred to
the original [project](https://github.com/Greenhouse-Lab/THEREALMcCOIL), and the [associated publication](http://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1005348)[^1]. I have simply provided
this wrapper in the hope that it might be helpful for others, and have provided a tutorial for basic use.

 [^1]:  THE REAL McCOIL: A method for the concurrent estimation of the complexity of infection and SNP allele frequency for malaria parasites. Chang HH, Worby CJ, Yeka A, Nankabirwa J, Kamya MR, et al. (2017) THE REAL McCOIL: A method for the concurrent estimation of the complexity of infection and SNP allele frequency for malaria parasites. PLOS Computational Biology 13(1): e1005348. (https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1005348#sec015)
