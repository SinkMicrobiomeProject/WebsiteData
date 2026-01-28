# =============================================================================
# 05_export_json.R
# Export all results to JSON format for website
# =============================================================================

cat("\n=== Step 5: Export to JSON ===\n")

# Load all results
if (!exists("processed_data")) {
  processed_data <- readRDS(file.path(OUTPUT_DIR, "processed_data.rds"))
}
alpha_results <- readRDS(file.path(OUTPUT_DIR, "alpha_diversity_results.rds"))
beta_results <- readRDS(file.path(OUTPUT_DIR, "beta_diversity_results.rds"))
guild_results <- readRDS(file.path(OUTPUT_DIR, "functional_guild_results.rds"))

# Extract needed data
otu_relabund_percent <- processed_data$otu_relabund_percent
taxonomy <- processed_data$taxonomy
metadata <- processed_data$metadata
tailpiece_samples <- processed_data$tailpiece_samples

# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------

# Get top N taxa for a sample
get_top_taxa <- function(sample_id, n = 5) {
  abundances <- otu_relabund_percent[, sample_id]
  top_idx <- order(abundances, decreasing = TRUE)[1:min(n, length(abundances))]

  data.frame(
    taxon = taxonomy$Genus[top_idx],
    species = taxonomy$Species[top_idx],
    full_taxonomy = taxonomy$OTU_ID[top_idx],
    relative_abundance = round(abundances[top_idx], 2),
    stringsAsFactors = FALSE
  )
}

# Format genus name for display
format_genus <- function(genus) {
  if (is.na(genus) || genus == "" || genus == "__") {
    return("Unclassified")
  }
  # Remove trailing underscores and clean up
  genus <- gsub("_[A-Z]$", "", genus)  # Remove suffixes like _A, _B
  genus <- gsub("_", " ", genus)
  return(genus)
}

# -----------------------------------------------------------------------------
# 1. Summary Statistics (Landing Page)
# -----------------------------------------------------------------------------
cat("Creating summary statistics JSON...\n")

# Total taxa (unique genera)
all_genera <- unique(taxonomy$Genus[taxonomy$Genus != "" & taxonomy$Genus != "__"])
total_taxa <- length(all_genera)

# Taxa count by county (based on tail piece samples)
taxa_by_county <- list()
for (county in unique(metadata$County)) {
  county_samples <- metadata$Sample_ID[metadata$County == county &
                                         metadata$Sample_ID %in% tailpiece_samples]
  if (length(county_samples) > 0) {
    county_otus <- rownames(otu_relabund_percent)[rowSums(otu_relabund_percent[, county_samples, drop = FALSE]) > 0]
    county_genera <- unique(taxonomy$Genus[taxonomy$OTU_ID %in% county_otus &
                                             taxonomy$Genus != "" &
                                             taxonomy$Genus != "__"])
    taxa_by_county[[county]] <- list(
      county = county,
      n_samples = length(county_samples),
      n_taxa = length(county_genera)
    )
  }
}

# Top 5 taxa overall (by mean relative abundance across tail piece samples)
tp_abundances <- otu_relabund_percent[, tailpiece_samples, drop = FALSE]
mean_abundances <- rowMeans(tp_abundances)
top5_idx <- order(mean_abundances, decreasing = TRUE)[1:5]

top5_overall <- lapply(1:5, function(i) {
  list(
    rank = i,
    genus = format_genus(taxonomy$Genus[top5_idx[i]]),
    mean_abundance = round(mean_abundances[top5_idx[i]], 2)
  )
})

# Top 5 taxa by county
top5_by_county <- list()
for (county in unique(metadata$County)) {
  county_samples <- metadata$Sample_ID[metadata$County == county &
                                         metadata$Sample_ID %in% tailpiece_samples]
  if (length(county_samples) > 0) {
    county_means <- rowMeans(otu_relabund_percent[, county_samples, drop = FALSE])
    county_top5_idx <- order(county_means, decreasing = TRUE)[1:5]

    top5_by_county[[county]] <- lapply(1:5, function(i) {
      list(
        rank = i,
        genus = format_genus(taxonomy$Genus[county_top5_idx[i]]),
        mean_abundance = round(county_means[county_top5_idx[i]], 2)
      )
    })
  }
}

