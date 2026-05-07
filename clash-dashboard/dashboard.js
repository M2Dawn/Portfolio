// ========== CLASH DASHBOARD - ENHANCED JAVASCRIPT ==========

// ========== UTILITIES ==========

// JSON Export
function exportToJSON(data) {
  return JSON.stringify(data, null, 2);
}

// CSV Parser
function parseCSV(text) {
  const rows = [];
  const lines = text.split(/\r\n|\n/);
  let i = 0;
  while(i < lines.length && lines[i].trim() === '') i++;
  if(i >= lines.length) return rows;
  const header = parseLine(lines[i++]);
  for(; i<lines.length; i++){
    if(lines[i].trim() === '') continue;
    const cols = parseLine(lines[i]);
    if(cols.length === 0) continue;
    const obj = {};
    for(let j=0;j<header.length;j++) obj[header[j]] = cols[j] ?? '';
    rows.push(obj);
  }
  return rows;
}

function parseLine(line) {
  const res = [];
  let cur = '', inQuotes = false;
  for(let i=0;i<line.length;i++){
    const ch = line[i];
    if(inQuotes){
      if(ch === '"' && line[i+1] === '"'){ cur += '"'; i++; }
      else if(ch === '"') inQuotes = false;
      else cur += ch;
    } else {
      if(ch === ','){ res.push(cur); cur = ''; }
      else if(ch === '"'){ inQuotes = true; }
      else cur += ch;
    }
  }
  res.push(cur);
  return res.map(s => s.trim());
}

// Toast Notification
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ========== STATE ==========
let clashes = [];
let charts = {};
let selectedClash = null;
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 50;
const STORAGE_KEY = 'clash-dashboard-data';

// Data persistence
function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clashes));
  } catch(e) {
    console.warn('LocalStorage save failed:', e);
  }
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch(e) {
    console.warn('LocalStorage load failed:', e);
    return null;
  }
}

// History management for undo/redo
function pushHistory() {
  historyIndex++;
  if(historyIndex < history.length) {
    history = history.slice(0, historyIndex);
  }
  history.push(JSON.parse(JSON.stringify(clashes)));
  if(history.length > MAX_HISTORY) {
    history.shift();
  } else {
    historyIndex = history.length - 1;
  }
  updateHistoryButtons();
}

function undo() {
  if(historyIndex > 0) {
    historyIndex--;
    clashes = JSON.parse(JSON.stringify(history[historyIndex]));
    renderTable();
    updateSummary();
    updateCharts();
    updateHistoryButtons();
    showToast('↶ Undo successful', 'success');
  }
}

function redo() {
  if(historyIndex < history.length - 1) {
    historyIndex++;
    clashes = JSON.parse(JSON.stringify(history[historyIndex]));
    renderTable();
    updateSummary();
    updateCharts();
    updateHistoryButtons();
    showToast('↷ Redo successful', 'success');
  }
}

function updateHistoryButtons() {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  if(undoBtn) undoBtn.disabled = historyIndex <= 0;
  if(redoBtn) redoBtn.disabled = historyIndex >= history.length - 1;
}

// ========== DOM ELEMENTS ==========
const fileInput = document.getElementById('fileInput');
const uploadZone = document.getElementById('uploadZone');
const tbody = document.querySelector('#clashTable tbody');
const search = document.getElementById('search');
const statusFilter = document.getElementById('statusFilter');
const priorityFilter = document.getElementById('priorityFilter');
const modelFilter = document.getElementById('modelFilter');
const detailsCard = document.getElementById('detailsCard');

// ========== DRAG & DROP UPLOAD ==========
uploadZone.addEventListener('click', () => fileInput.click());

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    fileInput.files = files;
    handleFileUpload(files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFileUpload(e.target.files[0]);
  }
});

async function handleFileUpload(file) {
  try {
    // Validate file size (max 10MB)
    if(file.size > 10 * 1024 * 1024) {
      showToast('❌ File too large. Maximum 10MB allowed.', 'error');
      return;
    }
    
    const text = await file.text();
    let newClashes = [];
    
    if(file.name.toLowerCase().endsWith('.json')){
      newClashes = JSON.parse(text);
      if(!Array.isArray(newClashes)) {
        showToast('❌ Invalid JSON format. Expected an array.', 'error');
        return;
      }
    } else {
      newClashes = parseCSV(text);
    }
    
    if(newClashes.length === 0) {
      showToast('⚠️ No data found in file.', 'error');
      return;
    }
    
    // Validate required fields
    const requiredFields = ['ClashID'];
    const hasRequiredFields = newClashes.every(c => 
      requiredFields.every(f => c[f] !== undefined && c[f] !== '')
    );
    
    if(!hasRequiredFields) {
      showToast('❌ Missing required field: ClashID', 'error');
      return;
    }
    
    clashes = newClashes;
    pushHistory();
    saveToLocalStorage();
    
    initModelFilter();
    renderTable();
    updateSummary();
    updateCharts();
    updateTimeline();
    
    showToast(`✅ Loaded ${clashes.length} clashes successfully!`, 'success');
  } catch (error) {
    showToast('❌ Error loading file. Please check format.', 'error');
    console.error(error);
  }
}

