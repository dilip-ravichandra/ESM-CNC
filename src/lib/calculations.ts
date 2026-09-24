import type { Machine, Settings } from '../types'

export function totalsFromMachines(machines: Machine[]) {
  const production = machines.reduce((s, m) => s + m.productionCount, 0)
  const good = machines.reduce((s, m) => s + m.goodParts, 0)
  const scrap = machines.reduce((s, m) => s + m.scrapParts, 0)
  const energy = machines.reduce((s, m) => s + m.energyToday, 0)
  const scrapRate = production > 0 ? (scrap / production) * 100 : 0
  const energyPerGood = good > 0 ? energy / good : 0
  return { production, good, scrap, energy, scrapRate, energyPerGood }
}

export function scrapCost(scrapParts: number, settings: Settings) {
  return scrapParts * settings.materialWeightPerPartKg * settings.materialCostPerKg
}

export function energyCost(kwh: number, settings: Settings) {
  return kwh * settings.electricityCostPerKwh
}

export function co2Estimate(kwh: number, settings: Settings) {
  return kwh * settings.co2FactorKgPerKwh
}

export function scenarioScrapAvoided(
  production: number,
  baselineRatePct: number,
  targetRatePct: number
) {
  const baselineScrap = (baselineRatePct / 100) * production
  const targetScrap = (targetRatePct / 100) * production
  return Math.max(0, baselineScrap - targetScrap)
}