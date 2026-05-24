import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FolderKanban, Hash, ArrowRight } from 'lucide-react'
import { useUIStore } from '../store/uiStore'
import { useBoardStore } from '../store/boardStore'

export default function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const { tickets, project } = useBoardStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      if (e.key === 'Escape') setCommandPaletteOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [commandPaletteOpen])

  const filteredTickets = query
    ? tickets.filter(t =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        `${project?.key}-${t.ticket_number}`.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : tickets.slice(0, 5)

  const actions = [
    { label: 'Go to Dashboard', icon: FolderKanban, action: () => { navigate('/projects'); setCommandPaletteOpen(false) } },
    { label: 'All Projects',    icon: FolderKanban, action: () => { navigate('/projects/board'); setCommandPaletteOpen(false) } },
  ]

  const { setActiveTicketId } = useUIStore()

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={() => setCommandPaletteOpen(false)}
            className="fixed inset-0 bg-black/50 z-50"
          />

          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
              className="w-full max-w-xl bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden pointer-events-auto"
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <Search size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search issues, projects, or actions..."
                  className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                />
                <kbd className="flex items-center gap-0.5 text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">
                {!query && (
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 mb-1">Actions</p>
                    {actions.map(({ label, icon: Icon, action }) => (
                      <button key={label} onClick={action}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group text-left">
                        <Icon size={14} className="text-gray-400 group-hover:text-violet-600 transition-colors flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                        <ArrowRight size={12} className="ml-auto text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}

                {filteredTickets.length > 0 && (
                  <div className="px-3 pt-2 pb-3">
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 mb-1">
                      {query ? 'Issues' : 'Recent Issues'}
                    </p>
                    {filteredTickets.map(ticket => (
                      <button
                        key={ticket.id}
                        onClick={() => { setActiveTicketId(ticket.id); setCommandPaletteOpen(false) }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group text-left"
                      >
                        <Hash size={13} className="text-gray-400 flex-shrink-0" />
                        <span className="text-[10px] font-mono text-gray-400 w-14 flex-shrink-0">
                          {project?.key}-{ticket.ticket_number}
                        </span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{ticket.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                          ticket.status === 'done' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {ticket.status.replace('-', ' ')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {query && filteredTickets.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                    No results for "{query}"
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><kbd className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">↑↓</kbd> navigate</span>
                <span className="flex items-center gap-1"><kbd className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">↵</kbd> select</span>
                <span className="flex items-center gap-1"><kbd className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">esc</kbd> close</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
