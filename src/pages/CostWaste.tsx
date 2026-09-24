import { useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { energyTrend, scrapTrend } from '@/data/simulatedData'
import { energyCost, scrapCost } from '@/lib/calculations'
import { formatNumber } from '@/lib/utils'
import {
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

export function CostWaste() {
  const { totals, settings, filteredMachines, streamConnected, latestEnergy, energyHistory } = useApp()

  const reworkParts = filteredMachines.reduce((sum, machine) => sum + machine.reworkCount, 0)
  const materialWasteKg = totals.scrap * settings.materialWeightPerPartKg
  const materialLossCost = scrapCost(totals.scrap, settings)
  const energyLossCost = energyCost(totals.energy, settings)
  const reworkMaterialCost = reworkParts * settings.materialWeightPerPartKg * settings.materialCostPerKg * 0.35
  const recentTicks = energyHistory.slice(-120)
  const excessEnergyRecentKwh = recentTicks.reduce((sum, tick) => (
    sum + Math.max(0, tick.powerKw - tick.expectedMaxKw) / 3600
  ), 0)
  const excessEnergyCostRecent = energyCost(excessEnergyRecentKwh, settings)
  const totalLoss = materialLossCost + energyLossCost + reworkMaterialCost + excessEnergyCostRecent

  const trendData = useMemo(() => {
    const dailyProduction = Math.max(1, totals.production / 7)
    const energyTargetMultiplier = 1 - settings.energyReductionTargetPct / 100
    return scrapTrend.map((scrapPoint, idx) => {
      const energyPoint = energyTrend[idx]
      const baselineScrapParts = (scrapPoint.scrapRate / 100) * dailyProduction
      const baselineScrapCost = baselineScrapParts * settings.materialWeightPerPartKg * settings.materialCostPerKg
      const baselineEnergyCost = energyCost(energyPoint.energy, settings)
      const baselineTotal = baselineScrapCost + baselineEnergyCost

      const improvedScrapRate = Math.max(settings.scrapRateTarget, scrapPoint.scrapRate - 1.2)
      const improvedScrapParts = (improvedScrapRate / 100) * dailyProduction
      const improvedScrapCost = improvedScrapParts * settings.materialWeightPerPartKg * settings.materialCostPerKg
      const improvedEnergyCost = energyCost(Math.max(0, energyPoint.energy * energyTargetMultiplier), settings)
      const improvedTotal = improvedScrapCost + improvedEnergyCost

      return {
        day: scrapPoint.day,
        baselineCost: Number(baselineTotal.toFixed(2)),
        improvedCost: Number(improvedTotal.toFixed(2)),
        reduction: Number((baselineTotal - improvedTotal).toFixed(2)),
        scrapRate: scrapPoint.scrapRate,
      }
    })
  }, [settings, totals.production])

  const drivers = [
    {
      name: 'Scrap loss',
      value: Number(materialLossCost.toFixed(2)),
      reason: `${totals.scrap} defective parts are consuming ${materialWasteKg.toFixed(1)} kg material.`,
      action: `Push scrap rate from ${totals.scrapRate.toFixed(1)}% toward ${settings.scrapRateTarget}% by tightening tool condition checks.`,
    },
    {
      name: 'Energy consumption',
      value: Number(energyLossCost.toFixed(2)),
      reason: `${totals.energy.toFixed(1)} kWh consumed across selected machines.`,
      action: `Target ${settings.energyReductionTargetPct}% reduction via idle cutback and feed optimization.`,
    },
    {
      name: 'Rework overhead',
      value: Number(reworkMaterialCost.toFixed(2)),
      reason: `${reworkParts} parts required rework in the selected scope.`,
      action: 'Run root-cause checks on recurring setup drift and incorrect fixturing.',
    },
    {
      name: 'Excess power (recent)',
      value: Number(excessEnergyCostRecent.toFixed(2)),
      reason: streamConnected
        ? `${recentTicks.length} replay ticks analyzed; ${recentTicks.filter((tick) => tick.energyAnomaly).length} anomaly ticks over expected band.`
        : 'Connect replay stream to calculate measured excess-over-band energy in real time.',
      action: 'Prioritize machines repeatedly crossing the expected power band.',
    },
  ]

  const topDrivers = [...drivers].sort((a, b) => b.value - a.value).slice(0, 3)

  const machineCostData = filteredMachines.map((machine) => {
    const latest = latestEnergy[machine.id]
    const overBandKw = latest ? Math.max(0, latest.powerKw - latest.expectedMaxKw) : 0
    const machineScrapCost = scrapCost(machine.scrapParts, settings)
    const machineEnergyCost = energyCost(machine.energyToday, settings)
    const machineExcessCost = energyCost(overBandKw / 2, settings)
    return {
      machine: machine.id,
      scrap: Number(machineScrapCost.toFixed(1)),
      energy: Number(machineEnergyCost.toFixed(1)),
      excess: Number(machineExcessCost.toFixed(1)),
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Cost & Waste</h2>
        <p className="text-sm text-slate-500">
          {streamConnected
            ? 'Live energy replay is connected. Cost drivers include recent over-band power.'
            : 'Offline mode active. Connect stream for measured excess-energy waste analytics.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total avoidable cost', `$${formatNumber(totalLoss, 0)}`, 'Scrap + energy + rework + recent excess power'],
          ['Material waste', `${materialWasteKg.toFixed(1)} kg`, `${totals.scrap} scrap parts`],
          ['Energy cost', `$${formatNumber(energyLossCost, 0)}`, `${totals.energy.toFixed(1)} kWh consumed`],
          ['Potential weekly savings', `$${formatNumber(trendData.reduce((sum, item) => sum + item.reduction, 0), 0)}`, `if target path is maintained`],
        ].map(([label, value, hint]) => (
          <div key={label} className="card">
            <div className="text-2xl font-bold text-warn">{value}</div>
            <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
            <div className="mt-2 text-xs text-slate-400">{hint}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card h-[360px]">
          <h3 className="mb-1 text-sm font-semibold text-warn">Past week cost trajectory and reduction path</h3>
          <p className="mb-3 text-xs text-slate-500">
            Baseline vs improved path using current targets ({settings.scrapRateTarget}% scrap target and {settings.energyReductionTargetPct}% energy reduction).
          </p>
          <ResponsiveContainer width="100%" height="80%">
            <ComposedChart data={trendData}>
              <CartesianGrid stroke="#2e3640" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1f26', border: '1px solid #2e3640' }} />
              <Legend />
              <Bar dataKey="reduction" fill="#10b981" radius={[4, 4, 0, 0]} name="Daily Reduction $" />
              <Line dataKey="baselineCost" stroke="#f87171" strokeWidth={2} dot={false} name="Baseline Cost $" />
              <Line dataKey="improvedCost" stroke="#22d3ee" strokeWidth={2} dot={false} name="Improved Cost $" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="card h-[360px]">
          <h3 className="mb-1 text-sm font-semibold text-warn">Why cost is leaking (driver breakdown)</h3>
          <p className="mb-3 text-xs text-slate-500">
            Top contributors computed from selected factory/line scope.
          </p>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={drivers}>
              <CartesianGrid stroke="#2e3640" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={56} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1f26', border: '1px solid #2e3640' }} />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Cost $" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-cyan">Actionable explanation</h3>
          <div className="space-y-3">
            {topDrivers.map((driver) => (
              <div key={driver.name} className="rounded-lg border border-charcoal-600 bg-charcoal-700/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{driver.name}</span>
                  <span className="text-sm font-bold text-warn">${formatNumber(driver.value, 0)}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">{driver.reason}</p>
                <p className="mt-1 text-xs text-cyan">{driver.action}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card h-[330px]">
          <h3 className="mb-1 text-sm font-semibold text-cyan">Machine-wise cost concentration</h3>
          <p className="mb-3 text-xs text-slate-500">
            Compare scrap, energy, and over-band impact per machine.
          </p>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={machineCostData}>
              <CartesianGrid stroke="#2e3640" strokeDasharray="3 3" />
              <XAxis dataKey="machine" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1f26', border: '1px solid #2e3640' }} />
              <Legend />
              <Bar dataKey="scrap" stackId="cost" fill="#ef4444" name="Scrap $" />
              <Bar dataKey="energy" stackId="cost" fill="#22d3ee" name="Energy $" />
              <Bar dataKey="excess" stackId="cost" fill="#f59e0b" name="Excess $" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
