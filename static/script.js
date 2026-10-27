// SMOOTH SCROLL FOR NAV LINKS
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// SMOOTH SCROLL FOR TREATMENT BUTTONS
let currentlyOpenId = null;

window.showText = function(id) {
    const allTexts = document.querySelectorAll('.reveal-text');

    // If the same section is already open, close it and reset
    if (currentlyOpenId === id) {
        document.getElementById(id).classList.remove('active');
        currentlyOpenId = null;
        return;
    }

    // Otherwise, close any open section
    allTexts.forEach(text => {
        text.classList.remove('active');
    });

    // Open the new one
    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
        currentlyOpenId = id;
    }
};

// tab Treatment effectiveness animation
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;

    // Hide all tab content by default
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Remove active class and bold from all tab links
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, add "active" class and bold font to the clicked tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// BACK TO TOP BUTTON
// Show/hide the back-to-top button on scroll
window.onscroll = function() {
    var whatPeopleThinkSection = document.getElementById('PublicStatement');
    var backToTopButton = document.getElementById('backToTopButton');

    // Get the position of the "What People Think" section
    var rect = whatPeopleThinkSection.getBoundingClientRect();
    
    // Get scroll position relative to the top of the section
    var sectionTop = window.scrollY + rect.top;

    // Check if the user has scrolled within the "What People Think" section
    if (window.scrollY > sectionTop + 500 && rect.bottom > 0) {
        backToTopButton.style.display = 'block';
    } else {
        backToTopButton.style.display = 'none';
    }
};

// SMOOTH SCROLL to the top of the "Public statement" section when "Back to Top" button is clicked
document.getElementById('backToTopButton').addEventListener('click', function(e) {
    e.preventDefault(); // Prevent the default anchor behavior

    var whatPeopleThinkSection = document.getElementById('PublicStatement');
    var rect = whatPeopleThinkSection.getBoundingClientRect();
    var sectionTop = window.scrollY + rect.top - 125;

    // Use window.scrollTo with behavior 'smooth' to scroll to the top of the section
    window.scrollTo({
        top: sectionTop, // Scroll to the top of the "What People Think" section
        behavior: 'smooth' // Enable smooth scroll
    });
});

