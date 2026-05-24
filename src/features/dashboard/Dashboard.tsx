import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, CheckCircle2, Clock, AlertCircle, FolderOpen, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useBoardStore } from '../../store/boardStore'

const COLORS = ['#7C3AED', '#3B82F6', '#F59E0B', '#10B981']
const TYPE_COLORS = { story: '#10B981', bug: '#EF4444', task: '#3B82F6' }

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tickets, sprints, epics, project } = useBoardStore()

  const activeSprint = sprints.find(s => s.status === 'active')
  const sprintTickets = activeSprint ? tickets.filter(t => t.sprint_id === activeSprint.id) : []

  const statusData = [
    { name: 'To Do',       value: tickets.filter(t => t.status === 'todo').length,        color: '#9CA3AF' },
    { name: 'In Progress', value: tickets.filter(t => t.status === 'in-progress').length, color: '#3B82F6' },
    { name: 'In Review',   value: tickets.filter(t => t.status === 'in-review').length,   color: '#F59E0B' },
    { name: 'Done',        value: tickets.filter(t => t.status === 'done').length,         color: '#10B981' },
  ]

  const typeData = [
    { name: 'Stories', value: tickets.filter(t => t.type === 'story').length, fill: '#10B981' },
    { name: 'Bugs',    value: tickets.filter(t => t.type === 'bug').length,   fill: '#EF4444' },
    { name: 'Tasks',   value: tickets.filter(t => t.type === 'task').length,  fill: '#3B82F6' },
  ]

  const priorityData = [
    { name: 'Highest', value: tickets.filter(t => t.priority === 'highest').length },
    { name: 'High',    value: tickets.filter(t => t.priority === 'high').length },
    { name: 'Medium',  value: tickets.filter(t => t.priority === 'medium').length },
    { name: 'Low',     value: tickets.filter(t => t.priority === 'low').length },
    { name: 'Lowest',  value: tickets.filter(t => t.priority === 'lowest').length },
  ]

  const recentTickets = [...tickets].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)

  const statCards = [
    { label: 'Total Issues', value: tickets.length, icon: FolderOpen, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10' },
    { label: 'In Progress',  value: tickets.filter(t => t.status === 'in-progress').length, icon: Clock,         color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-500/10'    },
    { label: 'Completed',    value: tickets.filter(t => t.status === 'done').length,         icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Open Sprints', value: sprints.filter(s => s.status === 'active').length,       icon: TrendingUp,    color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-500/10'  },
  ]

  const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {project?.name ?? 'InnovatioTrakko'} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div key={label} {...fade} transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-[#1A1A1E] rounded-xl border border-gray-200 dark:border-gray-700/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
              <div className={`p-1.5 rounded-lg ${bg}`}><Icon size={14} className={color} /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status distribution */}
        <motion.div {...fade} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white dark:bg-[#1A1A1E] rounded-xl border border-gray-200 dark:border-gray-700/60 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Issue Status Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusData} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Type breakdown */}
        <motion.div {...fade} transition={{ delay: 0.25 }}
          className="bg-white dark:bg-[#1A1A1E] rounded-xl border border-gray-200 dark:border-gray-700/60 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Issue Types</h3>
          {tickets.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={3}>
                  {typeData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[140px] flex items-center justify-center text-gray-300 dark:text-gray-600 text-sm">No data yet</div>
          )}
          <div className="flex justify-center gap-4 mt-2">
            {typeData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                <span className="text-[11px] text-gray-500 dark:text-gray-400">{d.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Active sprint + recent tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active sprint */}
        <motion.div {...fade} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-[#1A1A1E] rounded-xl border border-gray-200 dark:border-gray-700/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Active Sprint</h3>
            {activeSprint && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {activeSprint.name}
              </span>
            )}
          </div>
          {activeSprint ? (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{sprintTickets.filter(t => t.status === 'done').length}/{sprintTickets.length}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${sprintTickets.length ? (sprintTickets.filter(t => t.status === 'done').length / sprintTickets.length) * 100 : 0}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={[
                  { name: 'Todo',        v: sprintTickets.filter(t => t.status === 'todo').length },
                  { name: 'In Progress', v: sprintTickets.filter(t => t.status === 'in-progress').length },
                  { name: 'In Review',   v: sprintTickets.filter(t => t.status === 'in-review').length },
                  { name: 'Done',        v: sprintTickets.filter(t => t.status === 'done').length },
                ]} barSize={20}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Bar dataKey="v" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-300 dark:text-gray-600 text-sm">No active sprint</div>
          )}
        </motion.div>

        {/* Recent tickets */}
        <motion.div {...fade} transition={{ delay: 0.35 }}
          className="bg-white dark:bg-[#1A1A1E] rounded-xl border border-gray-200 dark:border-gray-700/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Issues</h3>
            <ArrowRight size={14} className="text-gray-400" />
          </div>
          {recentTickets.length === 0 ? (
            <div className="p-8 text-center text-gray-300 dark:text-gray-600 text-sm">No issues yet</div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {recentTickets.map(tk => (
                <li key={tk.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <span className="text-[10px] font-mono text-gray-400 w-14 flex-shrink-0">{project?.key}-{tk.ticket_number}</span>
                  <span className="text-xs text-gray-800 dark:text-gray-200 flex-1 truncate">{tk.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    tk.status === 'done' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                    tk.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {tk.status.replace('-', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  )
}
