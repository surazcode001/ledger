import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Bookmark, Bug, CheckSquare, ChevronsUp, ChevronUp, Minus, ChevronDown,
  ChevronsDown, MessageSquare, Activity, Edit3, Send
} from 'lucide-react'
import { useBoardStore } from '../../store/boardStore'
import { useUIStore } from '../../store/uiStore'

type TicketStatus = 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done'
type Priority = 'lowest' | 'low' | 'medium' | 'high' | 'highest'

const STATUS_CFG: Record<TicketStatus, { label: string; color: string; bg: string }> = {
  backlog:       { label: 'Backlog',     color: 'text-gray-600',    bg: 'bg-gray-100 dark:bg-gray-700'          },
  todo:          { label: 'To Do',       color: 'text-gray-600',    bg: 'bg-gray-100 dark:bg-gray-700'          },
  'in-progress': { label: 'In Progress', color: 'text-blue-700',    bg: 'bg-blue-100 dark:bg-blue-500/20'       },
  'in-review':   { label: 'In Review',   color: 'text-amber-700',   bg: 'bg-amber-100 dark:bg-amber-500/20'     },
  done:          { label: 'Done',        color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
}

const PRI_CFG: Record<Priority, { Icon: any; label: string; color: string }> = {
  highest: { Icon: ChevronsUp,   label: 'Highest', color: 'text-red-500'    },
  high:    { Icon: ChevronUp,    label: 'High',    color: 'text-orange-500' },
  medium:  { Icon: Minus,        label: 'Medium',  color: 'text-amber-500'  },
  low:     { Icon: ChevronDown,  label: 'Low',     color: 'text-blue-400'   },
  lowest:  { Icon: ChevronsDown, label: 'Lowest',  color: 'text-gray-400'   },
}

const TYPE_CFG = {
  story: { Icon: Bookmark,    label: 'Story', color: 'text-emerald-600' },
  bug:   { Icon: Bug,         label: 'Bug',   color: 'text-red-600'     },
  task:  { Icon: CheckSquare, label: 'Task',  color: 'text-blue-600'    },
}

interface Comment {
  id: string
  text: string
  createdAt: Date
}

export default function TicketDetailPage() {
  const { activeTicketId, setActiveTicketId } = useUIStore()
  const { tickets, project, sprints, epics, updateTicket } = useBoardStore()
  const [activeTab, setActiveTab] = useState<'activity' | 'comments'>('activity')

  // Title editing
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  // Description editing
  const [editingDesc, setEditingDesc] = useState(false)
  const [desc, setDesc] = useState('')
  const descRef = useRef<HTMLTextAreaElement>(null)

  // Comments
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')

  const ticket = tickets.find(t => t.id === activeTicketId)

  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title)
      setDesc(ticket.description ?? '')
      setComments([])
      setEditingTitle(false)
      setEditingDesc(false)
    }
  }, [ticket?.id])

  useEffect(() => {
    if (editingTitle) titleRef.current?.focus()
  }, [editingTitle])

  useEffect(() => {
    if (editingDesc) descRef.current?.focus()
  }, [editingDesc])

  const saveTitle = () => {
    if (ticket && title.trim() && title.trim() !== ticket.title) {
      updateTicket(ticket.id, { title: title.trim() })
    }
    setEditingTitle(false)
  }

  const saveDesc = () => {
    if (ticket && desc !== (ticket.description ?? '')) {
      updateTicket(ticket.id, { description: desc.trim() || null })
    }
    setEditingDesc(false)
  }

  const submitComment = () => {
    const text = commentText.trim()
    if (!text) return
    setComments(prev => [...prev, { id: crypto.randomUUID(), text, createdAt: new Date() }])
    setCommentText('')
  }

  if (!ticket || !activeTicketId) return null

  const tc = TYPE_CFG[ticket.type as keyof typeof TYPE_CFG]
  const sc = STATUS_CFG[ticket.status as TicketStatus]
  const ticketKey = `${project?.key ?? 'TK'}-${ticket.ticket_number}`

  return (
    <AnimatePresence>
      {activeTicketId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setActiveTicketId(null)}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-3xl bg-white dark:bg-[#111113] shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <tc.Icon size={15} className={tc.color} />
                <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{ticketKey}</span>
                <select
                  value={ticket.status}
                  onChange={e => updateTicket(ticket.id, { status: e.target.value as any })}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 outline-none cursor-pointer ${sc.bg} ${sc.color}`}
                >
                  {Object.entries(STATUS_CFG).map(([val, cfg]) => (
                    <option key={val} value={val}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('comments')}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Comments"
                >
                  <MessageSquare size={15} />
                </button>
                <button
                  onClick={() => setActiveTicketId(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Main content */}
              <div className="flex-1 flex flex-col overflow-y-auto">
                <div className="px-6 py-5 flex-1 space-y-6">

                  {/* Title */}
                  <div onClick={() => !editingTitle && setEditingTitle(true)}>
                    {editingTitle ? (
                      <input
                        ref={titleRef}
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onBlur={saveTitle}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveTitle()
                          if (e.key === 'Escape') { setTitle(ticket.title); setEditingTitle(false) }
                        }}
                        className="w-full text-xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-violet-500 outline-none pb-1"
                      />
                    ) : (
                      <div className="group flex items-start gap-2 cursor-text">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">{ticket.title}</h1>
                        <Edit3 size={14} className="opacity-0 group-hover:opacity-100 text-gray-400 mt-1.5 flex-shrink-0 transition-opacity" />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Description</h3>
                    {editingDesc ? (
                      <textarea
                        ref={descRef}
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                        onBlur={saveDesc}
                        onKeyDown={e => {
                          if (e.key === 'Escape') { setDesc(ticket.description ?? ''); setEditingDesc(false) }
                          if (e.key === 'Enter' && e.metaKey) saveDesc()
                        }}
                        rows={5}
                        placeholder="Describe this issue..."
                        className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#1A1A1E] border-2 border-violet-400 dark:border-violet-500/60 text-sm text-gray-800 dark:text-gray-200 outline-none resize-none"
                      />
                    ) : (
                      <div
                        onClick={() => setEditingDesc(true)}
                        className="min-h-[80px] p-3 rounded-lg bg-gray-50 dark:bg-[#1A1A1E] border border-gray-200 dark:border-gray-700 text-sm cursor-text hover:border-violet-300 dark:hover:border-violet-500/40 transition-colors group"
                      >
                        {ticket.description ? (
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
                        ) : (
                          <p className="text-gray-400 dark:text-gray-500 italic">Click to add a description...</p>
                        )}
                      </div>
                    )}
                    {editingDesc && (
                      <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                        <kbd className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-[10px]">⌘ Enter</kbd> to save ·{' '}
                        <kbd className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-[10px]">Esc</kbd> to cancel
                      </p>
                    )}
                  </div>

                  {/* Activity / Comments tabs */}
                  <div>
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                      {(['activity', 'comments'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium capitalize border-b-2 -mb-px transition-colors
                            ${activeTab === tab
                              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                          {tab === 'activity' ? <Activity size={12} /> : <MessageSquare size={12} />}
                          {tab}
                          {tab === 'comments' && comments.length > 0 && (
                            <span className="ml-1 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-[10px] px-1.5 py-0.5 rounded-full">
                              {comments.length}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    {activeTab === 'activity' && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[9px] font-bold">U</span>
                          </div>
                          <div className="flex-1 text-xs text-gray-500 dark:text-gray-400 pt-0.5">
                            <span className="font-medium text-gray-700 dark:text-gray-300">You</span>
                            {' '}created this issue
                            <span className="ml-1 text-gray-400">·</span>
                            <span className="ml-1">{new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                        {comments.map(c => (
                          <div key={c.id} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-[9px] font-bold">U</span>
                            </div>
                            <div className="flex-1 text-xs text-gray-500 dark:text-gray-400 pt-0.5">
                              <span className="font-medium text-gray-700 dark:text-gray-300">You</span>
                              {' '}commented
                              <span className="ml-1 text-gray-400">· just now</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === 'comments' && (
                      <div className="space-y-4">
                        {comments.length === 0 && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">No comments yet — be the first!</p>
                        )}
                        {comments.map(c => (
                          <div key={c.id} className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-[9px] font-bold">U</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">You</span>
                                <span className="text-[10px] text-gray-400">
                                  {c.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#1A1A1E] border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {c.text}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Comment input */}
                        <div className="flex items-start gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-white text-[9px] font-bold">U</span>
                          </div>
                          <div className="flex-1">
                            <textarea
                              value={commentText}
                              onChange={e => setCommentText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment()
                              }}
                              placeholder="Write a comment..."
                              rows={3}
                              className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#1A1A1E] border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none transition-colors"
                            />
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-[11px] text-gray-400">
                                <kbd className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-[10px]">⌘ Enter</kbd> to submit
                              </p>
                              <button
                                onClick={submitComment}
                                disabled={!commentText.trim()}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                              >
                                <Send size={11} /> Comment
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right sidebar */}
              <div className="w-56 flex-shrink-0 border-l border-gray-100 dark:border-gray-800 overflow-y-auto p-4 space-y-5">
                {[
                  {
                    label: 'Assignee',
                    content: (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold">U</span>
                        </div>
                        <span className="text-xs text-gray-700 dark:text-gray-300">You</span>
                      </div>
                    ),
                  },
                  {
                    label: 'Priority',
                    content: (
                      <select
                        value={ticket.priority}
                        onChange={e => updateTicket(ticket.id, { priority: e.target.value as any })}
                        className="w-full text-xs bg-transparent text-gray-700 dark:text-gray-300 border-0 outline-none cursor-pointer p-0"
                      >
                        {Object.entries(PRI_CFG).map(([val, cfg]) => (
                          <option key={val} value={val}>{cfg.label}</option>
                        ))}
                      </select>
                    ),
                  },
                  {
                    label: 'Sprint',
                    content: (
                      <select
                        value={ticket.sprint_id ?? ''}
                        onChange={e => useBoardStore.getState().assignSprint(ticket.id, e.target.value || null)}
                        className="w-full text-xs bg-transparent text-gray-700 dark:text-gray-300 border-0 outline-none cursor-pointer p-0"
                      >
                        <option value="">No Sprint</option>
                        {sprints.filter(s => s.status !== 'completed').map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    ),
                  },
                  {
                    label: 'Epic',
                    content: (
                      <select
                        value={ticket.epic_id ?? ''}
                        onChange={e => updateTicket(ticket.id, { epic_id: e.target.value || null })}
                        className="w-full text-xs bg-transparent text-gray-700 dark:text-gray-300 border-0 outline-none cursor-pointer p-0"
                      >
                        <option value="">No Epic</option>
                        {epics.map(ep => <option key={ep.id} value={ep.id}>{ep.name}</option>)}
                      </select>
                    ),
                  },
                  {
                    label: 'Story Points',
                    content: (
                      <input
                        type="number" min="1" max="100"
                        value={ticket.story_points ?? ''}
                        onChange={e => updateTicket(ticket.id, { story_points: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full text-xs bg-transparent text-gray-700 dark:text-gray-300 border-0 outline-none p-0"
                        placeholder="—"
                      />
                    ),
                  },
                  {
                    label: 'Type',
                    content: (
                      <select
                        value={ticket.type}
                        onChange={e => updateTicket(ticket.id, { type: e.target.value as any })}
                        className="w-full text-xs bg-transparent text-gray-700 dark:text-gray-300 border-0 outline-none cursor-pointer p-0"
                      >
                        <option value="story">Story</option>
                        <option value="bug">Bug</option>
                        <option value="task">Task</option>
                      </select>
                    ),
                  },
                  {
                    label: 'Created',
                    content: (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    ),
                  },
                ].map(({ label, content }) => (
                  <div key={label}>
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-1.5">{label}</p>
                    {content}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
