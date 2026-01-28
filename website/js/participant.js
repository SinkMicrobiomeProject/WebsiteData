/* =============================================================================
   Sink Microbiome Project - Participant Page JavaScript
   ============================================================================= */

// Configuration
const DATA_PATH = '../output/';

// Global data storage
let participantData = null;
let percentileReference = null;

// Guild descriptions for display
const GUILD_INFO = {
    personal_care_degraders: {
        name: 'Personal Care Product Degraders',
        description: 'Bacteria that can break down soaps, shampoos, and other personal care products commonly found in bathroom sinks.'
    },
    moisture_lovers: {
        name: 'Moisture Lovers',
        description: 'Water-loving bacteria that thrive in the constantly wet environment of sink drains.'
    },
    disinfectant_survivalists: {
        name: 'Disinfectant Survivalists',
        description: 'Bacteria with resistance to common household disinfectants and cleaning products.'
    },
    odor_producers: {
        name: 'Odor Producers',
        description: 'Bacteria that can produce volatile compounds, sometimes contributing to drain odors.'
    },
    skin_commuters: {
        name: 'Skin Commuters',
        description: 'Bacteria originally from human skin, transferred during hand washing.'
    },
    oral_commuters: {
        name: 'Oral Commuters',
        description: 'Bacteria from the mouth, introduced during tooth brushing and other oral hygiene activities.'
    }
};

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    const kitId = getKitIdFromUrl();

    if (!kitId) {
        showError('No Kit ID specified. Please return to the home page and select a participant.');
        return;
    }

    try {
        await loadParticipantData(kitId);
        await loadPercentileReference();
        populatePage();
    } catch (error) {
        console.error('Error loading data:', error);
        showError(`Unable to load data for Kit ${kitId}. This kit may not exist in our database.`);
    }
});

// Get Kit ID from URL parameters
function getKitIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('kit');
}

// Load participant data
async function loadParticipantData(kitId) {
    const response = await fetch(`${DATA_PATH}participants/kit_${kitId}.json`);
    if (!response.ok) throw new Error('Participant data not found');
    participantData = await response.json();
}

// Load percentile reference data
async function loadPercentileReference() {
    try {
        const response = await fetch(`${DATA_PATH}percentile_reference.json`);
        if (response.ok) {
            percentileReference = await response.json();
        }
    } catch (error) {
        console.log('Percentile reference not available');
    }
}

// Populate all page sections
function populatePage() {
    if (!participantData) return;

    // Update header
    document.getElementById('kit-id').textContent = participantData.kit_id;
    document.getElementById('county-name').textContent = participantData.county;
    document.getElementById('form-kit-id').value = participantData.kit_id;
    document.title = `Kit ${participantData.kit_id} Results - The Sink Microbiome Project`;

    // Update last updated
    if (participantData.last_updated) {
        document.getElementById('last-updated').textContent = participantData.last_updated;
    }

    // Get tailpiece data (primary sample for display)
    const tailpiece = participantData.tailpiece;

    // Populate sections
    populateTopTaxa(tailpiece);
    populateSimilarity();
    populateAlphaDiversity(tailpiece);
    populateBetaDiversity(tailpiece);
    populateFunctionalGuilds(tailpiece);
}

// Populate top 5 taxa
function populateTopTaxa(tailpiece) {
    const container = document.getElementById('top-taxa-list');
    container.innerHTML = '';

    const topTaxa = tailpiece?.top5_taxa;
    if (!topTaxa || topTaxa.length === 0) {
        container.innerHTML = '<p class="no-data">No taxa data available</p>';
        return;
    }

    const maxAbundance = Math.max(...topTaxa.map(t => t.relative_abundance));

    topTaxa.forEach((taxon, index) => {
        const item = document.createElement('div');
        item.className = 'taxa-item';

        const barWidth = (taxon.relative_abundance / maxAbundance * 100).toFixed(0);

        item.innerHTML = `
            <div class="taxa-rank">${index + 1}</div>
            <div class="taxa-info" style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="taxa-name">${taxon.genus}</span>
                    <span class="taxa-abundance">${taxon.relative_abundance.toFixed(1)}%</span>
                </div>
                <div class="taxa-bar" style="width: ${barWidth}%;"></div>
            </div>
        `;

        container.appendChild(item);
    });

    // Update total taxa count
    document.getElementById('total-taxa').textContent = tailpiece?.total_taxa || '--';
}

// Populate similarity score
function populateSimilarity() {
    const score = participantData.py_similarity;

    if (score === null || score === undefined) {
        document.getElementById('similarity-score').textContent = 'N/A';
        document.getElementById('similarity-interpretation').textContent =
            'Similarity data not available for this sample.';
        return;
    }

    const percentage = (score * 100).toFixed(1);
    document.getElementById('similarity-score').textContent = percentage;

    // Animate the gauge fill
    setTimeout(() => {
        document.getElementById('similarity-fill').style.width = percentage + '%';
    }, 100);

    // Set interpretation
    let interpretation = '';
    if (score >= 0.7) {
        interpretation = 'Your tail piece and countertop have very similar bacterial communities! This suggests similar environmental conditions or cross-contamination between these locations.';
    } else if (score >= 0.4) {
        interpretation = 'Your tail piece and countertop have moderately similar bacterial communities. Some bacteria are shared, but each location has its own distinct community.';
    } else {
        interpretation = 'Your tail piece and countertop have quite different bacterial communities. Each location hosts its own unique set of bacteria.';
    }
    document.getElementById('similarity-interpretation').textContent = interpretation;
}

