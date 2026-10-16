---
title: "vrcmort"
summary: "R tools for estimating mortality when registration completeness changes."
authors: []
tags: [rpackage, humanitarian, other]
categories: [R, humanitarian]
date: 2025-12-01T10:00:00+00:00

image:
  caption: "Model schematic from vrcmort"
  focal_point: "Center"
  preview_only: false

url_code: "https://github.com/jameel-institute/vrcmort"
links:
- name: Documentation
  url: https://jameel-institute.github.io/vrcmort/
url_pdf: ""
url_slides: ""
url_video: ""
slides: ""
---

`vrcmort` fits hierarchical Bayesian models to vital-registration mortality counts when reporting changes across places and over time, including during armed conflict. It separates underlying mortality from the process by which deaths are registered, so a fall in recorded deaths is not automatically interpreted as a fall in mortality.

### Workflow

<ol class="mortality-workflow">
<li><strong>Prepare and inspect records</strong><span>Organise mortality counts and covariates; examine patterns in reporting.</span></li>
<li><strong>Fit mortality and reporting together</strong><span>Use R and Stan to estimate latent deaths and changing registration completeness.</span></li>
<li><strong>Summarise uncertainty</strong><span>Review fitted mortality, reporting estimates and model diagnostics.</span></li>
</ol>

The model can represent age-selective changes in reporting and partial pooling across regions.
