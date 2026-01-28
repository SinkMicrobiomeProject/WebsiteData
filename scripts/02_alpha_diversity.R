# =============================================================================
# 02_alpha_diversity.R
# Calculate alpha diversity metrics
# =============================================================================

cat("\n=== Step 2: Alpha Diversity ===\n")

# Load processed data if not in memory
if (!exists("processed_data")) {
  processed_data <- readRDS(file.path(OUTPUT_DIR, "processed_data.rds"))
}

# Extract data
otu_matrix <- processed_data$otu_matrix
otu_rarefied <- processed_data$otu_rarefied
metadata <- processed_data$metadata
tailpiece_samples <- processed_data$tailpiece_samples

# -----------------------------------------------------------------------------
# Calculate Alpha Diversity Metrics
# -----------------------------------------------------------------------------
cat("Calculating alpha diversity metrics...\n")

# Function to calculate multiple alpha diversity metrics
calc_alpha_diversity <- function(otu_table) {
  # Transpose for vegan (samples as rows)
  otu_t <- t(otu_table)

  data.frame(
    Sample_ID = rownames(otu_t),
    # Observed richness (number of taxa)
    observed_richness = specnumber(otu_t),
    # Shannon diversity
    shannon = diversity(otu_t, index = "shannon"),
    # Simpson diversity
    simpson = diversity(otu_t, index = "simpson"),
    # Inverse Simpson
    inv_simpson = diversity(otu_t, index = "invsimpson"),
    # Pielou's evenness
    evenness = diversity(otu_t, index = "shannon") / log(specnumber(otu_t)),
    stringsAsFactors = FALSE
  )
}

# Calculate on rarefied data if available, otherwise use raw counts
if (!is.null(otu_rarefied)) {
  alpha_diversity <- calc_alpha_diversity(otu_rarefied)
  cat("  - Calculated alpha diversity on rarefied data\n")
} else {
  alpha_diversity <- calc_alpha_diversity(otu_matrix)
  cat("  - Calculated alpha diversity on raw counts (no rarefaction performed)\n")
}

# Handle NaN values in evenness (when richness = 1)
alpha_diversity$evenness[is.nan(alpha_diversity$evenness)] <- 0

# Merge with metadata
alpha_diversity <- merge(alpha_diversity, metadata, by = "Sample_ID")

cat("  - Metrics calculated for", nrow(alpha_diversity), "samples\n")

# -----------------------------------------------------------------------------
# Calculate Percentile Rankings (for tail piece samples)
# -----------------------------------------------------------------------------
cat("Calculating percentile rankings...\n")

# Calculate percentiles within tail piece samples only
tailpiece_alpha <- alpha_diversity[alpha_diversity$Sample_ID %in% tailpiece_samples, ]

if (nrow(tailpiece_alpha) > 0) {
  # Calculate percentile for each metric
  tailpiece_alpha$richness_percentile <- ecdf(tailpiece_alpha$observed_richness)(tailpiece_alpha$observed_richness) * 100
  tailpiece_alpha$shannon_percentile <- ecdf(tailpiece_alpha$shannon)(tailpiece_alpha$shannon) * 100
  tailpiece_alpha$simpson_percentile <- ecdf(tailpiece_alpha$simpson)(tailpiece_alpha$simpson) * 100

  cat("  - Percentile rankings calculated for", nrow(tailpiece_alpha), "tail piece samples\n")
}

# -----------------------------------------------------------------------------
# Summary Statistics by County
# -----------------------------------------------------------------------------
cat("Calculating summary statistics by county...\n")

# Overall stats
overall_stats <- data.frame(
  group = "Overall",
  n_samples = nrow(tailpiece_alpha),
  mean_richness = mean(tailpiece_alpha$observed_richness, na.rm = TRUE),
  sd_richness = sd(tailpiece_alpha$observed_richness, na.rm = TRUE),
  min_richness = min(tailpiece_alpha$observed_richness, na.rm = TRUE),
  max_richness = max(tailpiece_alpha$observed_richness, na.rm = TRUE),
  mean_shannon = mean(tailpiece_alpha$shannon, na.rm = TRUE),
  stringsAsFactors = FALSE
)

# Stats by county
county_stats <- tailpiece_alpha %>%
  group_by(County) %>%
  summarize(
    group = first(County),
    n_samples = n(),
    mean_richness = mean(observed_richness, na.rm = TRUE),
    sd_richness = sd(observed_richness, na.rm = TRUE),
    min_richness = min(observed_richness, na.rm = TRUE),
    max_richness = max(observed_richness, na.rm = TRUE),
    mean_shannon = mean(shannon, na.rm = TRUE),
    .groups = "drop"
  ) %>%
  select(-County)

alpha_summary <- rbind(overall_stats, as.data.frame(county_stats))

cat("  - Summary statistics:\n")
print(alpha_summary)

# -----------------------------------------------------------------------------
# Save Alpha Diversity Results
# -----------------------------------------------------------------------------
cat("Saving alpha diversity results...\n")

alpha_results <- list(
  alpha_diversity = alpha_diversity,
  tailpiece_alpha = tailpiece_alpha,
  alpha_summary = alpha_summary
)

saveRDS(alpha_results, file.path(OUTPUT_DIR, "alpha_diversity_results.rds"))

# Also save as CSV for easy viewing
write.csv(alpha_diversity, file.path(OUTPUT_DIR, "alpha_diversity.csv"), row.names = FALSE)

cat("Alpha diversity analysis complete.\n\n")
