const SERVICE_OPTIONS = ['', 'Social Media Management', 'Paid Ads', 'Website', 'Content Creation', 'Hosting and Domain', 'SEO', 'Local SEO'];
const CURRENCY = { AUD: 'A$', USD: '$', EUR: '€' };

let services = [{ id: 1, description: '', quantity: 1, unitPrice: 0, isCustom: false }];
let logoData = null;
let serviceIdCounter = 2;
let activeSenderId = null;
const sectionState = { senders: true, clients: false, invoices: false };

// ── Init ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  const due = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  document.getElementById('invoiceDate').value = today;
  document.getElementById('dueDate').value = due;

  seedSenders();
  seedClients();
  const senders = getSenders();
  if (senders.length > 0) selectSender(senders[0].id, false);

  renderServices();
  showDashboard();
  update();
});

// ── Dashboard ─────────────────────────────────────────
function showDashboard() {
  document.getElementById('dashboard-view').style.display = 'block';
  document.getElementById('generator-view').style.display = 'none';
  document.getElementById('nav-dashboard').classList.add('nav-active');
  document.getElementById('nav-generator').classList.remove('nav-active');
  renderDashboard();
}

function showGenerator() {
  document.getElementById('dashboard-view').style.display = 'none';
  document.getElementById('generator-view').style.display = 'flex';
  document.getElementById('nav-generator').classList.add('nav-active');
  document.getElementById('nav-dashboard').classList.remove('nav-active');
  renderSidebar();
}

function startNewInvoice() {
  showGenerator();
  newInvoice();
}

function useSenderFromDash(id) {
  showGenerator();
  selectSender(id, true);
}

function useClientFromDash(id) {
  showGenerator();
  selectClient(id);
  update();
}

