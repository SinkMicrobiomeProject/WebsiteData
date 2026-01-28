#!/usr/bin/env Rscript
# =============================================================================
# Sink Microbiome Project - Analysis Pipeline
# =============================================================================
#
# This script runs the complete analysis pipeline for the Sink Microbiome Project
# and generates all JSON files needed for the website.
#
# Usage:
#   Rscript run_pipeline.R
#
# Or in RStudio:
#   source("run_pipeline.R")
#
# =============================================================================

cat("
================================================================================
     SINK MICROBIOME PROJECT - ANALYSIS PIPELINE
================================================================================
")

# Record start time
start_time <- Sys.time()

# Get the directory where this script is located
get_script_dir <- function() {
  # Try multiple methods to find script directory

  # Method 1: commandArgs
  args <- commandArgs(trailingOnly = FALSE)
  file_arg <- grep("--file=", args, value = TRUE)
  if (length(file_arg) > 0) {
    return(dirname(normalizePath(sub("--file=", "", file_arg))))
  }

  # Method 2: sys.frame (for source())
  for (i in sys.nframe():1) {
    if (!is.null(sys.frame(i)$ofile)) {
      return(dirname(sys.frame(i)$ofile))
    }
  }

  # Method 3: Default path
  return("/Users/megan/Desktop/Premier/Public_Science/Sink_Microbiome_Project/SeqData_TestRun_Dec2025/claude_analysis/scripts")
}

script_dir <- get_script_dir()

cat("Script directory:", script_dir, "\n\n")

# -----------------------------------------------------------------------------
# Step 0: Load Configuration
# -----------------------------------------------------------------------------
cat("Loading configuration...\n")
source(file.path(script_dir, "00_config.R"))

# -----------------------------------------------------------------------------
# Step 1: Data Processing
# -----------------------------------------------------------------------------
source(file.path(script_dir, "01_data_processing.R"))

# -----------------------------------------------------------------------------
# Step 2: Alpha Diversity
# -----------------------------------------------------------------------------
source(file.path(script_dir, "02_alpha_diversity.R"))

# -----------------------------------------------------------------------------
# Step 3: Beta Diversity
# -----------------------------------------------------------------------------
source(file.path(script_dir, "03_beta_diversity.R"))

# -----------------------------------------------------------------------------
# Step 4: Functional Guilds
# -----------------------------------------------------------------------------
source(file.path(script_dir, "04_functional_guilds.R"))

# -----------------------------------------------------------------------------
# Step 5: Export to JSON
# -----------------------------------------------------------------------------
source(file.path(script_dir, "05_export_json.R"))

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
end_time <- Sys.time()
elapsed <- round(difftime(end_time, start_time, units = "secs"), 1)

cat("
================================================================================
     PIPELINE COMPLETE
================================================================================

Time elapsed:", elapsed, "seconds

Output directory:", OUTPUT_DIR, "

Files created:
  - processed_data.rds
  - alpha_diversity_results.rds
  - alpha_diversity.csv
  - beta_diversity_results.rds
  - within_kit_similarity.csv
  - beta_comparisons.csv
  - functional_guild_results.rds
  - guild_scores.csv
  - guild_scores_with_percentiles.csv
  - summary.json
  - map_data.json
  - participants_index.json
  - percentile_reference.json
  - participants/kit_*.json (one per participant)

To update the website:
  1. Copy the JSON files from the output directory to your website's data folder
  2. Push changes to GitHub repository

================================================================================
")
