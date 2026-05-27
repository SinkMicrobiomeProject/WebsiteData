# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Citizen science bioinformatics project for the Sink Microbiome Project - analyzing bacterial communities in household bathroom sinks across multiple US states. Combines an R analysis pipeline with an interactive web interface for participant results.

## Commands

### Run Analysis Locally
```bash
cd scripts
Rscript run_pipeline.R
```

### GitHub Actions
- Runs monthly (1st of month, 6:00 AM UTC)
- Triggers automatically when files in `data/` are modified
- Can be manually triggered via GitHub Actions "Run workflow"
- The workflow uses `git pull --rebase origin main` before pushing to avoid rejection when local commits are ahead of remote

## Architecture

### Data Flow
```
data/ (OTU table, metadata, guild reference)
    ↓
scripts/ (R pipeline: 01-05)
    ↓
output/ (JSON files)
    ↓
website/ (HTML/JS frontend)
```

### Analysis Pipeline (Sequential)
1. `01_data_processing.R` - Load OTU/metadata, rarefaction (100k reads), filter low-abundance OTUs
2. `02_alpha_diversity.R` - Richness, Shannon, Simpson indices with percentile rankings; summary by **State** (not county)
3. `03_beta_diversity.R` - Bray-Curtis distances, within-kit similarity (drain vs countertop); comparisons by **State**
4. `04_functional_guilds.R` - Map genera to 7 functional categories, calculate scores; merges on `State` (not County/Zipcode)
5. `05_export_json.R` - Generate all JSON output for website; exports `states`, `taxa_by_state`, `top5_taxa_by_state`, `similarity_scores` fields

### Key Output Files
- `summary.json` - Landing page stats; keys: `total_samples`, `total_taxa`, `last_updated`, `states`, `taxa_by_state`, `top5_taxa_by_state`, `similarity_scores`
- `map_data.json` - Sample-level state data
- `participants_index.json` - All kit IDs with state
- `participants/kit_*.json` - Individual participant results; uses `state` (not `county`); `total_taxa` counts unique genera (not OTUs)

### Website
- `website/index.html` - Landing page: intro, summary stats, US bubble map, bacteria by state, phylum donut chart, top-15 genera bar chart, drain–countertop similarity strip chart, participant lookup grid, video embed, hypothesis link, donation teaser
- `website/participant.html` - Individual kit results loaded dynamically from JSON
- `website/microbes.html` - Full microbial community browser (donut + bar chart)
- `website/hypothesis.html` - Citizen scientist hypothesis submission form (formsubmit.co → sinkmicrobiome@duke.edu)
- `website/donate.html` - Donation options: $10 kit, tiered swag ($25–$100), Duke giving portal instructions, disclaimers
- JavaScript loads data from `../output/` relative to `website/` directory

## Terminology: State not County
All scripts and JSON outputs use **State** throughout. The metadata has a `State` column (not `County`). The metadata does not have a `County` or `Zipcode` column — do not attempt to select or group by those fields.

## Genus Descriptions
Brief public-friendly descriptions for the top 25 genera are stored in the `GENUS_DESCRIPTIONS` object in both `website/js/main.js` and `website/js/participant.js`. These appear as a subline beneath genus names in all taxa lists. To add or edit descriptions, update both files.

## Functional Guilds (7 Categories)
1. Personal Care Product Degraders
2. Moisture Lovers
3. Disinfectant Survivalists
4. Odor Producers
5. Skin Associates
6. Oral Associates
7. Soil Associates

## Adding New Analysis
1. Create new R script in `scripts/` following the numbered naming convention
2. Source it in `run_pipeline_github.R` (and `run_pipeline.R` for local runs)
3. Export relevant JSON in `05_export_json.R`

## GitHub Repository

- **Remote:** `https://github.com/SinkMicrobiomeProject/WebsiteData.git`
- **Branch:** `main`
- **GitHub Pages:** Enabled, deploy from `main` branch, root `/`
- **Custom domain:** `sinkmicrobiome.org` (CNAME file in repo root)
- **Root redirect:** `index.html` at repo root redirects to `/website/`
- **Jekyll:** Disabled via `.nojekyll` file in repo root — required because JSON/RDS files in `output/` would cause Jekyll builds to fail