// ========== TABS ==========
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    
    // Update active tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Update active content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    
    // Refresh charts when analytics tab is opened
    if (tabName === 'analytics' && clashes.length > 0) {
      setTimeout(() => updateCharts(), 100);
    }
  });
});

// ========== FILTERS ==========
function initModelFilter(){
  const models = new Set();
  const categories = new Set();
  const assignees = new Set();
  
  clashes.forEach(c => { 
    if(c.ModelA) models.add(c.ModelA); 
    if(c.ModelB) models.add(c.ModelB);
    if(c.Category) categories.add(c.Category);
    if(c.AssignedTo) assignees.add(c.AssignedTo);
  });
  
  modelFilter.innerHTML = '<option value="">All Models</option>';
  Array.from(models).sort().forEach(m => {
    const opt = document.createElement('option'); 
    opt.value = m; 
    opt.textContent = m; 
    modelFilter.appendChild(opt);
  });
  
  // Initialize category filter if it exists
  const categoryFilter = document.getElementById('categoryFilter');
  if(categoryFilter) {
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    Array.from(categories).sort().forEach(c => {
      const opt = document.createElement('option'); 
      opt.value = c; 
      opt.textContent = c; 
      categoryFilter.appendChild(opt);
    });
    categoryFilter.addEventListener('change', renderTable);
  }
  
  // Initialize assignee filter if it exists
  const assigneeFilter = document.getElementById('assigneeFilter');
  if(assigneeFilter) {
    assigneeFilter.innerHTML = '<option value="">All Assignees</option>';
    Array.from(assignees).sort().forEach(a => {
      const opt = document.createElement('option'); 
      opt.value = a; 
      opt.textContent = a; 
      assigneeFilter.appendChild(opt);
    });
    assigneeFilter.addEventListener('change', renderTable);
  }
}

search.addEventListener('input', renderTable);
statusFilter.addEventListener('change', renderTable);
priorityFilter.addEventListener('change', renderTable);
modelFilter.addEventListener('change', renderTable);

document.getElementById('clearFilters').addEventListener('click', () => {
  search.value = ''; 
  statusFilter.value = ''; 
  priorityFilter.value = ''; 
  modelFilter.value = '';
  const categoryFilter = document.getElementById('categoryFilter');
  const assigneeFilter = document.getElementById('assigneeFilter');
  if(categoryFilter) categoryFilter.value = '';
  if(assigneeFilter) assigneeFilter.value = '';
  renderTable();
});

// ========== TABLE RENDERING ==========
function renderTable(){
  const q = search.value.trim().toLowerCase();
  tbody.innerHTML = '';
  
  const categoryFilter = document.getElementById('categoryFilter');
  const assigneeFilter = document.getElementById('assigneeFilter');
  
  const filtered = clashes.filter(c => {
    if(statusFilter.value && (c.Status ?? '').toLowerCase() !== statusFilter.value.toLowerCase()) return false;
    if(priorityFilter.value && (c.Priority ?? '').toLowerCase() !== priorityFilter.value.toLowerCase()) return false;
    if(modelFilter.value && !((c.ModelA||'').toLowerCase() === modelFilter.value.toLowerCase() || (c.ModelB||'').toLowerCase() === modelFilter.value.toLowerCase())) return false;
    if(categoryFilter?.value && (c.Category ?? '').toLowerCase() !== categoryFilter.value.toLowerCase()) return false;
    if(assigneeFilter?.value && (c.AssignedTo ?? '').toLowerCase() !== assigneeFilter.value.toLowerCase()) return false;
    if(q && !((c.ClashID||'').toLowerCase().includes(q) || (c.ModelA||'').toLowerCase().includes(q) || (c.ModelB||'').toLowerCase().includes(q) || (c.Notes||'').toLowerCase().includes(q))) return false;
    return true;
  });
  
  filtered.forEach(c => {
    const tr = document.createElement('tr');
    
    const priorityClass = `priority-${(c.Priority||'low').toLowerCase()}`;
    const statusClass = `status-${(c.Status||'open').toLowerCase()}`;
    
    tr.innerHTML = `
      <td>${c.ClashID||''}</td>
      <td>${c.ModelA||''}</td>
      <td>${c.ModelB||''}</td>
      <td>${c.Category||''}</td>
      <td><span class="priority-badge ${priorityClass}">${c.Priority||'Low'}</span></td>
      <td>${c.Location||''}</td>
      <td><span class="status-badge ${statusClass}">${c.Status||'Open'}</span></td>
      <td>${c.AssignedTo||'-'}</td>
    `;
    
    tr.addEventListener('click', (e) => {
      if(!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        document.querySelectorAll('#clashTable tbody tr').forEach(r => r.classList.remove('selected'));
        tr.classList.add('selected');
        showDetails(c);
      }
      updateBulkActionsVisibility();
    });
    
    tbody.appendChild(tr);
  });
  
  updateBulkActionsVisibility();
}

