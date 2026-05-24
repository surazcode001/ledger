import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Project, Sprint, Epic, Ticket } from '../types/database'

type TicketStatus = 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done'

interface BoardState {
  project: Project | null
  tickets: Ticket[]
  sprints: Sprint[]
  epics: Epic[]
  loading: boolean
  fetchBoard: (projectId: string) => Promise<void>
  moveTicket: (ticketId: string, status: TicketStatus) => Promise<void>
  assignSprint: (ticketId: string, sprintId: string | null) => Promise<void>
  createTicket: (data: Omit<Ticket, 'id' | 'ticket_number' | 'created_at'>) => Promise<Ticket | null>
  updateTicket: (ticketId: string, data: Partial<Ticket>) => Promise<void>
  deleteTicket: (ticketId: string) => Promise<void>
  createSprint: (data: Omit<Sprint, 'id' | 'created_at'>) => Promise<void>
  startSprint: (sprintId: string) => Promise<void>
  completeSprint: (sprintId: string) => Promise<void>
  createEpic: (data: Omit<Epic, 'id' | 'created_at'>) => Promise<void>
}

export const useBoardStore = create<BoardState>((set, get) => ({
  project: null,
  tickets: [],
  sprints: [],
  epics: [],
  loading: false,

  fetchBoard: async (projectId) => {
    set({ loading: true })
    const [{ data: p }, { data: t }, { data: s }, { data: e }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('tickets').select('*').eq('project_id', projectId).order('ticket_number'),
      supabase.from('sprints').select('*').eq('project_id', projectId).order('created_at'),
      supabase.from('epics').select('*').eq('project_id', projectId).order('created_at'),
    ])
    set({ project: p ?? null, tickets: t ?? [], sprints: s ?? [], epics: e ?? [], loading: false })
  },

  moveTicket: async (ticketId, status) => {
    set(s => ({ tickets: s.tickets.map(t => t.id === ticketId ? { ...t, status } : t) }))
    await supabase.from('tickets').update({ status }).eq('id', ticketId)
  },

  assignSprint: async (ticketId, sprintId) => {
    const status: TicketStatus = sprintId ? 'todo' : 'backlog'
    set(s => ({ tickets: s.tickets.map(t => t.id === ticketId ? { ...t, sprint_id: sprintId, status } : t) }))
    await supabase.from('tickets').update({ sprint_id: sprintId, status }).eq('id', ticketId)
  },

  createTicket: async (data) => {
    const { data: ticket } = await supabase.from('tickets').insert(data as any).select().single()
    if (ticket) set(s => ({ tickets: [...s.tickets, ticket] }))
    return ticket
  },

  updateTicket: async (ticketId, data) => {
    set(s => ({ tickets: s.tickets.map(t => t.id === ticketId ? { ...t, ...data } : t) }))
    await supabase.from('tickets').update(data).eq('id', ticketId)
  },

  deleteTicket: async (ticketId) => {
    set(s => ({ tickets: s.tickets.filter(t => t.id !== ticketId) }))
    await supabase.from('tickets').delete().eq('id', ticketId)
  },

  createSprint: async (data) => {
    const { data: sprint } = await supabase.from('sprints').insert(data).select().single()
    if (sprint) set(s => ({ sprints: [...s.sprints, sprint] }))
  },

  startSprint: async (sprintId) => {
    await supabase.from('sprints').update({ status: 'active' }).eq('id', sprintId)
    await supabase.from('tickets').update({ status: 'todo' }).eq('sprint_id', sprintId).eq('status', 'backlog')
    set(s => ({
      sprints: s.sprints.map(sp => sp.id === sprintId ? { ...sp, status: 'active' } : sp),
      tickets: s.tickets.map(t => t.sprint_id === sprintId && t.status === 'backlog' ? { ...t, status: 'todo' } : t),
    }))
  },

  completeSprint: async (sprintId) => {
    await supabase.from('sprints').update({ status: 'completed' }).eq('id', sprintId)
    await supabase.from('tickets').update({ sprint_id: null, status: 'backlog' }).eq('sprint_id', sprintId).neq('status', 'done')
    set(s => ({
      sprints: s.sprints.map(sp => sp.id === sprintId ? { ...sp, status: 'completed' } : sp),
      tickets: s.tickets.map(t => t.sprint_id === sprintId && t.status !== 'done' ? { ...t, sprint_id: null, status: 'backlog' } : t),
    }))
  },

  createEpic: async (data) => {
    const { data: epic } = await supabase.from('epics').insert(data).select().single()
    if (epic) set(s => ({ epics: [...s.epics, epic] }))
  },
}))
