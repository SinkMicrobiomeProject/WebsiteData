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

// State center coordinates [lat, lon] for bubble map
const STATE_CENTERS = {
    'Alabama':        [32.8, -86.8],  'Arizona':        [34.3, -111.1],
    'Arkansas':       [35.0, -92.4],  'California':     [36.8, -119.4],
    'Colorado':       [39.0, -105.5], 'Connecticut':    [41.7, -72.7],
    'Delaware':       [39.0, -75.5],  'Florida':        [27.8, -81.6],
    'Georgia':        [32.2, -83.4],  'Idaho':          [44.4, -114.6],
    'Illinois':       [40.0, -89.2],  'Indiana':        [40.3, -86.1],
    'Iowa':           [42.0, -93.6],  'Kansas':         [38.5, -98.4],
    'Kentucky':       [37.5, -85.3],  'Louisiana':      [31.1, -91.8],
    'Maine':          [45.4, -69.0],  'Maryland':       [39.1, -76.8],
    'Massachusetts':  [42.4, -71.4],  'Michigan':       [44.3, -85.4],
    'Minnesota':      [46.7, -93.9],  'Mississippi':    [32.7, -89.7],
    'Missouri':       [38.5, -92.3],  'Montana':        [47.0, -110.4],
    'Nebraska':       [41.5, -99.9],  'Nevada':         [38.5, -117.1],
    'New Hampshire':  [44.0, -71.6],  'New Jersey':     [40.1, -74.4],
    'New Mexico':     [34.5, -106.0], 'New York':       [43.0, -75.5],
    'North Carolina': [35.6, -79.4],  'North Dakota':   [47.5, -100.5],
    'Ohio':           [40.4, -82.8],  'Oklahoma':       [35.6, -97.0],
    'Oregon':         [44.6, -122.1], 'Pennsylvania':   [40.6, -77.2],
    'Rhode Island':   [41.7, -71.5],  'South Carolina': [34.0, -81.0],
    'South Dakota':   [44.4, -100.2], 'Tennessee':      [35.9, -86.7],
    'Texas':          [31.5, -99.3],  'Utah':           [39.3, -111.1],
    'Vermont':        [44.6, -72.7],  'Virginia':       [37.8, -78.2],
    'Washington':     [47.4, -120.5], 'West Virginia':  [38.9, -80.5],
    'Wisconsin':      [44.5, -89.6],  'Wyoming':        [43.0, -107.6],
    'Alaska':         null,           'Hawaii':         null
};

// Inset pixel positions (SVG coords) for AK and HI
const STATE_INSET = { 'Alaska': {x: 90, y: 450}, 'Hawaii': {x: 240, y: 470} };

// State name → 2-letter abbreviation
const STATE_ABBR = {
    'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
    'Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
    'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS',
    'Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD','Massachusetts':'MA',
    'Michigan':'MI','Minnesota':'MN','Mississippi':'MS','Missouri':'MO','Montana':'MT',
    'Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM',
    'New York':'NY','North Carolina':'NC','North Dakota':'ND','Ohio':'OH','Oklahoma':'OK',
    'Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
    'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT',
    'Virginia':'VA','Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY'
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

    // Populate bubble map
    populateBubbleMap();

    // Populate state grid
    populateStateGrid();

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
            const desc = i < 5 ? (GENUS_DESCRIPTIONS[g.genus] || '') : '';
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
            if (desc) {
                const descEl = document.createElement('div');
                descEl.className = 'bar-desc';
                descEl.textContent = desc;
                barContainer.appendChild(descEl);
            }
            setTimeout(() => { document.getElementById(`fig-bar-${i}`).style.width = widthPct + '%'; }, 50 + i * 40);
        });
    }

    // Figure note
    const note = document.getElementById('figure-note');
    if (note && summaryData) {
        note.textContent = `Data last updated: ${summaryData.last_updated}. Relative abundances shown are means across all ${summaryData.total_samples} samples after rarefaction.`;
    }
}