## GitHub Actions: Known Issues & Fixes
- **Token scope:** The local PAT does not have `workflow` scope, so `.github/workflows/` files cannot be pushed locally. Edit workflow files directly in the GitHub web UI at `github.com/SinkMicrobiomeProject/WebsiteData/edit/main/.github/workflows/update-analysis.yml`
- **Push conflicts:** GitHub Actions commits to `output/` on the same branch. Always `git pull --rebase origin main` before pushing local changes to avoid rejection
- **Node.js deprecation:** Actions use Node.js 20 (`actions/checkout@v4`, `actions/cache@v4`). Add `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` as a job-level env var in the workflow to opt into Node.js 24 before the June 2026 forced migration

## Data File Formats

### OTU/ASV Table (`data/otu-table-w-taxonomy.txt`)
- Tab-separated, first column is full taxonomy string (semicolon-separated, domain through species)
- Column headers are sample IDs: `{kit_id}_{P or Y}` (P = drain/tail piece, Y = countertop)
- Multi-timepoint kits: `{kit_id}_{timepoint}_{P or Y}` (e.g., `34_1_P`)

### Metadata (`data/metadata.txt`)
- Tab-separated with columns: `Sample ID`, `Kit ID`, `sample_location`, `State`
- `sample_location` values: "Tail piece" or "Countertop"
- `State`: full US state name (e.g., "North Carolina", "Michigan")

## Website Details

- JavaScript loads data from `../output/` relative to `website/` directory
- **Critical:** `participant.html` must contain `<input type="hidden" id="form-kit-id" value="">` — removing it crashes `participant.js`
- **Top nav:** Links to PreMiEr, LinkedIn, Bluesky, and **Donate** (`donate.html`) appear above the header on all 5 pages
- **Genus descriptions:** Public-friendly one-liners stored in `GENUS_DESCRIPTIONS` in both `main.js` and `participant.js` — update both files if editing
- **Guild display names:** Defined in `GUILD_INFO` in `participant.js`; internal R column names (`Skin_commuter`, `Oral_commuter`, `Soil_associate`) differ from display names (Skin Associates, Oral Associates, Soil Associates)
- **Participant cards:** Show kit number only (no "Kit" label prefix); font-size set in `.participant-card .kit-id`
- **Similarity strip chart:** Auto-hidden if `summaryData.similarity_scores` is absent or empty (handles old JSON gracefully)
- **Bubble map:** Alaska and Hawaii use manual inset positions (`STATE_INSET` in `main.js`); all other states use equirectangular projection

### HTML Element IDs (must match JS)
- `id="total-states"` — state count stat card
- `id="state-grid"` — bacteria-by-state grid
- `id="us-bubble-map"` — SVG element for sample distribution map
- `id="sim-chart"` — SVG element for drain–countertop similarity strip chart
- `id="similarity-summary-section"` — wrapping section (hidden when no data)
- `id="state-name"` — participant's state in participant.html
- `id="same-state-value"` / `id="other-state-value"` — beta diversity cards
- `id="state-compare"` — state name label in beta section
- `id="kit-id"` — kit number in participant header

### Local Preview
```bash
cd /Users/megan/Desktop/Premier/Public_Science/Sink_Microbiome_Project/SeqData_TestRun_Dec2025/claude_analysis
python3 -m http.server 8080
# Browse to http://localhost:8080/website/index.html
```

## Full Update Workflow
See `INSTRUCTIONS.md` for detailed step-by-step guide covering data updates, pipeline execution, and website deployment.

## Dependencies
- R 4.0+ with packages: `vegan`, `jsonlite`, `dplyr`, `tidyr`, `tibble`
- System: libcurl, libssl, libxml2 (for GitHub Actions)
- `gh` CLI is not installed locally; use standard `git` commands
