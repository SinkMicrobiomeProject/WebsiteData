# =============================================================================
# 03_beta_diversity.R
# Calculate beta diversity metrics and similarity scores
# =============================================================================

cat("\n=== Step 3: Beta Diversity ===\n")

# Load processed data if not in memory
if (!exists("processed_data")) {
  processed_data <- readRDS(file.path(OUTPUT_DIR, "processed_data.rds"))
}

# Extract data
otu_relabund <- processed_data$otu_relabund
metadata <- processed_data$metadata
tailpiece_samples <- processed_data$tailpiece_samples
countertop_samples <- processed_data$countertop_samples

# -----------------------------------------------------------------------------
# Calculate Bray-Curtis Distance Matrix
# -----------------------------------------------------------------------------
cat("Calculating Bray-Curtis distances...\n")

# Use relative abundance for beta diversity
# Transpose for vegan (samples as rows)
otu_t <- t(otu_relabund)

# Calculate Bray-Curtis dissimilarity
bray_dist <- vegdist(otu_t, method = "bray")
bray_matrix <- as.matrix(bray_dist)

cat("  - Calculated pairwise distances for", nrow(bray_matrix), "samples\n")

# Convert dissimilarity to similarity (1 - dissimilarity)
similarity_matrix <- 1 - bray_matrix

# -----------------------------------------------------------------------------
# Calculate Within-Kit Similarity (Tail piece vs Countertop)
# -----------------------------------------------------------------------------
cat("Calculating within-kit similarity (P vs Y)...\n")

# Get unique kit IDs
kit_ids <- unique(metadata$Kit.ID)

within_kit_similarity <- data.frame(
  Kit_ID = character(),
  P_sample = character(),
  Y_sample = character(),
  similarity = numeric(),
  stringsAsFactors = FALSE
)

for (kit in kit_ids) {
  kit_samples <- metadata$Sample_ID[metadata$Kit.ID == kit]
  p_sample <- kit_samples[grepl("_P$", kit_samples)]
  y_sample <- kit_samples[grepl("_Y$", kit_samples)]

  if (length(p_sample) == 1 && length(y_sample) == 1) {
    if (p_sample %in% rownames(similarity_matrix) && y_sample %in% rownames(similarity_matrix)) {
      sim <- similarity_matrix[p_sample, y_sample]
      within_kit_similarity <- rbind(within_kit_similarity, data.frame(
        Kit_ID = kit,
        P_sample = p_sample,
        Y_sample = y_sample,
        similarity = round(sim, 4),
        stringsAsFactors = FALSE
      ))
    }
  }
}

cat("  - Calculated within-kit similarity for", nrow(within_kit_similarity), "kits\n")
if (nrow(within_kit_similarity) > 0) {
  cat("  - Mean P-Y similarity:", round(mean(within_kit_similarity$similarity), 3), "\n")
  cat("  - Range:", round(min(within_kit_similarity$similarity), 3), "-",
      round(max(within_kit_similarity$similarity), 3), "\n")
}

# -----------------------------------------------------------------------------
# Calculate Between-Sample Similarities for Each Tail Piece Sample
# -----------------------------------------------------------------------------
cat("Calculating between-sample similarities...\n")

# For each tail piece sample, calculate:
# 1. Mean similarity to other samples in same county
# 2. Mean similarity to samples in other counties

# Filter to tail piece samples only
tp_similarity <- similarity_matrix[tailpiece_samples, tailpiece_samples]

# Create results dataframe
beta_comparisons <- data.frame(
  Sample_ID = character(),
  County = character(),
  mean_sim_same_county = numeric(),
  mean_sim_other_counties = numeric(),
  mean_sim_all_others = numeric(),
  stringsAsFactors = FALSE
)

for (sample in tailpiece_samples) {
  sample_county <- metadata$County[metadata$Sample_ID == sample]

  # Other samples in same county
  same_county_samples <- metadata$Sample_ID[metadata$Sample_ID %in% tailpiece_samples &
                                              metadata$County == sample_county &
                                              metadata$Sample_ID != sample]

  # Samples in other counties
  other_county_samples <- metadata$Sample_ID[metadata$Sample_ID %in% tailpiece_samples &
                                               metadata$County != sample_county]

  # All other samples
  all_other_samples <- tailpiece_samples[tailpiece_samples != sample]

  # Calculate mean similarities
  mean_same <- ifelse(length(same_county_samples) > 0,
                      mean(tp_similarity[sample, same_county_samples], na.rm = TRUE),
                      NA)
  mean_other <- ifelse(length(other_county_samples) > 0,
                       mean(tp_similarity[sample, other_county_samples], na.rm = TRUE),
                       NA)
  mean_all <- ifelse(length(all_other_samples) > 0,
                     mean(tp_similarity[sample, all_other_samples], na.rm = TRUE),
                     NA)

  beta_comparisons <- rbind(beta_comparisons, data.frame(
    Sample_ID = sample,
    County = sample_county,
    mean_sim_same_county = round(mean_same, 4),
    mean_sim_other_counties = round(mean_other, 4),
    mean_sim_all_others = round(mean_all, 4),
    stringsAsFactors = FALSE
  ))
}

cat("  - Calculated between-sample comparisons for", nrow(beta_comparisons), "samples\n")

# -----------------------------------------------------------------------------
# Calculate Similarity Percentiles
# -----------------------------------------------------------------------------
cat("Calculating similarity percentiles...\n")

if (nrow(beta_comparisons) > 1) {
  beta_comparisons$sim_percentile <- ecdf(beta_comparisons$mean_sim_all_others)(beta_comparisons$mean_sim_all_others) * 100
  cat("  - Percentile rankings calculated\n")
}

# -----------------------------------------------------------------------------
# County-Level Summary
# -----------------------------------------------------------------------------
cat("Calculating county-level summaries...\n")

county_beta_summary <- beta_comparisons %>%
  group_by(County) %>%
  summarize(
    n_samples = n(),
    mean_within_county_sim = mean(mean_sim_same_county, na.rm = TRUE),
    mean_between_county_sim = mean(mean_sim_other_counties, na.rm = TRUE),
    .groups = "drop"
  )

cat("  - County beta diversity summary:\n")
print(as.data.frame(county_beta_summary))

# -----------------------------------------------------------------------------
# Save Beta Diversity Results
# -----------------------------------------------------------------------------
cat("Saving beta diversity results...\n")

beta_results <- list(
  bray_matrix = bray_matrix,
  similarity_matrix = similarity_matrix,
  within_kit_similarity = within_kit_similarity,
  beta_comparisons = beta_comparisons,
  county_beta_summary = county_beta_summary
)

saveRDS(beta_results, file.path(OUTPUT_DIR, "beta_diversity_results.rds"))

# Save CSVs
write.csv(within_kit_similarity, file.path(OUTPUT_DIR, "within_kit_similarity.csv"), row.names = FALSE)
write.csv(beta_comparisons, file.path(OUTPUT_DIR, "beta_comparisons.csv"), row.names = FALSE)

cat("Beta diversity analysis complete.\n\n")
