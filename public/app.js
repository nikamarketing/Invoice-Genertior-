const SERVICE_OPTIONS = ['', 'Social Media Management', 'Paid Ads', 'Website', 'Content Creation', 'Hosting and Domain', 'SEO', 'Local SEO'];
const CURRENCY = { AUD: 'A$', USD: '$', EUR: '€' };

let services = [{ id: 1, description: 'Domain Renew', quantity: 1, unitPrice: 60, isCustom: true }];
let logoData = null;
let serviceIdCounter = 2;
let activeSenderId = null;
let senderLogoData = null;

// ── Init ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  const due = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  document.getElementById('invoiceDate').value = today;
  document.getElementById('dueDate').value = due;

  seedSenders();
  renderSenders();

  const senders = getSenders();
  if (senders.length > 0) {
    selectSender(senders[0].id, false);
  }

  prefillClient();
  renderServices();
  renderSidebar();
  update();
});

// ── Sender Storage ────────────────────────────────────
function getSenders() {
  try {
    return JSON.parse(localStorage.getItem('inv_senders') || '[]');
  } catch (e) {
    return [];
  }
}

function saveSendersStorage(list) {
  localStorage.setItem('inv_senders', JSON.stringify(list));
}

function seedSenders() {
  const existing = getSenders();
  if (existing.length === 0) {
    const bondi = {
      id: Date.now(),
      name: 'Bondi Marketing',
      abn: '',
      email: 'info@bondimarketing.au',
      phone: '+61 02 8080 2107',
      address: 'Level 23, 520 Oxford St.',
      suburb: 'Sydney',
      state: 'NSW',
      postcode: '2022',
      logoData: null
    };
    saveSendersStorage([bondi]);
  }
}

// ── Sender Render & Actions ───────────────────────────
function renderSenders() {
  const list = document.getElementById('senders-list');
  const senders = getSenders();
  if (senders.length === 0) {
    list.innerHTML = '<p class="senders-empty">No saved senders yet.</p>';
    return;
  }
  list.innerHTML = senders.map(s => {
    const isActive = s.id === activeSenderId;
    return `
      <div class="sender-card${isActive ? ' sender-card--active' : ''}">
        <div class="sender-card-info">
          <div class="sender-card-name">${escHtml(s.name)}</div>
          <div class="sender-card-sub">${escHtml(s.email || s.phone || '')}</div>
        </div>
        <div class="sender-card-actions">
          <button class="sender-use-btn${isActive ? ' sender-use-btn--active' : ''}"
            onclick="selectSender(${s.id}, true)">
            ${isActive ? '&#10003; Active' : 'Use'}
          </button>
          <button class="sender-del-btn" onclick="deleteSender(${s.id})" title="Delete sender">&#10005;</button>
        </div>
      </div>
    `;
  }).join('');
}

function selectSender(id, triggerUpdate) {
  activeSenderId = id;
  const senders = getSenders();
  const sender = senders.find(s => s.id === id);
  if (!sender) return;

  const setVal = (elId, v) => {
    const el = document.getElementById(elId);
    if (el) el.value = v || '';
  };

  setVal('providerName', sender.name);
  setVal('providerABN', sender.abn);
  setVal('providerEmail', sender.email);
  setVal('providerPhone', sender.phone);
  setVal('providerAddress', sender.address);
  setVal('providerSuburb', sender.suburb);
  setVal('providerState', sender.state);
  setVal('providerPostcode', sender.postcode);

  // Load logo
  if (sender.logoData) {
    logoData = sender.logoData;
    const preview = document.getElementById('logo-preview');
    const placeholder = document.getElementById('logo-placeholder');
    const removeBtn = document.getElementById('logo-remove');
    if (preview) { preview.src = logoData; preview.style.display = 'block'; }
    if (placeholder) placeholder.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'inline-block';
  } else {
    logoData = null;
    const preview = document.getElementById('logo-preview');
    const placeholder = document.getElementById('logo-placeholder');
    const removeBtn = document.getElementById('logo-remove');
    if (preview) preview.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
    if (removeBtn) removeBtn.style.display = 'none';
  }

  renderSenders();
  if (triggerUpdate) update();
}

