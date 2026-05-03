import { useEffect, useState } from 'react'
import { Plus, X, Trash2, CheckCircle, Send, Printer, Settings } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { printInvoice, type BusinessInfo } from '../lib/printInvoice'
import type { Invoice, InvoiceItem } from '../types/database'

interface LineItem { description: string; quantity: string; unit_price: string }
interface InvoiceForm {
  client_name: string; client_email: string; client_address: string; client_pan: string
  date: string; due_date: string; notes: string; tax_rate: string
  items: LineItem[]
}

const emptyForm = (): InvoiceForm => ({
  client_name: '', client_email: '', client_address: '', client_pan: '',
  date: new Date().toISOString().slice(0, 10),
  due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  notes: '', tax_rate: '0',
  items: [{ description: '', quantity: '1', unit_price: '' }],
})

const BUSINESS_KEY = 'ledger_business_info'
const loadBusiness = (): BusinessInfo => {
  try { return JSON.parse(localStorage.getItem(BUSINESS_KEY) ?? '{}') } catch { return { name: '', address: '', pan: '', email: '' } }
}

const STATUS_STYLE: Record<Invoice['status'], string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-50 text-blue-700',
  paid: 'bg-green-50 text-green-700',
}

export default function Invoices() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState<(Invoice & { items: InvoiceItem[] }) | null>(null)
  const [showBusiness, setShowBusiness] = useState(false)
  const [form, setForm] = useState<InvoiceForm>(emptyForm())
  const [business, setBusiness] = useState<BusinessInfo>(loadBusiness())
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!user) return
    const { data } = await supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setInvoices(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const openDetail = async (inv: Invoice) => {
    const { data } = await supabase.from('invoice_items').select('*').eq('invoice_id', inv.id)
    setShowDetail({ ...inv, items: data ?? [] })
  }

  const calcTotals = (items: LineItem[], taxRate: number) => {
    const subtotal = items.reduce((s, i) => s + (parseFloat(i.quantity || '0') * parseFloat(i.unit_price || '0')), 0)
    const tax_amount = subtotal * (taxRate / 100)
    return { subtotal, tax_amount, total: subtotal + tax_amount }
  }

  const saveBusiness = (info: BusinessInfo) => {
    localStorage.setItem(BUSINESS_KEY, JSON.stringify(info))
    setBusiness(info)
    setShowBusiness(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)

    const taxRate = parseFloat(form.tax_rate || '0')
    const { subtotal, tax_amount, total } = calcTotals(form.items, taxRate)
    const invoice_number = `INV-${String(invoices.length + 1).padStart(4, '0')}`

    const { data: inv } = await supabase.from('invoices').insert({
      user_id: user.id, invoice_number,
      client_name: form.client_name,
      client_email: form.client_email || null,
      client_address: form.client_address || null,
      client_pan: form.client_pan || null,
      date: form.date, due_date: form.due_date,
      notes: form.notes || null,
      tax_rate: taxRate, subtotal, tax_amount, total,
    }).select().single()

    if (inv) {
      const lineItems = form.items.filter(i => i.description && i.unit_price).map(i => ({
        invoice_id: inv.id, description: i.description,
        quantity: parseFloat(i.quantity), unit_price: parseFloat(i.unit_price),
        amount: parseFloat(i.quantity) * parseFloat(i.unit_price),
      }))
      if (lineItems.length) await supabase.from('invoice_items').insert(lineItems)
    }

    setSaving(false)
    setShowModal(false)
    setForm(emptyForm())
    load()
  }

  const updateStatus = async (id: string, status: Invoice['status']) => {
    await supabase.from('invoices').update({ status }).eq('id', id)
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    if (showDetail?.id === id) setShowDetail(prev => prev ? { ...prev, status } : null)
  }

  const deleteInvoice = async (id: string) => {
    await supabase.from('invoices').delete().eq('id', id)
    setInvoices(prev => prev.filter(i => i.id !== id))
    setShowDetail(null)
  }

  const setItem = (idx: number, field: keyof LineItem, value: string) =>
    setForm(f => ({ ...f, items: f.items.map((item, i) => i === idx ? { ...item, [field]: value } : item) }))

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: '', quantity: '1', unit_price: '' }] }))
  const removeItem = (idx: number) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n)
  const previewTotals = calcTotals(form.items, parseFloat(form.tax_rate || '0'))

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowBusiness(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg transition-colors">
            <Settings size={15} /> Business Info
          </button>
          <button onClick={() => { setShowModal(true); setForm(emptyForm()) }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={15} /> New Invoice
          </button>
        </div>
      </div>

      {/* Summary chips */}
      {!loading && (
        <div className="flex gap-3">
          {(['draft', 'sent', 'paid'] as const).map(s => {
            const count = invoices.filter(i => i.status === s).length
            const total = invoices.filter(i => i.status === s).reduce((sum, i) => sum + i.total, 0)
            return (
              <div key={s} className={`px-4 py-2 rounded-lg border text-sm ${STATUS_STYLE[s]}`}>
                <span className="font-semibold capitalize">{s}</span>
                <span className="ml-2 opacity-70">{count} · {fmt(total)}</span>
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No invoices yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">Invoice</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">Client</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">Date</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">Due</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 text-right">Total</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 group cursor-pointer" onClick={() => openDetail(inv)}>
                  <td className="px-5 py-3 font-medium text-indigo-600">{inv.invoice_number}</td>
                  <td className="px-5 py-3 text-gray-900">{inv.client_name}</td>
                  <td className="px-5 py-3 text-gray-500">{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-gray-500">{new Date(inv.due_date).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_STYLE[inv.status]}`}>{inv.status}</span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-900 text-right">{fmt(inv.total)}</td>
                  <td className="px-5 py-3 opacity-0 group-hover:opacity-100">
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      {inv.status === 'draft' && (
                        <button onClick={() => updateStatus(inv.id, 'sent')} title="Mark as sent"
                          className="p-1 rounded text-gray-400 hover:text-blue-600"><Send size={13} /></button>
                      )}
                      {inv.status !== 'paid' && (
                        <button onClick={() => updateStatus(inv.id, 'paid')} title="Mark as paid"
                          className="p-1 rounded text-gray-400 hover:text-green-600"><CheckCircle size={13} /></button>
                      )}
                      <button onClick={() => deleteInvoice(inv.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail drawer */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-lg shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-gray-900">{showDetail.invoice_number}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_STYLE[showDetail.status]}`}>{showDetail.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => printInvoice(showDetail, business)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  <Printer size={14} /> Print
                </button>
                <button onClick={() => setShowDetail(null)} className="p-1 rounded text-gray-400 hover:bg-gray-100"><X size={18} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-gray-400">Client</p><p className="font-medium">{showDetail.client_name}</p></div>
                {showDetail.client_email && <div><p className="text-xs text-gray-400">Email</p><p>{showDetail.client_email}</p></div>}
                {showDetail.client_pan && <div><p className="text-xs text-gray-400">Client PAN</p><p className="font-mono font-medium">{showDetail.client_pan}</p></div>}
                <div><p className="text-xs text-gray-400">Invoice Date</p><p>{new Date(showDetail.date).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-gray-400">Due Date</p><p>{new Date(showDetail.due_date).toLocaleDateString()}</p></div>
              </div>

              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Item</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Price</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {showDetail.items.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-2">{item.description}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{item.quantity}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{fmt(item.unit_price)}</td>
                      <td className="px-4 py-2 text-right font-medium">{fmt(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="space-y-1 text-sm text-right">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmt(showDetail.subtotal)}</span></div>
                {showDetail.tax_rate > 0 && <div className="flex justify-between text-gray-500"><span>Tax ({showDetail.tax_rate}%)</span><span>{fmt(showDetail.tax_amount)}</span></div>}
                <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-1"><span>Total</span><span>{fmt(showDetail.total)}</span></div>
              </div>

              {showDetail.notes && (
                <div className="text-sm text-gray-500 border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold text-gray-400 mb-1">Notes</p>
                  <p>{showDetail.notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 p-4 border-t border-gray-200">
              {showDetail.status === 'draft' && (
                <button onClick={() => updateStatus(showDetail.id, 'sent')}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">Mark as Sent</button>
              )}
              {showDetail.status !== 'paid' && (
                <button onClick={() => updateStatus(showDetail.id, 'paid')}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg">Mark as Paid</button>
              )}
              <button onClick={() => deleteInvoice(showDetail.id)}
                className="px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Business Info modal */}
      {showBusiness && (
        <BusinessInfoModal business={business} onSave={saveBusiness} onClose={() => setShowBusiness(false)} />
      )}

      {/* Create invoice modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">New Invoice</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Client Name *</label>
                  <input required type="text" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Client Email</label>
                  <input type="email" value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Client PAN</label>
                  <input type="text" placeholder="e.g. ABCDE1234F" maxLength={10}
                    value={form.client_pan} onChange={e => setForm(f => ({ ...f, client_pan: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Client Address</label>
                  <textarea rows={2} value={form.client_address} onChange={e => setForm(f => ({ ...f, client_address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tax Rate (%)</label>
                  <input type="number" min="0" max="100" step="0.01" value={form.tax_rate} onChange={e => setForm(f => ({ ...f, tax_rate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div />
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Invoice Date *</label>
                  <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Due Date *</label>
                  <input required type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Line Items</label>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input type="text" placeholder="Description" value={item.description}
                        onChange={e => setItem(idx, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <input type="number" placeholder="Qty" value={item.quantity} min="0" step="0.01"
                        onChange={e => setItem(idx, 'quantity', e.target.value)}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <input type="number" placeholder="Price" value={item.unit_price} min="0" step="0.01"
                        onChange={e => setItem(idx, 'unit_price', e.target.value)}
                        className="w-24 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <span className="w-20 flex items-center justify-end text-sm font-medium text-gray-700">
                        {fmt(parseFloat(item.quantity || '0') * parseFloat(item.unit_price || '0'))}
                      </span>
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="p-2 text-gray-400 hover:text-red-500"><X size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem} className="mt-2 text-sm text-indigo-600 hover:underline">+ Add line item</button>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmt(previewTotals.subtotal)}</span></div>
                {parseFloat(form.tax_rate) > 0 && <div className="flex justify-between text-gray-500"><span>Tax ({form.tax_rate}%)</span><span>{fmt(previewTotals.tax_amount)}</span></div>}
                <div className="flex justify-between font-bold text-gray-900"><span>Total</span><span>{fmt(previewTotals.total)}</span></div>
              </div>

              <textarea placeholder="Notes (optional)" rows={2} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />

              <button type="submit" disabled={saving}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                {saving ? 'Creating…' : 'Create Invoice'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function BusinessInfoModal({ business, onSave, onClose }: {
  business: BusinessInfo
  onSave: (b: BusinessInfo) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<BusinessInfo>({ ...business })

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold">Business Information</h3>
            <p className="text-xs text-gray-400 mt-0.5">Appears on printed invoices</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Business Name</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Business PAN</label>
            <input type="text" placeholder="e.g. ABCDE1234F" maxLength={10}
              value={form.pan} onChange={e => setForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <textarea rows={3} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <button onClick={() => onSave(form)}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
