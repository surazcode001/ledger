import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MessageSquare, Paperclip, ChevronsUp, ChevronUp, Minus, ChevronDown, ChevronsDown, Bookmark, Bug, CheckSquare } from 'lucide-react'
import type { Ticket, Epic } from '../../types/database'

type TicketType = 'story' | 'bug' | 'task'
type Priority = 'lowest' | 'low' | 'medium' | 'high' | 'highest'

const TYPE_CFG: Record<TicketType, { Icon: any; color: string; bg: string }> = {
  story: { Icon: Bookmark,     color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  bug:   { Icon: Bug,          color: 'text-red-600 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-500/10'         },
  task:  { Icon: CheckSquare,  color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-500/10'       },
}

const PRI_CFG: Record<Priority, { Icon: any; color: string; border: string }> = {
  highest: { Icon: ChevronsUp,   color: 'text-red-500',    border: 'border-red-400'    },
  high:    { Icon: ChevronUp,    color: 'text-orange-500', border: 'border-orange-400' },
  medium:  { Icon: Minus,        color: 'text-amber-500',  border: 'border-amber-400'  },
  low:     { Icon: ChevronDown,  color: 'text-blue-400',   border: 'border-blue-300'   },
  lowest:  { Icon: ChevronsDown, color: 'text-gray-400',   border: 'border-gray-300'   },
}

interface Props {
  ticket: Ticket
  projectKey: string
  epic?: Epic
  onClick: () => void
}

export default function TicketCard({ ticket, projectKey, epic, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
    data: { ticket },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const tc = TYPE_CFG[ticket.type as TicketType]
  const pc = PRI_CFG[ticket.priority as Priority]
  const ticketKey = `${projectKey}-${ticket.ticket_number}`

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <motion.div
        onClick={onClick}
        whileHover={{ y: -1, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
        transition={{ duration: 0.15 }}
        className={`
          bg-white dark:bg-[#1A1A1E] rounded-xl border border-gray-200 dark:border-gray-700/60
          p-3 cursor-pointer select-none group
          border-l-[3px] ${pc.border}
        `}
      >
        {/* Top row: type + key */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className={`p-0.5 rounded ${tc.bg}`}>
              <tc.Icon size={11} className={tc.color} />
            </span>
            <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{ticketKey}</span>
          </div>
          <pc.Icon size={12} className={`${pc.color} flex-shrink-0`} />
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug line-clamp-2 mb-2">
          {ticket.title}
        </p>

        {/* Epic tag */}
        {epic && (
          <div className="mb-2">
            <span
              className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ background: epic.color + '20', color: epic.color }}
            >
              {epic.name}
            </span>
          </div>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1 text-[10px]">
              <MessageSquare size={10} /> 0
            </span>
            <span className="flex items-center gap-1 text-[10px]">
              <Paperclip size={10} /> 0
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {ticket.story_points != null && (
              <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded px-1.5 py-0.5 font-medium">
                {ticket.story_points}
              </span>
            )}
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">U</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