function deleteSender(id) {
  if (!confirm('Delete this sender profile?')) return;
  const senders = getSenders().filter(s => s.id !== id);
  saveSendersStorage(senders);
  if (activeSenderId === id) activeSenderId = null;
  renderSenders();
}

function showAddSenderPanel() {
  const panel = document.getElementById('add-sender-panel');
  if (panel) panel.style.display = 'block';
}

function hideAddSenderPanel() {
  const panel = document.getElementById('add-sender-panel');
  if (panel) panel.style.display = 'none';
  ['as-name','as-abn','as-email','as-phone','as-address','as-suburb','as-state','as-postcode'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  senderLogoData = null;
  const preview = document.getElementById('as-logo-preview');
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  const logoInput = document.getElementById('as-logo-input');
  if (logoInput) logoInput.value = '';
}

function handleSenderLogo(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    senderLogoData = e.target.result;
    const preview = document.getElementById('as-logo-preview');
    if (preview) { preview.src = senderLogoData; preview.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
}

function saveSenderFromForm() {
  const nameEl = document.getElementById('as-name');
  const name = nameEl ? nameEl.value.trim() : '';
  if (!name) {
    alert('Sender name is required.');
    if (nameEl) nameEl.focus();
    return;
  }

  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };

  const newId = Date.now();
  const newSender = {
    id: newId,
    name: name,
    abn: getVal('as-abn'),
    email: getVal('as-email'),
    phone: getVal('as-phone'),
    address: getVal('as-address'),
    suburb: getVal('as-suburb'),
    state: getVal('as-state'),
    postcode: getVal('as-postcode'),
    logoData: senderLogoData || null
  };

  const senders = getSenders();
  senders.push(newSender);
  saveSendersStorage(senders);

  hideAddSenderPanel();
  renderSenders();
  selectSender(newId, true);
}

// ── Client Prefill ────────────────────────────────────
function prefillClient() {
  const fields = {
    clientCompany: 'Australian Universal Federation of Education and Culture (AUF)',
    clientAddress: 'LEVEL 1, 110 MOORE STREET',
    clientSuburb: 'LIVERPOOL',
    clientState: 'NSW',
    clientPostcode: '2170',
    clientEmail: 'info@auf.net.au',
    taxRate: '0',
    notes: ''
  };
  Object.entries(fields).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = value;
  });
}

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
        <option value="__custom__" ${s.isCustom ? 'selected' : ''}>&#9999;&#65039; Custom service...</option>
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
  const v = select.value;
  if (v === '__custom__') {
    services = services.map(s => s.id === id ? { ...s, description: '', isCustom: true } : s);
  } else {
    services = services.map(s => s.id === id ? { ...s, description: v, isCustom: false } : s);
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
  tbody.innerHTML = services.map((s) => `
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
    const invoiceData = captureInvoiceData(); // capture BEFORE async

    const el = document.getElementById('invoice-preview');
    const scaler = el.parentElement;

    // Temporarily undo the CSS scale so html2canvas sees the full element
    const prevTransform = scaler.style.transform;
    const prevWidth = scaler.style.width;
    scaler.style.transform = 'none';
    scaler.style.width = '794px';

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: el.scrollWidth,
      height: el.scrollHeight,
      windowWidth: 794,
    });

    scaler.style.transform = prevTransform;
    scaler.style.width = prevWidth;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    const num = document.getElementById('invoiceNumber').value || 'invoice';
    pdf.save(`Invoice-${num}.pdf`);

    saveToHistory(invoiceData);
  } catch (e) {
    console.error(e);
  } finally {
    btn.disabled = false;
    label.textContent = 'Download as PDF';
  }
}

// ── Invoice History ───────────────────────────────────
function getSavedInvoices() {
  try {
    return JSON.parse(localStorage.getItem('inv_history') || '[]');
  } catch (e) {
    return [];
  }
}

function captureInvoiceData() {
  const currency = val('currency');
  const sym = CURRENCY[currency] || 'A$';
  const subtotal = services.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0);
  const taxRate = parseFloat(val('taxRate')) || 0;
  const taxAmt = subtotal * taxRate / 100;
  const total = subtotal + taxAmt;

  return {
    id: Date.now(),
    invoiceNumber: val('invoiceNumber') || 'INV-001',
    invoiceDate: val('invoiceDate'),
    dueDate: val('dueDate'),
    currency: currency,
    sym: sym,
    providerName: val('providerName'),
    providerABN: val('providerABN'),
    providerEmail: val('providerEmail'),
    providerPhone: val('providerPhone'),
    providerAddress: val('providerAddress'),
    providerSuburb: val('providerSuburb'),
    providerState: val('providerState'),
    providerPostcode: val('providerPostcode'),
    clientName: val('clientName'),
    clientCompany: val('clientCompany'),
    clientEmail: val('clientEmail'),
    clientAddress: val('clientAddress'),
    clientSuburb: val('clientSuburb'),
    clientState: val('clientState'),
    clientPostcode: val('clientPostcode'),
    taxRate: taxRate,
    taxAmt: taxAmt,
    notes: val('notes'),
    services: JSON.parse(JSON.stringify(services)),
    logoData: logoData,
    subtotal: subtotal,
    total: total
  };
}

function saveToHistory(data) {
  try {
    let list = getSavedInvoices();
    // Try saving with logo first, then fall back without if storage is full
    try {
      list.unshift(data);
      if (list.length > 20) list = list.slice(0, 20);
      localStorage.setItem('inv_history', JSON.stringify(list));
    } catch (storageErr) {
      // Retry without logo data
      const dataNoLogo = { ...data, logoData: null };
      list = getSavedInvoices();
      list.unshift(dataNoLogo);
      if (list.length > 20) list = list.slice(0, 20);
      localStorage.setItem('inv_history', JSON.stringify(list));
    }
  } catch (e) {
    console.error('Failed to save invoice to history:', e);
  }
  renderSidebar();
}

function renderSidebar() {
  const list = document.getElementById('sidebar-list');
  const countEl = document.getElementById('sidebar-count');
  const invoices = getSavedInvoices();

  if (countEl) countEl.textContent = invoices.length;

  if (invoices.length === 0) {
    list.innerHTML = '<p class="sidebar-empty">No invoices yet.<br>Click "Download as PDF" to save here.</p>';
    return;
  }

  const fmtDate = (s) => { if (!s) return '—'; const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; };
  const fmt = (sym, n) => `${sym}${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  const truncate = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');

  list.innerHTML = invoices.map(inv => {
    const client = truncate(inv.clientCompany || inv.clientName || 'Unknown', 24);
    return `
      <div class="sidebar-item">
        <div class="sidebar-item-top">
          <span class="sidebar-item-num">${escHtml(inv.invoiceNumber)}</span>
          <button class="sidebar-item-del" onclick="deleteInvoice(${inv.id})" title="Delete">&#10005;</button>
        </div>
        <div class="sidebar-item-client">${escHtml(client)}</div>
        <div class="sidebar-item-meta">
          <span>${fmtDate(inv.invoiceDate)}</span>
          <strong>${fmt(inv.sym || 'A$', inv.total)}</strong>
        </div>
        <button class="sidebar-item-dl" id="sidebtn-${inv.id}" onclick="redownloadInvoice(${inv.id}, this)">
          &#8595; Download PDF
        </button>
      </div>
    `;
  }).join('');
}

async function redownloadInvoice(id, btn) {
  const invoices = getSavedInvoices();
  const data = invoices.find(inv => inv.id === id);
  if (!data) return;

  const origText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Generating…';

  try {
    // Build off-screen container
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;z-index:-1;';
    container.innerHTML = buildInvoiceHTML(data);
    document.body.appendChild(container);

    const el = container.querySelector('.invoice-paper');
    await new Promise(r => setTimeout(r, 80)); // allow images to load

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: el.scrollWidth,
      height: el.scrollHeight,
      windowWidth: 794,
    });

    document.body.removeChild(container);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`Invoice-${data.invoiceNumber}.pdf`);
  } catch (e) {
    console.error(e);
    try { document.body.removeChild(container); } catch (_) {}
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
}

