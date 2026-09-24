import type { Alert, Machine, Settings } from '@/types'

const now = new Date()
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString()

export const DEFAULT_SETTINGS: Settings = {
  factory: 'All Factories',
  productionLine: 'All Lines',
  dateRange: 'Today',
  defectRiskThreshold: 70,
  energyAnomalyThresholdKw: 8,
  energyAnomalyScoreThreshold: 0.7,
  expectedBandMultiplier: 2,
  streamMode: 'offline_sim',
  electricityCostPerKwh: 0.14,
  materialCostPerKg: 12,
  materialWeightPerPartKg: 0.35,
  co2FactorKgPerKwh: 0.42,
  scrapRateTarget: 4,
  energyReductionTargetPct: 10,
}

export const initialMachines: Machine[] = [
  { id: 'CNC-01', name: 'Haas VF-2', factory: 'Factory A', line: 'CNC 1', status: 'warning', defectRisk: 62, vibration: 4.8, acoustic: 72, rpm: 4200, feedRate: 620, spindleLoad: 68, torque: 42, power: 6.4, energyToday: 48.2, energyAnomaly: false, productionCount: 1240, goodParts: 1168, scrapParts: 72, reworkCount: 21 },
  { id: 'CNC-02', name: 'Mazak VCN', factory: 'Factory A', line: 'CNC 2', status: 'normal', defectRisk: 18, vibration: 2.1, acoustic: 61, rpm: 5100, feedRate: 700, spindleLoad: 54, torque: 31, power: 5.1, energyToday: 39.6, energyAnomaly: false, productionCount: 1530, goodParts: 1498, scrapParts: 32, reworkCount: 8 },
  { id: 'CNC-03', name: 'Okuma Genos', factory: 'Factory B', line: 'CNC 1', status: 'high_risk', defectRisk: 78, vibration: 6.9, acoustic: 84, rpm: 3600, feedRate: 480, spindleLoad: 82, torque: 57, power: 7.2, energyToday: 61.4, energyAnomaly: false, productionCount: 980, goodParts: 904, scrapParts: 76, reworkCount: 34 },
  { id: 'CNC-04', name: 'DMG Mori', factory: 'Factory B', line: 'CNC 2', status: 'energy_anomaly', defectRisk: 27, vibration: 2.7, acoustic: 64, rpm: 4700, feedRate: 590, spindleLoad: 59, torque: 35, power: 8.8, energyToday: 75.1, energyAnomaly: true, productionCount: 1310, goodParts: 1270, scrapParts: 40, reworkCount: 12 },
]

export const initialAlerts: Alert[] = [
  { id: 'ALT-1001', machineId: 'CNC-03', type: 'defect_risk', severity: 'critical', riskScore: 78, detectedAt: hoursAgo(1), status: 'active', explanation: 'Vibration and acoustic readings are above the learned baseline.', recommendedAction: 'Inspect tool wear and workpiece fixturing.', history: [{ action: 'Alert detected', at: hoursAgo(1) }] },
  { id: 'ALT-1002', machineId: 'CNC-04', type: 'energy_anomaly', severity: 'warning', power: 8.8, expectedPowerRange: '5–7 kW', detectedAt: hoursAgo(3), status: 'acknowledged', explanation: 'Power draw is above the expected range for this operation.', recommendedAction: 'Review cutting parameters and idle time.', history: [{ action: 'Alert detected', at: hoursAgo(3) }, { action: 'Acknowledged', at: hoursAgo(2), by: 'Operator' }] },
  { id: 'ALT-1003', machineId: 'CNC-01', type: 'defect_risk', severity: 'warning', riskScore: 62, detectedAt: hoursAgo(8), status: 'resolved', explanation: 'Moderate defect risk detected from spindle telemetry.', recommendedAction: 'Monitor the next production batch.', inspectionResult: 'No Issue Found', history: [{ action: 'Alert detected', at: hoursAgo(8) }, { action: 'Resolved', at: hoursAgo(6), by: 'Operator' }] },
]

export const scrapTrend = [
  { day: 'Mon', scrapRate: 7.2 }, { day: 'Tue', scrapRate: 6.8 }, { day: 'Wed', scrapRate: 6.1 },
  { day: 'Thu', scrapRate: 5.8 }, { day: 'Fri', scrapRate: 6.4 }, { day: 'Sat', scrapRate: 5.1 },
  { day: 'Sun', scrapRate: 4.9 },
]

export const energyTrend = [
  { day: 'Mon', energy: 310 }, { day: 'Tue', energy: 298 }, { day: 'Wed', energy: 320 },
  { day: 'Thu', energy: 286 }, { day: 'Fri', energy: 304 }, { day: 'Sat', energy: 270 },
  { day: 'Sun', energy: 266 },
]

export const defectCategories = [
  { name: 'Tool wear', value: 38 }, { name: 'Fixturing', value: 24 },
  { name: 'Parameters', value: 21 }, { name: 'Material', value: 17 },
]
