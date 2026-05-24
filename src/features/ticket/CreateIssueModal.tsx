import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Bookmark, Bug, CheckSquare,
  ChevronsUp, ChevronUp, Minus, ChevronDown, ChevronsDown,
} from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useBoardStore } from '../../store/boardStore'
import { useAuth } from '../../context/AuthContext'

type TicketType = 'story' | 'bug' | 'task'
type Priority = 'lowest' | 'low' | 'medium' | 'high' | 'highest'

const TYPES: { value: TicketType; Icon: any; label: string; color: string; bg: string; ring: string }[] = [
  { value: 'story', Icon: Bookmark,    label: 'Story', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', ring: 'ring-emerald-400' },
  { value: 'bug',   Icon: Bug,         label: 'Bug',   color: 'text-red-600 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-500/10',         ring: 'ring-red-400'     },
  { value: 'task',  Icon: CheckSquare, label: 'Task',  color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-500/10',       ring: 'ring-blue-400'    },
]

const PRIORITIES: { value: Priority; Icon: any; label: string; color: string }[] = [
  { value: 'highest', Icon: ChevronsUp,   label: 'Highest', color: 'text-red-500'    },
  { value: 'high',    Icon: ChevronUp,    label: 'High',    color: 'text-orange-500' },
  { value: 'medium',  Icon: Minus,        label: 'Medium',  color: 'text-amber-500'  },
  { value: 'low',     Icon: ChevronDown,  label: 'Low',     color: 'text-blue-400'   },
  { value: 'lowest',  Icon: ChevronsDown, label: 'Lowest',  color: 'text-gray-400'   },
]

const STATUSES = [
  { value: 'backlog',     label: 'Backlog'      },
  { value: 'todo',        label: 'To Do'        },
  { value: 'in-progress', label: 'In Progress'  },
  { value: 'in-review',  label: 'In Review'    },
  { value: 'done',        label: 'Done'         },
]

const inputCls = 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors'
const selectCls = 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors cursor-pointer'
const labelCls = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5'

export default function CreateIssueModal() {
  const { createIssueOpen, createIssueStatus, closeCreateIssue } = useUIStore()
  const { project, sprints, epics, createTicket } = useBoardStore()
  const { user } = useAuth()
  const titleRef = useRef<HTMLInputElement>(null)

  const [type, setType]             = useState<TicketType>('task')
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority]     = useState<Priority>('medium')
  const [status, setStatus]         = useState(createIssueStatus)
  const [sprintId, setSprintId]     = useState('')
  const [epicId, setEpicId]         = useState('')
  const [storyPoints, setStoryPoints] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    if (createIssueOpen) {
      setTitle('')
      setDescription('')
      setType('task')
      setPriority('medium')
      setStatus(createIssueStatus)
      setSprintId('')
      setEpicId('')
      setStoryPoints('')
      setError('')
      setTimeout(() => titleRef.current?.focus(), 80)
    }
  }, [createIssueOpen, createIssueStatus])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCreateIssue()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const activeSprints = sprints.filter(s => s.status !== 'completed')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    if (!user || !project) return
    setSubmitting(true)
    setError('')
    try {
      await createTicket({
        project_id: project.id,
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        type,
        priority,
        status: status as any,
        sprint_id: sprintId || null,
        epic_id: epicId || null,
        story_points: storyPoints ? parseInt(storyPoints) : null,
      })
      closeCreateIssue()
    } catch {
      setError('Failed to create issue. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {createIssueOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeCreateIssue}
            className="fixed inset-0 bg-black/50 z-50"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
              className="w-full max-w-2xl bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 pointer-events-auto overflow-hidden"
            >
              <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                      {project?.key ?? 'TK'}
                    </span>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Create Issue</h2>
                  </div>
                  <button
                    type="button"
                    onClick={closeCreateIssue}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                  {/* Type selector */}
                  <div>
                    <p className={labelCls}>Issue Type</p>
                    <div className="flex gap-2">
                      {TYPES.map(({ value, Icon, label, color, bg, ring }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setType(value)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all text-sm font-medium
                            ${type === value
                              ? `${bg} border-transparent ring-2 ${ring} ring-offset-1 dark:ring-offset-[#18181B] ${color}`
                              : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                          <Icon size={15} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className={labelCls}>Title <span className="text-red-500">*</span></label>
                    <input
                      ref={titleRef}
                      value={title}
                      onChange={e => { setTitle(e.target.value); setError('') }}
                      placeholder="What needs to be done?"
                      className={`${inputCls} text-base font-medium`}
                    />
                    {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Add more details about this issue..."
                      rows={4}
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  {/* Priority + Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Priority</label>
                      <div className="grid grid-cols-5 gap-1">
                        {PRIORITIES.map(({ value, Icon, label, color }) => (
                          <button
                            key={value}
                            type="button"
                            title={label}
                            onClick={() => setPriority(value)}
                            className={`flex items-center justify-center py-2 rounded-lg border transition-all
                              ${priority === value
                                ? `border-transparent bg-gray-100 dark:bg-gray-700 ring-2 ring-violet-400 ring-offset-1 dark:ring-offset-[#18181B]`
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-800/40'
                              }`}
                          >
                            <Icon size={15} className={color} />
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500 text-center">
                        {PRIORITIES.find(p => p.value === priority)?.label}
                      </p>
                    </div>

                    <div>
                      <label className={labelCls}>Status</label>
                      <select value={status} onChange={e => setStatus(e.target.value)} className={selectCls}>
                        {STATUSES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Sprint + Epic + Story Points */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>Sprint</label>
                      <select value={sprintId} onChange={e => setSprintId(e.target.value)} className={selectCls}>
                        <option value="">No Sprint</option>
                        {activeSprints.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Epic</label>
                      <select value={epicId} onChange={e => setEpicId(e.target.value)} className={selectCls}>
                        <option value="">No Epic</option>
                        {epics.map(ep => (
                          <option key={ep.id} value={ep.id}>{ep.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Story Points</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={storyPoints}
                        onChange={e => setStoryPoints(e.target.value)}
                        placeholder="—"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#111113]">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Press <kbd className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-[10px]">Esc</kbd> to cancel
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={closeCreateIssue}
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !title.trim()}
                      className="px-5 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {submitting ? (
                        <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                      ) : 'Create Issue'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
