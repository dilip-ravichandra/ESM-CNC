export type MachineStatus = 'normal' | 'warning' | 'high_risk' | 'energy_anomaly' | 'offline'
export type AlertType = 'defect_risk' | 'energy_anomaly'
export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertStatus = 'active' | 'acknowledged' | 'resolved'
export type InspectionResult =
  | 'No Issue Found'
  | 'Tool Wear Found'
  | 'Workpiece Defect Found'
  | 'Energy Inefficiency Found'
  | 'Other'

export interface Machine {
  id: string
  name: string
  factory: string
  line: string
  status: MachineStatus
  defectRisk: number
  vibration: number
  acoustic: number
  rpm: number
  feedRate: number
  spindleLoad: number
  torque: number
  power: number
  energyToday: number
  energyAnomaly: boolean
  productionCount: number
  goodParts: number
  scrapParts: number
  reworkCount: number
}

export interface Alert {
  id: string
  machineId: string
  type: AlertType
  severity: AlertSeverity
  riskScore?: number
  power?: number
  expectedPowerRange?: string
  detectedAt: string
  status: AlertStatus
  explanation: string
  recommendedAction: string
  notes?: string
  inspectionResult?: InspectionResult
  history: { action: string; at: string; by?: string }[]
}

export interface Settings {
  factory: string
  productionLine: string
  dateRange: string
  defectRiskThreshold: number
  energyAnomalyThresholdKw: number
  energyAnomalyScoreThreshold: number
  expectedBandMultiplier: number
  streamMode: 'offline_sim' | 'mendeley_replay' | 'live_api'
  electricityCostPerKwh: number
  materialCostPerKg: number
  materialWeightPerPartKg: number
  co2FactorKgPerKwh: number
  scrapRateTarget: number
  energyReductionTargetPct: number
}

export interface EnergyTick {
  machineId: string
  ts: string
  powerKw: number
  energyTodayKwh: number
  expectedMinKw: number
  expectedMaxKw: number
  anomalyScore: number
  energyAnomaly: boolean
  state: string
  source: string
}

export interface AppState {
  machines: Machine[]
  alerts: Alert[]
  settings: Settings
  productionTotal: number
  energyTotalKwh: number
}