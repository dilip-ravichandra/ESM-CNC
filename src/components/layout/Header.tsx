import { Bell, ChevronDown, User } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useLocation } from 'react-router-dom'

const titles: Record<string, string> = {
  '/': 'Overview',
  '/machines': 'Machine Monitoring',
  '/anomalies': 'Anomaly Center',
  '/lean': 'Lean Analytics',
  '/green': 'Green Analytics',
  '/cost': 'Cost & Waste',
  '/architecture': 'System Architecture',
  '/future': 'Future Works',
  '/settings': 'Settings',
}

export function Header() {
  const { settings, setSettings, activeAlertCount } = useApp()
  const location = useLocation()
  const base = location.pathname.startsWith('/machines/')
    ? 'Machine Detail'
    : location.pathname.startsWith('/investigate/')
      ? 'Alert Investigation'
      : titles[location.pathname] ?? 'EcoLean AI'

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-charcoal-600 bg-charcoal/95 px-6 backdrop-blur">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white">{base}</h1>
        <span className="badge bg-cyan/15 text-cyan border border-cyan/30">DEMO MODE</span>
        <span className="badge bg-green/15 text-green border border-green/30">System Online</span>
      </div>
      <div className="flex items-center gap-3">
        <select
          className="input w-auto min-w-[120px] py-1.5 text-xs"
          value={settings.factory}
          onChange={(e) => setSettings((s) => ({ ...s, factory: e.target.value }))}
        >
          <option>All Factories</option>
          <option>Factory A</option>
          <option>Factory B</option>
        </select>
        <select
          className="input w-auto min-w-[130px] py-1.5 text-xs"
          value={settings.productionLine}
          onChange={(e) => setSettings((s) => ({ ...s, productionLine: e.target.value }))}
        >
          <option>All Lines</option>
          <option>CNC 1</option>
          <option>CNC 2</option>
        </select>
        <select
          className="input w-auto min-w-[120px] py-1.5 text-xs"
          value={settings.dateRange}
          onChange={(e) => setSettings((s) => ({ ...s, dateRange: e.target.value }))}
        >
          <option>Today</option>
          <option>Last 7 days</option>
          <option>Last 30 days</option>
        </select>
        <button className="relative rounded-lg p-2 text-slate-400 hover:bg-charcoal-700 hover:text-white">
          <Bell className="h-5 w-5" />
          {activeAlertCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-risk px-1 text-[10px] font-bold text-white">
              {activeAlertCount}
            </span>
          )}
        </button>
        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-charcoal-700">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-charcoal-600">
            <User className="h-4 w-4" />
          </div>
          Operator
          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
        </button>
      </div>
    </header>
  )
}