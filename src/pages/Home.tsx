import { useNavigate } from 'react-router-dom'
import { Wallet, FolderKanban, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const CARDS = [
  {
    title: 'Ledger',
    description: 'Track income, expenses, bank accounts, invoices, and financial reports.',
    icon: Wallet,
    from: 'from-indigo-500',
    to: 'to-indigo-700',
    path: '/ledger',
  },
  {
    title: 'Projects',
    description: 'Manage projects and tasks with a kanban board and priority flags.',
    icon: FolderKanban,
    from: 'from-violet-500',
    to: 'to-violet-700',
    path: '/projects',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
        <span className="text-lg font-bold text-gray-900">Workspace</span>
        <div className="flex items-center gap-5">
          <span className="text-sm text-gray-400 hidden sm:block">{user?.email}</span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Where do you want to go?</h2>
          <p className="text-gray-400 mt-2 text-sm">Choose a workspace to continue</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          {CARDS.map(({ title, description, icon: Icon, from, to, path }) => (
            <button
              key={title}
              onClick={() => navigate(path)}
              className="group bg-white rounded-2xl border border-gray-200 p-8 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
            >
              <div className={`inline-flex p-3.5 rounded-xl bg-gradient-to-br ${from} ${to} mb-6 shadow-sm`}>
                <Icon size={26} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                {title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              <div className="mt-6 text-xs font-semibold text-indigo-600 group-hover:gap-2 flex items-center gap-1 transition-all">
                Open {title} →
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
