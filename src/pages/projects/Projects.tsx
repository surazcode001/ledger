import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, X, FolderKanban, CheckSquare, Play, Archive } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { Project } from '../../types/database'

type ProjectStatus = 'planning' | 'active' | 'completed' | 'on-hold'

interface ProjectStats {
  total: number
  active: number
  completed: number
  totalTasks: number
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  'on-hold': 'bg-yellow-100 text-yellow-700',
}

const COLORS = ['#6366f1', '#ec4899', '#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6']

const DEFAULT_FORM = { name: '', description: '', status: 'planning' as ProjectStatus, color: '#6366f1', due_date: '' }

export default function Projects() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<ProjectStats>({ total: 0, active: 0, completed: 0, totalTasks: 0 })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)

  const fetchProjects = async () => {
    if (!user) return
    const [{ data: projectData }, { count: taskCount }] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    ])
    const list = projectData ?? []
    setProjects(list)
    setStats({
      total: list.length,
      active: list.filter(p => p.status === 'active').length,
      completed: list.filter(p => p.status === 'completed').length,
      totalTasks: taskCount ?? 0,
    })
    setLoading(false)
  }

  useEffect(() => { fetchProjects() }, [user])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    await supabase.from('projects').insert({
      user_id: user.id,
      name: form.name,
      description: form.description || null,
      status: form.status,
      color: form.color,
      due_date: form.due_date || null,
    })
    setSaving(false)
    setShowModal(false)
    setForm(DEFAULT_FORM)
    fetchProjects()
  }

  const statusLabel = (s: ProjectStatus) => s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )

  const statCards = [
    { label: 'Total Projects', value: stats.total, icon: FolderKanban, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Active', value: stats.active, icon: Play, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Completed', value: stats.completed, icon: Archive, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Tasks', value: stats.totalTasks, icon: CheckSquare, color: 'text-violet-600', bg: 'bg-violet-50' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">{label}</p>
              <div className={`p-1.5 rounded-lg ${bg}`}><Icon size={14} className={color} /></div>
            </div>
            {loading
              ? <div className="h-6 bg-gray-100 rounded animate-pulse w-1/2" />
              : <p className="text-2xl font-bold text-gray-900">{value}</p>
            }
          </div>
        ))}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No projects yet</p>
          <p className="text-sm mt-1">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: p.color }} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                  {p.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status as ProjectStatus]}`}>
                      {statusLabel(p.status as ProjectStatus)}
                    </span>
                    {p.due_date && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar size={11} />
                        {new Date(p.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">New Project</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-6 h-6 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Creating…' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
