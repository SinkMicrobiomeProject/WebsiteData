/* =============================================================================
   Sink Microbiome Project - Main JavaScript
   ============================================================================= */

// Configuration
const DATA_PATH = '../output/';

// Brief public-friendly descriptions for common bacterial genera
const GENUS_DESCRIPTIONS = {
    'Acinetobacter':      'Thrives on moist surfaces; a common resident of sink drains',
    'Comamonas':          'Water-dwelling; helps break down organic matter in pipes',
    'Pseudomonas':        'Highly versatile; found in soil, water, and on surfaces worldwide',
    'Pantoea':            'Common on plants and in soil; enters homes through water',
    'Diaphorobacter':     'Freshwater specialist; breaks down pollutants in pipes and drains',
    'Enterobacter':       'Found in soil, water, and the human gut',
    'Brevundimonas':      'Aquatic bacteria; commonly detected in tap water and plumbing',
    'Klebsiella':         'Found in soil, water, and the human intestine',
    'Janthinobacterium':  'Cold-loving; produces a distinctive purple pigment in nature',
    'Rossellomorea':      'Spore-forming soil bacterium; moisture-tolerant indoor survivor',
    'Chryseobacterium':   'Loves cold, wet environments; common in pipes and refrigerators',
    'Serratia':           'Widespread in soil and water; a classic sink inhabitant',
    'Herbaspirillum':     'Associated with plant roots; occasionally detected in water systems',
    'Stenotrophomonas':   'Widespread in soil and water; breaks down diverse compounds',
    'Pseudoxanthomonas':  'Soil and water dweller; helps degrade organic material',
    'Achromobacter':      'Detected in chlorinated tap water and moist indoor surfaces',
    'Sphingobacterium':   'Breaks down complex organic molecules in soil and water',
    'Ochrobactrum':       'Hardy environmental bacterium found in soil and water worldwide',
    'Agrobacterium':      'Commonly found in soil; associated with plant root systems',
    'Allorhizobium':      'Relative of nitrogen-fixing bacteria; found in soil and water',
    'Bosea':              'Environmental bacterium naturally occurring in soil and water',
    'Pedobacter':         'Freshwater and soil specialist; thrives in cool, moist habitats',
    'Phytobacter':        'Plant-associated; occasionally found in household water systems',
    'Flavobacterium':     'Aquatic bacteria; thrives in cold, freshwater environments',
    'Unclassified':       'Bacteria not yet assigned to a named scientific group',
};

// Global data storage
let summaryData = null;
let participantsIndex = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadSummaryData();
        await loadParticipantsIndex();
        populatePage();
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Unable to load data. Please try again later.');
    }
});

// Load summary data from JSON
async function loadSummaryData() {
    const response = await fetch(DATA_PATH + 'summary.json');
    if (!response.ok) throw new Error('Failed to load summary data');
    summaryData = await response.json();
}

// Load participants index
async function loadParticipantsIndex() {
    const response = await fetch(DATA_PATH + 'participants_index.json');
    if (!response.ok) throw new Error('Failed to load participants index');
    participantsIndex = await response.json();
}

// Populate all page sections
function populatePage() {
    if (!summaryData) return;

    // Update statistics
    document.getElementById('total-samples').textContent = summaryData.total_samples;
    document.getElementById('total-taxa').textContent = summaryData.total_taxa;
    document.getElementById('total-states').textContent = summaryData.states.length;
    document.getElementById('last-updated').textContent = summaryData.last_updated;

    // Populate state grid
    populateStateGrid();

    // Populate top taxa
    populateTopTaxa();

    // Populate participants grid
    populateParticipantsGrid();
}

// Populate state statistics grid
function populateStateGrid() {
    const container = document.getElementById('state-grid');
    container.innerHTML = '';

    for (const [stateName, stateData] of Object.entries(summaryData.taxa_by_state)) {
        const topTaxa = summaryData.top5_taxa_by_state[stateName];

        const card = document.createElement('div');
        card.className = 'county-card';

        let topTaxaHTML = '';
        if (topTaxa && topTaxa.length > 0) {
            const topGenus = topTaxa[0].genus;
            const desc = GENUS_DESCRIPTIONS[topGenus] || '';
            topTaxaHTML = '<div class="county-top-taxa"><strong>Top Genus:</strong> <em>' +
                          topGenus + '</em> (' + topTaxa[0].mean_abundance.toFixed(1) + '%)' +
                          (desc ? '<br><span style="font-size:0.78rem;color:#666;">' + desc + '</span>' : '') +
                          '</div>';
        }

        card.innerHTML = `
            <h3>${stateName}</h3>
            <div class="county-stat">
                <span>Samples:</span>
                <span><strong>${stateData.n_samples}</strong></span>
            </div>
            <div class="county-stat">
                <span>Taxa Recovered:</span>
                <span><strong>${stateData.n_taxa}</strong></span>
            </div>
            ${topTaxaHTML}
        `;

        container.appendChild(card);
    }
}

// Populate top 5 taxa overall
function populateTopTaxa() {
    const container = document.getElementById('top-taxa-overall');
    container.innerHTML = '';

    const maxAbundance = Math.max(...summaryData.top5_taxa_overall.map(t => t.mean_abundance));

    summaryData.top5_taxa_overall.forEach(taxon => {
        const item = document.createElement('div');
        item.className = 'taxa-item';

        const barWidth = (taxon.mean_abundance / maxAbundance * 100).toFixed(0);

        const description = GENUS_DESCRIPTIONS[taxon.genus] || '';
        item.innerHTML = `
            <div class="taxa-rank">${taxon.rank}</div>
            <div class="taxa-info" style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="taxa-name">${taxon.genus}</span>
                    <span class="taxa-abundance">${taxon.mean_abundance.toFixed(1)}%</span>
                </div>
                ${description ? `<div class="taxa-description">${description}</div>` : ''}
                <div class="taxa-bar" style="width: ${barWidth}%;"></div>
            </div>
        `;

        container.appendChild(item);
    });
}

// Populate participants grid
function populateParticipantsGrid() {
    const container = document.getElementById('participants-grid');
    container.innerHTML = '';

    if (!participantsIndex) return;

    participantsIndex.forEach(participant => {
        const card = document.createElement('a');
        card.className = 'participant-card';
        card.href = `participant.html?kit=${participant.kit_id}`;

        card.innerHTML = `
            <div class="kit-id">Kit ${participant.kit_id}</div>
            <div class="county">${participant.state}</div>
        `;

        container.appendChild(card);
    });
}

// Look up participant by Kit ID
function lookupParticipant() {
    const input = document.getElementById('kit-id-input');
    const errorDiv = document.getElementById('lookup-error');
    const kitId = input.value.trim();

    errorDiv.textContent = '';

    if (!kitId) {
        errorDiv.textContent = 'Please enter a Kit ID';
        return;
    }

    // Check if participant exists
    const participant = participantsIndex.find(p =>
        p.kit_id.toString() === kitId ||
        p.kit_id.toString() === kitId.replace(/^kit[_\s]*/i, '')
    );

    if (participant) {
        window.location.href = `participant.html?kit=${participant.kit_id}`;
    } else {
        errorDiv.textContent = `Kit ID "${kitId}" not found. Please check and try again.`;
    }
}

// Handle Enter key in lookup input
document.getElementById('kit-id-input')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        lookupParticipant();
    }
});

// Show error message
function showError(message) {
    const container = document.querySelector('.container');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-banner';
    errorDiv.innerHTML = `<p>${message}</p>`;
    container.insertBefore(errorDiv, container.firstChild);
}
