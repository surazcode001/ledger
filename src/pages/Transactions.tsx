import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Transaction, Account, Category } from '../types/database'

type TxType = 'income' | 'expense' | 'transfer'

interface TxForm {
  type: TxType
  amount: string
  description: string
  notes: string
  date: string
  account_id: string
  category_id: string
}

const emptyForm: TxForm = {
  type: 'expense', amount: '', description: '', notes: '',
  date: new Date().toISOString().slice(0, 10), account_id: '', category_id: '',
}

type TxWithRels = Transaction & { category_name?: string; account_name?: string }

export default function Transactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<TxWithRels[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [form, setForm] = useState<TxForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState<'all' | TxType>('all')

  const load = async () => {
    if (!user) return
    const [txRes, accRes, catRes] = await Promise.all([
      supabase.from('transactions').select('*, categories(name), accounts(name)').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('accounts').select('*').eq('user_id', user.id),
      supabase.from('categories').select('*').eq('user_id', user.id),
    ])
    setTransactions((txRes.data ?? []).map((t: any) => ({ ...t, category_name: t.categories?.name, account_name: t.accounts?.name })))
    setAccounts(accRes.data ?? [])
    setCategories(catRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const openNew = () => { setEditing(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (tx: Transaction) => {
    setEditing(tx)
    setForm({
      type: tx.type as TxType,
      amount: String(tx.amount),
      description: tx.description,
      notes: tx.notes ?? '',
      date: tx.date,
      account_id: tx.account_id,
      category_id: tx.category_id ?? '',
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)

    const payload = {
      type: form.type,
      amount: parseFloat(form.amount),
      description: form.description,
      notes: form.notes || null,
      date: form.date,
      account_id: form.account_id,
      category_id: form.category_id || null,
    }

    if (editing) {
      await supabase.from('transactions').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('transactions').insert({ ...payload, user_id: user.id })
    }

    setSaving(false)
    setShowModal(false)
    load()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const filtered = filterType === 'all' ? transactions : transactions.filter(t => t.type === filterType)
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={15} /> Add
        </button>
      </div>

      <div className="flex gap-2">
        {(['all', 'income', 'expense', 'transfer'] as const).map(f => (
          <button key={f} onClick={() => setFilterType(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors
              ${filterType === f ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No transactions found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">Date</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">Description</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">Category</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">Account</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 text-right">Amount</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50 group">
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{tx.description}</p>
                    {tx.notes && <p className="text-xs text-gray-400 mt-0.5">{tx.notes}</p>}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{tx.category_name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500">{tx.account_name ?? '—'}</td>
                  <td className={`px-5 py-3 font-semibold text-right whitespace-nowrap ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <button onClick={() => openEdit(tx)} className="p-1 rounded text-gray-400 hover:text-indigo-600 transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(tx.id)} className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">{editing ? 'Edit Transaction' : 'New Transaction'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="flex gap-2">
                {(['expense', 'income', 'transfer'] as TxType[]).map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors
                      ${form.type === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >{t}</button>
                ))}
              </div>

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
                {categories.filter(c => c.type === form.type || form.type === 'transfer').map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>

              <button type="submit" disabled={saving}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
