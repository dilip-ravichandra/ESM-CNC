import { useMemo, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { MachineCard } from '@/components/MachineCard'
import type { Machine } from '@/types'
import {
  Activity,
  Gauge,
  Radio,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type SignalPoint = {
  t: string
  power: number
  load: number
  risk: number
}

const machineColors: Record<string, string> = {
  'CNC-01': '#22d3ee',
  'CNC-02': '#34d399',
  'CNC-03': '#f87171',
  'CNC-04': '#fbbf24',
}

function buildSignal(machine: Machine, livePower?: number): SignalPoint[] {
  return Array.from({ length: 30 }, (_, index) => {
    const wave = Math.sin(index / 2.8) * 0.5 + Math.cos(index / 4.2) * 0.25
    const power = Math.max(0.2, (livePower ?? machine.power) + wave + (index > 25 ? (machine.defectRisk - 50) / 80 : 0))
    return {
      t: `${index + 1}s`,
      power: Number(power.toFixed(2)),
      load: Math.max(8, Math.min(100, machine.spindleLoad + Math.sin(index / 3) * 8)),
      risk: Math.max(4, Math.min(100, machine.defectRisk + Math.sin(index / 2) * 5)),
    }
  })
}

function HealthGauge({ value, color }: { value: number; color: string }) {
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, value) / 100) * circumference
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg className="-rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#2e3640" strokeWidth="8" />
        <circle
          className="gauge-draw"
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="8"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white">{Math.round(value)}%</span>
        <span className="text-[9px] uppercase tracking-widest text-slate-500">health</span>
      </div>
    </div>
  )
}

