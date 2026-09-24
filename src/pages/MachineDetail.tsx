import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ArrowLeft } from 'lucide-react'

const trend = Array.from({ length: 12 }, (_, i) => ({
  t: `${i}:00`,
  risk: 20 + Math.sin(i / 2) * 15 + (i > 8 ? 40 : 0),
  vib: 2 + Math.sin(i / 3) * 1.5 + (i > 8 ? 4 : 0),
  power: 5 + Math.cos(i / 2) * 1.2,
}))

export function MachineDetail() {
  const { id } = useParams()
  const { machines, alerts } = useApp()
  const navigate = useNavigate()
  const m = machines.find((x) => x.id === id)
  if (!m) {
    return (
      <div className="card">
        Machine not found.{' '}
        <button className="text-cyan" onClick={() => navigate('/machines')}>
          Back
        </button>
      </div>
    )
  }
  const machineAlerts = alerts.filter((a) => a.machineId === m.id)

  return (
    <div className="space-y-6">
      <button className="btn-secondary text-xs" onClick={() => navigate('/machines')}>
        <ArrowLeft className="h-3.5 w-3.5" /> Back to machines
      </button>
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">{m.id}</h2>
            <p className="text-sm text-slate-400">
              {m.line} · {m.factory} · Simulated telemetry
            </p>
          </div>
          <span className="badge border border-cyan/30 bg-cyan/10 text-cyan uppercase">
            DEMO DATA
          </span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['Defect Risk', `${m.defectRisk}%`],
            ['Vibration', `${m.vibration} mm/s`],
            ['Acoustic', `${m.acoustic} dB`],
            ['RPM', m.rpm],
            ['Feed Rate', `${m.feedRate} mm/min`],
            ['Spindle Load', `${m.spindleLoad}%`],
            ['Torque', `${m.torque} Nm`],
            ['Power', `${m.power} kW`],
            ['Energy Today', `${m.energyToday} kWh`],
            ['Good / Scrap', `${m.goodParts} / ${m.scrapParts}`],
          ].map(([k, v]) => (
            <div key={k as string}>
              <div className="text-[10px] uppercase text-slate-500">{k}</div>
              <div className="text-sm font-semibold text-white">{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          { key: 'risk', name: 'Defect Risk %', color: '#ef4444' },
          { key: 'vib', name: 'Vibration', color: '#f59e0b' },
          { key: 'power', name: 'Power kW', color: '#22d3ee' },
        ].map((c) => (
          <div key={c.key} className="card">
            <h4 className="mb-2 text-xs font-medium text-slate-400">{c.name} (simulated)</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e3640" />
                  <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1a1f26', border: '1px solid #2e3640' }} />
                  <Line type="monotone" dataKey={c.key} stroke={c.color} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 className="mb-3 text-sm font-semibold">Alerts for this machine</h3>
        {machineAlerts.length === 0 && <p className="text-sm text-slate-500">None</p>}
        <ul className="space-y-2">
          {machineAlerts.map((a) => (
            <li key={a.id} className="flex justify-between text-sm">
              <span>
                {a.id} · {a.type} · {a.status}
              </span>
              <button className="text-cyan text-xs" onClick={() => navigate(`/investigate/${a.id}`)}>
                Investigate
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-lg border border-charcoal-600 bg-charcoal-700/40 p-3 text-xs text-slate-400">
          <strong className="text-slate-300">Recommended inspection:</strong> Check tool wear,
          workpiece fixturing, and cutting parameters. Risk scores are simulated model outputs,
          not validated micro-fracture detection.
        </div>
      </div>
    </div>
  )
}