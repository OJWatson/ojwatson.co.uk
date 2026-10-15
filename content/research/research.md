+++
# Research widget.
widget = "blank"  # See https://sourcethemes.com/academic/docs/page-builder/
headless = true  # This file represents a page section.
active = true  # Activate this widget? true/false
weight = 30  # Order that this section will appear in.

title = ""

# Choose the user profile to display
# This should be the username of a profile in your `content/authors/` folder.
# See https://sourcethemes.com/academic/docs/get-started/#introduce-yourself

[design.background]
  # Apply a background color, gradient, or image.
  #   Uncomment (by removing `#`) an option to apply it.
  #   Choose a light or dark text color by setting `text_color_light`.
  #   Any HTML color name or Hex value is valid.

  # Background color.
  # color = "navy"

  # Background gradient.
  # gradient_start = "DeepSkyBlue"
  # gradient_end = "SkyBlue"

  # Background image.
  #  image = "headers/tree.jpg"  # Name of image in `static/img/`.
  #  image_darken = 0  # Darken the image? Range 0-1 where 0 is transparent and 1 is opaque.

  # Text color (true=light or false=dark).
  text_color_light = false

[advanced]
 # Custom CSS.
 css_style = "research"
+++

# Research

<section class="research-area">

<img class="research-image research-image-right" src="/img/hrp2.jpg" alt="Maps of malaria epidemiology and diagnostic risk">

### Malaria transmission modelling

In 2016, a study in the Democratic Republic of Congo provided evidence that malaria parasites were evading detection by rapid diagnostic tests due to the deletion of the pfhrp2 gene. Using mathematical transmission models, I provided evidence that there was selection of pfhrp2 gene deletions to a WHO panel steered by the director of the WHO Global Malaria Programme. The panel formulated WHO guidance to national malaria control programmes (NMCPs) to implement molecular surveys to estimate pfhrp2 deletion prevalence. After attending the Malaria Policy Advisory Committee meeting in November 2017, I conducted a collaborative study with the WHO to estimate the potential for seasonal variations in malaria transmission to introduce bias in estimating pfhrp2 deletion prevalence. These findings informed NMCPs through an interactive online database and field training programmes to optimise surveillance for pfhrp2. (Both studies in eLife). Additionally, I have modelled the impact of false-negative RDTs on community surveys (BMJ Global Health), worked on modelling ivermectin as a possible addition to the currently available malaria control tools (Lancet Infectious Diseases), as well as a modelling-based evaluation of the utility of malaria genetics for inferring transmission intensity (Molecular Biology and Evolution) and the impact of partner drug resistance on artemisinin resistance (Lancet Microbe).

Selected publications:

