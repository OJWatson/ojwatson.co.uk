+++
widget = "blank"
headless = true
active = true
weight = 30
title = ""

[advanced]
css_class = "research-overview"
+++

<h1 id="research-title">Research</h1>

I work on infectious disease modelling, with interests in malaria, vaccination and mortality estimation in humanitarian settings. These are some examples from current collaborations and earlier work.

[Malaria](#malaria-transmission-modelling) · [Vaccines](#vaccine-impact-and-pandemic-preparedness) · [Mortality and humanitarian research](#humanitarian-evidence-for-humanitarian-operations) · [Survey data](#survey-data-and-software) · [Modelling methods](#methods-that-connect-the-work)

{{< research-area id="malaria-transmission-modelling" title="Malaria transmission modelling" image="/img/hrp2.jpg" alt="Three maps of malaria prevalence, treatment seeking and diagnostic risk in sub-Saharan Africa" caption="Earlier malaria diagnostic-risk modelling. [eLife, 2017](https://doi.org/10.7554/eLife.25008)." >}}

I use genetic and epidemiological data to study changes that affect malaria diagnosis and treatment, and to help interpret surveillance findings.

My work with collaborators includes modelling the risk posed by parasite gene deletions that affect rapid diagnostic tests. With C. P. G. Meier-Scherling and colleagues, I also compared trends in markers of antimalarial resistance in Uganda and southeast Asia.

Selected papers:

- [Global risk from pfhrp2/3 deletions](https://doi.org/10.1038/s41591-025-03974-3) — Nature Medicine, 2025. [Analysis code](https://github.com/OJWatson/hrpup).
- [Trends in markers of antimalarial resistance](https://doi.org/10.1016/j.lanmic.2024.101027) — The Lancet Microbe, 2025.
- [Drivers of pfhrp2 deletions in sub-Saharan Africa](https://doi.org/10.7554/eLife.25008) — eLife, 2017.

Related software: [hrpup](/project/hrpup/), [hrp2malaRia](/project/hrp2malaria/) and [magenta](/project/magenta/).

{{< /research-area >}}

{{< research-area id="vaccine-impact-and-pandemic-preparedness" title="Vaccination and pandemic preparedness" image="/img/headers/vaccine2.jpg" alt="World map of estimated deaths averted by COVID-19 vaccination per 10,000 people" caption="From the study of the first year of COVID-19 vaccination. [The Lancet Infectious Diseases, 2022](https://doi.org/10.1016/S1473-3099(22)00320-6)." >}}

I model the effects of vaccination, including how timing, access and delivery affect its impact in different countries.

Our analysis of the first year of COVID-19 vaccination estimated 19.8 million deaths averted when calibrated to excess mortality estimates. This is a model-based estimate, rather than a directly observed count. I also contributed to the study of the 100 Days Mission led by Gregory Barnsley, on how faster vaccine availability could have changed the course of COVID-19.

Selected papers:

- [Impact of the 100 Days Mission for vaccines on COVID-19](https://doi.org/10.1016/S2214-109X(24)00286-9) — The Lancet Global Health, 2024.
- [Global impact of the first year of COVID-19 vaccination](https://doi.org/10.1016/S1473-3099(22)00320-6) — The Lancet Infectious Diseases, 2022. [Analysis code](https://github.com/mrc-ide/covid-vaccine-impact-orderly).

Related software: [nimue](/project/nimue/), [squire](/project/squire/), [vaccine cost evaluation](/project/vece/) and [returns on vaccine investment](/project/roiv/).

{{< /research-area >}}

{{< research-area id="humanitarian-evidence-for-humanitarian-operations" title="Mortality and humanitarian research" image="/img/certificate.jpg" alt="Example of a community obituary notice used in mortality research" caption="Community obituary notices formed part of our [mortality study in Damascus](https://doi.org/10.1038/s41467-021-22474-9)." >}}

I work on estimating mortality where routine reporting is incomplete or disrupted, and on the use of modelling in public health and humanitarian settings.

With Mervat Alhaffar, Zaki Mehchy and colleagues, I combined reported mortality with community obituary notifications to investigate under-reporting of COVID-19 deaths in Damascus. I also contributed to two recent studies led by Paula Christen on the use of forecasts and collaboration between researchers and policymakers.

Selected papers:

- [Under-reporting of COVID-19 mortality in Damascus](https://doi.org/10.1038/s41467-021-22474-9) — Nature Communications, 2021. [Analysis code](https://github.com/mrc-ide/syria-covid-ascertainment).
- [Enhancing epidemic forecast usability for policymakers: a global mixed-methods study](https://doi.org/10.1371/journal.pgph.0006519) — PLOS Global Public Health, 2026. [Analysis code and de-identified survey data](https://github.com/paulachristen/infectech_manuscript).
- [Bridging the gap between public health, academia and policy](https://doi.org/10.1136/bmjgh-2025-019587) — BMJ Global Health, 2026. Reflections on the 2025 CEMA–MRC hackathon in Kenya. [Hackathon resources](https://cema-mrc-hackathon.github.io/) and [project repositories](https://github.com/CEMA-MRC-Hackathon).

Related projects: [mortality modelling](/project/vrcmort/) and [vaccine-preventable disease modelling](/project/vpdsus/).

{{< /research-area >}}

{{< research-area id="survey-data-and-software" title="Survey data and research software" image="/img/rdhs.png" alt="rdhs logo" caption="rdhs: working with Demographic and Health Surveys data in R." >}}

I develop open software for research and teaching. One example is **rdhs**, an R package for finding and preparing Demographic and Health Surveys data in reproducible workflows. The package is part of rOpenSci; access to individual datasets remains subject to DHS permissions.

- [rdhs software paper](https://doi.org/10.12688/wellcomeopenres.15311.1) — Watson, FitzJohn and Eaton, Wellcome Open Research, 2019.
- [Package documentation](https://docs.ropensci.org/rdhs/) and [source code](https://github.com/ropensci/rdhs).

The [software catalogue](/projects/) also includes tools for malaria genetics and outbreak teaching.

{{< /research-area >}}

{{< research-area id="methods-that-connect-the-work" title="Modelling methods and AI" image="/img/research/ai-epidemic-emulator.png" alt="Diagram of ways artificial intelligence can support infectious disease modelling" caption="Illustration from the [2025 Nature Perspective on AI in epidemiology](https://doi.org/10.1038/s41586-024-08564-w)." >}}

I explore methods for fitting and using computational models, including machine learning and model emulation.

I co-authored the [2025 Nature Perspective on artificial intelligence for modelling infectious disease epidemics](https://doi.org/10.1038/s41586-024-08564-w), which discusses opportunities, limitations and evaluation needs for AI in epidemiology.

Related development work is described on the [emidm project page](/project/emidm/). The Perspective discusses the wider field; it is not a validation study of that software.

{{< /research-area >}}

Browse [selected papers and code](/outputs/), see [People](/team/) for current colleagues, or [get in touch](/contact/).
