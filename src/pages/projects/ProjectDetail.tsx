import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, X, Flag } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { Project, Task } from '../../types/database'

type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done'
type Priority = 'low' | 'medium' | 'high'

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
]

const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'text-gray-400',
  medium: 'text-yellow-500',
  high: 'text-red-500',
}

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  'on-hold': 'bg-yellow-100 text-yellow-700',
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [addingTo, setAddingTo] = useState<TaskStatus | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<Priority>('medium')

  useEffect(() => {
    if (!id || !user) return
    Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('tasks').select('*').eq('project_id', id).order('created_at'),
    ]).then(([{ data: proj }, { data: taskData }]) => {
      setProject(proj)
      setTasks(taskData ?? [])
      setLoading(false)
    })
  }, [id, user])

  const addTask = async (status: TaskStatus) => {
    if (!newTitle.trim() || !user || !id) return
    const { data } = await supabase
      .from('tasks')
      .insert({ project_id: id, user_id: user.id, title: newTitle.trim(), status, priority: newPriority })
      .select()
      .single()
    if (data) setTasks(t => [...t, data])
    setNewTitle('')
    setAddingTo(null)
  }

  const moveTask = async (taskId: string, status: TaskStatus) => {
    await supabase.from('tasks').update({ status }).eq('id', taskId)
    setTasks(t => t.map(task => task.id === taskId ? { ...task, status } : task))
  }

  const deleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId)
    setTasks(t => t.filter(task => task.id !== taskId))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )

  if (!project) return (
    <div className="text-center py-20 text-gray-400">Project not found</div>
  )

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={15} /> Back to Projects
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[project.status]}`}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
          </span>
        </div>
        {project.description && (
          <p className="text-sm text-gray-500 mt-1 ml-7">{project.description}</p>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id)
          return (
            <div key={col.id} className="flex-shrink-0 w-64 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-2 min-h-[80px]">
                {colTasks.map(task => (
                  <div key={task.id} className="bg-white rounded-lg border border-gray-200 p-3 group">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-800 font-medium leading-snug">{task.title}</p>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-100 flex-shrink-0"
                      >
                        <X size={12} className="text-gray-400" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Flag size={12} className={PRIORITY_COLORS[task.priority as Priority]} />
                      <select
                        value={task.status}
                        onChange={e => moveTask(task.id, e.target.value as TaskStatus)}
                        className="text-xs text-gray-400 bg-transparent border-none outline-none cursor-pointer"
                      >
                        {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {addingTo === col.id ? (
                <div className="mt-2 bg-white rounded-lg border border-indigo-300 p-3 space-y-2">
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addTask(col.id)
                      if (e.key === 'Escape') setAddingTo(null)
                    }}
                    className="w-full text-sm outline-none placeholder-gray-400"
                    placeholder="Task title…"
                  />
                  <div className="flex items-center justify-between">
                    <select
                      value={newPriority}
                      onChange={e => setNewPriority(e.target.value as Priority)}
                      className="text-xs text-gray-500 border border-gray-200 rounded px-1 py-0.5 outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setAddingTo(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => addTask(col.id)}
                        className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setAddingTo(col.id); setNewTitle(''); setNewPriority('medium') }}
                  className="mt-2 flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 py-1.5"
                >
                  <Plus size={14} /> Add task
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
