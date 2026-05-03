import { useEffect, useRef, useState } from 'react'
import { Plus, Paperclip, Trash2, X, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Transaction, Account, Category } from '../types/database'

interface ExpenseForm {
  amount: string
  description: string
  notes: string
  date: string
  account_id: string
  category_id: string
}

const emptyForm: ExpenseForm = {
  amount: '', description: '', notes: '',
  date: new Date().toISOString().slice(0, 10),
  account_id: '', category_id: '',
}

type ExpenseWithRels = Transaction & { category_name?: string; category_color?: string; category_icon?: string }

export default function Expenses() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<ExpenseWithRels[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ExpenseForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    if (!user) return
    const [txRes, accRes, catRes] = await Promise.all([
      supabase.from('transactions').select('*, categories(name, color, icon), accounts(name)')
        .eq('user_id', user.id).eq('type', 'expense').order('date', { ascending: false }),
      supabase.from('accounts').select('*').eq('user_id', user.id),
      supabase.from('categories').select('*').eq('user_id', user.id).eq('type', 'expense'),
    ])
    setExpenses((txRes.data ?? []).map((t: any) => ({
      ...t,
      category_name: t.categories?.name,
      category_color: t.categories?.color,
      category_icon: t.categories?.icon,
    })))
    setAccounts(accRes.data ?? [])
    setCategories(catRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)

    let receipt_url: string | null = null

    if (receiptFile) {
      setUploading(true)
      const ext = receiptFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { data } = await supabase.storage.from('receipts').upload(path, receiptFile)
      if (data) {
        const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(data.path)
        receipt_url = urlData.publicUrl
      }
      setUploading(false)
    }

    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'expense',
      amount: parseFloat(form.amount),
      description: form.description,
      notes: form.notes || null,
      date: form.date,
      account_id: form.account_id,
      category_id: form.category_id || null,
      receipt_url,
    })

    setSaving(false)
    setShowModal(false)
    setForm(emptyForm)
    setReceiptFile(null)
    load()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const total = expenses.reduce((s, e) => s + e.amount, 0)

  // Group by category for summary
  const byCategory = expenses.reduce<Record<string, { name: string; color: string; icon: string; total: number }>>((acc, e) => {
    const key = e.category_id ?? 'uncategorized'
    if (!acc[key]) acc[key] = { name: e.category_name ?? 'Uncategorized', color: e.category_color ?? '#94a3b8', icon: e.category_icon ?? '📦', total: 0 }
    acc[key].total += e.amount
    return acc
  }, {})

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
          <p className="text-sm text-gray-500 mt-0.5">Total: <span className="font-semibold text-red-500">{fmt(total)}</span></p>
        </div>
        <button onClick={() => { setShowModal(true); setForm(emptyForm); setReceiptFile(null) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {/* Category breakdown */}
      {!loading && Object.keys(byCategory).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">By Category</h3>
          <div className="flex flex-wrap gap-2">
            {Object.values(byCategory).sort((a, b) => b.total - a.total).map(cat => (
              <div key={cat.name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                <span>{cat.icon}</span>
                <span className="text-sm text-gray-700">{cat.name}</span>
                <span className="text-sm font-semibold text-gray-900">{fmt(cat.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No expenses yet</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {expenses.map(exp => (
              <li key={exp.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{exp.description}</p>
                    {exp.receipt_url && (
                      <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer"
                        className="text-indigo-500 hover:text-indigo-700 shrink-0" title="View receipt">
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(exp.date).toLocaleDateString()}
                    {exp.category_name && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: exp.category_color }} />
                        {exp.category_icon} {exp.category_name}
                      </span>
                    )}
                    {exp.notes && ` · ${exp.notes}`}
                  </p>
                </div>
                <span className="text-sm font-semibold text-red-500 shrink-0">{fmt(exp.amount)}</span>
                <button onClick={() => handleDelete(exp.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 transition-all shrink-0">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Log Expense</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <input required type="number" min="0.01" step="0.01" placeholder="Amount"
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input required type="text" placeholder="Description"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <textarea placeholder="Notes (optional)" rows={2}
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <input required type="date"
                value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select required value={form.account_id} onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Category (optional)</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>

              {/* Receipt upload */}
              <div>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
                  onChange={e => setReceiptFile(e.target.files?.[0] ?? null)} />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                  <Paperclip size={14} />
                  {receiptFile ? receiptFile.name : 'Attach receipt (optional)'}
                </button>
              </div>

              <button type="submit" disabled={saving || uploading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {uploading ? 'Uploading…' : saving ? 'Saving…' : 'Log Expense'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
