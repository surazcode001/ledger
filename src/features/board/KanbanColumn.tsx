import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { Ticket, Epic } from '../../types/database'
import TicketCard from './TicketCard'

type TicketStatus = 'todo' | 'in-progress' | 'in-review' | 'done'

const COL_CFG: Record<TicketStatus, { label: string; dot: string; badge: string }> = {
  'todo':        { label: 'To Do',       dot: 'bg-gray-400',                           badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'               },
  'in-progress': { label: 'In Progress', dot: 'bg-blue-500',                           badge: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'             },
  'in-review':   { label: 'In Review',   dot: 'bg-amber-500',                          badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'         },
  'done':        { label: 'Done',        dot: 'bg-emerald-500',                        badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
}

interface Props {
  status: TicketStatus
  tickets: Ticket[]
  projectKey: string
  epicMap: Record<string, Epic>
  onAddTicket: (status: TicketStatus) => void
  onTicketClick: (ticket: Ticket) => void
}

export default function KanbanColumn({ status, tickets, projectKey, epicMap, onAddTicket, onTicketClick }: Props) {
  const cfg = COL_CFG[status]
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 sticky top-0 z-10 bg-[#F4F5F7] dark:bg-[#0D0D0F] pb-2">
        <div className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0`} />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{cfg.label}</span>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
          {tickets.length}
        </span>
        <button
          onClick={() => onAddTicket(status)}
          className="ml-auto p-0.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 min-h-[120px] rounded-xl p-1 transition-colors duration-150 ${
          isOver ? 'bg-violet-50 dark:bg-violet-500/5 ring-2 ring-violet-200 dark:ring-violet-500/20' : ''
        }`}
      >
        <SortableContext items={tickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              projectKey={projectKey}
              epic={ticket.epic_id ? epicMap[ticket.epic_id] : undefined}
              onClick={() => onTicketClick(ticket)}
            />
          ))}
        </SortableContext>

        {tickets.length === 0 && !isOver && (
          <div className="h-20 flex items-center justify-center">
            <p className="text-xs text-gray-300 dark:text-gray-600">Drop issues here</p>
          </div>
        )}
      </div>
    </div>
  )
}
