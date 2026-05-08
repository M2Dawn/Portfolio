// ========== BIM MODEL HEALTH DASHBOARD — JS ENGINE ==========

// ===== UTILITIES =====
function showToast(msg, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 50);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

// ===== STATE =====
let auditData = null;
let charts = {};

// ===== CHART DEFAULTS =====
Chart.defaults.color = '#A1A1AA';
Chart.defaults.font.family = "'Geist','Inter',system-ui,sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyleWidth = 8;
Chart.defaults.plugins.legend.labels.boxHeight = 6;

// ===== TABS =====
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// ===== UPLOAD =====
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault(); uploadZone.classList.remove('drag-over');
  if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', e => { if (e.target.files.length > 0) handleFile(e.target.files[0]); });

async function handleFile(file) {
  try {
    const text = await file.text();
    auditData = JSON.parse(text);
    renderAll();
    showToast('✅ Model audit data loaded!');
  } catch (e) { showToast('❌ Invalid file format', 'error'); console.error(e); }
}

// ===== ISSUE FILTERS =====
document.querySelectorAll('.issue-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.issue-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderIssuesTable(btn.dataset.severity);
  });
});

// ===== RENDER =====
function renderAll() {
  if (!auditData) return;
  renderKPIs();
  renderScoreRing();
  renderRadarChart();
  renderSeverityChart();
  renderDisciplineChart();
  renderCategoryBarChart();
  renderCategoryCards();
  renderIssuesTable('all');
}

function renderKPIs() {
  const d = auditData;
  document.getElementById('scoreValue').textContent = d.overallScore;
  const gradeEl = document.getElementById('scoreGrade');
  if (d.overallScore >= 85) { gradeEl.textContent = 'GRADE A — EXCELLENT'; gradeEl.className = 'score-grade grade-a'; }
  else if (d.overallScore >= 65) { gradeEl.textContent = 'GRADE B — GOOD'; gradeEl.className = 'score-grade grade-b'; }
  else { gradeEl.textContent = 'GRADE C — NEEDS WORK'; gradeEl.className = 'score-grade grade-c'; }

  document.getElementById('totalElements').textContent = d.totalElements.toLocaleString();
  document.getElementById('totalIssues').textContent = d.issues.length;
  const critical = d.issues.filter(i => i.severity === 'Critical').length;
  const warnings = d.issues.filter(i => i.severity === 'Warning').length;
  const infos = d.issues.filter(i => i.severity === 'Info').length;
  document.getElementById('criticalCount').textContent = `${critical} critical`;
  document.getElementById('warningCount').textContent = warnings;
  document.getElementById('infoCount').textContent = `${infos} informational`;
  document.getElementById('complianceRate').textContent = d.complianceRate + '%';

  document.getElementById('issuesBar').style.width = Math.min(d.issues.length / 50 * 100, 100) + '%';
  document.getElementById('complianceBar').style.width = d.complianceRate + '%';
  document.getElementById('warningsBar').style.width = Math.min(warnings / 20 * 100, 100) + '%';
  document.getElementById('issuesCountBadge').textContent = d.issues.length;
}