function renderDashboard() {
  const invoices = getSavedInvoices();
  const senders = getSenders();
  const clients = getSavedClients();
  const sym = CURRENCY[invoices[0] && invoices[0].currency] || 'A$';

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const senderName = senders.length ? senders[0].name : 'there';
  setText('dash-greeting', `${greeting}, ${senderName}`);

  // Date
  const now = new Date();
  setText('dash-date', now.toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

  // Analytics
  const totalRev = invoices.reduce((s, i) => s + (Number(i.total) || 0), 0);
  const thisMonth = invoices.filter(i => {
    if (!i.invoiceDate) return false;
    const d = new Date(i.invoiceDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, i) => s + (Number(i.total) || 0), 0);
  const avgInv = invoices.length ? totalRev / invoices.length : 0;
  const fmtMoney = (n, s) => `${s}${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  const firstSym = invoices.length ? (invoices[0].sym || 'A$') : 'A$';

  document.getElementById('dash-analytics').innerHTML = [
    { label: 'Total Revenue', value: fmtMoney(totalRev, firstSym), sub: `${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}` },
    { label: 'Total Invoices', value: invoices.length, sub: 'all time' },
    { label: 'This Month', value: fmtMoney(thisMonth, firstSym), sub: now.toLocaleString('en-AU', { month: 'long' }) },
    { label: 'Average Invoice', value: fmtMoney(avgInv, firstSym), sub: 'per invoice' },
  ].map(c => `
    <div class="dash-metric">
      <div class="dash-metric-label">${c.label}</div>
      <div class="dash-metric-value">${c.value}</div>
      <div class="dash-metric-sub">${c.sub}</div>
    </div>`).join('');

  // Recent invoices count
  setText('dash-inv-count', invoices.length);

  // Recent invoices table
  const fmtDate = (s) => { if (!s) return '—'; const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; };
  const dashInv = document.getElementById('dash-invoices');
  if (!invoices.length) {
    dashInv.innerHTML = '<p class="dash-empty">No invoices yet. Click "+ Create Invoice" to get started.</p>';
  } else {
    dashInv.innerHTML = `<table class="dash-table">
      <thead><tr><th>Invoice #</th><th>Client</th><th>Date</th><th>Amount</th><th></th></tr></thead>
      <tbody>${invoices.slice(0, 8).map(inv => `<tr>
        <td><span class="dash-inv-num">${escHtml(inv.invoiceNumber)}</span></td>
        <td>${escHtml(inv.clientCompany || inv.clientName || '—')}</td>
        <td>${fmtDate(inv.invoiceDate)}</td>
        <td><strong>${fmtMoney(inv.total, inv.sym || 'A$')}</strong></td>
        <td><button class="dash-dl-btn" onclick="redownloadInvoice(${inv.id}, this)">↓ PDF</button></td>
      </tr>`).join('')}</tbody>
    </table>`;
  }

  // Senders
  const dashSenders = document.getElementById('dash-senders');
  if (!senders.length) {
    dashSenders.innerHTML = '<p class="dash-empty">No senders saved.</p>';
  } else {
    dashSenders.innerHTML = senders.map(s => `
      <div class="dash-contact-item" onclick="useSenderFromDash(${s.id})">
        <div class="dash-contact-avatar">${escHtml((s.name || '?')[0].toUpperCase())}</div>
        <div class="dash-contact-info">
          <div class="dash-contact-name">${escHtml(s.name)}</div>
          <div class="dash-contact-sub">${escHtml(s.email || s.phone || '')}</div>
        </div>
        <span class="dash-contact-use">Use →</span>
      </div>`).join('');
  }

  // Clients
  const dashClients = document.getElementById('dash-clients');
  if (!clients.length) {
    dashClients.innerHTML = '<p class="dash-empty">No clients saved.</p>';
  } else {
    dashClients.innerHTML = clients.map(c => `
      <div class="dash-contact-item" onclick="useClientFromDash(${c.id})">
        <div class="dash-contact-avatar">${escHtml(((c.company || c.name || '?')[0]).toUpperCase())}</div>
        <div class="dash-contact-info">
          <div class="dash-contact-name">${escHtml(c.company || c.name || 'Client')}</div>
          <div class="dash-contact-sub">${escHtml(c.email || '')}</div>
        </div>
        <span class="dash-contact-use">Use →</span>
      </div>`).join('');
  }
}

// ── New Invoice ───────────────────────────────────────
function newInvoice() {
  const invoices = getSavedInvoices();
  let max = 0;
  invoices.forEach(inv => {
    const m = (inv.invoiceNumber || '').match(/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1]));
  });
  const stored = parseInt(localStorage.getItem('inv_counter') || '0');
  max = Math.max(max, stored);
  const next = max + 1;
  localStorage.setItem('inv_counter', next);

  document.getElementById('invoiceNumber').value = 'INV-' + String(next).padStart(3, '0');

  ['clientName','clientCompany','clientEmail','clientAddress','clientSuburb','clientState','clientPostcode'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });

  const today = new Date().toISOString().split('T')[0];
  const due = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  document.getElementById('invoiceDate').value = today;
  document.getElementById('dueDate').value = due;
  document.getElementById('taxRate').value = '0';
  document.getElementById('notes').value = '';

  services = [{ id: 1, description: '', quantity: 1, unitPrice: 0, isCustom: false }];
  serviceIdCounter = 2;
  renderServices();
  update();
}

// ── Senders ───────────────────────────────────────────
function getSenders() {
  try { return JSON.parse(localStorage.getItem('inv_senders') || '[]'); } catch { return []; }
}

function saveSendersStorage(list) {
  localStorage.setItem('inv_senders', JSON.stringify(list));
}

function seedSenders() {
  if (getSenders().length > 0) return;
  saveSendersStorage([{
    id: Date.now(),
    name: 'Bondi Marketing', abn: '',
    email: 'info@bondimarketing.au', phone: '+61 02 8080 2107',
    address: 'Level 23, 520 Oxford St.', suburb: 'Sydney', state: 'NSW', postcode: '2022',
    logoData: null,
  }]);
}

function selectSender(id, triggerUpdate) {
  activeSenderId = id;
  const s = getSenders().find(x => x.id === id);
  if (!s) return;
  const sv = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v || ''; };
  sv('providerName', s.name); sv('providerABN', s.abn);
  sv('providerEmail', s.email); sv('providerPhone', s.phone);
  sv('providerAddress', s.address); sv('providerSuburb', s.suburb);
  sv('providerState', s.state); sv('providerPostcode', s.postcode);
  if (s.logoData) {
    logoData = s.logoData;
    document.getElementById('logo-preview').src = logoData;
    document.getElementById('logo-preview').style.display = 'block';
    document.getElementById('logo-placeholder').style.display = 'none';
    document.getElementById('logo-remove').style.display = 'inline-block';
  } else {
    logoData = null;
    document.getElementById('logo-preview').style.display = 'none';
    document.getElementById('logo-placeholder').style.display = 'flex';
    document.getElementById('logo-remove').style.display = 'none';
  }
  renderSidebar();
  if (triggerUpdate) update();
}

function deleteSender(id) {
  if (!confirm('Delete this sender?')) return;
  saveSendersStorage(getSenders().filter(s => s.id !== id));
  if (activeSenderId === id) activeSenderId = null;
  renderSidebar();
}

function saveCurrentAsSender() {
  const name = val('providerName').trim();
  if (!name) { alert('Enter your business name first.'); return; }
  const newSender = {
    id: Date.now(), name,
    abn: val('providerABN'), email: val('providerEmail'), phone: val('providerPhone'),
    address: val('providerAddress'), suburb: val('providerSuburb'),
    state: val('providerState'), postcode: val('providerPostcode'),
    logoData,
  };
  const list = getSenders();
  list.push(newSender);
  saveSendersStorage(list);
  activeSenderId = newSender.id;
  sectionState.senders = true;
  renderSidebar();
  showToast('Sender saved!');
}

// ── Clients ───────────────────────────────────────────
function seedClients() {
  if (getSavedClients().length > 0) return;
  saveClientsStorage([{
    id: Date.now(),
    name: '',
    company: 'Australian Universal Federation of Education and Culture (AUF)',
    email: 'info@auf.net.au',
    address: 'LEVEL 1, 110 MOORE STREET',
    suburb: 'LIVERPOOL',
    state: 'NSW',
    postcode: '2170',
  }]);
}

function getSavedClients() {
  try { return JSON.parse(localStorage.getItem('inv_clients') || '[]'); } catch { return []; }
}

function saveClientsStorage(list) {
  localStorage.setItem('inv_clients', JSON.stringify(list));
}

function selectClient(id) {
  const c = getSavedClients().find(x => x.id === id);
  if (!c) return;
  const sv = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v || ''; };
  sv('clientName', c.name); sv('clientCompany', c.company);
  sv('clientEmail', c.email); sv('clientAddress', c.address);
  sv('clientSuburb', c.suburb); sv('clientState', c.state);
  sv('clientPostcode', c.postcode);
  update();
}

function deleteSavedClient(id) {
  if (!confirm('Delete this client?')) return;
  saveClientsStorage(getSavedClients().filter(c => c.id !== id));
  renderSidebar();
}

function saveCurrentAsClient() {
  const company = val('clientCompany').trim();
  const name = val('clientName').trim();
  if (!company && !name) { alert('Enter client name or company first.'); return; }
  const newClient = {
    id: Date.now(), name, company,
    email: val('clientEmail'), address: val('clientAddress'),
    suburb: val('clientSuburb'), state: val('clientState'), postcode: val('clientPostcode'),
  };
  const list = getSavedClients();
  list.push(newClient);
  saveClientsStorage(list);
  sectionState.clients = true;
  renderSidebar();
  showToast('Client saved!');
}

// ── Sidebar Accordion ─────────────────────────────────
function toggleSection(name) {
  sectionState[name] = !sectionState[name];
  renderSidebar();
}

function renderSidebar() {
  const container = document.getElementById('sb-content');
  if (!container) return;
  const senders = getSenders();
  const clients = getSavedClients();
  const invoices = getSavedInvoices();
  container.innerHTML =
    buildSection('senders', 'Senders', senders.length, buildSendersContent(senders)) +
    buildSection('clients', 'Clients', clients.length, buildClientsContent(clients)) +
    buildSection('invoices', 'Past Invoices', invoices.length, buildInvoicesContent(invoices));
}

function buildSection(name, title, count, content) {
  const open = sectionState[name];
  return `
    <div class="sb-section">
      <button class="sb-hdr" onclick="toggleSection('${name}')">
        <span class="sb-hdr-title">${title}</span>
        <span class="sb-hdr-right">
          ${count > 0 ? `<span class="sb-count">${count}</span>` : ''}
          <span class="sb-chevron">${open ? '▾' : '▸'}</span>
        </span>
      </button>
      <div class="sb-body${open ? '' : ' sb-closed'}">${content}</div>
    </div>`;
}

function buildSendersContent(senders) {
  if (!senders.length) return '<p class="sb-empty">No senders saved.<br>Fill Your Details &amp; click "Save as Sender".</p>';
  return senders.map(s => {
    const active = s.id === activeSenderId;
    return `<div class="sb-item${active ? ' sb-item--active' : ''}" onclick="selectSender(${s.id}, true)">
      <div class="sb-item-info">
        <div class="sb-item-name">${escHtml(s.name)}</div>
        <div class="sb-item-sub">${escHtml(s.email || s.phone || '')}</div>
      </div>
      ${active ? '<span class="sb-active-mark">✓</span>' : ''}
      <button class="sb-del-btn" onclick="event.stopPropagation();deleteSender(${s.id})" title="Delete">✕</button>
    </div>`;
  }).join('');
}

function buildClientsContent(clients) {
  if (!clients.length) return '<p class="sb-empty">No clients saved.<br>Fill Bill To &amp; click "Save as Client".</p>';
  return clients.map(c => `
    <div class="sb-item" onclick="selectClient(${c.id})">
      <div class="sb-item-info">
        <div class="sb-item-name">${escHtml(c.company || c.name || 'Client')}</div>
        <div class="sb-item-sub">${escHtml(c.email || '')}</div>
      </div>
      <button class="sb-del-btn" onclick="event.stopPropagation();deleteSavedClient(${c.id})" title="Delete">✕</button>
    </div>`).join('');
}

function buildInvoicesContent(invoices) {
  if (!invoices.length) return '<p class="sb-empty">No invoices yet.<br>Click "Download as PDF".</p>';
  const fmtDate = (s) => { if (!s) return '—'; const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; };
  const fmtAmt = (sym, n) => `${sym}${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  return invoices.map(inv => {
    const client = (inv.clientCompany || inv.clientName || 'Client').slice(0, 22);
    return `<div class="sb-invoice-item">
      <div class="sb-invoice-top">
        <span class="sb-invoice-num">${escHtml(inv.invoiceNumber)}</span>
        <button class="sb-del-btn" onclick="deleteInvoice(${inv.id})" title="Delete">✕</button>
      </div>
      <div class="sb-invoice-client">${escHtml(client)}</div>
      <div class="sb-invoice-meta">
        <span>${fmtDate(inv.invoiceDate)}</span>
        <strong>${fmtAmt(inv.sym || 'A$', inv.total)}</strong>
      </div>
      <button class="sb-dl-btn" onclick="redownloadInvoice(${inv.id}, this)">↓ Download PDF</button>
    </div>`;
  }).join('');
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
        ${SERVICE_OPTIONS.slice(1).map(opt => `<option value="${opt}" ${s.description === opt && !s.isCustom ? 'selected' : ''}>${opt}</option>`).join('')}
        <option value="__custom__" ${s.isCustom ? 'selected' : ''}>✏️ Custom service...</option>
      </select>
      ${s.isCustom ? `<input type="text" class="service-desc" placeholder="Enter custom service name"
        value="${escHtml(s.description)}" oninput="updateServiceField(${s.id}, 'description', this.value)" style="margin-bottom:8px" />` : ''}
      <div class="service-row">
        <div>
          <label>Quantity</label>
          <input type="number" min="0" step="1" value="${s.quantity}" oninput="updateServiceField(${s.id}, 'quantity', parseFloat(this.value)||0)" />
        </div>
        <div>
          <label>Unit Price</label>
          <input type="number" min="0" step="0.01" value="${s.unitPrice}" oninput="updateServiceField(${s.id}, 'unitPrice', parseFloat(this.value)||0)" />
        </div>
      </div>
    </div>`).join('');
}

function handleServiceType(id, select) {
  const v = select.value;
  if (v === '__custom__') {
    services = services.map(s => s.id === id ? { ...s, description: '', isCustom: true } : s);
  } else {
    services = services.map(s => s.id === id ? { ...s, description: v, isCustom: false } : s);
  }
  renderServices(); update();
}

function updateServiceField(id, field, value) {
  services = services.map(s => s.id === id ? { ...s, [field]: value } : s);
  update();
}

function addService() {
  services.push({ id: serviceIdCounter++, description: '', quantity: 1, unitPrice: 0, isCustom: false });
  renderServices(); update();
}

function removeService(id) {
  services = services.filter(s => s.id !== id);
  renderServices(); update();
}

// ── Update Preview ────────────────────────────────────
function update() {
  const currency = val('currency');
  const sym = CURRENCY[currency] || 'A$';
  const fmt = (n) => `${sym}${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  const fmtDate = (s) => { if (!s) return '—'; const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; };

  const prevLogo = document.getElementById('prev-logo');
  const prevBiz = document.getElementById('prev-biz-name');
  if (logoData) {
    prevLogo.src = logoData; prevLogo.style.display = 'block'; prevBiz.textContent = '';
  } else {
    prevLogo.style.display = 'none'; prevBiz.textContent = val('providerName') || 'Your Business';
  }

  setText('prev-inv-num', val('invoiceNumber') || 'INV-001');
  setText('prev-inv-date', fmtDate(val('invoiceDate')));
  const due = val('dueDate');
  setText('prev-due-date', fmtDate(due));
  document.getElementById('prev-due-wrap').style.display = due ? 'block' : 'none';

  setText('prev-provider-name', val('providerName'));
  setHtml('prev-provider-abn', val('providerABN') ? `ABN: ${val('providerABN')}` : '');
  setHtml('prev-provider-addr', [
    val('providerAddress'),
    [val('providerSuburb'), val('providerState'), val('providerPostcode')].filter(Boolean).join(', '),
    val('providerEmail'), val('providerPhone'),
  ].filter(Boolean).join('<br>'));

  const clientCo = val('clientCompany');
  setText('prev-client-company', clientCo);
  document.getElementById('prev-client-company').style.cssText = clientCo ? 'font-weight:700;font-size:15px' : 'font-weight:400;font-size:13px';
  setText('prev-client-name', val('clientName'));
  document.getElementById('prev-client-name').style.cssText = clientCo ? 'font-weight:400;font-size:13px' : 'font-weight:700;font-size:15px';
  setHtml('prev-client-addr', [
    val('clientAddress'),
    [val('clientSuburb'), val('clientState'), val('clientPostcode')].filter(Boolean).join(', '),
    val('clientEmail'),
  ].filter(Boolean).join('<br>'));

  document.getElementById('prev-services').innerHTML = services.map(s => `
    <tr>
      <td class="col-desc">${escHtml(s.description) || '<em style="color:#d1d5db">No description</em>'}</td>
      <td class="col-qty">${s.quantity}</td>
      <td class="col-price">${fmt(s.unitPrice)}</td>
      <td class="col-total">${fmt(s.quantity * s.unitPrice)}</td>
    </tr>`).join('');

  const subtotal = services.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0);
  const taxRate = parseFloat(val('taxRate')) || 0;
  const taxAmt = subtotal * taxRate / 100;
  const total = subtotal + taxAmt;

  setText('prev-subtotal', fmt(subtotal));
  document.getElementById('prev-tax-row').style.display = taxRate > 0 ? 'flex' : 'none';
  setText('prev-tax-label', `Tax (${taxRate}%)`);
  setText('prev-tax-amt', fmt(taxAmt));
  setText('prev-total-label', `Total (${currency})`);
  setText('prev-total-amt', fmt(total));

  const notes = val('notes');
  document.getElementById('prev-notes-wrap').style.display = notes ? 'block' : 'none';
  setText('prev-notes', notes);
}

// ── PDF Download ──────────────────────────────────────
async function downloadPDF() {
  const invoiceData = captureInvoiceData();
  const btn = document.querySelector('.btn-download');
  const label = document.getElementById('btn-label');
  btn.disabled = true; label.textContent = 'Generating PDF...';
  try {
    const el = document.getElementById('invoice-preview');
    const scaler = el.parentElement;
    const prevTransform = scaler.style.transform;
    const prevWidth = scaler.style.width;
    scaler.style.transform = 'none';
    scaler.style.width = '794px';

    const canvas = await html2canvas(el, {
      scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
      width: el.scrollWidth, height: el.scrollHeight, windowWidth: 794,
    });

    scaler.style.transform = prevTransform;
    scaler.style.width = prevWidth;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`Invoice-${document.getElementById('invoiceNumber').value || 'invoice'}.pdf`);
    saveToHistory(invoiceData);
  } catch (e) { console.error(e); }
  finally { btn.disabled = false; label.textContent = 'Download as PDF'; }
}

// ── Invoice History ───────────────────────────────────
function getSavedInvoices() {
  try { return JSON.parse(localStorage.getItem('inv_history') || '[]'); } catch { return []; }
}

function captureInvoiceData() {
  const currency = val('currency');
  const sym = CURRENCY[currency] || 'A$';
  const subtotal = services.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0);
  const taxRate = parseFloat(val('taxRate')) || 0;
  const taxAmt = subtotal * taxRate / 100;
  return {
    id: Date.now(),
    invoiceNumber: val('invoiceNumber') || 'INV-001',
    invoiceDate: val('invoiceDate'), dueDate: val('dueDate'),
    currency, sym, subtotal, taxRate, taxAmt, total: subtotal + taxAmt,
    providerName: val('providerName'), providerABN: val('providerABN'),
    providerEmail: val('providerEmail'), providerPhone: val('providerPhone'),
    providerAddress: val('providerAddress'), providerSuburb: val('providerSuburb'),
    providerState: val('providerState'), providerPostcode: val('providerPostcode'),
    clientName: val('clientName'), clientCompany: val('clientCompany'),
    clientEmail: val('clientEmail'), clientAddress: val('clientAddress'),
    clientSuburb: val('clientSuburb'), clientState: val('clientState'), clientPostcode: val('clientPostcode'),
    notes: val('notes'), logoData, services: JSON.parse(JSON.stringify(services)),
  };
}

function saveToHistory(data) {
  let list = getSavedInvoices();
  list.unshift(data);
  if (list.length > 20) list.length = 20;
  try {
    localStorage.setItem('inv_history', JSON.stringify(list));
  } catch {
    const slim = list.map(i => ({ ...i, logoData: null }));
    try { localStorage.setItem('inv_history', JSON.stringify(slim)); } catch {}
  }
  sectionState.invoices = true;
  if (document.getElementById('dashboard-view').style.display !== 'none') {
    renderDashboard();
  } else {
    renderSidebar();
  }
}

async function redownloadInvoice(id, btn) {
  const data = getSavedInvoices().find(i => i.id === id);
  if (!data) return;
  const orig = btn.textContent;
  btn.disabled = true; btn.textContent = 'Generating…';
  let container;
  try {
    container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;z-index:-1;';
    container.innerHTML = buildInvoiceHTML(data);
    document.body.appendChild(container);
    await new Promise(r => setTimeout(r, 80));
    const el = container.querySelector('.invoice-paper');
    const canvas = await html2canvas(el, {
      scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
      width: el.scrollWidth, height: el.scrollHeight, windowWidth: 794,
    });
    document.body.removeChild(container);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`Invoice-${data.invoiceNumber}.pdf`);
  } catch (e) {
    console.error(e);
    try { if (container) document.body.removeChild(container); } catch {}
  } finally { btn.disabled = false; btn.textContent = orig; }
}

