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

// Static figure data (from OTU table analysis)
const PHYLA = [
    { name: "Proteobacteria",  gtdb: "Pseudomonadota", pct: 91.7, color: "#2c6ea6" },
    { name: "Firmicutes",      gtdb: "Bacillota",       pct: 3.9,  color: "#27ae60" },
    { name: "Bacteroidetes",   gtdb: "Bacteroidota",    pct: 2.4,  color: "#e67e22" },
    { name: "Unclassified",    gtdb: "Unclassified",    pct: 1.4,  color: "#95a5a6" },
    { name: "Actinobacteria",  gtdb: "Actinomycetota",  pct: 0.4,  color: "#8e44ad" },
    { name: "Rare (<0.1%)",    gtdb: "",                pct: 0.2,  color: "#bdc3c7" }
];
const GENERA_FIG = [
    { genus: "Acinetobacter",      phylum: "Pseudomonadota", pct: 34.2 },
    { genus: "Comamonas",          phylum: "Pseudomonadota", pct: 12.2 },
    { genus: "Pseudomonas",        phylum: "Pseudomonadota", pct: 8.7  },
    { genus: "Pantoea",            phylum: "Pseudomonadota", pct: 7.9  },
    { genus: "Diaphorobacter",     phylum: "Pseudomonadota", pct: 5.5  },
    { genus: "Rossellomorea",      phylum: "Bacillota",      pct: 3.1  },
    { genus: "Klebsiella",         phylum: "Pseudomonadota", pct: 2.3  },
    { genus: "Enterobacter",       phylum: "Pseudomonadota", pct: 2.0  },
    { genus: "Brevundimonas",      phylum: "Pseudomonadota", pct: 1.8  },
    { genus: "Janthinobacterium",  phylum: "Pseudomonadota", pct: 1.6  },
    { genus: "Chryseobacterium",   phylum: "Bacteroidota",   pct: 1.2  },
    { genus: "Serratia",           phylum: "Pseudomonadota", pct: 0.9  },
    { genus: "Herbaspirillum",     phylum: "Pseudomonadota", pct: 0.8  },
    { genus: "Sphingobacterium",   phylum: "Bacteroidota",   pct: 0.7  },
    { genus: "Achromobacter",      phylum: "Pseudomonadota", pct: 0.5  }
];
const PHYLUM_COLOR = { "Pseudomonadota": "#2c6ea6", "Bacillota": "#27ae60",
                       "Bacteroidota": "#e67e22", "Actinomycetota": "#8e44ad" };

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

    // Render microbial community figure
    populateFigure();
}

function populateFigure() {
    // Donut chart
    const svg = document.getElementById('donut-svg');
    if (!svg) return;
    const cx = 100, cy = 100, r = 80, inner = 52;
    const total = PHYLA.reduce((s, p) => s + p.pct, 0);
    let angle = -Math.PI / 2;
    PHYLA.forEach(p => {
        const sweep = (p.pct / total) * 2 * Math.PI;
        const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
        const x2 = cx + r * Math.cos(angle + sweep), y2 = cy + r * Math.sin(angle + sweep);
        const xi1 = cx + inner * Math.cos(angle), yi1 = cy + inner * Math.sin(angle);
        const xi2 = cx + inner * Math.cos(angle + sweep), yi2 = cy + inner * Math.sin(angle + sweep);
        const large = sweep > Math.PI ? 1 : 0;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d',
            `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z`);
        path.setAttribute('fill', p.color);
        path.setAttribute('stroke', '#fff');
        path.setAttribute('stroke-width', '2');
        path.addEventListener('mouseover', function() { this.setAttribute('opacity', '0.82'); });
        path.addEventListener('mouseout',  function() { this.setAttribute('opacity', '1'); });
        svg.appendChild(path);
        angle += sweep;
    });
    document.getElementById('donut-total').textContent = '142';

    // Phylum legend
    const ul = document.getElementById('phylum-legend');
    if (ul) PHYLA.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="legend-dot" style="background:${p.color}"></span>
                        <span class="legend-name">${p.name}</span>
                        <span class="legend-pct">${p.pct}%</span>`;
        ul.appendChild(li);
    });

    // Bar chart
    const barContainer = document.getElementById('bar-chart');
    if (barContainer) {
        const maxPct = GENERA_FIG[0].pct;
        GENERA_FIG.forEach((g, i) => {
            const color = PHYLUM_COLOR[g.phylum] || '#95a5a6';
            const widthPct = (g.pct / maxPct * 100).toFixed(1);
            const showInside = g.pct >= 4;
            const row = document.createElement('div');
            row.className = 'bar-row';
            row.innerHTML = `<div class="bar-label" title="${g.genus}">${g.genus}</div>
                             <div class="bar-track">
                               <div class="bar-fill" id="fig-bar-${i}" style="width:0%;background:${color}">
                                 ${showInside ? `<span class="bar-pct">${g.pct}%</span>` : ''}
                               </div>
                             </div>
                             ${!showInside ? `<span class="bar-pct outside">${g.pct}%</span>` : ''}`;
            barContainer.appendChild(row);
            setTimeout(() => { document.getElementById(`fig-bar-${i}`).style.width = widthPct + '%'; }, 50 + i * 40);
        });
    }

    // Figure note
    const note = document.getElementById('figure-note');
    if (note && summaryData) {
        note.textContent = `Data last updated: ${summaryData.last_updated}. Relative abundances shown are means across all ${summaryData.total_samples} samples after rarefaction.`;
    }
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

    participantsIndex.sort((a, b) => parseInt(a.kit_id) - parseInt(b.kit_id));

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
