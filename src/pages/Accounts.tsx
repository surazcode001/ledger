import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Account } from '../types/database'

type AccountType = Account['type']

const ACCOUNT_TYPES: AccountType[] = ['checking', 'savings', 'credit', 'cash', 'investment']

interface AccountForm {
  name: string
  type: AccountType
  balance: string
  currency: string
}

const emptyForm: AccountForm = { name: '', type: 'checking', balance: '0', currency: 'USD' }

export default function Accounts() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<AccountForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!user) return
    const { data } = await supabase.from('accounts').select('*').eq('user_id', user.id).order('created_at')
    setAccounts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)

    await supabase.from('accounts').insert({
      user_id: user.id,
      name: form.name,
      type: form.type,
      balance: parseFloat(form.balance),
      currency: form.currency,
    })

    setSaving(false)
    setShowModal(false)
    setForm(emptyForm)
    load()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('accounts').delete().eq('id', id)
    setAccounts(prev => prev.filter(a => a.id !== id))
  }

  const fmt = (n: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)

  const typeColors: Record<AccountType, string> = {
    checking: 'bg-blue-50 text-blue-700',
    savings: 'bg-green-50 text-green-700',
    credit: 'bg-red-50 text-red-700',
    cash: 'bg-yellow-50 text-yellow-700',
    investment: 'bg-purple-50 text-purple-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Accounts</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} /> Add Account
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No accounts yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => (
            <div key={acc.id} className="bg-white rounded-xl border border-gray-200 p-5 group relative">
              <button
                onClick={() => handleDelete(acc.id)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 size={14} />
              </button>
              <div className="flex items-start justify-between mb-3">
                <p className="font-semibold text-gray-900">{acc.name}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-3">
                {fmt(acc.balance, acc.currency)}
              </p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${typeColors[acc.type]}`}>
                {acc.type}
              </span>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">New Account</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <input required type="text" placeholder="Account name"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as AccountType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ACCOUNT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>

              <input required type="number" step="0.01" placeholder="Opening balance"
                value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <input required type="text" placeholder="Currency (e.g. USD)"
                maxLength={3} value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <button type="submit" disabled={saving}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? 'Saving…' : 'Add Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
