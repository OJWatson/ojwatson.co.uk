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

We use mathematical models, data and open software to understand infectious disease burden and support public health decisions. Our work connects three areas: malaria control, vaccination and pandemic preparedness, and evidence for humanitarian response.

The examples below bring together current collaborations and earlier work by OJ that underpins the programme. For a concise collection of papers and associated code, visit [Selected outputs](/outputs/).

[Malaria](#malaria-transmission-modelling) · [Vaccines and preparedness](#vaccine-impact-and-pandemic-preparedness) · [Mortality and humanitarian evidence](#humanitarian-evidence-for-humanitarian-operations)

## Malaria transmission modelling

How can surveillance and modelling help protect malaria diagnosis and treatment? We study how changes in parasite populations affect the tools used by malaria control programmes, linking genetic and epidemiological data to questions about where surveillance is most needed.

Our work on diagnostic reliability includes a [2025 Nature Medicine study of the global risk from pfhrp2/3 deletions](https://doi.org/10.1038/s41591-025-03974-3), with the accompanying [hrpup research compendium](https://github.com/OJWatson/hrpup). Earlier [work in eLife](https://doi.org/10.7554/eLife.25008) examined the drivers of these deletions in sub-Saharan Africa.

A complementary [2025 Lancet Microbe study](https://doi.org/10.1016/j.lanmic.2024.101027) compared trends in markers of antimalarial resistance in Uganda and southeast Asia. Together, these studies illustrate how modelling can help interpret surveillance signals while making uncertainty explicit.

Explore the related [malaria software projects](/projects/), including [hrpup](/project/hrpup/), [hrp2malaRia](/project/hrp2malaria/) and [magenta](/project/magenta/).

## Vaccine impact and pandemic preparedness

How much disease can vaccination prevent, and how do timing, access and delivery change that benefit? We use models to compare vaccination strategies and assess investments in preparedness, with particular attention to differences between countries and health systems.

The [2024 study of the 100 Days Mission](https://doi.org/10.1016/S2214-109X(24)00286-9), led by Gregory Barnsley, examined how faster vaccine availability could have changed the course of COVID-19. It builds on the [2022 analysis of the first year of COVID-19 vaccination](https://doi.org/10.1016/S1473-3099(22)00320-6), which estimated 19.8 million deaths averted when calibrated to excess mortality estimates. This is a model-based estimate, rather than a directly observed count. The [study's analysis repository](https://github.com/mrc-ide/covid-vaccine-impact-orderly) links the result to its data and code.

Related software includes the [nimue vaccination model](/project/nimue/) and [squire epidemic model](/project/squire/). Further project pages describe work on [vaccine cost evaluation](/project/vece/) and [returns on vaccine investment](/project/roiv/).

## Humanitarian evidence for humanitarian operations

How can we produce useful evidence when routine health information is incomplete or disrupted? This work combines mortality estimation, alternative data sources and collaboration with public health and humanitarian partners. It also asks how modelling results can be communicated in forms that people can use.

The [Damascus mortality study in Nature Communications (2021)](https://doi.org/10.1038/s41467-021-22474-9) combined reported mortality with community obituary notifications to investigate under-reporting of COVID-19 deaths. Its [dedicated research compendium](https://github.com/mrc-ide/syria-covid-ascertainment) contains the accompanying analysis.

Paula Christen led two recent studies on the connection between evidence and decisions:

- [Enhancing epidemic forecast usability for policymakers: a global mixed-methods study](https://doi.org/10.1371/journal.pgph.0006519), **PLOS Global Public Health, 2026**. Surveys and interviews examined how forecasts were understood and used, and what made them useful to policymakers. [Analysis code and de-identified survey data](https://github.com/paulachristen/infectech_manuscript).
- [Bridging the gap between public health, academia and policy](https://doi.org/10.1136/bmjgh-2025-019587), **BMJ Global Health, 2026**. A practice paper reflecting on the 2025 CEMA–MRC hackathon in Kenya, where researchers, developers and policymakers co-developed prototype tools. [Hackathon resources](https://cema-mrc-hackathon.github.io/) and [public project repositories](https://github.com/CEMA-MRC-Hackathon).

Current project pages include [mortality modelling](/project/vrcmort/) and [vaccine-preventable disease modelling](/project/vpdsus/).

## Methods that connect the work

Open software, reproducible analysis and clear communication run through the programme. We also explore methods that make computational models faster and easier to use, including machine learning and model emulation.

OJ co-authored the [2025 Nature Perspective on artificial intelligence for modelling infectious disease epidemics](https://doi.org/10.1038/s41586-024-08564-w). This discusses opportunities, limitations and evaluation needs for AI in epidemiology. Related development work is described on the [emidm project page](/project/emidm/); the Perspective is not a validation study of that software.

The [projects catalogue](/projects/) also includes tools for accessing survey data, analysing malaria genetics and teaching outbreak modelling. [Meet the people](/team/) or [get in touch](/contact/) to discuss a research question or collaboration.