export function MachineMonitoring() {
  const { filteredMachines, latestEnergy, energyHistory, streamConnected } = useApp()
  const [statusFilter, setStatusFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [selectedId, setSelectedId] = useState('CNC-01')

  const list = filteredMachines.filter((machine) => {
    if (statusFilter !== 'all' && machine.status !== statusFilter) return false
    if (riskFilter === 'high' && machine.defectRisk < 70) return false
    if (riskFilter === 'medium' && (machine.defectRisk < 40 || machine.defectRisk >= 70)) return false
    if (riskFilter === 'low' && machine.defectRisk >= 40) return false
    return true
  })
  const selected = list.find((machine) => machine.id === selectedId) ?? list[0]
  const selectedEnergy = selected ? latestEnergy[selected.id] : undefined
  const selectedSignal = selected ? buildSignal(selected, selectedEnergy?.powerKw) : []
  const streamSignal = selected
    ? energyHistory.filter((tick) => tick.machineId === selected.id).map((tick, index) => ({
        t: `${index + 1}s`,
        power: tick.powerKw,
        expected: (tick.expectedMinKw + tick.expectedMaxKw) / 2,
      }))
    : []
  const chartSignal = streamSignal.length > 1 ? streamSignal : selectedSignal
  const color = selected ? machineColors[selected.id] ?? '#22d3ee' : '#22d3ee'
  const fleetHealth = useMemo(
    () => filteredMachines.length ? filteredMachines.reduce((sum, machine) => sum + (100 - machine.defectRisk), 0) / filteredMachines.length : 0,
    [filteredMachines]
  )

  return (
    <div className="machine-monitor space-y-6">
      <div className="monitor-hero relative overflow-hidden rounded-2xl border border-cyan/20 bg-charcoal-800 p-5 shadow-glow">
        <div className="energy-grid" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-cyan">
              <Sparkles className="h-4 w-4 animate-pulse" /> Fleet command center
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Machine <span className="text-cyan">Monitoring</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              A live telemetry wall for power, spindle load, energy anomalies, and simulated defect risk.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-charcoal-600 bg-charcoal/70 px-4 py-3">
            <span className={streamConnected ? 'status-orb bg-green' : 'status-orb bg-warn'} />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white">
                {streamConnected ? 'Energy stream online' : 'Offline telemetry'}
              </div>
              <div className="text-[10px] text-slate-500">
                {streamConnected ? 'Mendeley replay · 1 Hz' : 'Simulated fallback active'}
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-3">
          <div className="monitor-stat"><Radio className="text-cyan" /><span><b>{filteredMachines.length}</b> machines tracked</span></div>
          <div className="monitor-stat"><ShieldCheck className="text-green" /><span><b>{fleetHealth.toFixed(0)}%</b> fleet health</span></div>
          <div className="monitor-stat"><Zap className="text-warn" /><span><b>{filteredMachines.reduce((sum, m) => sum + m.power, 0).toFixed(1)}</b> kW total draw</span></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="normal">Normal</option>
          <option value="warning">Warning</option>
          <option value="high_risk">High Defect Risk</option>
          <option value="energy_anomaly">Energy Anomaly</option>
        </select>
        <select className="input w-auto" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
          <option value="all">All risk levels</option>
          <option value="high">High (≥70%)</option>
          <option value="medium">Medium (40–69%)</option>
          <option value="low">Low (&lt;40%)</option>
        </select>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <Activity className="h-4 w-4 text-cyan" /> {streamConnected ? 'ENERGY STREAM · Mendeley replay' : 'DEMO TELEMETRY'}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {list.map((machine) => (
          <button
            className={`machine-tile text-left ${machine.id === selected?.id ? 'machine-tile-active' : ''}`}
            key={machine.id}
            onClick={() => setSelectedId(machine.id)}
          >
            <div className="machine-tile-pulse" style={{ backgroundColor: machineColors[machine.id] ?? '#22d3ee' }} />
            <div className="flex items-start justify-between">
              <div><div className="font-mono text-lg font-black text-white">{machine.id}</div><div className="text-[10px] uppercase tracking-widest text-slate-500">{machine.name}</div></div>
              <span className={`h-2.5 w-2.5 rounded-full ${machine.energyAnomaly ? 'bg-warn animate-ping' : 'bg-green animate-pulse'}`} />
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div><div className="text-2xl font-black text-cyan">{machine.power.toFixed(2)}<small className="ml-1 text-xs font-normal">kW</small></div><div className="text-[10px] text-slate-500">POWER DRAW</div></div>
              <div className="text-right"><div className="text-lg font-bold text-white">{machine.defectRisk}%</div><div className="text-[10px] text-slate-500">RISK</div></div>
            </div>
            <div className="mt-3 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={buildSignal(machine, latestEnergy[machine.id]?.powerKw)}>
                  <defs><linearGradient id={`tile-${machine.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={machineColors[machine.id] ?? '#22d3ee'} stopOpacity={0.55} /><stop offset="100%" stopColor={machineColors[machine.id] ?? '#22d3ee'} stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="power" stroke={machineColors[machine.id] ?? '#22d3ee'} fill={`url(#tile-${machine.id})`} strokeWidth={2} isAnimationActive animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <section className="card relative overflow-hidden border-cyan/25 p-0">
          <div className="telemetry-scanline" />
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-charcoal-600 px-5 py-4">
            <div><div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-cyan"><Gauge className="h-4 w-4" /> Selected machine</div><h2 className="mt-1 text-2xl font-black text-white">{selected.id} <span className="text-sm font-normal text-slate-500">/ {selected.name}</span></h2></div>
            <div className="flex gap-2"><span className="badge border border-cyan/30 bg-cyan/10 text-cyan">{selected.line}</span><span className="badge border border-charcoal-600 bg-charcoal-700 text-slate-400">{selected.factory}</span></div>
          </div>
          <div className="grid gap-5 p-5 lg:grid-cols-[160px_1fr_260px]">
            <div className="flex flex-col items-center justify-center"><HealthGauge value={100 - selected.defectRisk} color={color} /><div className="mt-2 text-center text-[10px] uppercase tracking-wider text-slate-500">Operational health</div></div>
            <div className="min-h-[260px]">
              <div className="mb-2 flex items-center justify-between"><div className="text-xs font-bold uppercase tracking-widest text-slate-400">Power waveform · {streamSignal.length > 1 ? 'live replay' : 'simulated signal'}</div><div className="flex gap-3 text-[10px]"><span className="text-cyan">● POWER</span>{streamSignal.length > 1 && <span className="text-warn">● EXPECTED</span>}</div></div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartSignal}>
                  <CartesianGrid stroke="#2e3640" strokeDasharray="2 6" vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} width={35} />
                  <Tooltip contentStyle={{ background: '#10161d', border: '1px solid #22d3ee55', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="power" stroke={color} strokeWidth={3} dot={false} isAnimationActive animationDuration={1000} />
                  {streamSignal.length > 1 && <Line type="monotone" dataKey="expected" stroke="#fbbf24" strokeDasharray="5 5" dot={false} />}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
              {[['RPM', selected.rpm.toLocaleString()], ['SPINDLE', `${selected.spindleLoad}%`], ['VIBRATION', `${selected.vibration} mm/s`], ['ENERGY', `${selected.energyToday.toFixed(1)} kWh`], ['GOOD PARTS', selected.goodParts.toLocaleString()], ['SCRAP', selected.scrapParts.toLocaleString()]].map(([label, value]) => <div className="telemetry-readout" key={label}><div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div><div className="mt-1 font-mono text-lg font-bold text-white">{value}</div></div>)}
            </div>
          </div>
        </section>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Detailed machine cards</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{list.map((machine) => <MachineCard key={machine.id} machine={machine} />)}</div>
      </div>
      {list.length === 0 && <div className="card text-center text-slate-500">No machines match filters.</div>}
    </div>
  )
}
