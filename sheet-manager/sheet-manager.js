// ========== SHEET SET MANAGER — JAVASCRIPT ENGINE ==========

// ========== UTILITIES ==========
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
let sheets = [];
let selectedSheet = null;
let printQueue = [];
const STORAGE_KEY = 'sheet-manager-data';

function saveToLocalStorage() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets)); } catch(e) {}
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch(e) { return null; }
}

// ========== DOM ==========
const fileInput = document.getElementById('fileInput');
const uploadZone = document.getElementById('uploadZone');
const tbody = document.querySelector('#sheetTable tbody');
const search = document.getElementById('search');
const statusFilter = document.getElementById('statusFilter');
const disciplineFilter = document.getElementById('disciplineFilter');
const revisionFilter = document.getElementById('revisionFilter');
const detailsCard = document.getElementById('detailsCard');

// ========== UPLOAD ==========
uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => { uploadZone.classList.remove('drag-over'); });
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  if (e.dataTransfer.files.length > 0) {
    fileInput.files = e.dataTransfer.files;
    handleFileUpload(e.dataTransfer.files[0]);
  }
});
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) handleFileUpload(e.target.files[0]);
});

async function handleFileUpload(file) {
  try {
    if(file.size > 10 * 1024 * 1024) {
      showToast('❌ File too large. Maximum 10MB.', 'error');
      return;
    }
    const text = await file.text();
    let newSheets = [];
    if(file.name.toLowerCase().endsWith('.json')){
      newSheets = JSON.parse(text);
      if(!Array.isArray(newSheets)) { showToast('❌ Invalid JSON format.', 'error'); return; }
    } else {
      newSheets = parseCSV(text);
    }
    if(newSheets.length === 0) { showToast('⚠️ No data found.', 'error'); return; }
    sheets = newSheets;
    saveToLocalStorage();
    initFilters();
    renderTable();
    updateSummary();
    updatePrintSets();
    updateRevisions();
    showToast(`✅ Loaded ${sheets.length} sheets successfully!`, 'success');
  } catch (error) {
    showToast('❌ Error loading file.', 'error');
    console.error(error);
  }
}

// ========== TABS ==========
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// ========== FILTERS ==========
function initFilters(){
  const disciplines = new Set();
  const revisions = new Set();
  sheets.forEach(s => {
    if(s.Discipline) disciplines.add(s.Discipline);
    if(s.Revision) revisions.add(s.Revision);
  });
  disciplineFilter.innerHTML = '<option value="">All Disciplines</option>';
  Array.from(disciplines).sort().forEach(d => {
    const opt = document.createElement('option'); opt.value = d; opt.textContent = d;
    disciplineFilter.appendChild(opt);
  });
  revisionFilter.innerHTML = '<option value="">All Revisions</option>';
  Array.from(revisions).sort().forEach(r => {
    const opt = document.createElement('option'); opt.value = r; opt.textContent = r;
    revisionFilter.appendChild(opt);
  });
}

search.addEventListener('input', renderTable);
statusFilter.addEventListener('change', renderTable);
disciplineFilter.addEventListener('change', renderTable);
revisionFilter.addEventListener('change', renderTable);
document.getElementById('clearFilters').addEventListener('click', () => {
  search.value = ''; statusFilter.value = ''; disciplineFilter.value = ''; revisionFilter.value = '';
  renderTable();
});

