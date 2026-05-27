# Sink Microbiome Project — Analysis Pipeline & Website

A nationwide citizen science initiative exploring bacterial communities in household bathroom sinks. This repository contains the R analysis pipeline, JSON output data, and the full static website hosted at [sinkmicrobiome.org](https://sinkmicrobiome.org).

## Repository Structure

```
├── .github/
│   └── workflows/
│       └── update-analysis.yml       # Automated analysis (monthly + on data push)
├── data/
│   ├── otu-table-w-taxonomy.txt      # OTU abundance table with GTDB taxonomy
│   ├── metadata.txt                  # Sample metadata (Kit ID, sample_location, State)
│   └── functional_guilds_reference.csv  # Genus-to-guild mapping database
├── scripts/
│   ├── 00_config.R                   # Configuration settings
│   ├── 01_data_processing.R          # Load OTU/metadata, rarefaction, filter low-abundance OTUs
│   ├── 02_alpha_diversity.R          # Richness, Shannon, Simpson; percentile rankings by State
│   ├── 03_beta_diversity.R           # Bray-Curtis distances; within-kit & state-level comparisons
│   ├── 04_functional_guilds.R        # Map genera to 6 functional categories; scores by State
│   ├── 05_export_json.R              # Generate all JSON output for website
│   ├── run_pipeline.R                # Local pipeline runner
│   └── run_pipeline_github.R         # GitHub Actions pipeline runner
├── output/
│   ├── summary.json                  # Landing page stats + similarity scores
│   ├── map_data.json                 # Sample-level state data
│   ├── participants_index.json       # All kit IDs with state
│   ├── percentile_reference.json     # Guild descriptions
│   └── participants/
│       ├── kit_8.json
│       ├── kit_12.json
│       └── ...                       # One file per kit
├── website/
│   ├── index.html                    # Landing page
│   ├── participant.html              # Individual kit results (loaded dynamically)
│   ├── microbes.html                 # Full microbial community browser
│   ├── hypothesis.html               # Citizen scientist hypothesis submission form
│   ├── donate.html                   # Donation options and instructions
│   ├── assets/
│   │   └── logo.png
│   ├── css/
│   │   ├── styles.css                # Global styles
│   │   └── participant.css           # Participant results page styles
│   └── js/
│       ├── main.js                   # Landing page logic and visualizations
│       └── participant.js            # Individual results page logic
├── CNAME                             # Custom domain: sinkmicrobiome.org
├── .nojekyll                         # Disables Jekyll (required for JSON/RDS files)
└── index.html                        # Root redirect to /website/
```

## Website

The site is hosted on GitHub Pages at **sinkmicrobiome.org**. All pages share a common navigation bar linking to the PreMiEr website, LinkedIn, Bluesky, and the donation page.

### Landing Page (`index.html`)
- Project introduction and overview
- Summary statistics: samples analyzed, distinct bacteria, states represented
- Interactive US bubble map — bubble size reflects sample count per state; hover for details
- Most common bacteria by state (top 5 genera per state)
- Phylum-level donut chart and top-15 genera bar chart across all samples
- Drain vs. countertop similarity strip chart — one dot per household, colored by state
- Participant lookup by Kit ID
- Grid of all participant cards linking to individual results
- Embedded PBS SciNC video ("Meet the Microbes That Climb Out of Sinks")
- Hypothesis submission link
- Donation teaser section

### Individual Results (`participant.html?kit=<id>`)
- Top 5 bacterial genera with relative abundance and public-friendly descriptions
- Total unique bacterial genera recovered
- Drain vs. countertop similarity score with gauge visualization
- Species richness percentile ranking (compared to all samples)
- Beta diversity comparison: same-state sinks vs. other-state sinks
- Functional guild percentile rankings (6 categories)

### Microbial Community Browser (`microbes.html`)
- Phylum-level donut chart
- Top-15 genera bar chart
- Live hero stats (sample count, state count) pulled from `summary.json`

### Hypothesis Form (`hypothesis.html`)
- Free-text submission form delivered via [formsubmit.co](https://formsubmit.co) to sinkmicrobiome@duke.edu
- Thank-you confirmation shown after submission

### Donation Page (`donate.html`)
- **Option 1 — Join the Study ($10):** Receive a sampling kit
- **Option 2 — Support the Research (tiered swag):** $25 pen & notebook, $50 tote bag, $75 t-shirt, $100 Owala water bottle — sampling kit included at every tier
- Step-by-step instructions for donating via the Duke giving portal (gifts.duke.edu)
- Full disclaimers: tax deductibility (EIN 56-0532129), US shipping only, fulfillment timeline, availability, one reward per donation, no refunds, privacy

### Functional Guilds

| Guild | Description |
|-------|-------------|
| Personal Care Product Degraders | Bacteria that break down soaps and surfactants |
| Moisture Lovers | Water-loving bacteria thriving in humid sink environments |
| Disinfectant Survivalists | Bacteria tolerant of household disinfectants |
| Odor Producers | Bacteria producing volatile compounds |
| Skin Commuters | Bacteria originating from human skin |
| Oral Commuters | Bacteria originating from the mouth |

## Analysis Pipeline

Scripts run sequentially. Each script sources the previous outputs.

### 1. Data Processing (`01_data_processing.R`)
- Loads OTU table and sample metadata
- Rarefies to 100,000 reads per sample
- Filters low-abundance OTUs
- Parses GTDB taxonomy strings to extract Phylum through Species

### 2. Alpha Diversity (`02_alpha_diversity.R`)
- Calculates observed richness, Shannon index, and Simpson index per sample
- Computes percentile rankings relative to all other drain (tail piece) samples
- Summarizes metrics by **State**

### 3. Beta Diversity (`03_beta_diversity.R`)
- Calculates Bray-Curtis dissimilarity matrix
- **Within-kit similarity:** drain vs. countertop for each household (converted to similarity = 1 − dissimilarity)
- **Geographic comparisons:** average similarity to same-state sinks vs. other-state sinks

### 4. Functional Guilds (`04_functional_guilds.R`)
- Maps genera to 6 functional categories using the guild reference database
- Calculates guild score per sample (% relative abundance in each category)
- Merges on **State** (not county or zipcode)

### 5. JSON Export (`05_export_json.R`)
- Generates `summary.json` (landing page stats, state lists, per-state top taxa, drain–countertop similarity scores for all kits)
- Generates `participants_index.json` (kit ID + state for every sample)
- Generates `participants/kit_*.json` (full individual results per kit)
- `total_taxa` per participant counts **unique genera** (not OTUs) for consistency with the landing page stat

## Data Files

### Input

| File | Description |
|------|-------------|
| `otu-table-w-taxonomy.txt` | Tab-separated; first column is full GTDB taxonomy string (semicolon-delimited); remaining columns are sample IDs in the format `{kit_id}_{P or Y}` (P = drain/tail piece, Y = countertop); multi-timepoint kits use `{kit_id}_{timepoint}_{P or Y}` |
| `metadata.txt` | Tab-separated; columns: `Sample ID`, `Kit ID`, `sample_location` (Tail piece / Countertop), `State` (full state name) |
| `functional_guilds_reference.csv` | Genus-to-guild mapping; used by `04_functional_guilds.R` |

### Output (JSON)

| File | Website use |
|------|-------------|
| `summary.json` | Landing page stats: `total_samples`, `total_taxa`, `states`, `taxa_by_state`, `top5_taxa_by_state`, `similarity_scores`, `last_updated` |
| `map_data.json` | State-level sample counts for bubble map |
| `participants_index.json` | Array of `{ kit_id, state }` for participant grid and lookup |
| `participants/kit_*.json` | Full results for one kit: top taxa, diversity metrics, beta diversity, guild scores |

## Running the Analysis

### Prerequisites
- R 4.0+
- Packages: `vegan`, `jsonlite`, `dplyr`, `tidyr`, `tibble`

### Local Execution
```bash
cd scripts
Rscript run_pipeline.R
```

### Automated Updates (GitHub Actions)
The pipeline runs automatically:
- **Monthly** — 1st of each month at 6:00 AM UTC
- **On data push** — when files in `data/` are modified
- **Manual trigger** — via the "Run workflow" button in GitHub Actions

> **Note:** The workflow file (`.github/workflows/update-analysis.yml`) cannot be edited by pushing locally because the PAT does not have `workflow` scope. Edit it directly in the GitHub web UI.

> **Node.js deprecation:** Actions use Node.js 20. Add `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` as a job-level env var before June 2026 forced migration.

## Adding New Data

1. Add updated `otu-table-w-taxonomy.txt` and `metadata.txt` to `data/`
2. Commit and push — the GitHub Actions workflow will run automatically, regenerate all JSON, and commit the results to `output/`
3. Or trigger manually via GitHub Actions

> **Push conflicts:** GitHub Actions commits to `output/` on the same branch. Always run `git pull --rebase origin main` before pushing local changes.

## Contact

Questions about this project? Email us at [sinkmicrobiome@duke.edu](mailto:sinkmicrobiome@duke.edu).

This work was supported primarily by the Engineering Research Centers Program of the National Science Foundation under NSF Cooperative Agreement No. EEC-2133504.