function deleteInvoice(id) {
  let list = getSavedInvoices().filter(inv => inv.id !== id);
  localStorage.setItem('inv_history', JSON.stringify(list));
  renderSidebar();
}

function buildInvoiceHTML(data) {
  const sym = data.sym || 'A$';
  const fmt = (n) => `${sym}${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  const fmtDate = (s) => { if (!s) return '—'; const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; };

  const pLines = [
    data.providerAddress,
    [data.providerSuburb, data.providerState, data.providerPostcode].filter(Boolean).join(', '),
    data.providerEmail,
    data.providerPhone,
  ].filter(Boolean).join('<br>');

  const cLines = [
    data.clientAddress,
    [data.clientSuburb, data.clientState, data.clientPostcode].filter(Boolean).join(', '),
    data.clientEmail,
  ].filter(Boolean).join('<br>');

  const serviceRows = (data.services || []).map(s => `
    <tr>
      <td class="col-desc">${escHtml(s.description) || '<em style="color:#d1d5db">No description</em>'}</td>
      <td class="col-qty">${s.quantity}</td>
      <td class="col-price">${fmt(s.unitPrice)}</td>
      <td class="col-total">${fmt(s.quantity * s.unitPrice)}</td>
    </tr>
  `).join('');

  const taxRowHtml = data.taxRate > 0 ? `
    <div class="inv-total-row">
      <span>Tax (${data.taxRate}%)</span>
      <span>${fmt(data.taxAmt)}</span>
    </div>
  ` : '';

  const notesHtml = data.notes ? `
    <div class="inv-notes-wrap">
      <div class="inv-notes-label">Notes &amp; Payment Terms</div>
      <div class="inv-notes-text">${escHtml(data.notes)}</div>
    </div>
  ` : '';

  const logoHtml = data.logoData
    ? `<img src="${data.logoData}" alt="" style="display:block;max-height:80px;max-width:200px;object-fit:contain" />`
    : `<div class="inv-biz-name">${escHtml(data.providerName || 'Your Business')}</div>`;

  const dueHtml = data.dueDate
    ? `<div><strong>Due:</strong> ${fmtDate(data.dueDate)}</div>` : '';

  const clientCoStyle = data.clientCompany
    ? 'font-weight:700;font-size:15px;' : 'font-weight:400;font-size:13px;';
  const clientNameStyle = data.clientCompany
    ? 'font-weight:400;font-size:13px;' : 'font-weight:700;font-size:15px;';

  return `
    <div class="invoice-paper">
      <div class="inv-header">
        <div class="inv-logo-block">
          ${logoHtml}
        </div>
        <div class="inv-title-block">
          <div class="inv-title">INVOICE</div>
          <div class="inv-meta">
            <div><strong>Invoice #:</strong> ${escHtml(data.invoiceNumber)}</div>
            <div><strong>Date:</strong> ${fmtDate(data.invoiceDate)}</div>
            ${dueHtml}
          </div>
        </div>
      </div>

      <div class="inv-divider"></div>

      <div class="inv-parties">
        <div class="inv-from">
          <div class="inv-party-label">From</div>
          <div class="inv-party-name">${escHtml(data.providerName || '')}</div>
          ${data.providerABN ? `<div class="inv-party-sub">ABN: ${escHtml(data.providerABN)}</div>` : ''}
          <div class="inv-party-lines">${pLines}</div>
        </div>
        <div class="inv-billto">
          <div class="inv-party-label">Bill To</div>
          <div class="inv-party-name" style="${clientCoStyle}">${escHtml(data.clientCompany || '')}</div>
          <div class="inv-party-sub" style="${clientNameStyle}">${escHtml(data.clientName || '')}</div>
          <div class="inv-party-lines">${cLines}</div>
        </div>
      </div>

      <table class="inv-table">
        <thead>
          <tr>
            <th class="col-desc">Description</th>
            <th class="col-qty">Qty</th>
            <th class="col-price">Unit Price</th>
            <th class="col-total">Amount</th>
          </tr>
        </thead>
        <tbody>${serviceRows}</tbody>
      </table>

      <div class="inv-totals-wrap">
        <div class="inv-totals">
          <div class="inv-total-row">
            <span>Subtotal</span>
            <span>${fmt(data.subtotal)}</span>
          </div>
          ${taxRowHtml}
          <div class="inv-total-grand">
            <span>Total (${data.currency || 'AUD'})</span>
            <span>${fmt(data.total)}</span>
          </div>
        </div>
      </div>

      ${notesHtml}

      <div class="inv-footer">Generated with Invoice Generator</div>
    </div>
  `;
}

// ── Helpers ───────────────────────────────────────────
function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }
function setHtml(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
