import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Cpu,
  AlertTriangle,
  TrendingDown,
  Leaf,
  DollarSign,
  Network,
  Rocket,
  Settings,
  Factory,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/machines', label: 'Machine Monitoring', icon: Cpu },
  { to: '/anomalies', label: 'Anomaly Center', icon: AlertTriangle },
  { to: '/lean', label: 'Lean Analytics', icon: TrendingDown },
  { to: '/green', label: 'Green Analytics', icon: Leaf },
  { to: '/cost', label: 'Cost & Waste', icon: DollarSign },
  { to: '/architecture', label: 'System Architecture', icon: Network },
  { to: '/future', label: 'Future Works', icon: Rocket },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-charcoal-600 bg-charcoal-800">
      <div className="flex items-center gap-3 border-b border-charcoal-600 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan/20 text-cyan">
          <Factory className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight text-white">EcoLean AI</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Smart Factory</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-cyan/10 text-cyan border border-cyan/20'
                  : 'text-slate-400 hover:bg-charcoal-700 hover:text-slate-200'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-charcoal-600 p-4">
        <div className="rounded-lg bg-charcoal-700/80 px-3 py-2 text-[11px] text-slate-500">
          <span className="font-medium text-cyan">DEMO MODE</span>
          <p className="mt-1 leading-relaxed">Simulated CNC data. Not connected to real machines.</p>
        </div>
      </div>
    </aside>
  )
}