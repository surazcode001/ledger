import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Play, X, Archive, ChevronsUp, ChevronUp, Minus, ChevronDown, ChevronsDown, Bookmark, Bug, CheckSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { useBoardStore } from '../../store/boardStore'
import { useAuth } from '../../context/AuthContext'
import KanbanBoard from '../../features/board/KanbanBoard'
import TopNavbar from '../../layouts/TopNavbar'
import type { Ticket } from '../../types/database'

type Tab = 'board' | 'backlog' | 'epics'

const PRIORITY_CFG = {
  highest: { Icon: ChevronsUp,   color: 'text-red-500' },
  high:    { Icon: ChevronUp,    color: 'text-orange-500' },
  medium:  { Icon: Minus,        color: 'text-amber-500' },
  low:     { Icon: ChevronDown,  color: 'text-blue-400' },
  lowest:  { Icon: ChevronsDown, color: 'text-gray-400' },
}

const TYPE_CFG = {
  story: { Icon: Bookmark,    color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  bug:   { Icon: Bug,         color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-500/10'         },
  task:  { Icon: CheckSquare, color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-500/10'       },
}

const EPIC_COLORS = ['#7C3AED','#8B5CF6','#EC4899','#F97316','#10B981','#3B82F6','#EF4444','#14B8A6']

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { fetchBoard, project, tickets, sprints, epics, moveTicket, assignSprint, deleteTicket, startSprint, completeSprint, createSprint, createEpic } = useBoardStore()
const [tab, setTab] = useState<Tab>('board')
  const [sprintModal, setSprintModal] = useState(false)
  const [epicModal, setEpicModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sprintForm, setSprintForm] = useState({ name: '', goal: '', start_date: '', end_date: '' })
  const [epicForm, setEpicForm] = useState({ name: '', color: '#7C3AED' })

  useEffect(() => { if (id) fetchBoard(id) }, [id])

  const activeSprint = sprints.find(s => s.status === 'active')
  const planningSprints = sprints.filter(s => s.status === 'planning')
  const openSprints = [...planningSprints, ...(activeSprint ? [activeSprint] : [])]
  const epicMap = Object.fromEntries(epics.map(e => [e.id, e]))
  const tKey = (t: Ticket) => `${project?.key ?? 'TK'}-${t.ticket_number}`

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !id) return
    setSaving(true)
    await createSprint({ project_id: id, user_id: user.id, name: sprintForm.name, goal: sprintForm.goal || null, start_date: sprintForm.start_date || null, end_date: sprintForm.end_date || null, status: 'planning' })
    setSaving(false); setSprintModal(false); setSprintForm({ name: '', goal: '', start_date: '', end_date: '' })
  }

  const handleCreateEpic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !id) return
    setSaving(true)
    await createEpic({ project_id: id, user_id: user.id, name: epicForm.name, color: epicForm.color, status: 'open' })
    setSaving(false); setEpicModal(false); setEpicForm({ name: '', color: '#7C3AED' })
  }

  return (
    <div className="flex flex-col h-full">
      <TopNavbar breadcrumbs={[
        { label: 'InnovatioTrakko' },
        { label: project?.name ?? '…' },
        { label: tab.charAt(0).toUpperCase() + tab.slice(1) },
      ]} />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Project header */}
        <div className="px-6 pt-5 pb-0 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {project && (
              <>
                <div className="w-6 h-6 rounded-lg flex-shrink-0" style={{ backgroundColor: project.color }} />
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{project.name}</h1>
                {project.key && <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-md">{project.key}</span>}
              </>
            )}
            <div className="ml-auto flex items-center gap-2">
              {tab === 'backlog' && (
                <button onClick={() => setSprintModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Plus size={13} /> Create Sprint
                </button>
              )}
              {tab === 'epics' && (
                <button onClick={() => setEpicModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Plus size={13} /> Create Epic
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {(['board', 'backlog', 'epics'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors
                  ${tab === t ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {tab === 'board' && <KanbanBoard />}

          {tab === 'backlog' && (
            <div className="max-w-4xl space-y-4">
              {planningSprints.map(sprint => {
                const sTks = tickets.filter(t => t.sprint_id === sprint.id)
                return (
                  <div key={sprint.id} className="bg-white dark:bg-[#1A1A1E] rounded-xl border border-gray-200 dark:border-gray-700/60 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{sprint.name}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{sTks.length} issues</span>
                        {sprint.end_date && <span className="text-xs text-gray-400 dark:text-gray-500">· {new Date(sprint.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      </div>
                      <button disabled={!!activeSprint} onClick={() => startSprint(sprint.id)}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <Play size={11} /> Start Sprint
                      </button>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {sTks.map(tk => <BacklogRow key={tk.id} tk={tk} tKey={tKey(tk)} epicMap={epicMap} sprints={openSprints} onAssign={assignSprint} onDelete={deleteTicket} />)}
                      {sTks.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-5">No tickets — drag from backlog or create new</p>}
                    </div>
                  </div>
                )
              })}

              <div className="bg-white dark:bg-[#1A1A1E] rounded-xl border border-gray-200 dark:border-gray-700/60 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                  <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">Backlog</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{tickets.filter(t => !t.sprint_id).length} issues</span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {tickets.filter(t => !t.sprint_id).map(tk => (
                    <BacklogRow key={tk.id} tk={tk} tKey={tKey(tk)} epicMap={epicMap} sprints={openSprints} onAssign={assignSprint} onDelete={deleteTicket} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'epics' && (
            <div className="max-w-2xl space-y-3">
              {epics.length === 0 && (
                <div className="text-center py-16 text-gray-300 dark:text-gray-600 text-sm">No epics yet — epics group related issues into themes.</div>
              )}
              {epics.map(epic => {
                const epicTks = tickets.filter(t => t.epic_id === epic.id)
                const done = epicTks.filter(t => t.status === 'done').length
                return (
                  <div key={epic.id} className="bg-white dark:bg-[#1A1A1E] rounded-xl border border-gray-200 dark:border-gray-700/60 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: epic.color }} />
                      <span className="font-semibold text-gray-900 dark:text-white flex-1">{epic.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        epic.status === 'done' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                        epic.status === 'in-progress' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>{epic.status}</span>
                    </div>
                    {epicTks.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${(done / epicTks.length) * 100}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{done}/{epicTks.length}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sprint modal */}
      {sprintModal && (
        <Modal title="Create Sprint" onClose={() => setSprintModal(false)}>
          <form onSubmit={handleCreateSprint} className="space-y-4">
            <Field label="Sprint Name"><input required value={sprintForm.name} onChange={e => setSprintForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="e.g. Sprint 1" /></Field>
            <Field label="Goal"><input value={sprintForm.goal} onChange={e => setSprintForm(f => ({ ...f, goal: e.target.value }))} className={inputCls} placeholder="Sprint objective" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date"><input type="date" value={sprintForm.start_date} onChange={e => setSprintForm(f => ({ ...f, start_date: e.target.value }))} className={inputCls} /></Field>
              <Field label="End Date"><input type="date" value={sprintForm.end_date} onChange={e => setSprintForm(f => ({ ...f, end_date: e.target.value }))} className={inputCls} /></Field>
            </div>
            <ModalActions onCancel={() => setSprintModal(false)} saving={saving} label="Create Sprint" />
          </form>
        </Modal>
      )}

      {/* Epic modal */}
      {epicModal && (
        <Modal title="Create Epic" onClose={() => setEpicModal(false)}>
          <form onSubmit={handleCreateEpic} className="space-y-4">
            <Field label="Name"><input required value={epicForm.name} onChange={e => setEpicForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Epic name" /></Field>
            <Field label="Color">
              <div className="flex gap-2 flex-wrap">
                {EPIC_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setEpicForm(f => ({ ...f, color: c }))}
                    className={`w-6 h-6 rounded-full transition-transform ${epicForm.color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </Field>
            <ModalActions onCancel={() => setEpicModal(false)} saving={saving} label="Create Epic" />
          </form>
        </Modal>
      )}
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-[#1A1A1E] rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} className="text-gray-400" /></button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  )
}

function ModalActions({ onCancel, saving, label }: { onCancel: () => void; saving: boolean; label: string }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel} className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancel</button>
      <button type="submit" disabled={saving} className="px-4 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50 transition-colors">
        {saving ? 'Creating…' : label}
      </button>
    </div>
  )
}

function BacklogRow({ tk, tKey, epicMap, sprints, onAssign, onDelete }: {
  tk: Ticket; tKey: string; epicMap: Record<string, any>; sprints: any[]
  onAssign: (id: string, sprintId: string | null) => void; onDelete: (id: string) => void
}) {
  const tc = TYPE_CFG[tk.type as keyof typeof TYPE_CFG]
  const pc = PRIORITY_CFG[tk.priority as keyof typeof PRIORITY_CFG]
  const epic = tk.epic_id ? epicMap[tk.epic_id] : null
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/80 dark:hover:bg-gray-800/30 group transition-colors">
      <span className={`p-0.5 rounded flex-shrink-0 ${tc.bg}`}><tc.Icon size={11} className={tc.color} /></span>
      <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 w-16 flex-shrink-0">{tKey}</span>
      <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 truncate">{tk.title}</span>
      {epic && <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: epic.color + '20', color: epic.color }}>{epic.name}</span>}
      <pc.Icon size={12} className={`${pc.color} flex-shrink-0`} />
      {tk.story_points != null && <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded px-1.5 py-0.5 flex-shrink-0">{tk.story_points}</span>}
      <select value={tk.sprint_id ?? ''} onChange={e => onAssign(tk.id, e.target.value || null)}
        className="text-[10px] text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 outline-none bg-white dark:bg-gray-800 flex-shrink-0">
        <option value="">Backlog</option>
        {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <button onClick={() => onDelete(tk.id)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0 transition-opacity">
        <X size={11} className="text-gray-400" />
      </button>
    </div>
  )
}
