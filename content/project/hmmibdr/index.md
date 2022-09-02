---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "hmmIBDr"
summary: "Rcpp implementation of [hmmIBD](https://github.com/glipsnort/hmmIBD)."
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

url_code: "https://github.com/OJWatson/hmmibdr"
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

`hmmibdr` is an Rcpp wrapper for [hmmIBD](https://github.com/glipsnort/hmmIBD) in Rcpp. There has been a recent proliferation in the number of malaria studies using IBD. As interest in IBD grows, the need to provide comprehensive details of software used to infer IBD increases. hmmIBD is the only program known to the authors that is designed specifically for haploid malaria genomes and is capable of comparing samples across populations with different allele frequencies. This will likely be a useful feature for malaria elimination efforts, since it could facilitate identification of imported malaria cases. 

I claim no ownership over the original source code, and all attribution and acknowledgement should be referred to
the original [project](https://github.com/glipsnort/hmmIBD), and the [associated publication](hhttps://malariajournal.biomedcentral.com/articles/10.1186/s12936-018-2349-7)[^1]. I have simply provided
this wrapper in the hope that it might be helpful for others, and have provided a tutorial for basic use.

 [^1]:  Schaffner, S.F., Taylor, A.R., Wong, W. et al. hmmIBD: software to infer pairwise identity by descent between haploid genotypes. Malar J 17, 196 (2018). (https://malariajournal.biomedcentral.com/articles/10.1186/s12936-018-2349-7)
