import TopNavbar from '../../layouts/TopNavbar'
import Dashboard from '../../features/dashboard/Dashboard'

export default function ProjectsDashboard() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopNavbar breadcrumbs={[{ label: 'InnovatioTrakko' }, { label: 'Dashboard' }]} />
      <main className="flex-1 overflow-y-auto p-6">
        <Dashboard />
      </main>
    </div>
  )
}
