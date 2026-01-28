# =============================================================================
# 04_functional_guilds.R
# Calculate functional guild scores and percentiles
# =============================================================================

cat("\n=== Step 4: Functional Guild Analysis ===\n")

# Load processed data if not in memory
if (!exists("processed_data")) {
  processed_data <- readRDS(file.path(OUTPUT_DIR, "processed_data.rds"))
}

# Extract data
otu_relabund <- processed_data$otu_relabund
otu_relabund_percent <- processed_data$otu_relabund_percent
taxonomy <- processed_data$taxonomy
metadata <- processed_data$metadata
tailpiece_samples <- processed_data$tailpiece_samples

# -----------------------------------------------------------------------------
# Load Functional Guild Reference
# -----------------------------------------------------------------------------
cat("Loading functional guild reference database...\n")

guilds_ref <- read.csv(GUILDS_FILE, stringsAsFactors = FALSE)

cat("  - Loaded", nrow(guilds_ref), "genera with guild assignments\n")

# Guild columns
guild_cols <- c("Personal_care_degrader", "Moisture_lover", "Disinfectant_survivalist",
                "Odor_producer", "Skin_commuter", "Oral_commuter")

# Summary of guild reference
cat("  - Guild reference summary:\n")
for (g in guild_cols) {
  cat("    -", g, ":", sum(guilds_ref[[g]] == "Yes"), "genera\n")
}

# -----------------------------------------------------------------------------
# Match OTUs to Guilds
# -----------------------------------------------------------------------------
cat("Matching OTUs to functional guilds...\n")

# Clean genus names in taxonomy (remove trailing underscores and empty strings)
taxonomy$Genus_clean <- gsub("^_+$", "", taxonomy$Genus)
taxonomy$Genus_clean <- gsub("_$", "", taxonomy$Genus_clean)

# Match to guild reference
taxonomy_guilds <- merge(taxonomy, guilds_ref,
                         by.x = "Genus_clean", by.y = "Genus",
                         all.x = TRUE)

# Fill NAs with "No" for unmatched genera
for (g in guild_cols) {
  taxonomy_guilds[[g]][is.na(taxonomy_guilds[[g]])] <- "No"
}

# Reorder to match OTU table
taxonomy_guilds <- taxonomy_guilds[match(rownames(otu_relabund), taxonomy_guilds$OTU_ID), ]

matched_genera <- sum(!is.na(taxonomy_guilds$Notes))
cat("  - Matched", matched_genera, "OTUs to guild reference\n")

# -----------------------------------------------------------------------------
# Calculate Guild Scores per Sample
# -----------------------------------------------------------------------------
cat("Calculating guild scores per sample...\n")

# For each guild, sum the relative abundance of all OTUs belonging to that guild
guild_scores <- data.frame(Sample_ID = colnames(otu_relabund_percent))

for (guild in guild_cols) {
  # Get OTUs in this guild
  guild_otus <- taxonomy_guilds$OTU_ID[taxonomy_guilds[[guild]] == "Yes"]

  # Sum relative abundance for these OTUs in each sample
  if (length(guild_otus) > 0) {
    guild_abundances <- otu_relabund_percent[rownames(otu_relabund_percent) %in% guild_otus, , drop = FALSE]
    guild_scores[[guild]] <- colSums(guild_abundances)
  } else {
    guild_scores[[guild]] <- 0
  }
}

# Round to 2 decimal places
for (g in guild_cols) {
  guild_scores[[g]] <- round(guild_scores[[g]], 2)
}

# Merge with metadata
guild_scores <- merge(guild_scores, metadata[, c("Sample_ID", "Kit.ID", "sample_location", "County", "Zipcode")],
                      by = "Sample_ID")

cat("  - Guild scores calculated for", nrow(guild_scores), "samples\n")

# -----------------------------------------------------------------------------
# Calculate Guild Percentiles (for tail piece samples)
# -----------------------------------------------------------------------------
cat("Calculating guild percentiles...\n")

# Filter to tail piece samples
tp_guilds <- guild_scores[guild_scores$Sample_ID %in% tailpiece_samples, ]

# Calculate percentiles for each guild
for (guild in guild_cols) {
  percentile_col <- paste0(guild, "_percentile")
  tp_guilds[[percentile_col]] <- round(ecdf(tp_guilds[[guild]])(tp_guilds[[guild]]) * 100, 1)
}

cat("  - Percentiles calculated for", nrow(tp_guilds), "tail piece samples\n")

# -----------------------------------------------------------------------------
# Summary Statistics
# -----------------------------------------------------------------------------
cat("Calculating summary statistics...\n")

# Overall guild summary
guild_summary <- data.frame(
  Guild = guild_cols,
  Mean_Abundance = sapply(guild_cols, function(g) round(mean(tp_guilds[[g]], na.rm = TRUE), 2)),
  SD_Abundance = sapply(guild_cols, function(g) round(sd(tp_guilds[[g]], na.rm = TRUE), 2)),
  Min = sapply(guild_cols, function(g) round(min(tp_guilds[[g]], na.rm = TRUE), 2)),
  Max = sapply(guild_cols, function(g) round(max(tp_guilds[[g]], na.rm = TRUE), 2)),
  stringsAsFactors = FALSE
)
rownames(guild_summary) <- NULL

cat("  - Guild abundance summary (% relative abundance):\n")
print(guild_summary)

# County-level guild summary
county_guild_summary <- tp_guilds %>%
  group_by(County) %>%
  summarize(
    n_samples = n(),
    across(all_of(guild_cols), ~ round(mean(.x, na.rm = TRUE), 2), .names = "mean_{.col}"),
    .groups = "drop"
  )

cat("\n  - County-level guild summary:\n")
print(as.data.frame(county_guild_summary))

# -----------------------------------------------------------------------------
# Create User-Friendly Guild Names
# -----------------------------------------------------------------------------
guild_names_friendly <- data.frame(
  guild_id = guild_cols,
  guild_name = c(
    "Personal Care Product Degraders",
    "Moisture Lovers",
    "Disinfectant Survivalists",
    "Odor Producers",
    "Skin Commuters",
    "Oral Commuters"
  ),
  description = c(
    "Bacteria that break down soaps, surfactants, and personal care products",
    "Water-loving bacteria that thrive in moist sink environments",
    "Bacteria that can survive exposure to household disinfectants",
    "Bacteria that produce volatile compounds contributing to sink odors",
    "Bacteria typically found on human skin, transferred during hand washing",
    "Bacteria from the mouth, transferred during tooth brushing and spitting"
  ),
  stringsAsFactors = FALSE
)

# -----------------------------------------------------------------------------
# Save Functional Guild Results
# -----------------------------------------------------------------------------
cat("Saving functional guild results...\n")

guild_results <- list(
  guild_scores = guild_scores,
  tp_guilds = tp_guilds,
  guild_summary = guild_summary,
  county_guild_summary = county_guild_summary,
  taxonomy_guilds = taxonomy_guilds,
  guild_names_friendly = guild_names_friendly
)

saveRDS(guild_results, file.path(OUTPUT_DIR, "functional_guild_results.rds"))

# Save CSVs
write.csv(guild_scores, file.path(OUTPUT_DIR, "guild_scores.csv"), row.names = FALSE)
write.csv(tp_guilds, file.path(OUTPUT_DIR, "guild_scores_with_percentiles.csv"), row.names = FALSE)

cat("Functional guild analysis complete.\n\n")