// Draw US bubble map — circles sized by sqrt(n_samples)
function populateBubbleMap() {
    const svg = document.getElementById('us-bubble-map');
    const tooltip = document.getElementById('map-tooltip');
    if (!svg || !summaryData || !summaryData.taxa_by_state) return;

    // Project lat/lon onto 860×520 SVG (contiguous US only)
    function proj(lat, lon) {
        return {
            x: Math.round((lon + 128) / 63 * 760 + 50),
            y: Math.round((50 - lat) / 28 * 420 + 20)
        };
    }

    function el(tag, attrs) {
        const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
        return e;
    }

    // Collect sample counts
    const counts = {};
    for (const [state, data] of Object.entries(summaryData.taxa_by_state)) {
        counts[state] = data.n_samples;
    }
    const maxN = Math.max(...Object.values(counts), 1);
    const MAX_R = 28, MIN_R = 6;

    // Background
    svg.appendChild(el('rect', {x:0, y:0, width:860, height:520, fill:'#f0f6fb', rx:8}));

    // Inset box for AK + HI
    svg.appendChild(el('rect', {x:12, y:398, width:318, height:110, fill:'#e8f0f8', stroke:'#c0d0e0', 'stroke-width':1, rx:5}));
    const inkLabel = el('text', {x:171, y:518, 'text-anchor':'middle', fill:'#aaa', 'font-size':'9', 'font-family':'sans-serif'});
    inkLabel.textContent = 'AK  ·  HI (inset)';
    svg.appendChild(inkLabel);

    // Draw each state
    for (const [state, coords] of Object.entries(STATE_CENTERS)) {
        const n = counts[state] || 0;
        const pos = coords ? proj(coords[0], coords[1]) : STATE_INSET[state];
        if (!pos) continue;

        const r = n > 0 ? MIN_R + Math.sqrt(n / maxN) * (MAX_R - MIN_R) : 4;
        const rnd = Math.round(r * 10) / 10;

        const circle = el('circle', {
            cx: pos.x, cy: pos.y, r: rnd,
            fill: n > 0 ? 'rgba(44,110,166,0.75)' : 'rgba(180,200,215,0.45)',
            stroke: n > 0 ? '#1a4b8c' : '#b0c4d4',
            'stroke-width': n > 0 ? 1.5 : 0.8
        });
        svg.appendChild(circle);

        // Abbreviation label inside circle (only when big enough)
        const abbr = STATE_ABBR[state] || '';
        if (n > 0 && r >= 11 && abbr) {
            const lbl = el('text', {
                x: pos.x, y: pos.y,
                'text-anchor':'middle', 'dominant-baseline':'central',
                fill:'#fff', 'font-size': Math.min(Math.round(r * 0.65), 11),
                'font-family':'sans-serif', 'font-weight':'bold',
                'pointer-events':'none'
            });
            lbl.textContent = abbr;
            svg.appendChild(lbl);
        }

        // Tooltip on hover
        if (n > 0 && tooltip) {
            circle.style.cursor = 'pointer';
            circle.addEventListener('mouseenter', () => {
                tooltip.textContent = `${state}: ${n} sample${n !== 1 ? 's' : ''}`;
                tooltip.style.display = 'block';
            });
            circle.addEventListener('mousemove', e => {
                const rect = svg.closest('.map-container').getBoundingClientRect();
                tooltip.style.left = (e.clientX - rect.left + 14) + 'px';
                tooltip.style.top  = (e.clientY - rect.top  - 38) + 'px';
            });
            circle.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        }
    }

    // Legend (bottom-right)
    const lx = 680, ly = 400;
    svg.appendChild(el('rect', {x:lx-8, y:ly-22, width:168, height:108, fill:'#fff', stroke:'#dde', 'stroke-width':1, rx:7, opacity:0.92}));
    const ltitle = el('text', {x:lx+76, y:ly-5, 'text-anchor':'middle', fill:'#555', 'font-size':10, 'font-family':'sans-serif', 'font-weight':'bold'});
    ltitle.textContent = 'Samples per state';
    svg.appendChild(ltitle);

    const legendVals = [1, Math.max(1, Math.round(maxN / 2)), maxN];
    const unique = [...new Set(legendVals)];
    unique.forEach((n, i) => {
        const r = MIN_R + Math.sqrt(n / maxN) * (MAX_R - MIN_R);
        const cx = lx + 18 + i * 56;
        const cy = ly + 56;
        svg.appendChild(el('circle', {cx, cy, r: Math.round(r*10)/10, fill:'rgba(44,110,166,0.75)', stroke:'#1a4b8c', 'stroke-width':1.5}));
        const lt = el('text', {x:cx, y: cy + r + 12, 'text-anchor':'middle', fill:'#666', 'font-size':9, 'font-family':'sans-serif'});
        lt.textContent = n;
        svg.appendChild(lt);
    });
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
            <div class="kit-id">${participant.kit_id}</div>
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
