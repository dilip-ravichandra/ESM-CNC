import { useNavigate } from 'react-router-dom'
import type { Machine } from '@/types'
import { cn } from '@/lib/utils'
import { Activity, Zap } from 'lucide-react'

const statusMap: Record<
  Machine['status'],
  { label: string; className: string }
> = {
  normal: { label: 'Normal', className: 'bg-green/15 text-green border-green/30' },
  warning: { label: 'Warning', className: 'bg-warn/15 text-warn border-warn/30' },
  high_risk: { label: 'High Defect Risk', className: 'bg-risk/15 text-risk border-risk/30' },
  energy_anomaly: { label: 'Energy Anomaly', className: 'bg-warn/15 text-warn border-warn/30' },
  offline: { label: 'Offline', className: 'bg-slate-600/30 text-slate-400 border-slate-600' },
}

export function MachineCard({ machine }: { machine: Machine }) {
  const navigate = useNavigate()
  const st = statusMap[machine.status]

  return (
    <div className="card card-hover">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">{machine.id}</h3>
          <p className="text-xs text-slate-500">
            {machine.line} · {machine.factory}
          </p>
        </div>
        <span className={cn('badge border', st.className)}>{st.label}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-[10px] uppercase text-slate-500">Defect Risk</div>
          <div
            className={cn(
              'font-semibold',
              machine.defectRisk >= 70 ? 'text-risk' : machine.defectRisk >= 40 ? 'text-warn' : 'text-green'
            )}
          >
            {machine.defectRisk}%
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500">Vibration</div>
          <div className="font-medium text-slate-200">{machine.vibration} mm/s</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500">Spindle Load</div>
          <div className="font-medium text-slate-200">{machine.spindleLoad}%</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500">Power</div>
          <div className="flex items-center gap-1 font-medium text-slate-200">
            <Zap className="h-3.5 w-3.5 text-cyan" />
            {machine.power} kW
          </div>
        </div>
      </div>
      {machine.energyAnomaly && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-warn">
          <Activity className="h-3.5 w-3.5" />
          Energy anomaly detected (DEMO)
        </div>
      )}
      <button
        className="btn-secondary mt-4 w-full"
        onClick={() => navigate(`/machines/${machine.id}`)}
      >
        View Details
      </button>
    </div>
  )
}