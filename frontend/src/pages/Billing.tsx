import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function Billing() {
  const [billingJobs, setBillingJobs] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [taxRate, setTaxRate] = useState(0)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [jobs, invoicesData] = await Promise.all([
        api.listJobs({ status: 'billing' }),
        api.listInvoices()
      ])
      setBillingJobs(jobs as any)
      setInvoices(invoicesData as any)
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  const handleCreateInvoice = async (jobId: number) => {
    try {
      await api.createAutoInvoice(jobId, taxRate)
      setMsg('Invoice created!')
      loadData()
    } catch (err: any) {
      setMsg(err.message)
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const handleMarkPaid = async (invoiceId: number) => {
    try {
      await api.markInvoicePaid(invoiceId)
      setMsg('Invoice marked as paid!')
      loadData()
    } catch (err: any) {
      setMsg(err.message)
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const loadInvoiceDetails = async (id: number) => {
    try {
      const invoice = await api.getInvoice(id)
      setSelectedInvoice(invoice)
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Billing Dashboard</h1>

      {msg && (
        <div className={`mb-4 p-4 rounded-lg ${msg.includes('success') || msg.includes('created') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {msg}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card-metallic">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#3b82f6' }}>Jobs Ready for Billing</h2>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              className="input-modern w-full"
              value={taxRate}
              onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div className="space-y-3">
            {billingJobs.map(job => (
              <div key={job.id} className="p-4 bg-gray-800/50 rounded-lg">
                <div className="font-semibold text-white">Job #{job.id}</div>
                <div className="text-sm text-gray-400 mb-3">
                  {job.vehicle?.registration_number} | {job.operations_stream?.replace('_', ' ')}
                </div>
                <button onClick={() => handleCreateInvoice(job.id)} className="btn-primary w-full text-sm">
                  Create Invoice
                </button>
              </div>
            ))}
            {billingJobs.length === 0 && (
              <p className="text-gray-400 text-center py-8">No jobs ready for billing</p>
            )}
          </div>
        </div>

        <div className="card-metallic">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#3b82f6' }}>Recent Invoices</h2>
          <div className="space-y-3">
            {invoices.slice(0, 10).map(invoice => (
              <div
                key={invoice.id}
                onClick={() => loadInvoiceDetails(invoice.id)}
                className="p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-white">{invoice.invoice_number}</div>
                    <div className="text-sm text-gray-400">Job #{invoice.job_id} | ${invoice.total.toFixed(2)}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${invoice.paid ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>
                    {invoice.paid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <p className="text-gray-400 text-center py-8">No invoices</p>
            )}
          </div>
        </div>
      </div>

      {selectedInvoice && (
        <div className="card-metallic">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Invoice {selectedInvoice.invoice_number}</h2>
              <p className="text-gray-400">Job #{selectedInvoice.job_id}</p>
            </div>
            {!selectedInvoice.paid && (
              <button onClick={() => handleMarkPaid(selectedInvoice.id)} className="btn-primary">
                Mark as Paid
              </button>
            )}
          </div>

          <div className="mb-6">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(75, 85, 99, 0.5)' }}>
                  <th className="text-left py-2 px-3 text-gray-400">Description</th>
                  <th className="text-right py-2 px-3 text-gray-400">Qty</th>
                  <th className="text-right py-2 px-3 text-gray-400">Unit Price</th>
                  <th className="text-right py-2 px-3 text-gray-400">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items?.map((item: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(31, 41, 55, 0.5)' }}>
                    <td className="py-2 px-3">{item.description}</td>
                    <td className="py-2 px-3 text-right">{item.quantity}</td>
                    <td className="py-2 px-3 text-right">${item.unit_price.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-2 px-3 text-right font-semibold">Subtotal:</td>
                  <td className="py-2 px-3 text-right font-semibold">${selectedInvoice.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-2 px-3 text-right font-semibold">Tax:</td>
                  <td className="py-2 px-3 text-right font-semibold">${selectedInvoice.tax.toFixed(2)}</td>
                </tr>
                <tr style={{ borderTop: '2px solid rgba(75, 85, 99, 0.5)' }}>
                  <td colSpan={3} className="py-2 px-3 text-right font-bold text-lg">Total:</td>
                  <td className="py-2 px-3 text-right font-bold text-lg">${selectedInvoice.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}


