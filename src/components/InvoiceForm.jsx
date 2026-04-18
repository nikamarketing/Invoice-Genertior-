import { useRef } from 'react'

const CURRENCIES = [
  { value: 'AUD', label: 'AUD — Australian Dollar (A$)' },
  { value: 'USD', label: 'USD — US Dollar ($)' },
  { value: 'EUR', label: 'EUR — Euro (€)' },
]

export default function InvoiceForm({ invoice, setInvoice }) {
  const fileInputRef = useRef(null)

  const update = (path, value) => {
    setInvoice(prev => {
      const keys = path.split('.')
      if (keys.length === 1) return { ...prev, [keys[0]]: value }
      if (keys.length === 2) return { ...prev, [keys[0]]: { ...prev[keys[0]], [keys[1]]: value } }
      return prev
    })
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => update('logo', ev.target.result)
    reader.readAsDataURL(file)
  }

  const addService = () => {
    setInvoice(prev => ({
      ...prev,
      services: [...prev.services, { id: Date.now(), description: '', quantity: 1, unitPrice: 0 }],
    }))
  }

  const removeService = (id) => {
    setInvoice(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== id),
    }))
  }

  const updateService = (id, field, value) => {
    setInvoice(prev => ({
      ...prev,
      services: prev.services.map(s => s.id === id ? { ...s, [field]: value } : s),
    }))
  }

  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"

  const Section = ({ title, children }) => (
    <div className="mb-7">
      <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3 pb-1.5 border-b border-indigo-100">
        {title}
      </h3>
      {children}
    </div>
  )

  const Field = ({ label, half, children }) => (
    <div className={`mb-3 ${half ? '' : ''}`}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Invoice Details</h2>

      {/* Logo */}
      <Section title="Logo">
        <div className="flex items-center gap-4">
          {invoice.logo ? (
            <img
              src={invoice.logo}
              alt="Logo"
              className="h-16 w-auto max-w-[160px] object-contain border border-gray-200 rounded-lg p-1 bg-white"
            />
          ) : (
            <div className="h-16 w-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs bg-gray-50">
              No logo
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Upload Logo
            </button>
            {invoice.logo && (
              <button
                onClick={() => update('logo', null)}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>
      </Section>

      {/* Invoice Info */}
      <Section title="Invoice Info">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Invoice Number">
            <input type="text" className={inp} value={invoice.invoiceNumber}
              onChange={e => update('invoiceNumber', e.target.value)} />
          </Field>
          <Field label="Currency">
            <select className={inp} value={invoice.currency}
              onChange={e => update('currency', e.target.value)}>
              {CURRENCIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Invoice Date">
            <input type="date" className={inp} value={invoice.invoiceDate}
              onChange={e => update('invoiceDate', e.target.value)} />
          </Field>
          <Field label="Due Date">
            <input type="date" className={inp} value={invoice.dueDate}
              onChange={e => update('dueDate', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Service Provider */}
      <Section title="Your Details (Service Provider)">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Business / Your Name">
            <input type="text" className={inp} placeholder="Acme Pty Ltd"
              value={invoice.provider.name} onChange={e => update('provider.name', e.target.value)} />
          </Field>
          <Field label="ABN / Tax Number">
            <input type="text" className={inp} placeholder="12 345 678 901"
              value={invoice.provider.taxNumber} onChange={e => update('provider.taxNumber', e.target.value)} />
          </Field>
          <Field label="Email">
            <input type="email" className={inp} placeholder="hello@yourco.com"
              value={invoice.provider.email} onChange={e => update('provider.email', e.target.value)} />
          </Field>
          <Field label="Phone">
            <input type="text" className={inp} placeholder="+61 400 000 000"
              value={invoice.provider.phone} onChange={e => update('provider.phone', e.target.value)} />
          </Field>
        </div>
        <Field label="Street Address">
          <input type="text" className={inp} placeholder="123 Main Street"
            value={invoice.provider.address} onChange={e => update('provider.address', e.target.value)} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="City / Suburb">
            <input type="text" className={inp} placeholder="Sydney"
              value={invoice.provider.suburb} onChange={e => update('provider.suburb', e.target.value)} />
          </Field>
          <Field label="State">
            <input type="text" className={inp} placeholder="NSW"
              value={invoice.provider.state} onChange={e => update('provider.state', e.target.value)} />
          </Field>
          <Field label="Postcode">
            <input type="text" className={inp} placeholder="2000"
              value={invoice.provider.postcode} onChange={e => update('provider.postcode', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Client */}
      <Section title="Bill To (Client Details)">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Client Name">
            <input type="text" className={inp} placeholder="Jane Smith"
              value={invoice.client.name} onChange={e => update('client.name', e.target.value)} />
          </Field>
          <Field label="Company (optional)">
            <input type="text" className={inp} placeholder="Client Co. Pty Ltd"
              value={invoice.client.company} onChange={e => update('client.company', e.target.value)} />
          </Field>
          <Field label="Email">
            <input type="email" className={inp} placeholder="jane@clientco.com"
              value={invoice.client.email} onChange={e => update('client.email', e.target.value)} />
          </Field>
        </div>
        <Field label="Street Address">
          <input type="text" className={inp} placeholder="456 Client Avenue"
            value={invoice.client.address} onChange={e => update('client.address', e.target.value)} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="City / Suburb">
            <input type="text" className={inp} placeholder="Melbourne"
              value={invoice.client.suburb} onChange={e => update('client.suburb', e.target.value)} />
          </Field>
          <Field label="State">
            <input type="text" className={inp} placeholder="VIC"
              value={invoice.client.state} onChange={e => update('client.state', e.target.value)} />
          </Field>
          <Field label="Postcode">
            <input type="text" className={inp} placeholder="3000"
              value={invoice.client.postcode} onChange={e => update('client.postcode', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Services */}
      <Section title="Services / Line Items">
        <div className="space-y-3">
          {invoice.services.map((service, index) => (
            <div key={service.id} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Item {index + 1}
                </span>
                {invoice.services.length > 1 && (
                  <button
                    onClick={() => removeService(service.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Service / product description"
                className={inp + ' mb-2 bg-white'}
                value={service.description}
                onChange={e => updateService(service.id, 'description', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className={inp + ' bg-white'}
                    value={service.quantity}
                    onChange={e => updateService(service.id, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inp + ' bg-white'}
                    value={service.unitPrice}
                    onChange={e => updateService(service.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={addService}
            className="w-full border-2 border-dashed border-indigo-300 hover:border-indigo-400 text-indigo-600 hover:bg-indigo-50 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            + Add Line Item
          </button>
        </div>
      </Section>

      {/* Tax & Notes */}
      <Section title="Tax & Notes">
        <Field label="Tax Rate (%)">
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            className={inp}
            value={invoice.taxRate}
            onChange={e => update('taxRate', parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Notes / Payment Terms">
          <textarea
            rows={3}
            className={inp}
            placeholder="Payment terms, bank details, thank you message..."
            value={invoice.notes}
            onChange={e => update('notes', e.target.value)}
          />
        </Field>
      </Section>
    </div>
  )
}