// treatments tabs
function openDVTab(evt, tabName) {
    var i, tabcontent, tablinks;

    // Hide all DV-specific tabs
    tabcontent = document.getElementsByClassName("forest-tab");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Remove active state from DV buttons
    tablinks = document.getElementsByClassName("dv-tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    // Show the selected DV tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
}

// FOREST PLOTS
console.log("dvData loaded:", dvData);
const min = -0.4;
const max = 1.2;

const COMPACT_BP = 900; // window-size responsive treatment labels
const compactMq = window.matchMedia(`(max-width: ${COMPACT_BP}px)`);

// --- helpers ---
function applyLabelCompaction(isCompact) {
  document.querySelectorAll('.treatment-label').forEach(el => {
    const full  = el.dataset.fullName;
    const short = el.dataset.shortName;
    if (full && short) el.textContent = isCompact ? short : full;
  });
}

function getStatsGapPx() {
  if (window.matchMedia('(max-width: 500px)').matches) return 10;  // phones
  if (window.matchMedia('(max-width: 768px)').matches) return 14;  // small tablets
  return 30;                                                       // desktop
}

function refreshStatsOffsets() {
  const gap = getStatsGapPx();
  document.querySelectorAll('.bar-stats').forEach(el => {
    const pct = parseFloat(el.dataset.ciRightPct || '0');
    el.style.left = `calc(${pct}% + ${gap}px)`;
  });
}

Object.entries(dvData).forEach(([dv, treatments]) => {
  const plotContainer  = document.getElementById(`plot-container-${dv}`);
  const labelContainer = document.getElementById(`label-container-${dv}`);
  const xAxis          = document.getElementById(`x-axis-${dv}`);

  // Clear previous content
  if (labelContainer) labelContainer.innerHTML = '';
  if (plotContainer)  plotContainer.innerHTML  = '';
  if (xAxis)          xAxis.innerHTML          = '';

  // vertical reference lines
  const ticks = [-0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2];
  ticks.forEach(val => {
    const line = document.createElement('div');
    line.className = val === 0 ? 'zero-line' : 'x-grid-line';
    line.style.left = `${((val - min) / (max - min)) * 100}%`;

    if (val === 0) {
      const label = document.createElement('span');
      label.textContent = 'null control';
      label.className = 'zero-line-label';
      line.appendChild(label);
    }
    plotContainer.appendChild(line);
  });

  if (xAxis) {
    ticks.forEach(val => {
      const tick = document.createElement('div');
      tick.className = 'tick-label';
      tick.style.left = `${((val - min) / (max - min)) * 100}%`;
      tick.textContent = val;
      xAxis.appendChild(tick);
    });

    const title = document.createElement('div');
    title.className = 'axis-title';
    title.style.position = 'absolute';
    title.style.left = '50%';
    title.style.top = '20px';
    title.style.transform = 'translateX(-50%)';
    title.textContent = 'Estimate';
    xAxis.appendChild(title);
  }

  // sort in descending order
  treatments.sort((a, b) => b.effect - a.effect);

  treatments.forEach((t, idx) => {
    // ---- LABEL ----
    const label = document.createElement('a');
    label.className = 'treatment-label';
    // relative link -> works on GitHub Pages project sites (/<repo>/) too
    label.href = `treatment/${Number(t.treatment_id)}.html`;
    label.target = "_blank";

    const fullName  = t.display_name ?? t.name ?? t.treatment_name ?? `Treatment ${idx + 1}`;
    const shortName = t.short_name   ?? t.code ?? `T${idx + 1}`;

    label.dataset.fullName  = fullName;
    label.dataset.shortName = shortName;
    label.title             = fullName;
    label.textContent       = compactMq.matches ? shortName : fullName;

    labelContainer.appendChild(label);

    // ---- PLOT ROW ----
    const barWrapper = document.createElement('div');
    barWrapper.className = 'bar-wrapper';

    const bar = document.createElement('div');
    bar.className = 'effect-bar';

    const rowGuide = document.createElement('div');
    rowGuide.className = 'row-guide';
    bar.appendChild(rowGuide);

    const line = document.createElement('div');
    line.className = 'ci-line';
    line.style.left  = `${((t.ci_low  - min) / (max - min)) * 100}%`;
    line.style.width = `${((t.ci_high - t.ci_low) / (max - min)) * 100}%`;

    const marker = document.createElement('div');
    marker.className = 'effect-marker';
    marker.style.left = `${((t.effect - min) / (max - min)) * 100}%`;

    bar.appendChild(line);
    bar.appendChild(marker);

    // stats
    const stats = document.createElement('span');
    stats.className = 'bar-stats';
    const dRaw = Number(t.cohens_d ?? t.Cohens_d);
    const pRaw = Number(t.adjusted_p_value ?? t.Adjusted_p_value);
    const pText = Number.isFinite(pRaw) ? (pRaw < 0.001 ? "< 0.001" : pRaw.toFixed(3)) : "—";
    const dText = Number.isFinite(dRaw) ? dRaw.toFixed(2) : "—";
    stats.textContent = `d = ${dText}, p adj. = ${pText}`;

    const rightEdgePct = ((t.ci_high - min) / (max - min)) * 100;
    stats.dataset.ciRightPct = rightEdgePct.toFixed(3);
    stats.style.left = `calc(${rightEdgePct}% + ${getStatsGapPx()}px)`; // anchored to CI end

    bar.appendChild(stats);
    barWrapper.appendChild(bar);
    plotContainer.appendChild(barWrapper);
  });
});

applyLabelCompaction(compactMq.matches);
if (compactMq.addEventListener) {
  compactMq.addEventListener('change', e => applyLabelCompaction(e.matches));
} else {
  compactMq.addListener(e => applyLabelCompaction(e.matches)); // Safari
}

window.addEventListener('resize', refreshStatsOffsets);


// MEDIA CAROUSEL
let currentMediaIndex = 0;

const mediaCards = document.querySelectorAll('.media-card');
const mediaDots = document.querySelectorAll('.media-dot');
const mediaPrev = document.querySelector('.media-arrow-left');
const mediaNext = document.querySelector('.media-arrow-right');

let isSliding = false;

function showMediaCard(index, direction = 1) {
    if (!mediaCards.length || index === currentMediaIndex || isSliding) return;

    isSliding = true;

    const oldIndex = currentMediaIndex;
    const newIndex = (index + mediaCards.length) % mediaCards.length;

    const oldCard = mediaCards[oldIndex];
    const newCard = mediaCards[newIndex];

    // Clear previous transition state
    oldCard.classList.remove('exiting', 'entering');
    newCard.classList.remove('active', 'exiting', 'entering');

    // Direction:
    // right arrow: old exits left, new enters from right
    // left arrow: old exits right, new enters from left
    const enterFrom = direction > 0 ? '100%' : '-100%';
    const exitTo = direction > 0 ? '-100%' : '100%';

    // Prepare positions
    newCard.style.setProperty('--start-x', enterFrom);
    oldCard.style.setProperty('--exit-x', exitTo);

    // Put incoming card offscreen immediately, without animation
    newCard.style.transition = 'none';
    newCard.style.opacity = '0';
    newCard.style.transform = `translateX(${enterFrom})`;

    // Force browser to register the offscreen position
    void newCard.offsetWidth;

    // Re-enable transition
    newCard.style.transition = '';
    newCard.style.opacity = '';
    newCard.style.transform = '';

    // Animate both cards
    oldCard.classList.remove('active');
    oldCard.classList.add('exiting');

    newCard.classList.add('entering');

    if (mediaDots[oldIndex]) mediaDots[oldIndex].classList.remove('active');
    if (mediaDots[newIndex]) mediaDots[newIndex].classList.add('active');

    currentMediaIndex = newIndex;

    setTimeout(() => {
        oldCard.classList.remove('exiting');
        newCard.classList.remove('entering');
        newCard.classList.add('active');
        isSliding = false;
    }, 400);
}

mediaPrev.addEventListener('click', function () {
    showMediaCard(currentMediaIndex - 1, -1);
});

mediaNext.addEventListener('click', function () {
    showMediaCard(currentMediaIndex + 1, 1);
});

mediaDots.forEach(dot => {
    dot.addEventListener('click', function () {
        const newIndex = Number(this.dataset.index);
        const direction = newIndex > currentMediaIndex ? 1 : -1;
        showMediaCard(newIndex, direction);
    });
});