function deleteInvoice(id) {
  localStorage.setItem('inv_history', JSON.stringify(getSavedInvoices().filter(i => i.id !== id)));
  renderSidebar();
}

function buildInvoiceHTML(data) {
  const sym = data.sym || 'A$';
  const fmt = (n) => `${sym}${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  const fmtDate = (s) => { if (!s) return '—'; const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; };
  const pLines = [data.providerAddress, [data.providerSuburb, data.providerState, data.providerPostcode].filter(Boolean).join(', '), data.providerEmail, data.providerPhone].filter(Boolean).join('<br>');
  const cLines = [data.clientAddress, [data.clientSuburb, data.clientState, data.clientPostcode].filter(Boolean).join(', '), data.clientEmail].filter(Boolean).join('<br>');
  const clientCoStyle = data.clientCompany ? 'font-weight:700;font-size:15px;' : 'font-weight:400;font-size:13px;';
  const clientNameStyle = data.clientCompany ? 'font-weight:400;font-size:13px;' : 'font-weight:700;font-size:15px;';
  return `<div class="invoice-paper">
    <div class="inv-header">
      <div class="inv-logo-block">
        ${data.logoData ? `<img src="${data.logoData}" alt="" style="display:block;max-height:80px;max-width:200px;object-fit:contain"/>` : `<div class="inv-biz-name">${escHtml(data.providerName || '')}</div>`}
      </div>
      <div class="inv-title-block">
        <div class="inv-title">INVOICE</div>
        <div class="inv-meta">
          <div><strong>Invoice #:</strong> ${escHtml(data.invoiceNumber)}</div>
          <div><strong>Date:</strong> ${fmtDate(data.invoiceDate)}</div>
          ${data.dueDate ? `<div><strong>Due:</strong> ${fmtDate(data.dueDate)}</div>` : ''}
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
      <thead><tr>
        <th class="col-desc">Description</th><th class="col-qty">Qty</th>
        <th class="col-price">Unit Price</th><th class="col-total">Amount</th>
      </tr></thead>
      <tbody>${(data.services || []).map(s => `<tr>
        <td class="col-desc">${escHtml(s.description) || '<em style="color:#d1d5db">No description</em>'}</td>
        <td class="col-qty">${s.quantity}</td>
        <td class="col-price">${fmt(s.unitPrice)}</td>
        <td class="col-total">${fmt(s.quantity * s.unitPrice)}</td>
      </tr>`).join('')}</tbody>
    </table>
    <div class="inv-totals-wrap"><div class="inv-totals">
      <div class="inv-total-row"><span>Subtotal</span><span>${fmt(data.subtotal)}</span></div>
      ${data.taxRate > 0 ? `<div class="inv-total-row"><span>Tax (${data.taxRate}%)</span><span>${fmt(data.taxAmt)}</span></div>` : ''}
      <div class="inv-total-grand"><span>Total (${data.currency || 'AUD'})</span><span>${fmt(data.total)}</span></div>
    </div></div>
    ${data.notes ? `<div class="inv-notes-wrap"><div class="inv-notes-label">Notes &amp; Payment Terms</div><div class="inv-notes-text">${escHtml(data.notes)}</div></div>` : ''}
    <div class="inv-footer">Generated with Invoice Generator</div>
  </div>`;
}

// ── Toast ─────────────────────────────────────────────
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('toast--show'));
  setTimeout(() => {
    t.classList.remove('toast--show');
    setTimeout(() => document.body.removeChild(t), 300);
  }, 2000);
}

// ── Helpers ───────────────────────────────────────────
function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }
function setHtml(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
