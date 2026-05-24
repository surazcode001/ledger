import { Search, Bell, Sun, Moon, Plus, ChevronRight, Command } from 'lucide-react'
import { useUIStore } from '../store/uiStore'
import { useBoardStore } from '../store/boardStore'

interface TopNavbarProps {
  breadcrumbs?: { label: string; to?: string }[]
}

export default function TopNavbar({ breadcrumbs }: TopNavbarProps) {
  const { darkMode, toggleDarkMode, setCommandPaletteOpen } = useUIStore()
  const { project } = useBoardStore()

  const crumbs = breadcrumbs ?? [
    { label: 'InnovatioTrakko' },
    ...(project ? [{ label: project.name }] : []),
  ]

  return (
    <header className="h-12 flex items-center gap-3 px-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-[#111113]/80 backdrop-blur-sm sticky top-0 z-20 flex-shrink-0">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm min-w-0 flex-1">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
            <span className={`truncate ${i === crumbs.length - 1 ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
              {c.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Search */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-w-[180px] max-w-[240px]"
      >
        <Search size={12} />
        <span className="flex-1 text-left">Search issues...</span>
        <span className="flex items-center gap-0.5 text-[10px] bg-white dark:bg-gray-700 px-1 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-gray-500">
          <Command size={9} /> K
        </span>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors"
        >
          <Plus size={13} /> Create
        </button>
        <button className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Bell size={15} />
        </button>
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  )
}