function renderScoreRing() {
  if (charts.ring) charts.ring.destroy();
  const score = auditData.overallScore;
  const color = score >= 85 ? '#22C55E' : score >= 65 ? '#FBBF24' : '#EF4444';
  charts.ring = new Chart(document.getElementById('scoreRingChart'), {
    type: 'doughnut',
    data: {
      datasets: [{ data: [score, 100 - score], backgroundColor: [color, 'rgba(255,255,255,0.05)'], borderWidth: 0, borderRadius: 8 }]
    },
    options: { cutout: '80%', responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
  });
}

function renderRadarChart() {
  if (charts.radar) charts.radar.destroy();
  const cats = auditData.categories;
  charts.radar = new Chart(document.getElementById('radarChart'), {
    type: 'radar',
    data: {
      labels: cats.map(c => c.name),
      datasets: [{
        label: 'Score',
        data: cats.map(c => c.score),
        borderColor: '#5B8DF3',
        backgroundColor: 'rgba(91,141,243,0.12)',
        borderWidth: 2,
        pointBackgroundColor: '#5B8DF3',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true, max: 100,
          grid: { color: 'rgba(255,255,255,0.06)' },
          angleLines: { color: 'rgba(255,255,255,0.06)' },
          pointLabels: { font: { size: 10, family: "'Geist Mono',monospace" }, color: '#A1A1AA' },
          ticks: { display: false }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function renderSeverityChart() {
  if (charts.severity) charts.severity.destroy();
  const issues = auditData.issues;
  const critical = issues.filter(i => i.severity === 'Critical').length;
  const warning = issues.filter(i => i.severity === 'Warning').length;
  const info = issues.filter(i => i.severity === 'Info').length;
  charts.severity = new Chart(document.getElementById('severityChart'), {
    type: 'doughnut',
    data: {
      labels: ['Critical', 'Warning', 'Info'],
      datasets: [{ data: [critical, warning, info], backgroundColor: ['#EF4444', '#FBBF24', '#06B6D4'], borderWidth: 0, borderRadius: 4, spacing: 3 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '55%',
      plugins: {
        legend: { position: 'bottom', labels: { padding: 16 } },
        tooltip: {
          backgroundColor: '#161619', borderColor: 'rgba(255,255,255,0.09)', borderWidth: 1,
          titleFont: { family: "'Geist',sans-serif", weight: 600 },
          bodyFont: { family: "'Geist Mono',monospace" },
          padding: 12, cornerRadius: 8
        }
      }
    }
  });
}

function renderDisciplineChart() {
  if (charts.discipline) charts.discipline.destroy();
  const discMap = {};
  auditData.issues.forEach(i => { discMap[i.discipline] = (discMap[i.discipline] || 0) + 1; });
  const labels = Object.keys(discMap).sort((a, b) => discMap[b] - discMap[a]);
  const data = labels.map(l => discMap[l]);
  const colors = ['#5B8DF3', '#9B5CF6', '#EF4444', '#22C55E', '#FBBF24', '#06B6D4'];
  charts.discipline = new Chart(document.getElementById('disciplineChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderWidth: 0, borderRadius: 6, barPercentage: 0.6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false } },
        y: { grid: { display: false }, border: { display: false }, ticks: { font: { family: "'Geist Mono',monospace", size: 10 } } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function renderCategoryBarChart() {
  if (charts.catBar) charts.catBar.destroy();
  const cats = auditData.categories;
  charts.catBar = new Chart(document.getElementById('categoryBar'), {
    type: 'bar',
    data: {
      labels: cats.map(c => c.name),
      datasets: [{
        data: cats.map(c => c.score),
        backgroundColor: cats.map(c => c.score >= 85 ? 'rgba(34,197,94,0.7)' : c.score >= 65 ? 'rgba(251,191,36,0.7)' : 'rgba(239,68,68,0.7)'),
        borderWidth: 0, borderRadius: 6, barPercentage: 0.55
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false } },
        x: { grid: { display: false }, border: { display: false }, ticks: { font: { family: "'Geist Mono',monospace", size: 9 }, maxRotation: 45 } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function renderCategoryCards() {
  const grid = document.getElementById('catGrid');
  grid.innerHTML = auditData.categories.map(c => {
    const color = c.score >= 85 ? 'var(--green)' : c.score >= 65 ? 'var(--amber)' : 'var(--red)';
    const icons = { 'Naming Conventions': '🏷️', 'Parameter Completeness': '📋', 'Element Placement': '📐', 'Room & Space': '🚪', 'Shared Coordinates': '🗺️', 'View Organization': '👁️', 'Family Standards': '🧱', 'Detailing': '✏️' };
    return `<div class="cat-card">
      <div class="cat-card-header">
        <span class="cat-card-icon">${icons[c.name] || '📊'}</span>
        <span class="cat-card-score" style="color:${color}">${c.score}</span>
      </div>
      <div class="cat-card-name">${c.name}</div>
      <div class="cat-card-desc">${c.description}</div>
      <div class="cat-card-bar"><div class="cat-card-bar-fill" style="width:${c.score}%;background:${color}"></div></div>
    </div>`;
  }).join('');
}

function renderIssuesTable(severity) {
  const tbody = document.getElementById('issuesTableBody');
  const filtered = severity === 'all' ? auditData.issues : auditData.issues.filter(i => i.severity === severity);
  tbody.innerHTML = filtered.map(i => {
    const cls = i.severity === 'Critical' ? 'sev-critical' : i.severity === 'Warning' ? 'sev-warning' : 'sev-info';
    return `<tr>
      <td><span class="sev-badge ${cls}">● ${i.severity}</span></td>
      <td><span class="cat-badge">${i.category}</span></td>
      <td style="font-family:var(--mono);color:var(--accent)">${i.element}</td>
      <td>${i.description}</td>
      <td style="font-family:var(--mono);color:var(--text-3)">${i.discipline}</td>
    </tr>`;
  }).join('');
}

// ===== EXPORT =====
document.getElementById('exportReport').addEventListener('click', () => {
  if (!auditData) { showToast('⚠️ No data to export', 'error'); return; }
  const report = {
    generatedAt: new Date().toISOString(),
    project: auditData.projectName,
    overallScore: auditData.overallScore,
    totalElements: auditData.totalElements,
    complianceRate: auditData.complianceRate,
    categories: auditData.categories,
    issuesSummary: {
      total: auditData.issues.length,
      critical: auditData.issues.filter(i => i.severity === 'Critical').length,
      warning: auditData.issues.filter(i => i.severity === 'Warning').length,
      info: auditData.issues.filter(i => i.severity === 'Info').length
    },
    issues: auditData.issues
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `model-health-report-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  showToast('✅ Report exported!');
});

// ===== SAMPLE DATA =====
const sampleData = {
  projectName: "Al Noor Tower — Phase 2",
  modelVersion: "R2026 Central Model v47",
  auditDate: "2026-01-28",
  overallScore: 74,
  totalElements: 14832,
  complianceRate: 81,
  categories: [
    { name: "Naming Conventions", score: 88, description: "Element and view naming follows BEP naming matrix" },
    { name: "Parameter Completeness", score: 62, description: "Required shared parameters populated across families" },
    { name: "Element Placement", score: 79, description: "Elements placed on correct worksets and levels" },
    { name: "Room & Space", score: 71, description: "Rooms bounded, areas calculated, MEP spaces assigned" },
    { name: "Shared Coordinates", score: 92, description: "Project base point and survey point alignment" },
    { name: "View Organization", score: 85, description: "Views named, grouped in browser, and templates applied" },
    { name: "Family Standards", score: 58, description: "Families use correct categories, subcategories, and nesting" },
    { name: "Detailing", score: 67, description: "Detail items, annotations, and dimensions conform to standards" }
  ],
  issues: [
    { severity: "Critical", category: "Family Standards", element: "Generic Model: GM_Placeholder_01", description: "Family uses incorrect category — should be 'Specialty Equipment' per BEP", discipline: "Architectural" },
    { severity: "Critical", category: "Parameter Completeness", element: "Wall: CW-102 Curtain Wall", description: "Fire Rating parameter empty — required for all exterior assemblies", discipline: "Architectural" },
    { severity: "Critical", category: "Element Placement", element: "Structural Column: 450x450 RC", description: "Column extends below Level 00 by 2400mm — check foundation coordination", discipline: "Structural" },
    { severity: "Critical", category: "Room & Space", element: "Room: Level 02 — Corridor", description: "Room area = 0 m² — room is unbounded (missing boundary walls)", discipline: "Architectural" },
    { severity: "Critical", category: "Family Standards", element: "Mech Equipment: AHU-03", description: "Nested family contains imported DWG geometry — causes file bloat", discipline: "MEP" },
    { severity: "Warning", category: "Naming Conventions", element: "View: 'Copy of Level 1'", description: "View name does not match BEP naming convention: XX-ZONE-TYPE-NUM", discipline: "General" },
    { severity: "Warning", category: "Naming Conventions", element: "Sheet: S-000 Unnamed", description: "Sheet has no title — all sheets must have project-standard titles", discipline: "Structural" },
    { severity: "Warning", category: "Parameter Completeness", element: "Door: DR-201 Single Leaf", description: "Acoustic rating parameter empty — required for all doors adjacent to meeting rooms", discipline: "Architectural" },
    { severity: "Warning", category: "Parameter Completeness", element: "Window: WN-105 Fixed", description: "U-value parameter empty — required for energy model", discipline: "Architectural" },
    { severity: "Warning", category: "Element Placement", element: "Duct: Supply Air Run 04", description: "Duct routed through structural beam at Grid C-7 — clash potential", discipline: "MEP" },
    { severity: "Warning", category: "Element Placement", element: "Pipe: CW Riser 02", description: "Pipe placed on wrong workset ('Arch Internal' instead of 'MEP Plumbing')", discipline: "MEP" },
    { severity: "Warning", category: "Room & Space", element: "MEP Space: Level 03 — Open Plan", description: "Space has no associated HVAC zone — will cause energy calc errors", discipline: "MEP" },
    { severity: "Warning", category: "Detailing", element: "Section: Building Section A-A", description: "Section head uses non-standard symbol — replace with project template symbol", discipline: "Architectural" },
    { severity: "Warning", category: "Detailing", element: "Dimension: Level 02 Plan", description: "12 witness lines reference deleted elements — dimensions show <N/A>", discipline: "Architectural" },
    { severity: "Warning", category: "View Organization", element: "View: '3D — Working View'", description: "Working view not placed in 'WIP' browser folder — clutters deliverable views", discipline: "General" },
    { severity: "Warning", category: "Family Standards", element: "Casework: Kitchen Island v3", description: "Family file size 18.4 MB — exceeds 5 MB threshold, likely contains imported geometry", discipline: "Architectural" },
    { severity: "Info", category: "Shared Coordinates", element: "Project Base Point", description: "PBP offset from Survey Point by 12.4m E, 8.2m N — verify with survey consultant", discipline: "General" },
    { severity: "Info", category: "View Organization", element: "Legend: Door Schedule Legend", description: "Legend not referenced on any sheet — consider adding to A-501", discipline: "Architectural" },
    { severity: "Info", category: "Naming Conventions", element: "Workset: 'New Workset 1'", description: "Default workset name detected — rename per BEP workset matrix", discipline: "General" },
    { severity: "Info", category: "Element Placement", element: "Grids: Grid A — Grid K", description: "Grid extents not uniform — Grid D extends 4m beyond others on Level 00", discipline: "Structural" },
    { severity: "Info", category: "Parameter Completeness", element: "Ceiling: ACT 600x600", description: "NRC (Noise Reduction Coefficient) parameter empty — optional but recommended", discipline: "Architectural" },
    { severity: "Info", category: "Room & Space", element: "Room: Level 01 — Storage 04", description: "Room has no department tag — tagging recommended for FM handover", discipline: "Architectural" },
    { severity: "Info", category: "Detailing", element: "Tag: Wall Tag Type A", description: "Tag family shows 'Type Mark' which is empty for 3 wall types", discipline: "Architectural" },
    { severity: "Info", category: "Family Standards", element: "Generic Annotation: GA_TitleBlock_v2", description: "Annotation family has 4 unused label parameters — clean up for file hygiene", discipline: "General" }
  ]
};

function loadSample() {
  auditData = JSON.parse(JSON.stringify(sampleData));
  renderAll();
  showToast('✅ Al Noor Tower Phase 2 — Model audit loaded (14,832 elements)', 'success');
}

document.getElementById('loadSampleBtn').addEventListener('click', loadSample);

// ===== INIT =====
window.addEventListener('load', () => {
  console.log('🏥 Model Health Dashboard — Professional Edition Ready!');
});
