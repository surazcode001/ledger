import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FolderKanban,
  ChevronLeft, ChevronRight, LogOut, Bell, Home, Zap
} from 'lucide-react'
import { useUIStore } from '../store/uiStore'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { section: 'Main', items: [
    { to: '/projects', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/projects/board', label: 'Projects', icon: FolderKanban },
  ]},
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 56 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex flex-col h-screen flex-shrink-0 bg-white dark:bg-[#111113] border-r border-gray-100 dark:border-gray-800 relative z-10 overflow-hidden"
    >
      {/* Logo */}
      <div className="h-12 flex items-center px-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Zap size={14} className="text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="text-sm font-bold text-gray-900 dark:text-white truncate"
              >
                InnovatioTrakko
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={toggleSidebar}
          className="ml-auto flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Home link */}
      <div className="px-2 pt-2">
        <Link
          to="/"
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Home size={14} className="flex-shrink-0" />
          {!sidebarCollapsed && <span>Home</span>}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-4 mt-1">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            {!sidebarCollapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                {section}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors group relative
                    ${isActive
                      ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }`
                  }
                >
                  <Icon size={15} className="flex-shrink-0" />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="truncate"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      {label}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-gray-100 dark:border-gray-800 space-y-0.5 flex-shrink-0">
        <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 w-full transition-colors">
          <Bell size={15} className="flex-shrink-0" />
          {!sidebarCollapsed && <span>Notifications</span>}
        </button>
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[9px] font-bold">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1 min-w-0"
              >
                {user?.email}
              </motion.span>
            )}
          </AnimatePresence>
          {!sidebarCollapsed && (
            <button
              onClick={async () => { await signOut(); navigate('/auth') }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-red-500"
            >
              <LogOut size={12} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
