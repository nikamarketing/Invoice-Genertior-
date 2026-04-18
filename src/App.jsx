import { useState, useRef } from 'react'
import InvoiceForm from './components/InvoiceForm'
import InvoicePreview from './components/InvoicePreview'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const today = new Date().toISOString().split('T')[0]
const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

const initialState = {
  logo: null,
  provider: {
    name: '',
    address: '',
    suburb: '',
    state: '',
    postcode: '',
    email: '',
    phone: '',
    taxNumber: '',
  },
  client: {
    name: '',
    company: '',
    address: '',
    suburb: '',
    state: '',
    postcode: '',
    email: '',
  },
  invoiceNumber: 'INV-001',
  invoiceDate: today,
  dueDate: thirtyDaysLater,
  currency: 'AUD',
  taxRate: 10,
  services: [
    { id: 1, description: '', quantity: 1, unitPrice: 0 },
  ],
  notes: 'Thank you for your business! Please make payment by the due date.',
}

export default function App() {
  const [invoice, setInvoice] = useState(initialState)
  const [generating, setGenerating] = useState(false)
  const previewRef = useRef(null)

  const handleGeneratePDF = async () => {
    if (!previewRef.current) return
    setGenerating(true)
    try {
      const element = previewRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h1 className="text-2xl font-bold tracking-tight">Invoice Generator</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          {/* Form Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <InvoiceForm invoice={invoice} setInvoice={setInvoice} />
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <button
              onClick={handleGeneratePDF}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 px-6 rounded-xl shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-base"
            >
              {generating ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download as PDF
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400">Live preview — fill the form to see changes</p>

            <div className="overflow-auto rounded-xl shadow-lg border border-gray-200">
              <div style={{ transform: 'scale(0.75)', transformOrigin: 'top left', width: '133.33%' }}>
                <InvoicePreview ref={previewRef} invoice={invoice} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
