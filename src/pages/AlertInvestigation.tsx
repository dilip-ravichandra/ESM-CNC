import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import type { InspectionResult } from '@/types'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const sampleTrend = Array.from({ length: 10 }, (_, i) => ({
  t: i,
  value: 5 + Math.sin(i) * 2 + (i > 6 ? 3 : 0),
}))

export function AlertInvestigation() {
  const { id } = useParams()
  const { alerts, machines, updateAlert, pushToast, latestEnergy, energyHistory, streamConnected } = useApp()
  const navigate = useNavigate()
  const alert = alerts.find((a) => a.id === id)
  const machine = machines.find((m) => m.id === alert?.machineId)
  const liveEnergy = machine ? latestEnergy[machine.id] : undefined
  const liveTrend = machine
    ? energyHistory.filter((tick) => tick.machineId === machine.id).slice(-30)
    : []
  const [notes, setNotes] = useState(alert?.notes ?? '')
  const [result, setResult] = useState<InspectionResult | ''>(alert?.inspectionResult ?? '')

  if (!alert) {
    return (
      <div className="card">
        Alert not found.{' '}
        <button className="text-cyan" onClick={() => navigate('/anomalies')}>
          Back
        </button>
      </div>
    )
  }

  const act = (status: 'acknowledged' | 'resolved', label: string) => {
    updateAlert(alert.id, {
      status,
      notes,
      inspectionResult: result || undefined,
      history: [{ action: label, at: new Date().toISOString(), by: 'Operator' }],
    })
    pushToast(label, 'success')
  }

  return (
    <div className="space-y-6">
      <button className="btn-secondary text-xs" onClick={() => navigate('/anomalies')}>
        ← Anomaly Center
      </button>
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">{alert.id}</h2>
            <p className="text-sm text-slate-400">
              {alert.machineId} · {alert.type.replace('_', ' ')} · {alert.severity}
            </p>
          </div>
          <span className="badge border border-cyan/30 bg-cyan/10 text-cyan">
            {streamConnected ? 'ENERGY STREAM · Mendeley replay' : 'DEMO · Simulated'}
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4 text-sm">
          <div>
            <div className="text-xs text-slate-500">Status</div>
            <div className="capitalize font-medium">{alert.status}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Detected</div>
            <div>{new Date(alert.detectedAt).toLocaleString()}</div>
          </div>
          {alert.riskScore != null && (
            <div>
              <div className="text-xs text-slate-500">Risk Score</div>
              <div className="text-risk font-semibold">{alert.riskScore}%</div>
            </div>
          )}
          {alert.power != null && (
            <div>
              <div className="text-xs text-slate-500">Power</div>
              <div>
                {alert.power} kW (exp. {alert.expectedPowerRange})
              </div>
            </div>
          )}
          {liveEnergy && (
            <div>
              <div className="text-xs text-slate-500">Live expected band</div>
              <div>{liveEnergy.expectedMinKw.toFixed(2)}–{liveEnergy.expectedMaxKw.toFixed(2)} kW</div>
            </div>
          )}
        </div>
        {machine && (
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-charcoal-700/50 p-3 text-xs sm:grid-cols-4">
            <div>Vibration: {machine.vibration} mm/s</div>
            <div>Spindle: {machine.spindleLoad}%</div>
            <div>RPM: {machine.rpm}</div>
            <div>Power: {machine.power} kW</div>
          </div>
        )}
        <p className="mt-4 text-sm text-slate-300">{alert.explanation}</p>
        <p className="mt-2 text-sm text-lean">
          <strong>Recommended:</strong> {alert.recommendedAction}
        </p>
        <p className="mt-2 text-[11px] text-slate-500">
          {streamConnected
            ? 'Energy readings are replayed from the supplied Mendeley repository. Defect-risk readings remain simulated.'
            : 'These are simulated readings. A high risk score is not proof of a defective workpiece.'}
        </p>
      </div>
      <div className="card">
        <h3 className="mb-2 text-sm font-semibold">{liveTrend.length ? 'Live power trend (Mendeley replay)' : 'Trend (simulated)'}</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={liveTrend.length ? liveTrend : sampleTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e3640" />
              <XAxis dataKey={liveTrend.length ? 'ts' : 't'} tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1a1f26', border: '1px solid #2e3640' }} />
              <Line type="monotone" dataKey={liveTrend.length ? 'powerKw' : 'value'} stroke="#22d3ee" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold">Operator actions</h3>
        <div>
          <label className="label">Inspection result</label>
          <select
            className="input"
            value={result}
            onChange={(e) => setResult(e.target.value as InspectionResult)}
          >
            <option value="">Select...</option>
            <option>No Issue Found</option>
            <option>Tool Wear Found</option>
            <option>Workpiece Defect Found</option>
            <option>Energy Inefficiency Found</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea
            className="input min-h-[80px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Operator notes..."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => act('acknowledged', 'Acknowledged')}>
            Acknowledge Alert
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              updateAlert(alert.id, {
                notes,
                inspectionResult: result || undefined,
                history: [
                  {
                    action: 'Inspection marked complete',
                    at: new Date().toISOString(),
                    by: 'Operator',
                  },
                ],
              })
              pushToast('Inspection marked complete', 'info')
            }}
          >
            Mark Inspection Complete
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              updateAlert(alert.id, {
                history: [
                  {
                    action: 'Escalated to engineer',
                    at: new Date().toISOString(),
                    by: 'Operator',
                  },
                ],
              })
              pushToast('Escalated to engineer (DEMO)', 'warning')
            }}
          >
            Escalate to Engineer
          </button>
          <button className="btn-success" onClick={() => act('resolved', 'Resolved')}>
            Resolve Alert
          </button>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-medium text-slate-500">History</h4>
          <ul className="space-y-1 text-xs text-slate-400">
            {alert.history.map((h, i) => (
              <li key={i}>
                {new Date(h.at).toLocaleString()} — {h.action}
                {h.by ? ` (${h.by})` : ''}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}