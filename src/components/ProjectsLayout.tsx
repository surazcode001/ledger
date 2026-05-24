import { Outlet } from 'react-router-dom'
import Sidebar from '../layouts/Sidebar'
import CommandPalette from './CommandPalette'
import TicketDetailPage from '../features/ticket/TicketDetailPage'

export default function ProjectsLayout() {
  return (
    <div className="flex h-screen bg-[#F4F5F7] dark:bg-[#0D0D0F]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </div>
      <CommandPalette />
      <TicketDetailPage />
    </div>
  )
}
