const SERVICE_OPTIONS = [
  '',
  'Social Media Management',
  'Paid Ads',
  'Website',
  'Content Creation',
  'Hosting and Domain',
  'SEO',
  'Local SEO',
];

const CURRENCY = {
  AUD: 'A$',
  USD: '$',
  EUR: '€',
};

let services = [{ id: 1, description: '', quantity: 1, unitPrice: 0, isCustom: false }];
let logoData = null;
let serviceIdCounter = 2;

// ── Init ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  const due = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  document.getElementById('invoiceDate').value = today;
  document.getElementById('dueDate').value = due;
  renderServices();
  update();
});

// ── Logo ──────────────────────────────────────────────
function handleLogo(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    logoData = e.target.result;
    document.getElementById('logo-preview').src = logoData;
    document.getElementById('logo-preview').style.display = 'block';
    document.getElementById('logo-placeholder').style.display = 'none';
    document.getElementById('logo-remove').style.display = 'inline-block';
    update();
  };
  reader.readAsDataURL(file);
}

function removeLogo() {
  logoData = null;
  document.getElementById('logo-preview').style.display = 'none';
  document.getElementById('logo-placeholder').style.display = 'flex';
  document.getElementById('logo-remove').style.display = 'none';
  document.getElementById('logo-input').value = '';
  update();
}

// ── Services ──────────────────────────────────────────
function renderServices() {
  const list = document.getElementById('services-list');
  list.innerHTML = services.map((s, i) => `
    <div class="service-item" id="srv-${s.id}">
      <div class="service-item-header">
        <span class="service-item-label">Item ${i + 1}</span>
        ${services.length > 1 ? `<button class="service-item-remove" onclick="removeService(${s.id})">Remove</button>` : ''}
      </div>
      <select class="service-desc" onchange="handleServiceType(${s.id}, this)">
        <option value="" ${s.description === '' && !s.isCustom ? 'selected' : ''}>— Select a service —</option>
        ${SERVICE_OPTIONS.slice(1).map(opt => `
          <option value="${opt}" ${s.description === opt && !s.isCustom ? 'selected' : ''}>${opt}</option>
        `).join('')}
        <option value="__custom__" ${s.isCustom ? 'selected' : ''}>✏️ Custom service...</option>
      </select>
      ${s.isCustom ? `
        <input type="text" class="service-desc" placeholder="Enter custom service name"
          value="${escHtml(s.description)}"
          oninput="updateServiceField(${s.id}, 'description', this.value)" style="margin-bottom:8px" />
      ` : ''}
      <div class="service-row">
        <div>
          <label>Quantity</label>
          <input type="number" min="0" step="1" value="${s.quantity}"
            oninput="updateServiceField(${s.id}, 'quantity', parseFloat(this.value)||0)" />
        </div>
        <div>
          <label>Unit Price</label>
          <input type="number" min="0" step="0.01" value="${s.unitPrice}"
            oninput="updateServiceField(${s.id}, 'unitPrice', parseFloat(this.value)||0)" />
        </div>
      </div>
    </div>
  `).join('');
}

function handleServiceType(id, select) {
  const val = select.value;
  if (val === '__custom__') {
    services = services.map(s => s.id === id ? { ...s, description: '', isCustom: true } : s);
  } else {
    services = services.map(s => s.id === id ? { ...s, description: val, isCustom: false } : s);
  }
  renderServices();
  update();
}

function updateServiceField(id, field, value) {
  services = services.map(s => s.id === id ? { ...s, [field]: value } : s);
  update();
}

function addService() {
  services.push({ id: serviceIdCounter++, description: '', quantity: 1, unitPrice: 0, isCustom: false });
  renderServices();
  update();
}

function removeService(id) {
  services = services.filter(s => s.id !== id);
  renderServices();
  update();
}

