import {
  Package,
  Percent,
  AlertTriangle,
  Zap,
  Gauge,
  Activity,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import { useApp } from '@/context/AppContext'
import { KPICard } from '@/components/KPICard'
import { MachineCard } from '@/components/MachineCard'
import { DemoControlPanel } from '@/components/DemoControlPanel'
import { scrapTrend, energyTrend } from '@/data/simulatedData'
import { formatNumber, formatPercent } from '@/lib/utils'
import { energyCost, scrapCost } from '@/lib/calculations'
import { useNavigate } from 'react-router-dom'

const PIE_COLORS = ['#14b8a6', '#ef4444']

export function Overview() {
  const { filteredMachines, alerts, totals, settings, activeAlertCount } = useApp()
  const navigate = useNavigate()
  const activeAlerts = alerts.filter((a) => a.status === 'active').slice(0, 4)
  const scrapCostVal = scrapCost(totals.scrap, settings)
  const energyCostVal = energyCost(totals.energy, settings)
  const costPerGood =
    totals.good > 0 ? (scrapCostVal + energyCostVal) / totals.good : 0

  return (
    <div className="space-y-6">
      <DemoControlPanel />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
          title="Production Count"
          value={formatNumber(totals.production)}
          icon={<Package className="h-5 w-5" />}
          status="info"
          trend="up"
          trendLabel="+4%"
          to="/lean"
          tooltip="Total parts produced (DEMO)"
        />
        <KPICard
          title="Scrap Rate"
          value={formatPercent(totals.scrapRate)}
          icon={<Percent className="h-5 w-5" />}
          status={totals.scrapRate > 6 ? 'risk' : 'warning'}
          trend="flat"
          trendLabel="vs baseline 7%"
          to="/lean"
        />
        <KPICard
          title="Defect Risk (max)"
          value={`${Math.max(...filteredMachines.map((m) => m.defectRisk), 0)}%`}
          icon={<AlertTriangle className="h-5 w-5" />}
          status="risk"
          to="/anomalies"
        />
        <KPICard
          title="Energy Consumption"
          value={formatNumber(totals.energy)}
          suffix="kWh"
          icon={<Zap className="h-5 w-5" />}
          status="info"
          to="/green"
        />
        <KPICard
          title="Energy / Good Part"
          value={totals.energyPerGood.toFixed(2)}
          suffix="kWh"
          icon={<Gauge className="h-5 w-5" />}
          status="normal"
          to="/green"
        />
        <KPICard
          title="Active Anomalies"
          value={activeAlertCount}
          icon={<Activity className="h-5 w-5" />}
          status={activeAlertCount > 0 ? 'warning' : 'normal'}
          to="/anomalies"
        />
      </div>

      {/* Machines */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Machine Health Monitoring
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filteredMachines.map((m) => (
            <MachineCard key={m.id} machine={m} />
          ))}
        </div>
      </section>

      {/* Lean + Green previews */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-lean">Lean Analytics Preview</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scrapTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3640" />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#1a1f26', border: '1px solid #2e3640' }}
                />
                <Line type="monotone" dataKey="scrapRate" stroke="#14b8a6" strokeWidth={2} dot={false} name="Scrap %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Good', value: totals.good },
                      { name: 'Scrap', value: totals.scrap },
                    ]}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                  >
                    {PIE_COLORS.map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Material Waste</span>
                <span>{(totals.scrap * settings.materialWeightPerPartKg).toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rework Rate</span>
                <span>
                  {totals.production
                    ? (
                        (filteredMachines.reduce((s, m) => s + m.reworkCount, 0) /
                          totals.production) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <button className="btn-secondary mt-2 w-full text-xs" onClick={() => navigate('/lean')}>
                Open Lean Analytics
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-green">Green Analytics Preview</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={energyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3640" />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1f26', border: '1px solid #2e3640' }} />
                <Line type="monotone" dataKey="kwh" stroke="#10b981" strokeWidth={2} dot={false} name="kWh" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredMachines.map((m) => ({ name: m.id, kwh: m.energyToday }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3640" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1f26', border: '1px solid #2e3640' }} />
                <Bar dataKey="kwh" fill="#10b981" radius={[4, 4, 0, 0]} name="Energy (kWh)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <button className="btn-secondary mt-3 w-full text-xs" onClick={() => navigate('/green')}>
            Open Green Analytics
          </button>
        </div>
      </div>

      {/* Alerts */}
      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Active Alerts</h3>
          <button className="text-xs text-cyan hover:underline" onClick={() => navigate('/anomalies')}>
            View all
          </button>
        </div>
        <div className="space-y-3">
          {activeAlerts.length === 0 && (
            <p className="text-sm text-slate-500">No active alerts.</p>
          )}
          {activeAlerts.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-charcoal-600 bg-charcoal-700/50 px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      a.severity === 'critical'
                        ? 'badge bg-risk/20 text-risk border border-risk/40'
                        : 'badge bg-warn/20 text-warn border border-warn/40'
                    }
                  >
                    {a.severity}
                  </span>
                  <span className="text-sm font-medium text-white">{a.machineId}</span>
                  <span className="text-xs text-slate-500">
                    {a.type === 'defect_risk' ? 'Defect Risk' : 'Energy Anomaly'}
                  </span>
                </div>
                <p className="mt-1 max-w-xl text-xs text-slate-400 line-clamp-1">{a.explanation}</p>
              </div>
              <button
                className="btn-primary text-xs"
                onClick={() => navigate(`/investigate/${a.id}`)}
              >
                Investigate
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Cost summary */}
      <section className="card">
        <h3 className="mb-4 text-sm font-semibold text-white">Cost & Waste Summary</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <div className="text-xs text-slate-500">Est. Scrap Cost</div>
            <div className="text-lg font-semibold text-white">${scrapCostVal.toFixed(0)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Est. Energy Cost</div>
            <div className="text-lg font-semibold text-white">${energyCostVal.toFixed(0)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Material Waste</div>
            <div className="text-lg font-semibold text-white">
              {(totals.scrap * settings.materialWeightPerPartKg).toFixed(1)} kg
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Cost / Good Part</div>
            <div className="text-lg font-semibold text-white">${costPerGood.toFixed(3)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Potential Savings (hyp.)</div>
            <div className="text-lg font-semibold text-lean">
              ~${(scrapCostVal * 0.4 + energyCostVal * 0.1).toFixed(0)}
            </div>
            <div className="text-[10px] text-slate-600">Hypothetical scenario only</div>
          </div>
        </div>
        <button className="btn-secondary mt-4 text-xs" onClick={() => navigate('/cost')}>
          Open Cost & Waste
        </button>
      </section>
    </div>
  )
}