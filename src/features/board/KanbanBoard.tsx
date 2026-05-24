import { useState } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { CheckCircle, Filter } from 'lucide-react'
import { motion } from 'framer-motion'
import { useBoardStore } from '../../store/boardStore'
import { useUIStore } from '../../store/uiStore'
import KanbanColumn from './KanbanColumn'
import TicketCard from './TicketCard'
import type { Ticket } from '../../types/database'

type TicketStatus = 'todo' | 'in-progress' | 'in-review' | 'done'
const BOARD_STATUSES: TicketStatus[] = ['todo', 'in-progress', 'in-review', 'done']

export default function KanbanBoard() {
  const { project, tickets, sprints, epics, moveTicket } = useBoardStore()
  const { setActiveTicketId, openCreateIssue } = useUIStore()
  const [dragging, setDragging] = useState<Ticket | null>(null)

  const activeSprint = sprints.find(s => s.status === 'active')
  const epicMap = Object.fromEntries(epics.map(e => [e.id, e]))

  const boardTickets = activeSprint
    ? tickets.filter(t => t.sprint_id === activeSprint.id && BOARD_STATUSES.includes(t.status as TicketStatus))
    : tickets.filter(t => BOARD_STATUSES.includes(t.status as TicketStatus))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const findContainer = (id: string): TicketStatus | null => {
    if (BOARD_STATUSES.includes(id as TicketStatus)) return id as TicketStatus
    const ticket = tickets.find(t => t.id === id)
    return ticket ? (ticket.status as TicketStatus) : null
  }

  const handleDragStart = (e: DragStartEvent) => {
    setDragging(tickets.find(t => t.id === e.active.id) ?? null)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setDragging(null)
    const { active, over } = e
    if (!over) return
    const targetStatus = findContainer(over.id as string)
    if (!targetStatus) return
    const ticket = tickets.find(t => t.id === active.id)
    if (ticket && ticket.status !== targetStatus) moveTicket(ticket.id, targetStatus)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {activeSprint ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1A1A1E] rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{activeSprint.name}</span>
              {activeSprint.end_date && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  · {new Date(activeSprint.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
            <button
              onClick={() => useBoardStore.getState().completeSprint(activeSprint.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <CheckCircle size={13} /> Complete Sprint
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/20">
            <span className="text-xs text-amber-700 dark:text-amber-400">No active sprint — go to Backlog to start one</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
            <Filter size={12} /> Filter
          </button>
        </div>
      </div>

      {/* Sprint progress bar */}
      {activeSprint && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
            <span>Sprint progress</span>
            <span>{boardTickets.filter(t => t.status === 'done').length}/{boardTickets.length} done</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${boardTickets.length ? (boardTickets.filter(t => t.status === 'done').length / boardTickets.length) * 100 : 0}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {BOARD_STATUSES.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              tickets={boardTickets.filter(t => t.status === status)}
              projectKey={project?.key ?? 'TK'}
              epicMap={epicMap}
              onAddTicket={(s) => openCreateIssue(s)}
              onTicketClick={(t) => setActiveTicketId(t.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {dragging && (
            <div className="rotate-2 scale-105 opacity-95">
              <TicketCard
                ticket={dragging}
                projectKey={project?.key ?? 'TK'}
                epic={dragging.epic_id ? epicMap[dragging.epic_id] : undefined}
                onClick={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
