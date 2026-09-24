import { useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { energyCost, co2Estimate } from '@/lib/calculations'
import { energyTrend } from '@/data/simulatedData'
import { formatNumber } from '@/lib/utils'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export function GreenAnalytics() {
  const {
    totals,
    settings,
    filteredMachines,
    streamConnected,
    connectStream,
    disconnectStream,
    energyHistory,
    latestEnergy,
  } = useApp()

  const recentTicks = energyHistory.slice(-120)
  const anomalyTicks = recentTicks.filter((tick) => tick.energyAnomaly).length
  const excessKwh = recentTicks.reduce(
    (sum, tick) => sum + Math.max(0, tick.powerKw - tick.expectedMaxKw) / 3600,
    0
  )
  const baselineKwh = Math.max(totals.energy, totals.energy * 1.12)
  const targetKwh = baselineKwh * (1 - settings.energyReductionTargetPct / 100)
  const avoidedKwh = Math.max(0, baselineKwh - totals.energy)
  const liveExcessCost = energyCost(excessKwh, settings)
  const energySpend = energyCost(totals.energy, settings)
  const emissions = co2Estimate(totals.energy, settings)
  const avoidedEmissions = co2Estimate(avoidedKwh, settings)

  const trendData = useMemo(() => {
    if (streamConnected && recentTicks.length > 1) {
      return recentTicks.map((tick, index) => ({
        label: `${index + 1}s`,
        actual: Number(tick.powerKw.toFixed(2)),
        expected: Number(((tick.expectedMinKw + tick.expectedMaxKw) / 2).toFixed(2)),
        co2: Number((tick.powerKw * settings.co2FactorKgPerKwh / 3600).toFixed(4)),
      }))
    }
    return energyTrend.map((point) => ({
      label: point.day,
      actual: point.energy,
      expected: Number((point.energy * 0.9).toFixed(1)),
      co2: Number((point.energy * settings.co2FactorKgPerKwh).toFixed(1)),
    }))
  }, [recentTicks, settings.co2FactorKgPerKwh, streamConnected])

  const reductionTrend = useMemo(() => {
    return energyTrend.map((point) => ({
      day: point.day,
      baseline: point.energy,
      actual: Number((point.energy * (0.96 - (point.energy % 7) / 100)).toFixed(1)),
      target: Number((point.energy * (1 - settings.energyReductionTargetPct / 100)).toFixed(1)),
    }))
  }, [settings.energyReductionTargetPct])

  const drivers = [
    {
      name: 'Idle / standby draw',
      value: Math.max(0, totals.energy * 0.18),
      reason: 'Machines consume power while waiting between jobs, tool changes, or operator actions.',
      action: 'Use automatic idle sleep and reduce non-cutting dwell time.',
    },
    {
      name: 'High-load cutting',
      value: Math.max(0, totals.energy * 0.34),
      reason: 'High spindle load and aggressive feed settings increase power per part.',
      action: 'Tune feed/speed against the expected power band before the next run.',
    },
    {
      name: 'Over-band anomalies',
      value: liveExcessCost,
      reason: streamConnected
        ? `${anomalyTicks} replay ticks exceeded the expected power band.`
        : 'Measured over-band waste becomes available after connecting the Mendeley replay.',
      action: 'Investigate repeated spikes by machine, phase, and NC operation.',
    },
    {
      name: 'Conversion emissions',
      value: emissions,
      reason: `Every consumed kWh contributes ${settings.co2FactorKgPerKwh.toFixed(2)} kg CO₂e at the configured factor.`,
      action: 'Reduce kWh per good part and prefer lower-energy process windows.',
    },
  ]

  const machineEnergyData = filteredMachines.map((machine) => {
    const latest = latestEnergy[machine.id]
    return {
      machine: machine.id,
      energy: Number(machine.energyToday.toFixed(1)),
      co2: Number(co2Estimate(machine.energyToday, settings).toFixed(1)),
      excess: latest ? Number((Math.max(0, latest.powerKw - latest.expectedMaxKw) / 2).toFixed(2)) : 0,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Green Analytics</h2>
          <p className="text-sm text-slate-500">
            {streamConnected
              ? 'ENERGY STREAM · Mendeley replay is feeding the sustainability view.'
              : 'Offline telemetry with historical energy and CO₂ estimates.'}
          </p>
        </div>
        <button
          className={streamConnected ? 'btn-secondary' : 'btn-primary'}
          onClick={streamConnected ? disconnectStream : connectStream}
        >
          {streamConnected ? 'Disconnect stream' : 'Connect stream'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Energy consumed', `${totals.energy.toFixed(1)} kWh`, 'Measured/estimated selected scope'],
          ['Energy spend', `$${formatNumber(energySpend, 2)}`, `Tariff $${settings.electricityCostPerKwh}/kWh`],
          ['CO₂ footprint', `${emissions.toFixed(1)} kg`, `Factor ${settings.co2FactorKgPerKwh} kg/kWh`],
          ['Avoided CO₂', `${avoidedEmissions.toFixed(1)} kg`, 'Compared with baseline path'],
          ['Energy anomalies', `${anomalyTicks}`, streamConnected ? 'Replay ticks over band' : 'Connect stream to measure'],
        ].map(([label, value, hint]) => (
          <div className="card" key={label}>
            <div className="text-2xl font-bold text-green">{value}</div>
            <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
            <div className="mt-2 text-xs text-slate-400">{hint}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card h-[370px]">
          <h3 className="mb-1 text-sm font-semibold text-green">
            {streamConnected ? 'Live power vs expected band' : 'Energy history vs expected reduction'}
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            {streamConnected
              ? 'The cyan line is replayed power; the amber line is the rolling expected level.'
              : 'Historical energy is compared with the target reduction path.'}
          </p>
          <ResponsiveContainer width="100%" height="78%">
            <ComposedChart data={streamConnected ? trendData : reductionTrend}>
              <CartesianGrid stroke="#2e3640" strokeDasharray="3 3" />
              <XAxis dataKey={streamConnected ? 'label' : 'day'} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1f26', border: '1px solid #2e3640' }} />
              <Legend />
              {streamConnected ? (
                <>
                  <Line dataKey="actual" stroke="#22d3ee" strokeWidth={3} dot={false} name="Power kW" />
                  <Line dataKey="expected" stroke="#fbbf24" strokeDasharray="5 5" dot={false} name="Expected kW" />
                </>
              ) : (
                <>
                  <Line dataKey="baseline" stroke="#f87171" strokeWidth={2} dot={false} name="Baseline kWh" />
                  <Line dataKey="actual" stroke="#22d3ee" strokeWidth={2} dot={false} name="Actual kWh" />
                  <Line dataKey="target" stroke="#34d399" strokeDasharray="5 5" dot={false} name="Target kWh" />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="card h-[370px]">
          <h3 className="mb-1 text-sm font-semibold text-green">How emissions are reduced</h3>
          <p className="mb-3 text-xs text-slate-500">
            Lowering kWh lowers both electricity spend and CO₂ at the configured emission factor.
          </p>
          <ResponsiveContainer width="100%" height="78%">
            <AreaChart data={reductionTrend}>
              <defs>
                <linearGradient id="greenActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2e3640" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1f26', border: '1px solid #2e3640' }} />
              <Legend />
              <Area dataKey="actual" stroke="#10b981" fill="url(#greenActual)" strokeWidth={2} name="Actual kWh" />
              <Line dataKey="target" stroke="#22d3ee" strokeDasharray="5 5" dot={false} name="Target kWh" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card h-[350px]">
          <h3 className="mb-1 text-sm font-semibold text-green">Machine energy and CO₂ concentration</h3>
          <p className="mb-3 text-xs text-slate-500">Use this view to prioritize the machines with the largest environmental footprint.</p>
          <ResponsiveContainer width="100%" height="78%">
            <BarChart data={machineEnergyData}>
              <CartesianGrid stroke="#2e3640" strokeDasharray="3 3" />
              <XAxis dataKey="machine" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1f26', border: '1px solid #2e3640' }} />
              <Legend />
              <Bar dataKey="energy" fill="#10b981" name="Energy kWh" />
              <Bar dataKey="co2" fill="#22d3ee" name="CO₂ kg" />
              <Bar dataKey="excess" fill="#f59e0b" name="Excess kWh" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-green">Why energy is being wasted</h3>
          <div className="space-y-3">
            {drivers.slice(0, 3).map((driver) => (
              <div className="rounded-lg border border-charcoal-600 bg-charcoal-700/50 p-3" key={driver.name}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{driver.name}</span>
                  <span className="text-sm font-bold text-green">
                    {driver.name === 'Conversion emissions' ? `${driver.value.toFixed(1)} kg` : `$${driver.value.toFixed(2)}`}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">{driver.reason}</p>
                <p className="mt-1 text-xs text-cyan">{driver.action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card border-green/25 bg-green/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-green">Recommended sustainability path</h3>
            <p className="mt-1 text-xs text-slate-400">
              Reduce approximately {avoidedKwh.toFixed(1)} kWh versus the current baseline, saving ${energyCost(avoidedKwh, settings).toFixed(2)} and {avoidedEmissions.toFixed(1)} kg CO₂.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-green">{targetKwh.toFixed(1)} kWh</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">target energy path</div>
          </div>
        </div>
      </div>
    </div>
  )
}
