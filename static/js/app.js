/* ── Canvas Setup ────────────────────────────────────────────────── */
const canvas = document.getElementById('clockCanvas');
const ctx = canvas.getContext('2d');
const placeholder = document.getElementById('placeholder');

let isDrawing = false;
let tool = 'pen';
let brushSz = 2;
let drawColor = '#1a1a1a';
let lastX = 0, lastY = 0;
let hasDrawn = false;

// White background
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

/* ── Tool Controls ───────────────────────────────────────────────── */
function setTool(t) {
  tool = t;
  document.getElementById('penBtn').classList.toggle('active', t === 'pen');
  document.getElementById('eraseBtn').classList.toggle('active', t === 'erase');
  canvas.style.cursor = t === 'erase' ? 'cell' : 'crosshair';
}

function setColor(c, el) {
  drawColor = c;
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('sel'));
  el.classList.add('sel');
}

function updateCursor() { /* cursor updates on size change */ }

/* ── Canvas Coordinates ──────────────────────────────────────────── */
function getPos(e) {
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width;
  const scaleY = canvas.height / r.height;
  const src = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - r.left) * scaleX,
    y: (src.clientY - r.top) * scaleY
  };
}

/* ── Drawing Events ──────────────────────────────────────────────── */
function startDraw(e) {
  isDrawing = true;
  const p = getPos(e);
  lastX = p.x; lastY = p.y;
}

function doDraw(e) {
  if (!isDrawing) return;
  const p = getPos(e);

  ctx.beginPath();
  if (tool === 'erase') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = brushSz * 7;
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = brushSz;
    ctx.strokeStyle = drawColor;
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  lastX = p.x; lastY = p.y;

  if (!hasDrawn) {
    hasDrawn = true;
    placeholder.style.opacity = '0';
  }
}

function stopDraw() {
  isDrawing = false;
  ctx.beginPath();
  // Restore white background under transparent areas from eraser
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';
}

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', doDraw);
canvas.addEventListener('mouseup', stopDraw);
canvas.addEventListener('mouseleave', stopDraw);
canvas.addEventListener('touchstart', e => { e.preventDefault(); startDraw(e); }, { passive: false });
canvas.addEventListener('touchmove', e => { e.preventDefault(); doDraw(e); }, { passive: false });
canvas.addEventListener('touchend', stopDraw);

/* ── Clear Canvas ────────────────────────────────────────────────── */
function clearCanvas() {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  hasDrawn = false;
  placeholder.style.opacity = '1';
  document.getElementById('resultsSection').style.display = 'none';
  document.getElementById('errorBanner').style.display = 'none';
}

/* ── Load Image ──────────────────────────────────────────────────── */
function loadImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const x = Math.round((canvas.width - w) / 2);
      const y = Math.round((canvas.height - h) / 2);
      ctx.drawImage(img, x, y, w, h);
      hasDrawn = true;
      placeholder.style.opacity = '0';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  // Reset input so same file can be reloaded
  event.target.value = '';
}

/* ── Scoring Metadata ────────────────────────────────────────────── */
const SCORE_META = [
  { key: 'circle',           label: 'Circle',              max: 2 },
  { key: 'numbers_present',  label: 'Numbers present',     max: 3 },
  { key: 'number_placement', label: 'Number placement',    max: 4 },
  { key: 'hands_present',    label: 'Hands present',       max: 2 },
  { key: 'hand_length',      label: 'Hand length/direction', max: 2 },
  { key: 'time_accuracy',    label: 'Time accuracy (10:10)', max: 2 },
];

const SEVERITY_TIERS = [
  { min: 13, label: 'Normal',                 desc: 'Visuospatial function appears intact',                  badgeCls: 'sref-green',   rowId: 'sref-13' },
  { min: 10, label: 'Mild concern',           desc: 'Possible early decline — retest in 3 months',           badgeCls: 'sref-amber',   rowId: 'sref-10' },
  { min:  7, label: 'Moderate concern',       desc: 'Consistent with MCI — flag for further testing',        badgeCls: 'sref-orange',  rowId: 'sref-7'  },
  { min:  4, label: 'Significant impairment', desc: 'Consistent with mild-moderate dementia',                badgeCls: 'sref-red',     rowId: 'sref-4'  },
  { min:  0, label: 'Severe impairment',      desc: 'Cannot complete basic visuospatial task',               badgeCls: 'sref-crimson', rowId: 'sref-0'  },
];

function getBarColor(ratio) {
  if (ratio >= 0.85) return '#16a34a';
  if (ratio >= 0.60) return '#d97706';
  return '#dc2626';
}

function getScoreColor(ratio) {
  if (ratio >= 0.85) return '#166534';
  if (ratio >= 0.60) return '#854d0e';
  return '#991b1b';
}

/* ── Loading Messages ────────────────────────────────────────────── */
const LOADING_MSGS = [
  'Analyzing clock drawing…',
  'Detecting circle completeness…',
  'Evaluating number placement…',
  'Checking hand positions for 10:10…',
  'Scanning for clinical red flags…',
  'Generating CLOX sub-scores…',
  'Preparing clinical summary…',
];

