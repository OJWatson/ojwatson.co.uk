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

[design]
  columns = "1"

[advanced]
 # Custom CSS.
 css_style = ""
 css_class = "research-overview"
+++

# Research

I work on open, reproducible models that help public-health teams reason under uncertainty. The main strands below connect methods, software, and collaborations across malaria, COVID-19, pandemic preparedness, humanitarian response, and AI-enabled epidemic modelling.

<div class="research-link-row">
  <a href="#malaria-transmission-modelling">Malaria</a>
  <a href="#covid-19-and-vaccine-impact">COVID-19 and vaccines</a>
  <a href="#humanitarian-evidence">Humanitarian evidence</a>
  <a href="#ai-enabled-epidemic-modelling">AI-enabled modelling</a>
  <a href="/projects/">Projects</a>
</div>

<div class="research-grid">
  <section class="research-card" id="malaria-transmission-modelling">
    <img src="/img/hrp2.jpg" alt="">
    <div>
      <p class="research-kicker">Transmission modelling</p>
      <h3>Malaria diagnostics, genetics, and control</h3>
      <p>I use mathematical transmission models to evaluate malaria diagnostics, parasite genetics, and intervention strategy. This work includes WHO-facing evidence on <em>pfhrp2/3</em> deletion surveillance, false-negative rapid diagnostic tests, ivermectin, malaria genetics, partner drug resistance, and artemisinin resistance.</p>
      <p><strong>Selected outputs:</strong> <a href="https://doi.org/10.1038/S41591-025-03974-3">Nature Medicine, 2025</a>; <a href="https://doi.org/10.7554/eLife.25008">eLife, 2017</a>; <a href="https://doi.org/10.1016/j.lanmic.2024.101027">Lancet Microbe, 2025</a>.</p>
      <p><strong>Tools:</strong> <a href="/project/hrp2malaria/">hrp2malaRia</a>, <a href="/project/magenta/">magenta</a>, <a href="/project/hmmibdr/">hmmIBDr</a>, <a href="/project/mccoilr/">McCOILR</a>, <a href="/project/hrpup/">hrpup</a>.</p>
    </div>
  </section>

  <section class="research-card" id="covid-19-and-vaccine-impact">
    <img src="/img/research/vaccine-impact-figure.png" alt="">
    <div>
      <p class="research-kicker">Pandemic response</p>
      <h3>COVID-19 modelling and vaccine impact</h3>
      <p>As part of the Imperial College COVID-19 response team, I led software and modelling for low- and middle-income country scenarios, produced trajectories for global burden estimates, and supplied country-level projections to the WHO. I also published global estimates of COVID-19 vaccine impact and continue to work on vaccine preparedness and the 100 Days Mission.</p>
      <p><strong>Selected outputs:</strong> <a href="https://doi.org/10.1016/S2214-109X(24)00286-9">Lancet Global Health, 2024</a>; <a href="https://doi.org/10.1016/S1473-3099(22)00320-6">Lancet Infectious Diseases, 2022</a>.</p>
      <p><strong>Tools:</strong> <a href="/project/squire/">squire</a>, <a href="/project/nimue/">nimue</a>, <a href="/project/vece/">vece</a>, <a href="/project/roiv/">roiv</a>, <a href="/project/vpdsus/">vpdsus</a>.</p>
    </div>
  </section>

  <section class="research-card" id="humanitarian-evidence">
    <img src="/img/research/humanitarian-mortality-model.png" alt="">
    <div>
      <p class="research-kicker">Crisis-affected settings</p>
      <h3>Humanitarian evidence for operations</h3>
      <p>I lead work on disease-burden estimation and response analytics in conflict, food insecurity, and other crisis-affected contexts. This includes excess mortality estimation, surveillance innovation, cholera anticipatory action, vaccine-preventable disease burden modelling, and novel mortality data sources from Damascus and Khartoum.</p>
      <p><strong>Selected outputs:</strong> <a href="https://doi.org/10.1101/2025.08.11.25333414">medRxiv, 2025</a>; <a href="https://doi.org/10.31235/osf.io/tcjqs_v1">SocArXiv, 2025</a>.</p>
      <p><strong>Tools:</strong> <a href="/project/vrcmort/">vrcmort</a>, <a href="/project/vpdsus/">vpdsus</a>.</p>
    </div>
  </section>

  <section class="research-card" id="ai-enabled-epidemic-modelling">
    <img src="/img/research/ai-epidemic-emulator.png" alt="">
    <div>
      <p class="research-kicker">Methods</p>
      <h3>AI-enabled epidemic modelling</h3>
      <p>A core methodological focus is developing deep learning surrogates for computationally intensive epidemic models. The aim is faster calibration, uncertainty quantification, and scenario exploration while keeping models interpretable enough for public-health decision-making.</p>
      <p><strong>Selected output:</strong> <a href="https://doi.org/10.1038/s41586-024-08564-w">Nature, 2025</a>.</p>
      <p><strong>Tool:</strong> <a href="/project/emidm/">emidm</a>.</p>
    </div>
  </section>

  <section class="research-card">
    <img src="/img/rdhs.png" alt="">
    <div>
      <p class="research-kicker">Open data access</p>
      <h3>Demographic and Health Surveys software</h3>
      <p>I developed <a href="/project/rdhs/">rdhs</a>, the first non-proprietary tool to ease access to and analysis of DHS datasets. The package was created to democratise access to lower-middle income country data and has been downloaded more than 23,000 times since publication.</p>
      <p><strong>Tool:</strong> <a href="/project/rdhs/">rdhs</a>.</p>
    </div>
  </section>
</div>

<p class="research-related">Related pages: <a href="/projects/">Projects</a> | <a href="/teaching/">Teaching</a> | <a href="/team/">Team</a> | <a href="/post/">News</a> | <a href="/contact/">Contact</a></p>
