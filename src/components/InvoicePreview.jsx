import { forwardRef } from 'react'

const CURRENCY_INFO = {
  AUD: { symbol: 'A$', code: 'AUD' },
  USD: { symbol: '$', code: 'USD' },
  EUR: { symbol: '€', code: 'EUR' },
}

const fmt = (amount, currency) => {
  const { symbol } = CURRENCY_INFO[currency] || CURRENCY_INFO.AUD
  return `${symbol}${Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

const fmtDate = (str) => {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

const s = {
  page: {
    width: '794px',
    minHeight: '1123px',
    backgroundColor: '#ffffff',
    padding: '56px 60px',
    fontFamily: "'Arial', 'Helvetica Neue', Helvetica, sans-serif",
    color: '#1f2937',
    boxSizing: 'border-box',
  },
  accent: '#4338ca',
  accentLight: '#eef2ff',
}

const InvoicePreview = forwardRef(({ invoice }, ref) => {
  const subtotal = invoice.services.reduce((sum, srv) => sum + srv.quantity * srv.unitPrice, 0)
  const taxAmount = subtotal * (invoice.taxRate / 100)
  const total = subtotal + taxAmount
  const { provider, client } = invoice

  const providerLines = [
    provider.address,
    [provider.suburb, provider.state, provider.postcode].filter(Boolean).join(', '),
    provider.email,
    provider.phone,
  ].filter(Boolean)

  const clientLines = [
    client.address,
    [client.suburb, client.state, client.postcode].filter(Boolean).join(', '),
    client.email,
  ].filter(Boolean)

  return (
    <div ref={ref} style={s.page}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '48px',
      }}>
        {/* Logo / Business name */}
        <div>
          {invoice.logo ? (
            <img
              src={invoice.logo}
              alt="Logo"
              style={{ maxHeight: '80px', maxWidth: '220px', objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <div style={{ fontSize: '22px', fontWeight: '800', color: s.accent, letterSpacing: '-0.5px' }}>
              {provider.name || 'Your Business'}
            </div>
          )}
        </div>

        {/* Invoice title + meta */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '36px', fontWeight: '900', color: s.accent, letterSpacing: '4px', lineHeight: 1 }}>
            INVOICE
          </div>
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280', lineHeight: '1.7' }}>
            <div><span style={{ fontWeight: '600', color: '#374151' }}>Invoice # </span>{invoice.invoiceNumber}</div>
            <div><span style={{ fontWeight: '600', color: '#374151' }}>Date: </span>{fmtDate(invoice.invoiceDate)}</div>
            {invoice.dueDate && (
              <div><span style={{ fontWeight: '600', color: '#374151' }}>Due: </span>{fmtDate(invoice.dueDate)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '3px', backgroundColor: s.accent, borderRadius: '2px', marginBottom: '36px' }} />

      {/* From / Bill To */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '48px', gap: '32px' }}>
        {/* From */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '10px', fontWeight: '800', color: s.accent,
            textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px',
          }}>From</div>
          {invoice.logo && provider.name && (
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '2px' }}>
              {provider.name}
            </div>
          )}
          {provider.taxNumber && (
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
              ABN: {provider.taxNumber}
            </div>
          )}
          {providerLines.map((line, i) => (
            <div key={i} style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>{line}</div>
          ))}
        </div>

        {/* Bill To */}
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{
            fontSize: '10px', fontWeight: '800', color: s.accent,
            textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px',
          }}>Bill To</div>
          {client.company && (
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '2px' }}>
              {client.company}
            </div>
          )}
          {client.name && (
            <div style={{
              fontSize: client.company ? '13px' : '15px',
              fontWeight: client.company ? '400' : '700',
              color: '#111827',
              marginBottom: '2px',
            }}>
              {client.name}
            </div>
          )}
          {clientLines.map((line, i) => (
            <div key={i} style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>{line}</div>
          ))}
        </div>
      </div>

      {/* Services Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
        <thead>
          <tr>
            <th style={{
              padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700',
              backgroundColor: s.accent, color: '#ffffff', borderRadius: '6px 0 0 6px',
            }}>Description</th>
            <th style={{
              padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '700',
              backgroundColor: s.accent, color: '#ffffff', width: '70px',
            }}>Qty</th>
            <th style={{
              padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '700',
              backgroundColor: s.accent, color: '#ffffff', width: '130px',
            }}>Unit Price</th>
            <th style={{
              padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '700',
              backgroundColor: s.accent, color: '#ffffff', width: '130px', borderRadius: '0 6px 6px 0',
            }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.services.map((srv, i) => (
            <tr key={srv.id} style={{ backgroundColor: i % 2 === 0 ? '#f9fafb' : '#ffffff' }}>
              <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                {srv.description || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>No description</span>}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                {srv.quantity}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                {fmt(srv.unitPrice, invoice.currency)}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#111827', borderBottom: '1px solid #e5e7eb' }}>
                {fmt(srv.quantity * srv.unitPrice, invoice.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
        <div style={{ width: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>
            <span>Subtotal</span>
            <span>{fmt(subtotal, invoice.currency)}</span>
          </div>
          {invoice.taxRate > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>
              <span>Tax ({invoice.taxRate}%)</span>
              <span>{fmt(taxAmount, invoice.currency)}</span>
            </div>
          )}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '14px 18px',
            backgroundColor: s.accent, color: '#ffffff',
            borderRadius: '10px', marginTop: '10px',
            fontSize: '16px', fontWeight: '700',
          }}>
            <span>Total ({invoice.currency})</span>
            <span>{fmt(total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '24px', marginTop: '8px' }}>
          <div style={{
            fontSize: '10px', fontWeight: '800', color: s.accent,
            textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px',
          }}>Notes & Payment Terms</div>
          <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
            {invoice.notes}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '60px', paddingTop: '20px',
        borderTop: '1px solid #f3f4f6',
        textAlign: 'center', fontSize: '11px', color: '#d1d5db',
      }}>
        Generated with Invoice Generator
      </div>
    </div>
  )
})

InvoicePreview.displayName = 'InvoicePreview'
export default InvoicePreview