// ========== TABLE ==========
function renderTable(){
  const q = search.value.trim().toLowerCase();
  tbody.innerHTML = '';
  const filtered = sheets.filter(s => {
    if(statusFilter.value && (s.Status||'').toLowerCase() !== statusFilter.value.toLowerCase()) return false;
    if(disciplineFilter.value && (s.Discipline||'') !== disciplineFilter.value) return false;
    if(revisionFilter.value && (s.Revision||'') !== revisionFilter.value) return false;
    if(q && !((s.SheetNumber||'').toLowerCase().includes(q) || (s.SheetName||'').toLowerCase().includes(q) || (s.Discipline||'').toLowerCase().includes(q))) return false;
    return true;
  });
  filtered.forEach(s => {
    const tr = document.createElement('tr');
    const discClass = getDisciplineClass(s.Discipline);
    const statusClass = getStatusClass(s.Status);
    tr.innerHTML = `
      <td><span style="font-family:var(--mono);font-weight:600;color:var(--accent)">${s.SheetNumber||''}</span></td>
      <td>${s.SheetName||''}</td>
      <td><span class="discipline-badge ${discClass}">${s.Discipline||'—'}</span></td>
      <td><span class="rev-badge">${s.Revision||'—'}</span></td>
      <td><span class="status-badge ${statusClass}">${s.Status||'Draft'}</span></td>
      <td style="font-family:var(--mono);color:var(--text-2)">${s.Scale||'—'}</td>
      <td>${s.DrawnBy||'—'}</td>
      <td style="font-family:var(--mono);color:var(--text-3)">${s.Date||'—'}</td>
    `;
    tr.addEventListener('click', () => {
      document.querySelectorAll('#sheetTable tbody tr').forEach(r => r.classList.remove('selected'));
      tr.classList.add('selected');
      showDetails(s);
    });
    tbody.appendChild(tr);
  });
}

function getDisciplineClass(d) {
  if(!d) return 'disc-gen';
  const dl = d.toLowerCase();
  if(dl.includes('arch')) return 'disc-arch';
  if(dl.includes('struct')) return 'disc-struct';
  if(dl.includes('mep') || dl.includes('mech') || dl.includes('elec') || dl.includes('plumb')) return 'disc-mep';
  if(dl.includes('civil') || dl.includes('site')) return 'disc-civil';
  return 'disc-gen';
}

function getStatusClass(s) {
  if(!s) return 'st-draft';
  const sl = s.toLowerCase();
  if(sl === 'approved') return 'st-approved';
  if(sl === 'in review') return 'st-review';
  if(sl === 'draft') return 'st-draft';
  if(sl === 'superseded') return 'st-superseded';
  return 'st-draft';
}

// ========== DETAILS ==========
function showDetails(s){
  selectedSheet = s;
  detailsCard.style.display = 'block';
  document.getElementById('detailNumber').textContent = s.SheetNumber || '—';
  document.getElementById('detailName').textContent = s.SheetName || '—';
  const discClass = getDisciplineClass(s.Discipline);
  document.getElementById('detailDiscipline').innerHTML = `<span class="discipline-badge ${discClass}">${s.Discipline||'—'}</span>`;
  document.getElementById('detailRevision').innerHTML = `<span class="rev-badge">${s.Revision||'—'}</span>`;
  const statusClass = getStatusClass(s.Status);
  document.getElementById('detailStatus').innerHTML = `<span class="status-badge ${statusClass}">${s.Status||'Draft'}</span>`;
  document.getElementById('detailScale').textContent = s.Scale || '—';
  document.getElementById('detailNotes').textContent = s.Notes || 'No notes';
  document.getElementById('statusSelect').value = s.Status || 'Draft';
  document.getElementById('revisionInput').value = s.Revision || '';
  detailsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

document.getElementById('saveUpdate').addEventListener('click', () => {
  if (!selectedSheet) return;
  selectedSheet.Status = document.getElementById('statusSelect').value;
  selectedSheet.Revision = document.getElementById('revisionInput').value.trim();
  saveToLocalStorage();
  renderTable();
  updateSummary();
  updatePrintSets();
  updateRevisions();
  showDetails(selectedSheet);
  showToast('✅ Sheet updated!', 'success');
});

// ========== SUMMARY ==========
function updateSummary(){
  document.getElementById('totalSheets').textContent = sheets.length;
  document.getElementById('approvedSheets').textContent = sheets.filter(s => (s.Status||'').toLowerCase() === 'approved').length;
  document.getElementById('reviewSheets').textContent = sheets.filter(s => (s.Status||'').toLowerCase() === 'in review').length;
  const revs = sheets.map(s => s.Revision || '').filter(r => r).sort();
  document.getElementById('latestRev').textContent = revs.length > 0 ? revs[revs.length - 1] : '—';
  const disciplines = new Set(sheets.map(s => s.Discipline).filter(d => d));
  document.getElementById('discCount').textContent = disciplines.size;
}

// ========== PRINT SETS ==========
function updatePrintSets(){
  const available = document.getElementById('availableSheets');
  const approvedSheets = sheets.filter(s => (s.Status||'').toLowerCase() !== 'superseded');
  available.innerHTML = '';
  approvedSheets.forEach(s => {
    const inQueue = printQueue.some(p => p.SheetNumber === s.SheetNumber);
    if(inQueue) return;
    const div = document.createElement('div');
    div.className = 'print-item';
    div.innerHTML = `
      <span class="sheet-num">${s.SheetNumber}</span>
      <span class="sheet-name">${s.SheetName}</span>
      <button class="add-btn" title="Add to print queue">+</button>
    `;
    div.querySelector('.add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      printQueue.push(s);
      updatePrintSets();
      updatePrintCount();
    });
    available.appendChild(div);
  });
  const queue = document.getElementById('printQueue');
  queue.innerHTML = '';
  printQueue.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'print-item';
    div.innerHTML = `
      <span class="sheet-num">${s.SheetNumber}</span>
      <span class="sheet-name">${s.SheetName}</span>
      <button class="remove-btn" title="Remove from queue">×</button>
    `;
    div.querySelector('.remove-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      printQueue.splice(i, 1);
      updatePrintSets();
      updatePrintCount();
    });
    queue.appendChild(div);
  });
  document.getElementById('generatePrintSet').disabled = printQueue.length === 0;
}