# Create summary JSON
summary_data <- list(
  last_updated = format(Sys.time(), "%Y-%m-%d %H:%M:%S"),
  total_samples = length(tailpiece_samples),
  total_taxa = total_taxa,
  taxa_by_county = taxa_by_county,
  top5_taxa_overall = top5_overall,
  top5_taxa_by_county = top5_by_county,
  counties = unique(metadata$County),
  zipcodes = unique(metadata$Zipcode)
)

write(toJSON(summary_data, auto_unbox = TRUE, pretty = TRUE),
      file.path(OUTPUT_DIR, "summary.json"))

cat("  - Created summary.json\n")

# -----------------------------------------------------------------------------
# 2. Map Data
# -----------------------------------------------------------------------------
cat("Creating map data JSON...\n")

# Create map data with zipcode coordinates (placeholder - would need real coordinates)
# For now, include zipcode info for each sample
map_data <- lapply(tailpiece_samples, function(s) {
  sample_meta <- metadata[metadata$Sample_ID == s, ]
  list(
    sample_id = s,
    kit_id = as.character(sample_meta$Kit.ID),
    zipcode = as.character(sample_meta$Zipcode),
    county = sample_meta$County
  )
})

write(toJSON(map_data, auto_unbox = TRUE, pretty = TRUE),
      file.path(OUTPUT_DIR, "map_data.json"))

cat("  - Created map_data.json\n")

# -----------------------------------------------------------------------------
# 3. Individual Participant Results
# -----------------------------------------------------------------------------
cat("Creating individual participant JSON files...\n")

# Get unique kit IDs
kit_ids <- unique(metadata$Kit.ID)

for (kit in kit_ids) {
  kit_meta <- metadata[metadata$Kit.ID == kit, ]
  kit_samples <- kit_meta$Sample_ID

  # Get P and Y samples
  p_sample <- kit_samples[grepl("_P$", kit_samples)][1]
  y_sample <- kit_samples[grepl("_Y$", kit_samples)][1]

  # Initialize participant data
  participant <- list(
    kit_id = as.character(kit),
    zipcode = as.character(kit_meta$Zipcode[1]),
    county = kit_meta$County[1]
  )

  # Tail piece results
  if (!is.na(p_sample) && p_sample %in% colnames(otu_relabund_percent)) {
    # Top 5 taxa
    top5_p <- get_top_taxa(p_sample, 5)
    participant$tailpiece <- list(
      sample_id = p_sample,
      top5_taxa = lapply(1:nrow(top5_p), function(i) {
        list(
          rank = i,
          genus = format_genus(top5_p$taxon[i]),
          relative_abundance = top5_p$relative_abundance[i]
        )
      }),
      total_taxa = sum(otu_relabund_percent[, p_sample] > 0)
    )

    # Alpha diversity
    if (p_sample %in% alpha_results$tailpiece_alpha$Sample_ID) {
      alpha_row <- alpha_results$tailpiece_alpha[alpha_results$tailpiece_alpha$Sample_ID == p_sample, ]
      participant$tailpiece$alpha_diversity <- list(
        observed_richness = alpha_row$observed_richness,
        shannon = round(alpha_row$shannon, 2),
        richness_percentile = round(alpha_row$richness_percentile, 1)
      )
    }

    # Beta diversity comparisons
    if (p_sample %in% beta_results$beta_comparisons$Sample_ID) {
      beta_row <- beta_results$beta_comparisons[beta_results$beta_comparisons$Sample_ID == p_sample, ]
      participant$tailpiece$beta_diversity <- list(
        similarity_same_county = beta_row$mean_sim_same_county,
        similarity_other_counties = beta_row$mean_sim_other_counties,
        similarity_percentile = round(beta_row$sim_percentile, 1)
      )
    }

    # Functional guild scores
    if (p_sample %in% guild_results$tp_guilds$Sample_ID) {
      guild_row <- guild_results$tp_guilds[guild_results$tp_guilds$Sample_ID == p_sample, ]
      participant$tailpiece$guilds <- list(
        personal_care_degraders = list(
          score = guild_row$Personal_care_degrader,
          percentile = guild_row$Personal_care_degrader_percentile
        ),
        moisture_lovers = list(
          score = guild_row$Moisture_lover,
          percentile = guild_row$Moisture_lover_percentile
        ),
        disinfectant_survivalists = list(
          score = guild_row$Disinfectant_survivalist,
          percentile = guild_row$Disinfectant_survivalist_percentile
        ),
        odor_producers = list(
          score = guild_row$Odor_producer,
          percentile = guild_row$Odor_producer_percentile
        ),
        skin_commuters = list(
          score = guild_row$Skin_commuter,
          percentile = guild_row$Skin_commuter_percentile
        ),
        oral_commuters = list(
          score = guild_row$Oral_commuter,
          percentile = guild_row$Oral_commuter_percentile
        )
      )
    }
  }

  # Countertop results
  if (!is.na(y_sample) && y_sample %in% colnames(otu_relabund_percent)) {
    top5_y <- get_top_taxa(y_sample, 5)
    participant$countertop <- list(
      sample_id = y_sample,
      top5_taxa = lapply(1:nrow(top5_y), function(i) {
        list(
          rank = i,
          genus = format_genus(top5_y$taxon[i]),
          relative_abundance = top5_y$relative_abundance[i]
        )
      }),
      total_taxa = sum(otu_relabund_percent[, y_sample] > 0)
    )
  }

  # P-Y similarity
  if (!is.na(p_sample) && !is.na(y_sample)) {
    kit_sim <- beta_results$within_kit_similarity[beta_results$within_kit_similarity$Kit_ID == kit, ]
    if (nrow(kit_sim) > 0) {
      participant$py_similarity <- kit_sim$similarity[1]
    }
  }

  # Write individual participant JSON
  write(toJSON(participant, auto_unbox = TRUE, pretty = TRUE),
        file.path(OUTPUT_DIR, "participants", paste0("kit_", kit, ".json")))
}