function updateBulkActionsVisibility() {
  const bulkActions = document.getElementById('bulkActions');
  const selected = document.querySelectorAll('#clashTable tbody tr.selected');
  if(bulkActions) {
    bulkActions.style.display = selected.length > 0 ? 'flex' : 'none';
  }
}

// ========== DETAILS PANEL ==========
function showDetails(c){
  selectedClash = c;
  detailsCard.style.display = 'block';
  
  document.getElementById('detailClashId').textContent = c.ClashID || '-';
  document.getElementById('detailModels').textContent = `${c.ModelA||''} ⇄ ${c.ModelB||''}`;
  document.getElementById('detailCategory').textContent = c.Category || '-';
  
  const priorityClass = `priority-${(c.Priority||'low').toLowerCase()}`;
  document.getElementById('detailPriority').innerHTML = `<span class="priority-badge ${priorityClass}">${c.Priority||'Low'}</span>`;
  
  document.getElementById('detailLocation').textContent = c.Location || '-';
  document.getElementById('detailCoords').textContent = `X: ${c.X||'-'}, Y: ${c.Y||'-'}, Z: ${c.Z||'-'}`;
  
  const statusClass = `status-${(c.Status||'open').toLowerCase()}`;
  document.getElementById('detailStatus').innerHTML = `<span class="status-badge ${statusClass}">${c.Status||'Open'}</span>`;
  
  document.getElementById('detailNotes').textContent = c.Notes || 'No notes available';
  
  document.getElementById('assignName').value = c.AssignedTo || '';
  document.getElementById('statusSelect').value = c.Status || 'Open';
  
  detailsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ========== BULK OPERATIONS ==========
function bulkUpdateStatus(newStatus) {
  const selected = document.querySelectorAll('#clashTable tbody tr.selected');
  if(selected.length === 0) {
    showToast('⚠️ Select clashes to update', 'error');
    return;
  }
  
  let count = 0;
  selected.forEach(row => {
    const clashId = row.cells[0].textContent;
    const clash = clashes.find(c => c.ClashID === clashId);
    if(clash) {
      clash.Status = newStatus;
      count++;
    }
  });
  
  pushHistory();
  saveToLocalStorage();
  renderTable();
  updateSummary();
  updateCharts();
  showToast(`✅ Updated ${count} clash${count !== 1 ? 'es' : ''}!`, 'success');
}

function bulkAssign(assignee) {
  const selected = document.querySelectorAll('#clashTable tbody tr.selected');
  if(selected.length === 0) {
    showToast('⚠️ Select clashes to assign', 'error');
    return;
  }
  
  let count = 0;
  selected.forEach(row => {
    const clashId = row.cells[0].textContent;
    const clash = clashes.find(c => c.ClashID === clashId);
    if(clash) {
      clash.AssignedTo = assignee;
      count++;
    }
  });
  
  pushHistory();
  saveToLocalStorage();
  renderTable();
  updateSummary();
  showToast(`✅ Assigned ${count} clash${count !== 1 ? 'es' : ''}!`, 'success');
}

function bulkDelete() {
  const selected = document.querySelectorAll('#clashTable tbody tr.selected');
  if(selected.length === 0) {
    showToast('⚠️ Select clashes to delete', 'error');
    return;
  }
  
  if(!confirm(`Delete ${selected.length} clash${selected.length !== 1 ? 'es' : ''}? This cannot be undone.`)) {
    return;
  }
  
  const clashIds = Array.from(selected).map(row => row.cells[0].textContent);
  clashes = clashes.filter(c => !clashIds.includes(c.ClashID));
  
  pushHistory();
  saveToLocalStorage();
  renderTable();
  updateSummary();
  updateCharts();
  showToast(`✅ Deleted ${clashIds.length} clash${clashIds.length !== 1 ? 'es' : ''}!`, 'success');
}

// Toggle row selection
document.addEventListener('click', (e) => {
  if(e.target.closest('#clashTable tbody tr')) {
    const row = e.target.closest('tr');
    if(e.ctrlKey || e.metaKey) {
      row.classList.toggle('selected');
    } else if(e.shiftKey) {
      // Range selection
      const rows = Array.from(document.querySelectorAll('#clashTable tbody tr'));
      const currentIndex = rows.indexOf(row);
      const lastSelected = document.querySelector('#clashTable tbody tr.selected');
      if(lastSelected) {
        const lastIndex = rows.indexOf(lastSelected);
        const [start, end] = currentIndex < lastIndex ? [currentIndex, lastIndex] : [lastIndex, currentIndex];
        rows.slice(start, end + 1).forEach(r => r.classList.add('selected'));
      }
    } else {
      document.querySelectorAll('#clashTable tbody tr').forEach(r => r.classList.remove('selected'));
      row.classList.add('selected');
    }
  }
});

document.getElementById('saveUpdate').addEventListener('click', () => {
  if (!selectedClash) return;
  
  selectedClash.AssignedTo = document.getElementById('assignName').value.trim();
  selectedClash.Status = document.getElementById('statusSelect').value;
  
  pushHistory();
  saveToLocalStorage();
  
  renderTable();
  updateSummary();
  updateCharts();
  updateTimeline();
  showDetails(selectedClash);
  
  showToast('✅ Clash updated successfully!', 'success');
});

// ========== SUMMARY STATS ==========
function updateSummary(){
  const total = clashes.length;
  const open = clashes.filter(c => (c.Status||'Open').toLowerCase() === 'open').length;
  const assigned = clashes.filter(c => (c.Status||'').toLowerCase() === 'assigned').length;
  const resolved = clashes.filter(c => (c.Status||'').toLowerCase() === 'resolved').length;
  
  document.getElementById('totalClashes').textContent = total;
  document.getElementById('openClashes').textContent = open;
  document.getElementById('assignedClashes').textContent = assigned;
  document.getElementById('resolvedClashes').textContent = resolved;
  
  // Calculate KPIs
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const highPriority = clashes.filter(c => (c.Priority||'').toLowerCase() === 'high').length;
  const unassigned = clashes.filter(c => !c.AssignedTo || c.AssignedTo.trim() === '').length;
  const avgResolutionTime = calculateAvgResolutionTime();
  
  // Update KPI displays if they exist
  const kpiResolution = document.getElementById('kpiResolution');
  const kpiHighPriority = document.getElementById('kpiHighPriority');
  const kpiAvgTime = document.getElementById('kpiAvgTime');
  const kpiUnassigned = document.getElementById('kpiUnassigned');
  
  if(kpiResolution) kpiResolution.textContent = `${resolutionRate}%`;
  if(kpiHighPriority) kpiHighPriority.textContent = highPriority;
  if(kpiAvgTime) kpiAvgTime.textContent = avgResolutionTime;
  if(kpiUnassigned) kpiUnassigned.textContent = unassigned;
}

function calculateAvgResolutionTime() {
  const resolved = clashes.filter(c => (c.Status||'').toLowerCase() === 'resolved');
  if(resolved.length === 0) return 'N/A';
  
  let totalDays = 0;
  resolved.forEach(c => {
    if(c.CreatedAt) {
      const created = new Date(c.CreatedAt);
      const now = new Date();
      const days = Math.round((now - created) / (1000 * 60 * 60 * 24));
      totalDays += days;
    }
  });
  
  const avg = Math.round(totalDays / resolved.length);
  return avg > 0 ? `${avg}d` : 'N/A';
}

// ========== CHARTS ==========
const chartFont = {family:"'Geist','Inter',system-ui,sans-serif"};
const chartGrid = {color:'rgba(255,255,255,0.05)',drawBorder:false};
const chartTick = {color:'#52525B',font:{...chartFont,size:11}};
const chartTooltip = {backgroundColor:'rgba(15,15,17,0.95)',titleFont:{...chartFont,size:13,weight:'600'},bodyFont:{...chartFont,size:12},borderColor:'rgba(255,255,255,0.09)',borderWidth:1,padding:12,cornerRadius:8,displayColors:true,boxPadding:4,usePointStyle:true};
const chartLegend = {position:'bottom',labels:{color:'#A1A1AA',font:{...chartFont,size:11,weight:'500'},padding:16,usePointStyle:true,pointStyleWidth:8}};

function updateCharts() {
  if (clashes.length === 0) return;

  const priorityCounts = {
    High: clashes.filter(c => (c.Priority||'').toLowerCase() === 'high').length,
    Medium: clashes.filter(c => (c.Priority||'').toLowerCase() === 'medium').length,
    Low: clashes.filter(c => (c.Priority||'').toLowerCase() === 'low').length
  };

  if (charts.priority) charts.priority.destroy();
  const pCtx = document.getElementById('priorityChart').getContext('2d');
  charts.priority = new Chart(pCtx, {
    type: 'doughnut',
    data: {
      labels: ['High', 'Medium', 'Low'],
      datasets: [{
        data: [priorityCounts.High, priorityCounts.Medium, priorityCounts.Low],
        backgroundColor: ['rgba(239,68,68,0.85)','rgba(251,191,36,0.85)','rgba(91,141,243,0.85)'],
        hoverBackgroundColor: ['#EF4444','#FBBF24','#5B8DF3'],
        borderWidth: 3,
        borderColor: '#161619',
        hoverBorderColor: '#0F0F11',
        spacing: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: chartLegend,
        tooltip: {...chartTooltip, callbacks:{label:ctx=>{const t=ctx.dataset.data.reduce((a,b)=>a+b,0);const pct=t>0?Math.round(ctx.raw/t*100):0;return ` ${ctx.label}: ${ctx.raw} (${pct}%)`}}}
      },
      animation:{animateRotate:true,duration:800,easing:'easeOutQuart'}
    }
  });

  const statusCounts = {
    Open: clashes.filter(c => (c.Status||'Open').toLowerCase() === 'open').length,
    Assigned: clashes.filter(c => (c.Status||'').toLowerCase() === 'assigned').length,
    Resolved: clashes.filter(c => (c.Status||'').toLowerCase() === 'resolved').length
  };

  if (charts.status) charts.status.destroy();
  const sCtx = document.getElementById('statusChart').getContext('2d');
  const gradOpen = sCtx.createLinearGradient(0,0,0,280); gradOpen.addColorStop(0,'rgba(239,68,68,0.8)'); gradOpen.addColorStop(1,'rgba(239,68,68,0.3)');
  const gradAssign = sCtx.createLinearGradient(0,0,0,280); gradAssign.addColorStop(0,'rgba(251,191,36,0.8)'); gradAssign.addColorStop(1,'rgba(251,191,36,0.3)');
  const gradResolved = sCtx.createLinearGradient(0,0,0,280); gradResolved.addColorStop(0,'rgba(34,197,94,0.8)'); gradResolved.addColorStop(1,'rgba(34,197,94,0.3)');
  charts.status = new Chart(sCtx, {
    type: 'bar',
    data: {
      labels: ['Open', 'Assigned', 'Resolved'],
      datasets: [{
        label: 'Clashes',
        data: [statusCounts.Open, statusCounts.Assigned, statusCounts.Resolved],
        backgroundColor: [gradOpen, gradAssign, gradResolved],
        hoverBackgroundColor: ['#EF4444','#FBBF24','#22C55E'],
        borderWidth: 0,
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.55,
        categoryPercentage: 0.7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {legend:{display:false}, tooltip:chartTooltip},
      scales: {
        y: {beginAtZero:true, ticks:chartTick, grid:chartGrid, border:{display:false}},
        x: {ticks:{...chartTick,color:'#A1A1AA'}, grid:{display:false}, border:{display:false}}
      },
      animation:{duration:700,easing:'easeOutQuart'}
    }
  });

  // Model Chart
  const modelCounts = {};
  clashes.forEach(c => {
    const modelA = c.ModelA || 'Unknown';
    const modelB = c.ModelB || 'Unknown';
    modelCounts[modelA] = (modelCounts[modelA] || 0) + 1;
    modelCounts[modelB] = (modelCounts[modelB] || 0) + 1;
  });
  const topModels = Object.entries(modelCounts).sort((a,b)=>b[1]-a[1]).slice(0,6);

  if (charts.model) charts.model.destroy();
  const mCtx = document.getElementById('modelChart').getContext('2d');
  const gradModel = mCtx.createLinearGradient(0,0,400,0); gradModel.addColorStop(0,'rgba(91,141,243,0.7)'); gradModel.addColorStop(1,'rgba(155,92,246,0.7)');
  charts.model = new Chart(mCtx, {
    type: 'bar',
    data: {
      labels: topModels.map(m=>m[0]),
      datasets: [{
        label: 'Clash Involvement',
        data: topModels.map(m=>m[1]),
        backgroundColor: gradModel,
        hoverBackgroundColor: '#5B8DF3',
        borderWidth: 0,
        borderRadius: 6,
        barPercentage: 0.6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {legend:{display:false}, tooltip:chartTooltip},
      scales: {
        x: {beginAtZero:true, ticks:chartTick, grid:chartGrid, border:{display:false}},
        y: {ticks:{...chartTick,color:'#A1A1AA',font:{...chartFont,size:11}}, grid:{display:false}, border:{display:false}}
      }
    }
  });

  // Trend Chart
  const trendData = generateTrendData(statusCounts);
  if (charts.trend) charts.trend.destroy();
  const tCtx = document.getElementById('trendChart').getContext('2d');
  const gradTrendOpen = tCtx.createLinearGradient(0,0,0,280); gradTrendOpen.addColorStop(0,'rgba(239,68,68,0.2)'); gradTrendOpen.addColorStop(1,'rgba(239,68,68,0)');
  const gradTrendRes = tCtx.createLinearGradient(0,0,0,280); gradTrendRes.addColorStop(0,'rgba(34,197,94,0.2)'); gradTrendRes.addColorStop(1,'rgba(34,197,94,0)');
  charts.trend = new Chart(tCtx, {
    type: 'line',
    data: {
      labels: trendData.map(d=>d.week),
      datasets: [
        {label:'Open',data:trendData.map(d=>d.open),borderColor:'#EF4444',backgroundColor:gradTrendOpen,tension:0.4,fill:true,pointRadius:4,pointBackgroundColor:'#EF4444',pointBorderColor:'#161619',pointBorderWidth:2,pointHoverRadius:6,borderWidth:2.5},
        {label:'Resolved',data:trendData.map(d=>d.resolved),borderColor:'#22C55E',backgroundColor:gradTrendRes,tension:0.4,fill:true,pointRadius:4,pointBackgroundColor:'#22C55E',pointBorderColor:'#161619',pointBorderWidth:2,pointHoverRadius:6,borderWidth:2.5}
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {legend:chartLegend, tooltip:chartTooltip},
      scales: {
        y: {beginAtZero:true, ticks:chartTick, grid:chartGrid, border:{display:false}},
        x: {ticks:{...chartTick,color:'#A1A1AA'}, grid:{display:false}, border:{display:false}}
      },
      interaction:{mode:'index',intersect:false}
    }
  });
}

// ========== TIMELINE ==========
function updateTimeline() {
  const container = document.getElementById('timelineContainer');
  
  if (clashes.length === 0) {
    container.innerHTML = `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div class="timeline-date">No data loaded</div>
          <div class="timeline-title">Upload clash data to view timeline</div>
          <div class="timeline-desc">Timeline will show clash creation and resolution history</div>
        </div>
      </div>
    `;
    return;
  }
  
  // Group clashes by date
  const timeline = [];
  clashes.forEach(c => {
    const date = c.CreatedAt || new Date().toISOString();
    const dateStr = new Date(date).toLocaleDateString();
    
    let entry = timeline.find(t => t.date === dateStr);
    if (!entry) {
      entry = { date: dateStr, clashes: [] };
      timeline.push(entry);
    }
    entry.clashes.push(c);
  });
  
  // Sort by date
  timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Render timeline
  container.innerHTML = timeline.slice(0, 10).map(entry => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-date">${entry.date}</div>
        <div class="timeline-title">${entry.clashes.length} clash${entry.clashes.length > 1 ? 'es' : ''} detected</div>
        <div class="timeline-desc">
          ${entry.clashes.slice(0, 3).map(c => `${c.ClashID}: ${c.ModelA} ⇄ ${c.ModelB}`).join('<br>')}
          ${entry.clashes.length > 3 ? `<br>+${entry.clashes.length - 3} more...` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

// ========== EXPORT FUNCTIONS ==========

// JSON Export
document.getElementById('downloadJson')?.addEventListener('click', () => {
  if (clashes.length === 0) {
    showToast('⚠️ No data to export', 'error');
    return;
  }
  
  const json = exportToJSON(clashes);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clash-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  
  showToast('✅ JSON exported successfully!', 'success');
});

// CSV Export
document.getElementById('downloadCsv').addEventListener('click', () => {
  if (clashes.length === 0) {
    showToast('⚠️ No data to export', 'error');
    return;
  }
  
  const rows = [];
  rows.push(['ClashID','ModelA','ModelB','Category','Priority','Location','X','Y','Z','Status','AssignedTo','Notes','CreatedAt']);
  clashes.forEach(c => rows.push([
    c.ClashID, c.ModelA, c.ModelB, c.Category, c.Priority, c.Location,
    c.X, c.Y, c.Z, c.Status, c.AssignedTo, c.Notes||'', c.CreatedAt||''
  ]));
  
  const csv = rows.map(r => r.map(cell => `"${(''+cell).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clash-report-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  
  showToast('✅ CSV exported successfully!', 'success');
});

// Excel Export
document.getElementById('downloadExcel').addEventListener('click', () => {
  if (clashes.length === 0) {
    showToast('⚠️ No data to export', 'error');
    return;
  }
  
  const ws_data = [
    ['ClashID','ModelA','ModelB','Category','Priority','Location','X','Y','Z','Status','AssignedTo','Notes','CreatedAt'],
    ...clashes.map(c => [
      c.ClashID, c.ModelA, c.ModelB, c.Category, c.Priority, c.Location,
      c.X, c.Y, c.Z, c.Status, c.AssignedTo, c.Notes||'', c.CreatedAt||''
    ])
  ];
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, 'Clashes');
  XLSX.writeFile(wb, `clash-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  
  showToast('✅ Excel exported successfully!', 'success');
});

// Print PDF
document.getElementById('printReport').addEventListener('click', () => {
  if (clashes.length === 0) {
    showToast('⚠️ No data to print', 'error');
    return;
  }
  
  const printWindow = window.open('', '_blank');
  const style = `<style>
    body{font-family:Inter,Arial;color:#111;background:#fff;padding:20px;max-width:1200px;margin:0 auto}
    h1{color:#3b82f6;border-bottom:3px solid #3b82f6;padding-bottom:10px}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin:20px 0}
    .stat-box{background:#f3f4f6;padding:15px;border-radius:8px;text-align:center}
    .stat-value{font-size:32px;font-weight:bold;color:#3b82f6}
    .stat-label{font-size:14px;color:#6b7280;margin-top:5px}
    table{width:100%;border-collapse:collapse;margin-top:20px}
    th,td{border:1px solid #ddd;padding:10px;text-align:left;font-size:12px}
    th{background:#3b82f6;color:white}
    .priority-high{color:#ef4444;font-weight:bold}
    .priority-medium{color:#fbbf24;font-weight:bold}
    .priority-low{color:#60a5fa;font-weight:bold}
  </style>`;
  
  const open = clashes.filter(c => (c.Status||'Open').toLowerCase() === 'open').length;
  const assigned = clashes.filter(c => (c.Status||'').toLowerCase() === 'assigned').length;
  const resolved = clashes.filter(c => (c.Status||'').toLowerCase() === 'resolved').length;
  
  let html = `<html><head><title>Clash Detection Report</title>${style}</head><body>`;
  html += `<h1>Clash Detection Report</h1>`;
  html += `<p>Generated on: ${new Date().toLocaleString()}</p>`;
  html += `<div class="stats">`;
  html += `<div class="stat-box"><div class="stat-value">${clashes.length}</div><div class="stat-label">Total Clashes</div></div>`;
  html += `<div class="stat-box"><div class="stat-value">${open}</div><div class="stat-label">Open</div></div>`;
  html += `<div class="stat-box"><div class="stat-value">${assigned}</div><div class="stat-label">Assigned</div></div>`;
  html += `<div class="stat-box"><div class="stat-value">${resolved}</div><div class="stat-label">Resolved</div></div>`;
  html += `</div>`;
  html += '<table><thead><tr><th>ClashID</th><th>Models</th><th>Priority</th><th>Location</th><th>Status</th><th>Assigned To</th></tr></thead><tbody>';
  
  clashes.forEach(c => {
    const priorityClass = `priority-${(c.Priority||'low').toLowerCase()}`;
    html += `<tr>
      <td>${c.ClashID||''}</td>
      <td>${(c.ModelA||'')} ⇄ ${(c.ModelB||'')}</td>
      <td class="${priorityClass}">${c.Priority||'Low'}</td>
      <td>${c.Location||''}</td>
      <td>${c.Status||'Open'}</td>
      <td>${c.AssignedTo||'-'}</td>
    </tr>`;
  });
  
  html += '</tbody></table></body></html>';
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 500);
});

// ========== SAMPLE DATA ==========
const sampleCsv = `ClashID,ModelA,ModelB,Category,Priority,Location,X,Y,Z,Status,AssignedTo,Notes,CreatedAt
C-0001,Structure.rvt,MEP-Mechanical.rvt,Structure-MEP,High,Level 02 — Zone A,12.3,45.6,3.5,Open,,W24x68 beam clashes with 600mm supply duct at gridline C-4,2025-01-15T08:00:00Z
C-0002,Architectural.rvt,MEP-Plumbing.rvt,Arch-MEP,Medium,Level 01 — Lobby,5.1,22.0,0.8,Assigned,Ahmed Hassan,100mm waste pipe penetrates through rated corridor wall,2025-01-16T12:30:00Z
C-0003,Structure.rvt,Architectural.rvt,Structure-Arch,Low,Level 03 — Office Wing,18.7,33.2,7.2,Resolved,Sarah Nabil,Column C-7 offset 50mm from architectural grid — adjusted,2025-01-17T09:15:00Z
C-0004,MEP-Electrical.rvt,MEP-Mechanical.rvt,MEP-MEP,High,Level 02 — Mechanical Room,14.5,48.9,3.8,Open,,Main cable tray 300mm conflicts with chilled water riser,2025-01-18T14:20:00Z
C-0005,Structure.rvt,MEP-Mechanical.rvt,Structure-MEP,Medium,Level 04 — West Tower,22.1,55.3,10.5,Assigned,John Mansour,Transfer beam depth blocks AHU duct routing,2025-01-19T10:45:00Z
C-0006,MEP-Plumbing.rvt,MEP-Electrical.rvt,MEP-MEP,High,Level B1 — Parking,8.4,12.1,-3.2,Open,,Storm drain crosses electrical bus duct at junction J-12,2025-01-20T07:30:00Z
C-0007,Architectural.rvt,Structure.rvt,Arch-Structure,Medium,Level 05 — Core,30.0,40.5,14.0,Assigned,Fatima Eldin,Shear wall thickness reduced — curtain wall bracket conflict,2025-01-21T11:00:00Z
C-0008,MEP-Mechanical.rvt,MEP-FireProtection.rvt,MEP-MEP,High,Level 02 — Corridor,16.8,38.2,3.3,Assigned,Omar Khalil,Supply diffuser location overlaps with sprinkler head SH-204,2025-01-22T09:00:00Z
C-0009,Structure.rvt,MEP-Plumbing.rvt,Structure-MEP,Low,Level 03 — Restrooms,25.3,18.7,7.5,Resolved,Ahmed Hassan,Slab penetration for soil stack approved by structural,2025-01-22T14:00:00Z
C-0010,Architectural.rvt,MEP-Mechanical.rvt,Arch-MEP,Medium,Level 01 — Main Entrance,3.2,8.9,0.5,Open,,Exposed ceiling zone — duct routing visible below 2700mm,2025-01-23T08:30:00Z
C-0011,MEP-Electrical.rvt,Structure.rvt,Structure-MEP,High,Level 06 — Roof,35.0,62.0,18.5,Open,,Lightning protection downconductor clashes with parapet steel,2025-01-24T10:15:00Z
C-0012,MEP-FireProtection.rvt,Structure.rvt,Structure-MEP,Medium,Level 02 — Zone B,19.5,52.4,3.8,Assigned,Sarah Nabil,Sprinkler branch line passes through W18x35 web,2025-01-24T13:45:00Z
C-0013,Architectural.rvt,MEP-Plumbing.rvt,Arch-MEP,Low,Level 01 — Kitchen,7.8,28.3,1.2,Resolved,Omar Khalil,Grease trap location shifted 400mm per architect approval,2025-01-25T09:00:00Z
C-0014,MEP-Mechanical.rvt,MEP-Plumbing.rvt,MEP-MEP,High,Level 03 — Shaft,20.0,30.0,7.0,Open,,FCU condensate drain crosses hot water supply in shaft S-3,2025-01-26T07:45:00Z
C-0015,Structure.rvt,Architectural.rvt,Arch-Structure,Medium,Level 04 — Balcony,28.5,60.8,11.2,Assigned,Fatima Eldin,Slab edge profile differs from architectural soffit detail,2025-01-26T15:30:00Z
C-0016,MEP-Electrical.rvt,Architectural.rvt,Arch-MEP,Low,Level 01 — Reception,4.0,15.5,0.9,Resolved,John Mansour,DB panel location moved to avoid feature wall,2025-01-27T10:00:00Z
C-0017,MEP-Mechanical.rvt,Structure.rvt,Structure-MEP,High,Level B1 — Plant Room,10.2,5.3,-3.0,Assigned,Ahmed Hassan,Chiller pipe 200mm dia hard-clashes with foundation beam,2025-01-28T08:15:00Z
C-0018,MEP-FireProtection.rvt,Architectural.rvt,Arch-MEP,Medium,Level 05 — Open Plan,32.0,45.0,14.5,Open,,Sprinkler heads conflict with suspended ceiling grid layout,2025-01-28T14:00:00Z
C-0019,Structure.rvt,MEP-Electrical.rvt,Structure-MEP,Low,Level 02 — Zone C,17.0,58.0,3.6,Resolved,Sarah Nabil,Conduit rerouted around post-tension tendon profile,2025-01-29T09:30:00Z
C-0020,MEP-Mechanical.rvt,Architectural.rvt,Arch-MEP,High,Level 03 — Conference,22.8,35.1,7.8,Open,,Return air grille position conflicts with AV screen recess,2025-01-30T11:00:00Z`;

// Load sample data on demand
function loadSampleData() {
  clashes = parseCSV(sampleCsv);
  pushHistory();
  saveToLocalStorage();
  initModelFilter();
  renderTable();
  updateSummary();
  updateCharts();
  updateTimeline();
  showToast('✅ 20 sample clashes loaded — Al Noor Tower Phase 2', 'success');
}

// Add load sample data button listener
const loadSampleBtn = document.getElementById('loadSampleBtn');
if (loadSampleBtn) {
  loadSampleBtn.addEventListener('click', loadSampleData);
}

// Undo/Redo buttons
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
if(undoBtn) undoBtn.addEventListener('click', undo);
if(redoBtn) redoBtn.addEventListener('click', redo);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Z: Undo
  if((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    undo();
  }
  // Ctrl/Cmd + Shift + Z: Redo
  if((e.ctrlKey || e.metaKey) && (e.key === 'z' && e.shiftKey || e.key === 'y')) {
    e.preventDefault();
    redo();
  }
  // Ctrl/Cmd + S: Save (export)
  if((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    document.getElementById('downloadCsv')?.click();
  }
  // Delete: Bulk delete selected
  if(e.key === 'Delete') {
    const selected = document.querySelectorAll('#clashTable tbody tr.selected');
    if(selected.length > 0) {
      e.preventDefault();
      bulkDelete();
    }
  }
});

// Helper function to generate trend data from clash history
function generateTrendData(statusCounts) {
  // Calculate trend based on priority distribution
  const highCount = clashes.filter(c => (c.Priority||'').toLowerCase() === 'high').length;
  const mediumCount = clashes.filter(c => (c.Priority||'').toLowerCase() === 'medium').length;
  const lowCount = clashes.filter(c => (c.Priority||'').toLowerCase() === 'low').length;
  
  const totalPriority = highCount + mediumCount + lowCount;
  const avgResolutionRate = totalPriority > 0 ? Math.round((statusCounts.Resolved / totalPriority) * 100) : 0;
  
  return [
    { week: 'High Priority', open: highCount, resolved: Math.round(highCount * avgResolutionRate / 100) },
    { week: 'Medium Priority', open: mediumCount, resolved: Math.round(mediumCount * avgResolutionRate / 100) },
    { week: 'Low Priority', open: lowCount, resolved: Math.round(lowCount * avgResolutionRate / 100) },
    { week: 'Overall', open: statusCounts.Open, resolved: statusCounts.Resolved }
  ];
}

// Initialize dashboard on page load
window.addEventListener('load', () => {
  // Clear stale sample data from previous version
  const dataVersion = localStorage.getItem('clash-dashboard-version');
  if(dataVersion !== '2') {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem('clash-dashboard-version', '2');
  }
  const savedData = loadFromLocalStorage();
  if(savedData && savedData.length > 0) {
    clashes = savedData;
    pushHistory();
    initModelFilter();
    renderTable();
    updateSummary();
    updateCharts();
    updateTimeline();
    showToast('📂 Previous data restored!', 'success');
  }
  updateHistoryButtons();
});

console.log('✨ Clash Dashboard Enhanced - Professional Edition Ready!');