function updatePrintCount(){
  document.getElementById('printCount').textContent = `${printQueue.length} sheet${printQueue.length !== 1 ? 's' : ''}`;
}

document.getElementById('generatePrintSet').addEventListener('click', () => {
  if(printQueue.length === 0) return;
  const printWindow = window.open('', '_blank');
  let html = `<html><head><title>Print Set</title><style>
    body{font-family:'Geist',Arial;color:#111;background:#fff;padding:20px;max-width:1200px;margin:0 auto}
    h1{color:#3b82f6;border-bottom:3px solid #3b82f6;padding-bottom:10px}
    table{width:100%;border-collapse:collapse;margin-top:20px}
    th,td{border:1px solid #ddd;padding:10px;text-align:left;font-size:12px}
    th{background:#3b82f6;color:white}
    .meta{display:flex;gap:24px;margin:12px 0;font-size:13px;color:#666}
  </style></head><body>`;
  html += `<h1>Print Set — Sheet Index</h1>`;
  html += `<div class="meta"><span>Date: ${new Date().toLocaleDateString()}</span><span>Sheets: ${printQueue.length}</span></div>`;
  html += '<table><thead><tr><th>#</th><th>Sheet Number</th><th>Sheet Name</th><th>Discipline</th><th>Revision</th><th>Scale</th></tr></thead><tbody>';
  printQueue.forEach((s, i) => {
    html += `<tr><td>${i+1}</td><td>${s.SheetNumber}</td><td>${s.SheetName}</td><td>${s.Discipline||'—'}</td><td>${s.Revision||'—'}</td><td>${s.Scale||'—'}</td></tr>`;
  });
  html += '</tbody></table></body></html>';
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 500);
  showToast(`🖨️ Print set generated — ${printQueue.length} sheets`, 'success');
});