cat("  - Created", length(kit_ids), "individual participant JSON files\n")

# -----------------------------------------------------------------------------
# 4. Percentile Rankings Reference
# -----------------------------------------------------------------------------
cat("Creating percentile rankings reference JSON...\n")

# Create reference data for percentile interpretation
percentile_ref <- list(
  alpha_diversity = list(
    metric = "Observed Richness",
    description = "Number of unique bacterial types detected",
    interpretation = "Higher percentile = more diverse bacterial community"
  ),
  guilds = guild_results$guild_names_friendly
)

write(toJSON(percentile_ref, auto_unbox = TRUE, pretty = TRUE),
      file.path(OUTPUT_DIR, "percentile_reference.json"))

cat("  - Created percentile_reference.json\n")

# -----------------------------------------------------------------------------
# 5. All Participants Index
# -----------------------------------------------------------------------------
cat("Creating participants index JSON...\n")

participants_index <- lapply(kit_ids, function(kit) {
  kit_meta <- metadata[metadata$Kit.ID == kit, ][1, ]
  list(
    kit_id = as.character(kit),
    zipcode = as.character(kit_meta$Zipcode),
    county = kit_meta$County
  )
})

write(toJSON(participants_index, auto_unbox = TRUE, pretty = TRUE),
      file.path(OUTPUT_DIR, "participants_index.json"))

cat("  - Created participants_index.json\n")

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
cat("\n=== JSON Export Complete ===\n")
cat("Output files created in:", OUTPUT_DIR, "\n")
cat("  - summary.json (landing page data)\n")
cat("  - map_data.json (map visualization)\n")
cat("  - participants_index.json (list of all kits)\n")
cat("  - percentile_reference.json (interpretation guide)\n")
cat("  - participants/kit_*.json (individual results)\n")
cat("\nTotal files:", 4 + length(kit_ids), "\n")
