import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface ChartRow { label: string; income: number; expenses: number; net: number }
interface CategoryData { name: string; icon: string; color: string; amount: number }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Reports() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('yearly')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()) // 0-indexed
  const [chartData, setChartData] = useState<ChartRow[]>([])
  const [byCategory, setByCategory] = useState<CategoryData[]>([])
  const [yearlyRows, setYearlyRows] = useState<ChartRow[]>([]) // for the breakdown table in yearly mode

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)

      let dateStart: string
      let dateEnd: string

      if (viewMode === 'yearly') {
        dateStart = `${selectedYear}-01-01`
        dateEnd = `${selectedYear}-12-31`
      } else {
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate()
        dateStart = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`
        dateEnd = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      }

      const [txRes, catRes] = await Promise.all([
        supabase.from('transactions').select('type, amount, date, category_id')
          .eq('user_id', user.id).gte('date', dateStart).lte('date', dateEnd),
        supabase.from('categories').select('id, name, icon, color').eq('user_id', user.id),
      ])

      const txs = txRes.data ?? []
      const cats = catRes.data ?? []

      if (viewMode === 'yearly') {
        // 12 monthly buckets
        const months: Record<string, ChartRow> = {}
        for (let m = 1; m <= 12; m++) {
          const key = `${selectedYear}-${String(m).padStart(2, '0')}`
          months[key] = {
            label: new Date(selectedYear, m - 1, 1).toLocaleString('default', { month: 'short' }),
            income: 0, expenses: 0, net: 0,
          }
        }
        txs.forEach(tx => {
          const key = tx.date.slice(0, 7)
          if (!months[key]) return
          if (tx.type === 'income') months[key].income += tx.amount
          if (tx.type === 'expense') months[key].expenses += tx.amount
          months[key].net = months[key].income - months[key].expenses
        })
        const rows = Object.values(months)
        setChartData(rows)
        setYearlyRows(rows)
      } else {
        // Daily buckets for the selected month
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate()
        const days: Record<string, ChartRow> = {}
        for (let d = 1; d <= lastDay; d++) {
          const key = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          days[key] = { label: String(d), income: 0, expenses: 0, net: 0 }
        }
        txs.forEach(tx => {
          if (!days[tx.date]) return
          if (tx.type === 'income') days[tx.date].income += tx.amount
          if (tx.type === 'expense') days[tx.date].expenses += tx.amount
          days[tx.date].net = days[tx.date].income - days[tx.date].expenses
        })
        setChartData(Object.values(days))
        setYearlyRows([])
      }

      // Category breakdown
      const catMap: Record<string, CategoryData> = {}
      txs.filter(t => t.type === 'expense').forEach(tx => {
        const cat = cats.find(c => c.id === tx.category_id)
        const key = tx.category_id ?? 'uncategorized'
        if (!catMap[key]) catMap[key] = { name: cat?.name ?? 'Uncategorized', icon: cat?.icon ?? '📦', color: cat?.color ?? '#94a3b8', amount: 0 }
        catMap[key].amount += tx.amount
      })
      setByCategory(Object.values(catMap).sort((a, b) => b.amount - a.amount))

      setLoading(false)
    }
    load()
  }, [user, viewMode, selectedYear, selectedMonth])

  const totalIncome = chartData.reduce((s, r) => s + r.income, 0)
  const totalExpenses = chartData.reduce((s, r) => s + r.expenses, 0)
  const netProfit = totalIncome - totalExpenses
  const margin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0'

  const periodLabel = viewMode === 'yearly'
    ? String(selectedYear)
    : `${MONTHS[selectedMonth]} ${selectedYear}`

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {(['yearly', 'monthly'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`px-4 py-2 font-medium capitalize transition-colors
                  ${viewMode === m ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {m}
              </button>
            ))}
          </div>

          {/* Year */}
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {/* Month — only in monthly mode */}
          {viewMode === 'monthly' && (
            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* P&L Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Profit & Loss — {periodLabel}</h3>
        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Income</span>
              <span className="text-sm font-semibold text-green-600">{fmt(totalIncome)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Expenses</span>
              <span className="text-sm font-semibold text-red-500">{fmt(totalExpenses)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-900">Net Profit</span>
              <span className={`text-base font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(netProfit)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Profit Margin</span>
              <span className={`text-sm font-semibold ${netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{margin}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">
          {viewMode === 'yearly' ? 'Monthly Income vs Expenses' : `Daily Income vs Expenses — ${MONTHS[selectedMonth]}`}
        </h3>
        {loading ? (
          <div className="h-56 bg-gray-100 rounded animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: viewMode === 'monthly' ? 10 : 12 }} interval={viewMode === 'monthly' ? 2 : 0} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : v}`} />
              <Tooltip formatter={(v) => fmt(Number(v))} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Expense by category */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Expenses by Category — {periodLabel}</h3>
        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : byCategory.length === 0 ? (
          <p className="text-sm text-gray-400">No expense data for {periodLabel}</p>
        ) : (
          <div className="space-y-3">
            {byCategory.map(cat => {
              const pct = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{cat.name}</span>
                      <span className="text-sm font-medium text-gray-900">{fmt(cat.amount)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right">{pct.toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Monthly breakdown table — yearly mode only */}
      {viewMode === 'yearly' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Monthly Breakdown — {selectedYear}</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500">Month</th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500">Income</th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500">Expenses</th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? [...Array(12)].map((_, i) => (
                    <tr key={i}><td colSpan={4} className="px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                  ))
                : yearlyRows.map(r => (
                    <tr key={r.label} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-700">{r.label}</td>
                      <td className="px-5 py-3 text-right text-green-600">{r.income > 0 ? fmt(r.income) : '—'}</td>
                      <td className="px-5 py-3 text-right text-red-500">{r.expenses > 0 ? fmt(r.expenses) : '—'}</td>
                      <td className={`px-5 py-3 text-right font-semibold ${r.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {r.income > 0 || r.expenses > 0 ? fmt(r.net) : '—'}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