// Populate alpha diversity
function populateAlphaDiversity(tailpiece) {
    const alpha = tailpiece?.alpha_diversity;

    if (!alpha) return;

    // Richness percentile
    if (alpha.richness_percentile !== undefined) {
        const richness = Math.round(alpha.richness_percentile);
        document.getElementById('richness-percentile').textContent = richness + 'th percentile';

        setTimeout(() => {
            document.getElementById('richness-fill').style.width = richness + '%';
            document.getElementById('richness-marker').style.left = richness + '%';
        }, 100);
    }

    // Shannon percentile
    if (alpha.shannon_percentile !== undefined) {
        const shannon = Math.round(alpha.shannon_percentile);
        document.getElementById('shannon-percentile').textContent = shannon + 'th percentile';

        setTimeout(() => {
            document.getElementById('shannon-fill').style.width = shannon + '%';
            document.getElementById('shannon-marker').style.left = shannon + '%';
        }, 100);
    }
}

// Populate beta diversity
function populateBetaDiversity(tailpiece) {
    const beta = tailpiece?.beta_diversity;

    if (!beta) return;

    // Same county (note: JSON uses similarity_same_county)
    if (beta.similarity_same_county !== undefined) {
        document.getElementById('same-county-value').textContent = beta.similarity_same_county.toFixed(2);
    }
    document.getElementById('county-compare').textContent = participantData.county;

    // Other counties (note: JSON uses similarity_other_counties)
    if (beta.similarity_other_counties !== undefined) {
        document.getElementById('other-county-value').textContent = beta.similarity_other_counties.toFixed(2);
    }

    // Interpretation
    let interpretation = '';
    if (beta.similarity_same_county !== undefined && beta.similarity_other_counties !== undefined) {
        if (beta.similarity_same_county > beta.similarity_other_counties) {
            interpretation = `Your sink is more similar to other sinks in ${participantData.county} County than to sinks elsewhere. Geographic proximity may influence bacterial communities!`;
        } else {
            interpretation = `Interestingly, your sink is as similar to sinks in other counties as to those in ${participantData.county} County. Local conditions may matter more than geography.`;
        }
    }
    document.getElementById('beta-interpretation').textContent = interpretation;
}

// Populate functional guilds
function populateFunctionalGuilds(tailpiece) {
    const container = document.getElementById('guilds-list');
    container.innerHTML = '';

    const guilds = tailpiece?.guilds;

    if (!guilds) {
        container.innerHTML = '<p class="no-data">Functional guild data not available</p>';
        return;
    }

    // Define guild display order and keys
    const guildOrder = [
        'personal_care_degraders',
        'moisture_lovers',
        'disinfectant_survivalists',
        'odor_producers',
        'skin_commuters',
        'oral_commuters'
    ];

    guildOrder.forEach(guildKey => {
        const guildData = guilds[guildKey];
        if (!guildData) return;

        const info = GUILD_INFO[guildKey] || { name: guildKey, description: '' };
        const percentile = Math.round(guildData.percentile || 0);
        const score = guildData.score ? guildData.score.toFixed(1) : '0';

        const item = document.createElement('div');
        item.className = 'guild-item';
        item.setAttribute('data-guild', guildKey.replace('_degraders', '').replace('_lovers', '').replace('_survivalists', '').replace('_producers', '').replace('_commuters', ''));

        item.innerHTML = `
            <div class="guild-header">
                <span class="guild-name">${info.name}</span>
                <span class="guild-percentile">${percentile}th percentile</span>
            </div>
            <div class="guild-bar-container">
                <div class="guild-bar" id="guild-bar-${guildKey}"></div>
            </div>
            <p class="guild-description">${info.description} (${score}% of your bacteria)</p>
        `;

        container.appendChild(item);

        // Animate the bar
        setTimeout(() => {
            document.getElementById(`guild-bar-${guildKey}`).style.width = percentile + '%';
        }, 100);
    });
}

// Show error message
function showError(message) {
    const container = document.querySelector('.container');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-banner';
    errorDiv.innerHTML = `<p>${message}</p>`;

    // Insert after back nav
    const backNav = container.querySelector('.back-nav');
    if (backNav) {
        backNav.after(errorDiv);
    } else {
        container.insertBefore(errorDiv, container.firstChild);
    }

    // Hide other sections
    const sections = container.querySelectorAll('section:not(.error-banner)');
    sections.forEach(section => {
        if (!section.classList.contains('updates-notice')) {
            section.style.display = 'none';
        }
    });
}
