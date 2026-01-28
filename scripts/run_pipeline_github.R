#!/usr/bin/env Rscript
# =============================================================================
# Sink Microbiome Project - Analysis Pipeline (GitHub Actions Version)
# =============================================================================
#
# This script is designed to run in GitHub Actions with relative paths.
# It expects to be run from the repository root directory.
#
# =============================================================================

cat("
================================================================================
     SINK MICROBIOME PROJECT - ANALYSIS PIPELINE (GitHub Actions)
================================================================================
")

# Record start time
start_time <- Sys.time()

# -----------------------------------------------------------------------------
# Configuration (GitHub Actions compatible)
# -----------------------------------------------------------------------------
cat("Loading configuration...\n")

# Use relative paths from repository root
BASE_DIR <- getwd()
DATA_DIR <- file.path(BASE_DIR, "data")
SCRIPTS_DIR <- file.path(BASE_DIR, "scripts")
OUTPUT_DIR <- file.path(BASE_DIR, "output")

# Data files - look for the most recent versions
OTU_FILE <- list.files(DATA_DIR, pattern = "otu.*table.*\\.txt$", full.names = TRUE)[1]
METADATA_FILE <- list.files(DATA_DIR, pattern = "metadata.*\\.txt$", full.names = TRUE)[1]
GUILDS_FILE <- file.path(DATA_DIR, "functional_guilds_reference.csv")

# Fallback to default names if pattern matching fails
if (is.na(OTU_FILE)) {
  OTU_FILE <- file.path(DATA_DIR, "otu-table-w-taxonomy.txt")
}
if (is.na(METADATA_FILE)) {
  METADATA_FILE <- file.path(DATA_DIR, "metadata.txt")
}

# Analysis parameters
RAREFACTION_DEPTH <- 100000
MIN_PREVALENCE <- 0.01
MIN_ABUNDANCE <- 10

# Create output directories
dir.create(OUTPUT_DIR, showWarnings = FALSE, recursive = TRUE)
dir.create(file.path(OUTPUT_DIR, "participants"), showWarnings = FALSE)

# Load packages
library(vegan)
library(jsonlite)
library(dplyr)
library(tidyr)
library(tibble)

cat("Base directory:", BASE_DIR, "\n")
cat("OTU file:", OTU_FILE, "\n")
cat("Metadata file:", METADATA_FILE, "\n")
cat("Guilds file:", GUILDS_FILE, "\n")
cat("Output directory:", OUTPUT_DIR, "\n")
cat("Rarefaction depth:", RAREFACTION_DEPTH, "\n\n")

# Verify files exist
if (!file.exists(OTU_FILE)) stop("OTU file not found: ", OTU_FILE)
if (!file.exists(METADATA_FILE)) stop("Metadata file not found: ", METADATA_FILE)
if (!file.exists(GUILDS_FILE)) stop("Guilds file not found: ", GUILDS_FILE)

# -----------------------------------------------------------------------------
# Source individual analysis scripts
# -----------------------------------------------------------------------------

# Modify environment for sourced scripts
assign("BASE_DIR", BASE_DIR, envir = .GlobalEnv)
assign("OTU_FILE", OTU_FILE, envir = .GlobalEnv)
assign("METADATA_FILE", METADATA_FILE, envir = .GlobalEnv)
assign("GUILDS_FILE", GUILDS_FILE, envir = .GlobalEnv)
assign("OUTPUT_DIR", OUTPUT_DIR, envir = .GlobalEnv)
assign("RAREFACTION_DEPTH", RAREFACTION_DEPTH, envir = .GlobalEnv)
assign("MIN_PREVALENCE", MIN_PREVALENCE, envir = .GlobalEnv)
assign("MIN_ABUNDANCE", MIN_ABUNDANCE, envir = .GlobalEnv)

# Run each analysis step
source(file.path(SCRIPTS_DIR, "01_data_processing.R"))
source(file.path(SCRIPTS_DIR, "02_alpha_diversity.R"))
source(file.path(SCRIPTS_DIR, "03_beta_diversity.R"))
source(file.path(SCRIPTS_DIR, "04_functional_guilds.R"))
source(file.path(SCRIPTS_DIR, "05_export_json.R"))

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

JSON files ready for website:
  - summary.json
  - map_data.json
  - participants_index.json
  - percentile_reference.json
  - participants/kit_*.json

================================================================================
")

# Return success
quit(status = 0)
