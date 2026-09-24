import { useApp } from '@/context/AppContext'
import { Play, Zap, Trash2, RotateCcw } from 'lucide-react'

export function DemoControlPanel() {
  const {
    simulateHighDefectRisk,
    simulateEnergyAnomaly,
    clearDemoAnomalies,
    resetDemo,
  } = useApp()

  return (
    <div className="card border-cyan/20 bg-charcoal-800/80">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-cyan">Demo Control Panel</h3>
        <span className="badge bg-cyan/10 text-cyan border border-cyan/30 text-[10px]">
          PRESENTATION
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn-secondary text-xs" onClick={simulateHighDefectRisk}>
          <Play className="h-3.5 w-3.5" /> Simulate High Defect Risk
        </button>
        <button className="btn-secondary text-xs" onClick={simulateEnergyAnomaly}>
          <Zap className="h-3.5 w-3.5" /> Simulate Energy Anomaly
        </button>
        <button className="btn-secondary text-xs" onClick={clearDemoAnomalies}>
          <Trash2 className="h-3.5 w-3.5" /> Clear Demo Anomalies
        </button>
        <button className="btn-danger text-xs" onClick={resetDemo}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset Demo
        </button>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        All events are simulated and labeled DEMO. Safe for live workshop demos.
      </p>
    </div>
  )
}