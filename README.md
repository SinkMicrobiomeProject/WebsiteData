# Sink Microbiome Project - Analysis Pipeline

This repository contains the analysis pipeline and results for the Sink Microbiome Project, a citizen science initiative exploring bacterial communities in household bathroom sinks across North Carolina.

## Repository Structure

```
SMP_test/
├── .github/
│   └── workflows/
│       └── update-analysis.yml    # Automated monthly analysis
├── data/
│   ├── otu-table-w-taxonomy.txt   # OTU abundance table
│   ├── metadata.txt               # Sample metadata (Kit ID, Zipcode, County)
│   └── functional_guilds_reference.csv  # Bacterial functional guild assignments
├── scripts/
│   ├── 00_config.R                # Configuration settings
│   ├── 01_data_processing.R       # Load and process OTU data
│   ├── 02_alpha_diversity.R       # Calculate alpha diversity metrics
│   ├── 03_beta_diversity.R        # Calculate beta diversity metrics
│   ├── 04_functional_guilds.R     # Calculate functional guild scores
│   ├── 05_export_json.R           # Export results to JSON for website
│   ├── run_pipeline.R             # Local pipeline runner
│   └── run_pipeline_github.R      # GitHub Actions pipeline runner
├── output/
│   ├── summary.json               # Landing page data
│   ├── map_data.json              # Sample map coordinates
│   ├── participants_index.json    # List of all participants
│   ├── percentile_reference.json  # Guild descriptions
│   └── participants/              # Individual kit results
│       ├── kit_8.json
│       ├── kit_12.json
│       └── ...
└── README.md
```

## Website Features

### Landing Page
- Total number of bacterial taxa recovered
- Taxa counts by county
- Top 5 most abundant bacterial genera (overall and by county)
- Interactive map of sampling locations

### Individual Participant Results (by Kit ID)
- Top 5 bacterial taxa with relative abundance
- Total bacterial taxa count
- Similarity score between tail piece and countertop samples
- Alpha diversity percentile ranking
- Beta diversity comparisons (same county vs. other counties)
- Functional guild percentile rankings

### Functional Guilds
| Guild | Description |
|-------|-------------|
| Personal Care Product Degraders | Bacteria that break down soaps and surfactants |
| Moisture Lovers | Water-loving bacteria thriving in sink environments |
| Disinfectant Survivalists | Bacteria surviving household disinfectants |
| Odor Producers | Bacteria producing volatile compounds |
| Skin Commuters | Bacteria from human skin (hand washing) |
| Oral Commuters | Bacteria from mouth (tooth brushing) |

## Running the Analysis

### Prerequisites
- R (version 4.0+)
- Required R packages: `vegan`, `jsonlite`, `dplyr`, `tidyr`, `tibble`

### Local Execution
```bash
cd scripts
Rscript run_pipeline.R
```

### Automated Updates (GitHub Actions)
The analysis automatically runs:
- **Monthly**: 1st of each month at 6:00 AM UTC
- **On data updates**: When files in `data/` are modified
- **Manual trigger**: Via GitHub Actions "Run workflow" button

## Data Files

### Input Files
| File | Description |
|------|-------------|
| `otu-table-w-taxonomy.txt` | OTU abundance table with GTDB taxonomy |
| `metadata.txt` | Sample metadata (Sample ID, Kit ID, Location, Zipcode, County) |
| `functional_guilds_reference.csv` | Genus-to-guild mapping database |

### Output Files (JSON)
| File | Website Use |
|------|-------------|
| `summary.json` | Landing page statistics |
| `map_data.json` | Interactive map data |
| `participants_index.json` | Participant lookup |
| `participants/kit_*.json` | Individual results pages |

## Adding New Data

1. Update `data/otu-table-w-taxonomy.txt` with new OTU data
2. Update `data/metadata.txt` with new sample metadata
3. Commit and push changes to trigger automatic analysis
4. Or manually trigger via GitHub Actions

## Analysis Methods

### Alpha Diversity
- **Observed Richness**: Number of unique bacterial taxa
- **Shannon Index**: Diversity accounting for abundance evenness
- **Percentile Rankings**: Compared to all other tail piece samples

### Beta Diversity
- **Bray-Curtis Dissimilarity**: Community composition differences
- **Within-Kit Similarity**: Tail piece vs. countertop comparison
- **Geographic Comparisons**: Same county vs. other counties

### Functional Guilds
Guild scores represent the percentage of bacterial relative abundance belonging to each functional category, based on literature-derived genus assignments.

## Contact

For questions about this project, please contact [your contact info].

## License

[Add appropriate license]