- [Global risk of selection and spread of pfhrp2/3 deletions](https://doi.org/10.1038/s41591-025-03974-3) — Nature Medicine, 2025.
- [Modelling the drivers of pfhrp2 deletions](https://doi.org/10.7554/eLife.25008) — eLife, 2017.
- [Selection of kelch13 mutations in Uganda vs southeast Asia](https://doi.org/10.1016/j.lanmic.2024.101027) — The Lancet Microbe, 2025.

Related software: [hrp2malaRia](/project/hrp2malaria/), [magenta](/project/magenta/), [hmmIBDr](/project/hmmibdr/), [McCOILR](/project/mccoilr/), [hrpup](/project/hrpup/).

</section>

<section class="research-area">

<img class="research-image research-image-right" src="/img/research/vaccine-impact-figure.png" alt="Illustration comparing health costs and vaccine costs across vaccination policies">

### Vaccine impact and pandemic preparedness

I work on vaccine impact modelling for COVID-19 and future pandemic threats, including prioritisation, delivery strategy, and preparedness planning. This includes modelling related to the 100 Days Mission and next-generation vaccine scenarios.

The goal is to provide decision-relevant evidence on expected impact and uncertainty under realistic operational constraints.

Selected publications:

- [Impact of the 100 Days Mission for vaccines on COVID-19](https://doi.org/10.1016/S2214-109X(24)00286-9) — The Lancet Global Health, 2024.
- [Global impact of the first year of COVID-19 vaccination](https://doi.org/10.1016/S1473-3099(22)00320-6) — The Lancet Infectious Diseases, 2022.

Related software: [nimue](/project/nimue/), with [squire](/project/squire/) providing the underlying transmission model.

</section>

<section class="research-area">

<img class="research-image research-image-left" src="/img/research/humanitarian-mortality-model.png" alt="Diagram separating the underlying mortality process from incomplete death registration">

### Humanitarian evidence for humanitarian operations

I lead work on disease burden estimation and response analytics in crisis-affected settings, including conflict and food insecurity contexts. This includes excess mortality estimation, surveillance innovation, cholera anticipatory action, and vaccine-preventable disease burden modelling.

This strand is developed through the [Jameel Institute RISE initiative](https://www.imperial.ac.uk/jameel-institute/research/jameel-institute-realtime-intelligent-support-for-emergencies-jameel-institute-rise/) and collaborations with humanitarian and public health partners, with an emphasis on evidence that can support operational decisions under uncertainty.

Related work examines how epidemic forecasts inform decisions in resource-constrained settings and how partnerships connect researchers with public health practitioners and policymakers.

Selected publications on evidence use and partnerships:

- [Enhancing epidemic forecast usability for policymakers: a global mixed-methods study](https://doi.org/10.1371/journal.pgph.0006519) — PLOS Global Public Health, 2026.
- [Bridging the gap between public health, academia and policy](https://doi.org/10.1136/bmjgh-2025-019587) — BMJ Global Health, 2026; reflections on the CEMA–MRC hackathon in Kenya.

Related software: [vrcmort](/project/vrcmort/), for mortality estimation with changing registration completeness.

</section>

<section class="research-area">

<img class="research-image research-image-left" src="/img/headers/vaccine2.jpg" alt="World map illustrating estimated impact of COVID-19 vaccination">

### COVID-19 Modelling

In March 2020, I joined the Imperial College COVID-19 response team. I led the software development and modelling in low- and middle-income countries (LMICs), producing epidemic trajectories for the potential global burden of COVID-19 (Science). Throughout the pandemic, I provided epidemic scenario projections (Imperial College COVID-19 LMIC Reports) for every country to the WHO as part of the first costing for a global response to COVID-19 (Lancet Global Health) and the WHO Essential Supplies Forecasting Tool.

Selected publications:

- [The impact of COVID-19 and strategies for mitigation and suppression in low- and middle-income countries](https://doi.org/10.1126/science.abc0035) — Science, 2020.
- [Projected health-care resource needs for an effective response to COVID-19 in 73 low-income and middle-income countries](https://doi.org/10.1016/S2214-109X(20)30383-1) — The Lancet Global Health, 2020.

Related software: [squire](/project/squire/).

</section>

<section class="research-area">

<img class="research-image research-image-right research-image-small" src="/img/certificate.jpg" alt="Community obituary notice used as an alternative mortality data source">

### Generating Novel Mortality Data Sources in low-income settings

As part of growing evidence of COVID-19 mortality being unobserved, I led two research studies in Damascus (Nature Communications) and Khartoum ([Imperial College COVID-19 Report 39](https://www.imperial.ac.uk/mrc-global-infectious-disease-analysis/disease-areas/covid-19/report-39-sudan/)) to ascertain mortality reporting of COVID-19. In Damascus, I identified Facebook groups uploading obituary certificates since the start of the conflict in Damascus. These obituary certificates provided a reliable source of mortality patterns in the city that revealed clear COVID-19 epidemic dynamics. In Khartoum, I worked with local youth activist groups to integrate surveys of COVID-19 symptoms distributed through social media channels to estimate the proportion of COVID-19 deaths occurring undetected. The latter was part of evidence that led to new ministry of health intervention measures and increased public health campaigns to raise awareness of COVID-19 during Sudan's second wave.

Selected publications:

- [Leveraging community mortality indicators to infer COVID-19 mortality and transmission dynamics in Damascus, Syria](https://doi.org/10.1038/s41467-021-22474-9) — Nature Communications, 2021.
- [Alternative epidemic indicators for COVID-19 in three settings with incomplete death registration systems](https://doi.org/10.1126/sciadv.adg7676) — Science Advances, 2023; includes Khartoum.

Related software: [Damascus analysis code](https://github.com/mrc-ide/syria-covid-ascertainment).

</section>

<section class="research-area">

<img class="research-image research-image-left" src="/img/research/ai-epidemic-emulator.png" alt="Examples of artificial intelligence methods for epidemic forecasts, disease networks and pathogen genomics">

### AI-enabled epidemic modelling

A core methodological focus is developing deep learning surrogates for computationally intensive epidemic models. This work is aimed at accelerating calibration, uncertainty quantification, and scenario exploration for policy support.

I am particularly interested in combining mechanistic modelling with modern generative and representation-learning approaches that remain interpretable for public health decision-making.

Selected publications:

- [Artificial intelligence for modelling infectious disease epidemics](https://doi.org/10.1038/s41586-024-08564-w) — Nature, 2025.

Related software: [METIS](https://github.com/OJWatson/metis), for training and evaluating neural surrogates of simulator trajectories.

</section>

<section class="research-area">

<img class="research-image research-image-left" src="/img/rdhs.png" alt="rdhs package logo">

### Demographic and Health Surveys Program (DHS) Software

I have developed an open source software package, rdhs, to ease access to and analysis of Demographic and Health Surveys data in R. The software supports reproducible survey discovery, data access and analysis; access to individual survey datasets remains subject to DHS permissions.

Selected publications:

- [rdhs: an R package to interact with The Demographic and Health Surveys (DHS) Program datasets](https://doi.org/10.12688/wellcomeopenres.15311.1) — Wellcome Open Research, 2019.

Related software: [rdhs](/project/rdhs/).

</section>
