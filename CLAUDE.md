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

## Architecture

### Data Flow
```
data/ (OTU table, metadata, guild reference)
    ↓
scripts/ (R pipeline: 00-05)
    ↓
output/ (JSON files)
    ↓
website/ (HTML/JS frontend)
```

### Analysis Pipeline (Sequential)
1. `00_config.R` - Paths, thresholds, package loading; auto-detects local vs GitHub environment
2. `01_data_processing.R` - Load OTU/metadata, rarefaction (100k reads), filter low-abundance OTUs
3. `02_alpha_diversity.R` - Richness, Shannon, Simpson indices with percentile rankings
4. `03_beta_diversity.R` - Bray-Curtis distances, within-kit similarity (tail piece vs countertop)
5. `04_functional_guilds.R` - Map genera to 6 functional categories, calculate scores
6. `05_export_json.R` - Generate all JSON output for website

### Key Output Files
- `summary.json` - Landing page stats
- `map_data.json` - Geographic coordinates for map
- `participants_index.json` - All kit IDs
- `participants/kit_*.json` - Individual participant results

### Website
- `index.html` - Landing page with summary stats, map, top taxa
- `participant.html` - Individual kit results loaded dynamically from JSON
- JavaScript loads data from `output/` directory

## Genus Descriptions
Brief public-friendly descriptions for the top 25 genera are stored in the `GENUS_DESCRIPTIONS` object in both `website/js/main.js` and `website/js/participant.js`. These appear as a subline beneath genus names in all taxa lists. To add or edit descriptions, update both files.

## Functional Guilds (6 Categories)
1. Personal Care Product Degraders
2. Moisture Lovers
3. Disinfectant Survivalists
4. Odor Producers
5. Skin Commuters
6. Oral Commuters

## Adding New Analysis
1. Create new R script in `scripts/` following the numbered naming convention
2. Source it in both `run_pipeline.R` and `run_pipeline_github.R`
3. Export relevant JSON in `05_export_json.R`

## GitHub Repository

- **Remote:** `git@github.com:SinkMicrobiomeProject/WebsiteData.git`
- **Branch:** `main`
- **GitHub Pages:** Deploy from `main` branch, root `/` — serves website at `sinkmicrobiomeproject.github.io/WebsiteData/website/`

## Data File Formats

### OTU/ASV Table (`data/otu-table-w-taxonomy.txt`)
- Tab-separated, first column is full taxonomy string (semicolon-separated, domain through species)
- Column headers are sample IDs: `{kit_id}_{P or Y}` (P = tail piece, Y = countertop)
- Multi-timepoint kits: `{kit_id}_{timepoint}_{P or Y}` (e.g., `34_1_P`)

### Metadata (`data/metadata.txt`)
- Tab-separated with columns: `Sample ID`, `Kit ID`, `sample_location`, `State`
- `sample_location` values: "Tail piece" or "Countertop"
- `State`: full US state name (e.g., "North Carolina", "Michigan")

## Website

- `index.html` - Landing page with summary stats, map, top taxa
- `participant.html` - Individual kit results loaded dynamically from JSON
- JavaScript loads data from `../output/` relative to `website/` directory
- **Critical:** `participant.html` must contain `<input type="hidden" id="form-kit-id" value="">` — removing it crashes `participant.js`

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
