import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  darkMode: boolean
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean
  activeTicketId: string | null
  toggleDarkMode: () => void
  toggleSidebar: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setActiveTicketId: (id: string | null) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      darkMode: false,
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      activeTicketId: null,
      toggleDarkMode: () =>
        set(state => {
          const next = !state.darkMode
          document.documentElement.classList.toggle('dark', next)
          document.body.classList.toggle('dark', next)
          return { darkMode: next }
        }),
      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setCommandPaletteOpen: open => set({ commandPaletteOpen: open }),
      setActiveTicketId: id => set({ activeTicketId: id }),
    }),
    {
      name: 'ui-store',
      onRehydrateStorage: () => state => {
        if (state?.darkMode) {
          document.documentElement.classList.add('dark')
          document.body.classList.add('dark')
        }
      },
    }
  )
)
