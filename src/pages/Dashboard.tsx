import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Transaction } from '../types/database'

interface Stats {
  cashBalance: number
  monthIncome: number
  monthExpenses: number
  recentTransactions: (Transaction & { category_name?: string; account_name?: string })[]
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ cashBalance: 0, monthIncome: 0, monthExpenses: 0, recentTransactions: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

      const [accRes, txRes, recentRes] = await Promise.all([
        supabase.from('accounts').select('balance').eq('user_id', user.id),
        supabase.from('transactions').select('type,amount').eq('user_id', user.id).gte('date', monthStart),
        supabase.from('transactions').select('*, categories(name), accounts(name)').eq('user_id', user.id).order('date', { ascending: false }).limit(8),
      ])

      const cashBalance = (accRes.data ?? []).reduce((s, a) => s + a.balance, 0)
      const txs = txRes.data ?? []
      const monthIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const monthExpenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

      const recent = (recentRes.data ?? []).map((t: any) => ({
        ...t,
        category_name: t.categories?.name,
        account_name: t.accounts?.name,
      }))

      setStats({ cashBalance, monthIncome, monthExpenses, recentTransactions: recent })
      setLoading(false)
    }
    fetch()
  }, [user])

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const net = stats.monthIncome - stats.monthExpenses
  const maxBar = Math.max(stats.monthIncome, stats.monthExpenses, 1)

  const cards = [
    { label: 'Cash Balance', value: stats.cashBalance, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Income this month', value: stats.monthIncome, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Expenses this month', value: stats.monthExpenses, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Net profit', value: net, icon: DollarSign, color: net >= 0 ? 'text-blue-600' : 'text-red-500', bg: net >= 0 ? 'bg-blue-50' : 'bg-red-50' },
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">{label}</p>
              <div className={`p-1.5 rounded-lg ${bg}`}><Icon size={14} className={color} /></div>
            </div>
            {loading
              ? <div className="h-6 bg-gray-100 rounded animate-pulse w-3/4" />
              : <p className={`text-xl font-bold ${value < 0 ? 'text-red-500' : 'text-gray-900'}`}>{fmt(value)}</p>}
          </div>
        ))}
      </div>

      {/* Income vs Expenses bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
        {loading ? (
          <div className="space-y-3">
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 bg-gray-100 rounded animate-pulse w-2/3" />
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { label: 'Income', value: stats.monthIncome, color: 'bg-green-500' },
              { label: 'Expenses', value: stats.monthExpenses, color: 'bg-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-20 shrink-0">{label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${(value / maxBar) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-24 text-right">{fmt(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
          <Link to="/transactions" className="text-xs text-indigo-600 hover:underline">View all</Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : stats.recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No transactions yet. <Link to="/transactions" className="text-indigo-600 hover:underline">Add one</Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {stats.recentTransactions.map(tx => (
              <li key={tx.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.date).toLocaleDateString()}
                    {tx.category_name && ` · ${tx.category_name}`}
                    {tx.account_name && ` · ${tx.account_name}`}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
