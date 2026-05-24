import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, Receipt, CreditCard,
  BarChart2, Wallet, Tag, LogOut, Menu, X, Home
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const nav = [
  {
    section: 'Overview',
    items: [
      { to: '/ledger', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Money',
    items: [
      { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
      { to: '/expenses', label: 'Expenses', icon: CreditCard },
      { to: '/accounts', label: 'Bank Accounts', icon: Wallet },
    ],
  },
  {
    section: 'Business',
    items: [
      { to: '/invoices', label: 'Invoices', icon: Receipt },
      { to: '/reports', label: 'Reports', icon: BarChart2 },
    ],
  },
  {
    section: 'Settings',
    items: [
      { to: '/categories', label: 'Categories', icon: Tag },
    ],
  },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-60 bg-white border-r border-gray-200
        flex flex-col transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-indigo-600">Ledger</h1>
            <Link to="/" className="p-1 rounded hover:bg-indigo-50 text-gray-400 hover:text-indigo-600" title="Home">
              <Home size={15} />
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.email}</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {nav.map(({ section, items }) => (
            <div key={section}>
              <p className="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">{section}</p>
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setOpen(true)} className="p-1 rounded text-gray-600 hover:bg-gray-100">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="text-base font-bold text-indigo-600">Ledger</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