// ========== REVISIONS ==========
function updateRevisions(){
  const container = document.getElementById('revisionTimeline');
  if(sheets.length === 0){
    container.innerHTML = `<div class="rev-item"><div class="rev-dot"></div><div class="rev-content"><div class="rev-date">No data</div><div class="rev-title">Upload sheet data to view revisions</div></div></div>`;
    return;
  }
  const revGroups = {};
  sheets.forEach(s => {
    const rev = s.Revision || 'P01';
    if(!revGroups[rev]) revGroups[rev] = [];
    revGroups[rev].push(s);
  });
  const sortedRevs = Object.keys(revGroups).sort().reverse();
  container.innerHTML = sortedRevs.map(rev => {
    const group = revGroups[rev];
    const approved = group.filter(s => (s.Status||'').toLowerCase() === 'approved').length;
    return `<div class="rev-item">
      <div class="rev-dot"></div>
      <div class="rev-content">
        <div class="rev-date">Revision ${rev}</div>
        <div class="rev-title">${group.length} sheet${group.length > 1 ? 's' : ''} — ${approved} approved</div>
        <div class="rev-desc">${group.slice(0, 3).map(s => `${s.SheetNumber}: ${s.SheetName}`).join(' • ')}${group.length > 3 ? ` +${group.length - 3} more` : ''}</div>
      </div>
    </div>`;
  }).join('');
}

