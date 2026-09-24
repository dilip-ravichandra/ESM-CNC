import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Activity, AlertTriangle, Radio, ShieldAlert, Zap } from 'lucide-react'

const severityColors = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#22d3ee',
}

export function AnomalyCenter() {
  const {
    alerts,
    filteredMachines,
    updateAlert,
    pushToast,
    streamConnected,
    connectStream,
    disconnectStream,
    energyHistory,
  } = useApp()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')

  const machineIds = useMemo(() => new Set(filteredMachines.map((machine) => machine.id)), [filteredMachines])
  const scopedAlerts = useMemo(
    () => alerts.filter((alert) => machineIds.has(alert.machineId)),
    [alerts, machineIds]
  )
  const filtered = scopedAlerts.filter((alert) => {
    if (filter === 'defect_risk' && alert.type !== 'defect_risk') return false
    if (filter === 'energy_anomaly' && alert.type !== 'energy_anomaly') return false
    if (filter === 'critical' && alert.severity !== 'critical') return false
    if (filter === 'warning' && alert.severity !== 'warning') return false
    if (filter === 'active' && alert.status !== 'active') return false
    if (filter === 'acknowledged' && alert.status !== 'acknowledged') return false
    if (filter === 'resolved' && alert.status !== 'resolved') return false
    if (q && !`${alert.id} ${alert.machineId} ${alert.type} ${alert.explanation}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  const counts = useMemo(() => ({
    total: scopedAlerts.length,
    critical: scopedAlerts.filter((alert) => alert.severity === 'critical').length,
    active: scopedAlerts.filter((alert) => alert.status === 'active').length,
    acknowledged: scopedAlerts.filter((alert) => alert.status === 'acknowledged').length,
    resolved: scopedAlerts.filter((alert) => alert.status === 'resolved').length,
  }), [scopedAlerts])

  const severityData = [
    { name: 'Critical', value: counts.critical, color: severityColors.critical },
    { name: 'Warning', value: scopedAlerts.filter((alert) => alert.severity === 'warning').length, color: severityColors.warning },
    { name: 'Info', value: scopedAlerts.filter((alert) => alert.severity === 'info').length, color: severityColors.info },
  ]
  const machineData = filteredMachines.map((machine) => ({
    machine: machine.id,
    alerts: scopedAlerts.filter((alert) => alert.machineId === machine.id).length,
    active: scopedAlerts.filter((alert) => alert.machineId === machine.id && alert.status === 'active').length,
  }))
  const energyData = energyHistory.slice(-30).map((tick, index) => ({
    point: `${index + 1}`,
    score: Number((tick.anomalyScore * 100).toFixed(1)),
    power: Number(tick.powerKw.toFixed(2)),
    expected: Number(tick.expectedMaxKw.toFixed(2)),
  }))
  const filters = ['all', 'energy_anomaly', 'defect_risk', 'critical', 'warning', 'active', 'acknowledged', 'resolved']

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-risk">
            <ShieldAlert className="h-4 w-4" /> Detection command center
          </div>
          <h2 className="mt-1 text-3xl font-black text-white">Anomaly Center</h2>
          <p className="mt-2 text-sm text-slate-500">
            {streamConnected
              ? 'Live energy anomalies are being created from the Mendeley replay stream.'
              : 'Defect-risk and energy alerts are shown for the selected factory and CNC line.'}
          </p>
        </div>
        <button
          className={streamConnected ? 'btn-secondary' : 'btn-primary'}
          onClick={streamConnected ? disconnectStream : connectStream}
        >
          <Radio className="h-4 w-4" />
          {streamConnected ? 'Disconnect stream' : 'Connect anomaly stream'}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Scoped alerts', value: counts.total, Icon: AlertTriangle },
          { label: 'Critical', value: counts.critical, Icon: ShieldAlert },
          { label: 'Active', value: counts.active, Icon: Activity },
          { label: 'Acknowledged', value: counts.acknowledged, Icon: Radio },
          { label: 'Resolved', value: counts.resolved, Icon: Zap },
        ].map(({ label, value, Icon }) => (
          <div className="card flex items-center gap-3 py-4" key={label}>
            <Icon className="h-5 w-5 text-cyan" />
            <div><div className="text-2xl font-black text-white">{value}</div><div className="text-xs text-slate-500">{label}</div></div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card h-72 lg:col-span-2">
          <h3 className="mb-1 text-sm font-semibold text-risk">Anomaly score and power context</h3>
          <p className="mb-2 text-xs text-slate-500">Live replay score is compared with the expected maximum power band.</p>
          {energyData.length > 1 ? (
            <ResponsiveContainer width="100%" height="82%">
              <LineChart data={energyData}>
                <CartesianGrid stroke="#2e3640" strokeDasharray="3 3" />
                <XAxis dataKey="point" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis yAxisId="score" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis yAxisId="power" orientation="right" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1a1f26', border: '1px solid #2e3640' }} />
                <Line yAxisId="score" dataKey="score" stroke="#ef4444" strokeWidth={2} dot={false} name="Anomaly score %" />
                <Line yAxisId="power" dataKey="power" stroke="#22d3ee" strokeWidth={2} dot={false} name="Power kW" />
                <Line yAxisId="power" dataKey="expected" stroke="#fbbf24" strokeDasharray="5 5" dot={false} name="Expected max kW" />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="flex h-5/6 items-center justify-center text-sm text-slate-500">Connect the stream to see live anomaly context.</div>}
        </div>
        <div className="card h-72">
          <h3 className="mb-1 text-sm font-semibold text-risk">Severity mix</h3>
          <p className="mb-2 text-xs text-slate-500">Current selected factory/line scope.</p>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={4}>
                {severityData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card h-72">
          <h3 className="mb-1 text-sm font-semibold text-risk">Alerts by machine</h3>
          <p className="mb-2 text-xs text-slate-500">Use this to prioritize investigation and maintenance.</p>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={machineData}>
              <CartesianGrid stroke="#2e3640" strokeDasharray="3 3" />
              <XAxis dataKey="machine" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1f26', border: '1px solid #2e3640' }} />
              <Bar dataKey="alerts" fill="#22d3ee" name="All alerts" />
              <Bar dataKey="active" fill="#ef4444" name="Active alerts" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-risk">What the alerts mean</h3>
          <div className="space-y-3 text-xs">
            <div className="rounded-lg border border-risk/20 bg-risk/5 p-3"><b className="text-risk">Defect risk:</b> simulated vibration/acoustic indicators. It is not proof of a dimensional defect.</div>
            <div className="rounded-lg border border-warn/20 bg-warn/5 p-3"><b className="text-warn">Energy anomaly:</b> measured or replayed power is outside the rolling expected band.</div>
            <div className="rounded-lg border border-cyan/20 bg-cyan/5 p-3"><b className="text-cyan">Operator workflow:</b> acknowledge, investigate, record inspection notes, then resolve.</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((value) => (
          <button key={value} className={cn('badge cursor-pointer border px-3 py-1.5', filter === value ? 'border-cyan/40 bg-cyan/15 text-cyan' : 'border-charcoal-600 text-slate-400 hover:border-slate-500')} onClick={() => setFilter(value)}>
            {value.replace('_', ' ')}
          </button>
        ))}
        <input className="input ml-auto max-w-xs" placeholder="Search alerts..." value={q} onChange={(event) => setQ(event.target.value)} />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-charcoal-600 text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3">Alert ID</th><th className="px-4 py-3">Machine</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Severity</th><th className="px-4 py-3">Score / Power</th><th className="px-4 py-3">Detected</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((alert) => (
              <tr key={alert.id} className="border-b border-charcoal-700/80 hover:bg-charcoal-700/40">
                <td className="px-4 py-3 font-mono text-xs text-cyan">{alert.id}</td>
                <td className="px-4 py-3">{alert.machineId}</td>
                <td className="px-4 py-3 capitalize">{alert.type.replace('_', ' ')}</td>
                <td className="px-4 py-3"><span className={cn('badge', alert.severity === 'critical' ? 'bg-risk/20 text-risk' : alert.severity === 'warning' ? 'bg-warn/20 text-warn' : 'bg-cyan/20 text-cyan')}>{alert.severity}</span></td>
                <td className="px-4 py-3">{alert.riskScore != null ? `${alert.riskScore}%` : alert.power != null ? `${alert.power} kW` : '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{new Date(alert.detectedAt).toLocaleString()}</td>
                <td className="px-4 py-3 capitalize">{alert.status}</td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1"><button className="btn-primary px-2 py-1 text-[11px]" onClick={() => navigate(`/investigate/${alert.id}`)}>Investigate</button>{alert.status === 'active' && <button className="btn-secondary px-2 py-1 text-[11px]" onClick={() => { updateAlert(alert.id, { status: 'acknowledged', history: [{ action: 'Acknowledged', at: new Date().toISOString(), by: 'Operator' }] }); pushToast('Alert acknowledged', 'success') }}>Ack</button>}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-8 text-center text-slate-500">No alerts match the current factory, CNC line, and alert filters.</p>}
      </div>
    </div>
  )
}
