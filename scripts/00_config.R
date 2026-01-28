# =============================================================================
# Configuration File for Sink Microbiome Project Analysis
# =============================================================================

# File paths - automatically detect if running locally or in GitHub Actions
if (Sys.getenv("GITHUB_ACTIONS") == "true") {
  # GitHub Actions environment
  BASE_DIR <- getwd()
} else {
  # Local environment - use absolute path
  BASE_DIR <- "/Users/megan/Desktop/Premier/Public_Science/Sink_Microbiome_Project/SeqData_TestRun_Dec2025/claude_analysis"
}

# Data files - check data/ subdirectory first, then base directory
DATA_DIR <- file.path(BASE_DIR, "data")
if (dir.exists(DATA_DIR)) {
  OTU_FILE <- file.path(DATA_DIR, "otu-table-w-taxonomy.txt")
  METADATA_FILE <- file.path(DATA_DIR, "metadata.txt")
  GUILDS_FILE <- file.path(DATA_DIR, "functional_guilds_reference.csv")
} else {
  # Fallback to base directory
  OTU_FILE <- file.path(BASE_DIR, "fake_otu.txt")
  METADATA_FILE <- file.path(BASE_DIR, "metadata.txt")
  GUILDS_FILE <- file.path(BASE_DIR, "functional_guilds_reference.csv")
}

OUTPUT_DIR <- file.path(BASE_DIR, "output")

# Analysis parameters
RAREFACTION_DEPTH <- 100000  # Minimum reads for rarefaction (adjust based on your data)
MIN_PREVALENCE <- 0.01      # Minimum proportion of samples a taxon must appear in
MIN_ABUNDANCE <- 10         # Minimum total reads for a taxon to be included

# Create output directories if they don't exist
dir.create(OUTPUT_DIR, showWarnings = FALSE, recursive = TRUE)
dir.create(file.path(OUTPUT_DIR, "participants"), showWarnings = FALSE)

# Load required packages
required_packages <- c("vegan", "jsonlite", "dplyr", "tidyr", "tibble")

for (pkg in required_packages) {
  if (!require(pkg, character.only = TRUE, quietly = TRUE)) {
    install.packages(pkg, repos = "https://cloud.r-project.org")
    library(pkg, character.only = TRUE)
  }
}

cat("Configuration loaded successfully.\n")
cat("Base directory:", BASE_DIR, "\n")
cat("Rarefaction depth:", RAREFACTION_DEPTH, "\n")