// ========== EXPORTS ==========
document.getElementById('downloadCsv').addEventListener('click', () => {
  if(sheets.length === 0) { showToast('⚠️ No data to export', 'error'); return; }
  const rows = [['SheetNumber','SheetName','Discipline','Revision','Status','Scale','DrawnBy','Date','Notes']];
  sheets.forEach(s => rows.push([s.SheetNumber,s.SheetName,s.Discipline,s.Revision,s.Status,s.Scale,s.DrawnBy,s.Date,s.Notes||'']));
  const csv = rows.map(r => r.map(cell => `"${(''+cell).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `sheet-index-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  showToast('✅ CSV exported!', 'success');
});

document.getElementById('downloadExcel').addEventListener('click', () => {
  if(sheets.length === 0) { showToast('⚠️ No data to export', 'error'); return; }
  const ws_data = [
    ['SheetNumber','SheetName','Discipline','Revision','Status','Scale','DrawnBy','Date','Notes'],
    ...sheets.map(s => [s.SheetNumber,s.SheetName,s.Discipline,s.Revision,s.Status,s.Scale,s.DrawnBy,s.Date,s.Notes||''])
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet Index');
  XLSX.writeFile(wb, `sheet-index-${new Date().toISOString().split('T')[0]}.xlsx`);
  showToast('✅ Excel exported!', 'success');
});

document.getElementById('printSet').addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector('[data-tab="printset"]').classList.add('active');
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('printset').classList.add('active');
});

// ========== SAMPLE DATA ==========
const sampleCsv = `SheetNumber,SheetName,Discipline,Revision,Status,Scale,DrawnBy,Date,Notes
A-001,Cover Sheet,Architectural,P03,Approved,NTS,Ahmed Hassan,2026-01-15,Project cover with vicinity map and sheet index
A-100,Site Plan,Architectural,P03,Approved,1:500,Ahmed Hassan,2026-01-15,Overall site layout with access roads and parking
A-101,Ground Floor Plan,Architectural,P03,Approved,1:100,Ahmed Hassan,2026-01-20,Lobby reception and retail areas
A-102,First Floor Plan,Architectural,P02,In Review,1:100,Ahmed Hassan,2026-01-22,Open plan office layout — pending client feedback
A-103,Second Floor Plan,Architectural,P02,In Review,1:100,Ahmed Hassan,2026-01-22,Meeting rooms and executive suite
A-104,Third Floor Plan,Architectural,P01,Draft,1:100,Ahmed Hassan,2026-01-25,Residential units — layout under review
A-201,Building Section A-A,Architectural,P03,Approved,1:50,Fatima Eldin,2026-01-18,Longitudinal section through main core
A-202,Building Section B-B,Architectural,P02,In Review,1:50,Fatima Eldin,2026-01-22,Transverse section at grid C
A-301,North Elevation,Architectural,P03,Approved,1:100,Fatima Eldin,2026-01-15,Main entrance facade with curtain wall details
A-302,South Elevation,Architectural,P02,In Review,1:100,Fatima Eldin,2026-01-22,Rear elevation — cladding revised
S-001,Foundation Plan,Structural,P03,Approved,1:100,Omar Khalil,2026-01-12,Mat foundation with pile layout
S-002,Ground Floor Framing,Structural,P03,Approved,1:100,Omar Khalil,2026-01-14,Transfer beam level with column grid
S-003,Typical Floor Framing,Structural,P02,In Review,1:100,Omar Khalil,2026-01-20,Post-tension slab layout for floors 1-3
S-004,Roof Framing Plan,Structural,P01,Draft,1:100,Omar Khalil,2026-01-25,Steel roof structure over mechanical penthouse
S-101,Foundation Details,Structural,P03,Approved,1:20,Sarah Nabil,2026-01-14,Pile cap and grade beam reinforcement
S-102,Connection Details,Structural,P02,In Review,1:10,Sarah Nabil,2026-01-20,Steel-to-concrete moment connections
M-001,Mechanical Floor Plan — GF,MEP,P02,In Review,1:100,John Mansour,2026-01-18,AHU locations and ductwork routing
M-002,Mechanical Floor Plan — 1F,MEP,P01,Draft,1:100,John Mansour,2026-01-22,FCU layout and condensate drainage
E-001,Electrical Floor Plan — GF,MEP,P02,Approved,1:100,Layla Abbas,2026-01-18,DB locations and cable tray routing
E-002,Lighting Layout — GF,MEP,P02,In Review,1:100,Layla Abbas,2026-01-22,Luminaire schedule and circuiting
P-001,Plumbing Floor Plan — GF,MEP,P02,Approved,1:100,John Mansour,2026-01-16,Hot/cold water riser diagram
P-002,Fire Protection Plan — GF,MEP,P01,Draft,1:100,John Mansour,2026-01-25,Sprinkler layout — pending fire consultant review
C-001,Site Grading Plan,Civil,P03,Approved,1:500,Omar Khalil,2026-01-10,Cut/fill volumes and drainage slope
C-002,Storm Water Management,Civil,P02,In Review,1:200,Omar Khalil,2026-01-18,Retention pond sizing and outfall details
G-001,General Notes,General,P03,Approved,NTS,Ahmed Hassan,2026-01-08,Project specifications and abbreviations
A-105,Roof Plan,Architectural,P01,Draft,1:100,Ahmed Hassan,2026-01-25,Mechanical equipment zones and waterproofing
A-401,Wall Sections,Architectural,P02,In Review,1:20,Fatima Eldin,2026-01-22,Curtain wall and masonry cavity details
A-501,Door Schedule,Architectural,P03,Approved,NTS,Ahmed Hassan,2026-01-15,Fire rated doors highlighted
A-502,Window Schedule,Architectural,P02,In Review,NTS,Ahmed Hassan,2026-01-22,Acoustic rated windows for north facade`;

function loadSampleData() {
  sheets = parseCSV(sampleCsv);
  saveToLocalStorage();
  initFilters();
  renderTable();
  updateSummary();
  updatePrintSets();
  updateRevisions();
  showToast('✅ 30 sample sheets loaded — Al Noor Tower Phase 2', 'success');
}

document.getElementById('loadSampleBtn').addEventListener('click', loadSampleData);

// ========== INIT ==========
window.addEventListener('load', () => {
  const dataVersion = localStorage.getItem('sheet-manager-version');
  if(dataVersion !== '1') {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem('sheet-manager-version', '1');
  }
  const savedData = loadFromLocalStorage();
  if(savedData && savedData.length > 0) {
    sheets = savedData;
    initFilters();
    renderTable();
    updateSummary();
    updatePrintSets();
    updateRevisions();
    showToast('📂 Previous data restored!', 'success');
  }
});

console.log('📋 Sheet Set Manager — Professional Edition Ready!');