/* ── Main Analyze Function ───────────────────────────────────────── */
async function analyzeDrawing() {
  const btn = document.getElementById('analyzeBtn');
  const loadEl = document.getElementById('loadingArea');
  const errEl = document.getElementById('errorBanner');
  const resultsEl = document.getElementById('resultsSection');

  // Reset UI
  errEl.style.display = 'none';
  resultsEl.style.display = 'none';
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;border-color:#fff3;border-top-color:#fff"></div> Analyzing…';
  loadEl.style.display = 'flex';

  // Cycle loading messages
  let mi = 0;
  const msgEl = document.getElementById('loadingMsg');
  msgEl.textContent = LOADING_MSGS[0];
  const msgInterval = setInterval(() => {
    mi = (mi + 1) % LOADING_MSGS.length;
    msgEl.textContent = LOADING_MSGS[mi];
  }, 2000);

  // Get image data (base64, no prefix)
  const imageData = canvas.toDataURL('image/png');
  const base64 = imageData.split(',')[1];

  try {
    const response = await fetch('/api/analyze-clock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64 }),
    });

    const result = await response.json();

    clearInterval(msgInterval);
    loadEl.style.display = 'none';
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-microscope"></i><span>Analyze drawing with AI</span>';

    if (!response.ok || result.error) {
      showError(result.error || 'Unknown error from server.');
      return;
    }

    renderResults(result);

  } catch (err) {
    clearInterval(msgInterval);
    loadEl.style.display = 'none';
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-microscope"></i><span>Analyze drawing with AI</span>';
    showError('Could not connect to Flask server. Make sure app.py is running on port 5000.');
  }
}

/* ── Show Error ──────────────────────────────────────────────────── */
function showError(msg) {
  const el = document.getElementById('errorBanner');
  document.getElementById('errorMsg').textContent = msg;
  el.style.display = 'flex';
}

/* ── Render Results ──────────────────────────────────────────────── */
function renderResults(data) {
  const scores = data.scores || {};
  const total = Object.values(scores).reduce((a, b) => a + (Number(b) || 0), 0);
  const sev = SEVERITY_TIERS.find(s => total >= s.min) || SEVERITY_TIERS[SEVERITY_TIERS.length - 1];

  // Total score
  document.getElementById('totalScore').textContent = total;
  document.getElementById('severityLabel').textContent = sev.label;
  document.getElementById('severityDesc').textContent = sev.desc;

  const badge = document.getElementById('severityBadge');
  badge.textContent = sev.label;
  badge.className = 'sev-badge ' + sev.badgeCls;

  // Highlight severity table row
  document.querySelectorAll('.sev-row').forEach(r => r.classList.remove('highlighted'));
  const targetRow = document.getElementById(sev.rowId);
  if (targetRow) targetRow.classList.add('highlighted');

  // Sub-score cards
  const grid = document.getElementById('scoresGrid');
  grid.innerHTML = '';
  SCORE_META.forEach(meta => {
    const val = Number(scores[meta.key] ?? 0);
    const ratio = meta.max > 0 ? val / meta.max : 0;
    const barColor = getBarColor(ratio);
    const numColor = getScoreColor(ratio);
    const pct = Math.round(ratio * 100);

    const card = document.createElement('div');
    card.className = 'score-card';
    card.innerHTML = `
      <div class="sc-label">${meta.label}</div>
      <div class="sc-vals">
        <span class="sc-num" style="color:${numColor}">${val}</span>
        <span class="sc-max"> / ${meta.max}</span>
      </div>
      <div class="sc-bar">
        <div class="sc-fill" style="width:0%;background:${barColor}" data-target="${pct}"></div>
      </div>
    `;
    grid.appendChild(card);
  });

  // Animate bars after paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.sc-fill').forEach(el => {
        el.style.width = el.dataset.target + '%';
      });
    });
  });

  // Clinical flags
  const flagsList = document.getElementById('flagsList');
  flagsList.innerHTML = '';
  const flags = data.flags || [];

  if (flags.length === 0) {
    flagsList.innerHTML = `
      <div class="flag-item">
        <div class="flag-dot flag-green"></div>
        <div><div class="flag-title">No significant clinical flags detected</div>
        <div class="flag-detail">Clock drawing appears within normal parameters.</div></div>
      </div>`;
  } else {
    flags.forEach(f => {
      const div = document.createElement('div');
      div.className = 'flag-item';
      const dotCls = f.severity === 'red' ? 'flag-red' : f.severity === 'amber' ? 'flag-amber' : 'flag-green';
      div.innerHTML = `
        <div class="flag-dot ${dotCls}"></div>
        <div>
          <div class="flag-title">${f.title || ''}</div>
          <div class="flag-detail">${f.detail || ''}</div>
        </div>`;
      flagsList.appendChild(div);
    });
  }

  // AI reasoning
  const rbox = document.getElementById('reasoningBox');
  rbox.textContent = data.reasoning || 'No clinical summary available.';

  // Show results
  document.getElementById('resultsSection').style.display = 'block';

  // Scroll to results
  setTimeout(() => {
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

/* ── Reset Test ──────────────────────────────────────────────────── */
function resetTest() {
  clearCanvas();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Print Report ────────────────────────────────────────────────── */
function printReport() {
  window.print();
}
