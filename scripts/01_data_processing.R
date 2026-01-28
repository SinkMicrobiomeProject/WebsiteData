# =============================================================================
# 01_data_processing.R
# Load and process OTU table and metadata
# =============================================================================

cat("\n=== Step 1: Data Processing ===\n")

# -----------------------------------------------------------------------------
# Load OTU Table
# -----------------------------------------------------------------------------
cat("Loading OTU table...\n")

# Read OTU table (skip comment line)
otu_raw <- read.delim(OTU_FILE, skip = 1, sep = "\t", check.names = FALSE,
                      row.names = 1, stringsAsFactors = FALSE)

# Store taxonomy separately (last column or embedded in row names)
# Check if taxonomy is in row names
taxonomy <- data.frame(
  OTU_ID = rownames(otu_raw),
  taxonomy = rownames(otu_raw),
  stringsAsFactors = FALSE
)

# Parse taxonomy into levels
parse_taxonomy <- function(tax_string) {
  parts <- strsplit(tax_string, ";")[[1]]
  data.frame(
    Domain = gsub("d__", "", parts[1]),
    Phylum = ifelse(length(parts) > 1, gsub("p__", "", parts[2]), NA),
    Class = ifelse(length(parts) > 2, gsub("c__", "", parts[3]), NA),
    Order = ifelse(length(parts) > 3, gsub("o__", "", parts[4]), NA),
    Family = ifelse(length(parts) > 4, gsub("f__", "", parts[5]), NA),
    Genus = ifelse(length(parts) > 5, gsub("g__", "", parts[6]), NA),
    Species = ifelse(length(parts) > 6, gsub("s__", "", parts[7]), NA),
    stringsAsFactors = FALSE
  )
}

taxonomy_parsed <- do.call(rbind, lapply(taxonomy$taxonomy, parse_taxonomy))
taxonomy <- cbind(taxonomy, taxonomy_parsed)

# Convert OTU table to numeric matrix
otu_matrix <- as.matrix(otu_raw)
mode(otu_matrix) <- "numeric"

cat("  - Loaded", nrow(otu_matrix), "OTUs across", ncol(otu_matrix), "samples\n")

# -----------------------------------------------------------------------------
# Load Metadata
# -----------------------------------------------------------------------------
cat("Loading metadata...\n")

metadata <- read.delim(METADATA_FILE, sep = "\t", stringsAsFactors = FALSE)
colnames(metadata)[1] <- "Sample_ID"  # Standardize column name

# Ensure Sample_ID matches OTU table column names
metadata$Sample_ID <- gsub(" ", ".", metadata$Sample_ID)  # Replace spaces with dots if needed

cat("  - Loaded metadata for", nrow(metadata), "samples\n")
cat("  - Counties:", paste(unique(metadata$County), collapse = ", "), "\n")
cat("  - Zipcodes:", paste(unique(metadata$Zipcode), collapse = ", "), "\n")

# -----------------------------------------------------------------------------
# Filter and Match Samples
# -----------------------------------------------------------------------------
cat("Matching samples between OTU table and metadata...\n")

# Find common samples
common_samples <- intersect(colnames(otu_matrix), metadata$Sample_ID)
cat("  - Found", length(common_samples), "matching samples\n")

# Filter to common samples
otu_matrix <- otu_matrix[, common_samples]
metadata <- metadata[metadata$Sample_ID %in% common_samples, ]
rownames(metadata) <- metadata$Sample_ID

# Reorder metadata to match OTU table
metadata <- metadata[colnames(otu_matrix), ]

# -----------------------------------------------------------------------------
# Calculate Read Depths
# -----------------------------------------------------------------------------
cat("Calculating read depths...\n")

read_depths <- colSums(otu_matrix)
cat("  - Read depth range:", min(read_depths), "-", max(read_depths), "\n")
cat("  - Mean read depth:", round(mean(read_depths)), "\n")

# Add read depth to metadata
metadata$read_depth <- read_depths[metadata$Sample_ID]

# -----------------------------------------------------------------------------
# Filter Low-Abundance OTUs
# -----------------------------------------------------------------------------
cat("Filtering low-abundance OTUs...\n")

# Remove OTUs with very low total counts
otu_totals <- rowSums(otu_matrix)
keep_otus <- otu_totals >= MIN_ABUNDANCE
otu_matrix <- otu_matrix[keep_otus, ]
taxonomy <- taxonomy[keep_otus, ]

cat("  - Retained", nrow(otu_matrix), "OTUs after filtering\n")

# -----------------------------------------------------------------------------
# Rarefaction (if needed)
# -----------------------------------------------------------------------------
cat("Checking rarefaction requirements...\n")

samples_below_threshold <- sum(read_depths < RAREFACTION_DEPTH)
if (samples_below_threshold > 0) {
  cat("  - WARNING:", samples_below_threshold, "samples below rarefaction depth of", RAREFACTION_DEPTH, "\n")
  cat("  - These samples will be excluded from rarefied analyses\n")
}

# Identify samples that pass rarefaction threshold
samples_for_rarefaction <- names(read_depths[read_depths >= RAREFACTION_DEPTH])

if (length(samples_for_rarefaction) > 0) {
  # Perform rarefaction using vegan
  set.seed(123)  # For reproducibility
  otu_rarefied <- t(rrarefy(t(otu_matrix[, samples_for_rarefaction]), RAREFACTION_DEPTH))
  cat("  - Rarefied", ncol(otu_rarefied), "samples to", RAREFACTION_DEPTH, "reads\n")
} else {
  cat("  - No samples meet rarefaction threshold. Using relative abundance only.\n")
  otu_rarefied <- NULL
}

# -----------------------------------------------------------------------------
# Calculate Relative Abundance
# -----------------------------------------------------------------------------
cat("Calculating relative abundance...\n")

otu_relabund <- sweep(otu_matrix, 2, colSums(otu_matrix), "/")
otu_relabund_percent <- otu_relabund * 100

cat("  - Relative abundance calculated for all samples\n")

# -----------------------------------------------------------------------------
# Create Sample Type Subsets
# -----------------------------------------------------------------------------
cat("Creating sample type subsets...\n")

# Tail piece samples (P)
tailpiece_samples <- metadata$Sample_ID[metadata$sample_location == "Tail piece"]
# Countertop samples (Y)
countertop_samples <- metadata$Sample_ID[metadata$sample_location == "Countertop"]

cat("  - Tail piece samples:", length(tailpiece_samples), "\n")
cat("  - Countertop samples:", length(countertop_samples), "\n")

# -----------------------------------------------------------------------------
# Save Processed Data
# -----------------------------------------------------------------------------
cat("Saving processed data objects...\n")

processed_data <- list(
  otu_matrix = otu_matrix,
  otu_rarefied = otu_rarefied,
  otu_relabund = otu_relabund,
  otu_relabund_percent = otu_relabund_percent,
  taxonomy = taxonomy,
  metadata = metadata,
  read_depths = read_depths,
  tailpiece_samples = tailpiece_samples,
  countertop_samples = countertop_samples,
  samples_for_rarefaction = samples_for_rarefaction
)

saveRDS(processed_data, file.path(OUTPUT_DIR, "processed_data.rds"))

cat("Data processing complete.\n\n")
