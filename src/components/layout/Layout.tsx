import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'

function Toasts() {
  const { toasts } = useApp()
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur',
            t.type === 'success' && 'border-green/40 bg-green/10 text-green',
            t.type === 'warning' && 'border-warn/40 bg-warn/10 text-warn',
            t.type === 'error' && 'border-risk/40 bg-risk/10 text-risk',
            t.type === 'info' && 'border-cyan/40 bg-cyan/10 text-cyan'
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

export function Layout() {
  return (
    <div className="min-h-screen bg-charcoal">
      <Sidebar />
      <div className="pl-60">
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
      <Toasts />
    </div>
  )
}