// ── Update Preview ────────────────────────────────────
function update() {
  const currency = val('currency');
  const sym = CURRENCY[currency] || 'A$';
  const fmt = (n) => `${sym}${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  const fmtDate = (s) => { if (!s) return '—'; const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; };

  // Logo / biz name
  const prevLogo = document.getElementById('prev-logo');
  const prevBiz = document.getElementById('prev-biz-name');
  if (logoData) {
    prevLogo.src = logoData;
    prevLogo.style.display = 'block';
    prevBiz.textContent = '';
  } else {
    prevLogo.style.display = 'none';
    prevBiz.textContent = val('providerName') || 'Your Business';
  }

  // Invoice meta
  setText('prev-inv-num', val('invoiceNumber') || 'INV-001');
  setText('prev-inv-date', fmtDate(val('invoiceDate')));
  const due = val('dueDate');
  setText('prev-due-date', fmtDate(due));
  document.getElementById('prev-due-wrap').style.display = due ? 'block' : 'none';

  // Provider
  setText('prev-provider-name', val('providerName'));
  const abn = val('providerABN');
  setHtml('prev-provider-abn', abn ? `ABN: ${abn}` : '');
  const pLines = [
    val('providerAddress'),
    [val('providerSuburb'), val('providerState'), val('providerPostcode')].filter(Boolean).join(', '),
    val('providerEmail'),
    val('providerPhone'),
  ].filter(Boolean).join('<br>');
  setHtml('prev-provider-addr', pLines);

  // Client
  const clientCo = val('clientCompany');
  const clientName = val('clientName');
  setText('prev-client-company', clientCo);
  document.getElementById('prev-client-company').style.fontWeight = clientCo ? '700' : '400';
  document.getElementById('prev-client-company').style.fontSize = clientCo ? '15px' : '13px';
  setText('prev-client-name', clientName);
  document.getElementById('prev-client-name').style.fontWeight = clientCo ? '400' : '700';
  document.getElementById('prev-client-name').style.fontSize = clientCo ? '13px' : '15px';
  const cLines = [
    val('clientAddress'),
    [val('clientSuburb'), val('clientState'), val('clientPostcode')].filter(Boolean).join(', '),
    val('clientEmail'),
  ].filter(Boolean).join('<br>');
  setHtml('prev-client-addr', cLines);

  // Services table
  const tbody = document.getElementById('prev-services');
  tbody.innerHTML = services.map((s, i) => `
    <tr>
      <td class="col-desc">${escHtml(s.description) || '<em style="color:#d1d5db">No description</em>'}</td>
      <td class="col-qty">${s.quantity}</td>
      <td class="col-price">${fmt(s.unitPrice)}</td>
      <td class="col-total">${fmt(s.quantity * s.unitPrice)}</td>
    </tr>
  `).join('');

  // Totals
  const subtotal = services.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0);
  const taxRate = parseFloat(val('taxRate')) || 0;
  const taxAmt = subtotal * taxRate / 100;
  const total = subtotal + taxAmt;

  setText('prev-subtotal', fmt(subtotal));
  const taxRow = document.getElementById('prev-tax-row');
  taxRow.style.display = taxRate > 0 ? 'flex' : 'none';
  setText('prev-tax-label', `Tax (${taxRate}%)`);
  setText('prev-tax-amt', fmt(taxAmt));
  setText('prev-total-label', `Total (${currency})`);
  setText('prev-total-amt', fmt(total));

  // Notes
  const notes = val('notes');
  document.getElementById('prev-notes-wrap').style.display = notes ? 'block' : 'none';
  setText('prev-notes', notes);
}

// ── PDF Download ──────────────────────────────────────
async function downloadPDF() {
  const btn = document.querySelector('.btn-download');
  const label = document.getElementById('btn-label');
  btn.disabled = true;
  label.textContent = 'Generating PDF...';
  try {
    const el = document.getElementById('invoice-preview');
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    const num = document.getElementById('invoiceNumber').value || 'invoice';
    pdf.save(`Invoice-${num}.pdf`);
  } catch (e) {
    console.error(e);
  } finally {
    btn.disabled = false;
    label.textContent = 'Download as PDF';
  }
}

// ── Helpers ───────────────────────────────────────────
function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }
function setHtml(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
