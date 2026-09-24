import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import type { Alert, Machine, Settings, InspectionResult, EnergyTick } from '../types'
import {
  DEFAULT_SETTINGS,
  initialAlerts,
  initialMachines,
} from '../data/simulatedData'
import { totalsFromMachines } from '../lib/calculations'

interface Toast {
  id: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
}

interface AppContextValue {
  machines: Machine[]
  alerts: Alert[]
  settings: Settings
  setSettings: (s: Settings | ((prev: Settings) => Settings)) => void
  updateAlert: (id: string, patch: Partial<Alert>) => void
  addAlert: (a: Alert) => void
  resetDemo: () => void
  simulateHighDefectRisk: () => void
  simulateEnergyAnomaly: () => void
  clearDemoAnomalies: () => void
  totals: ReturnType<typeof totalsFromMachines>
  activeAlertCount: number
  toasts: Toast[]
  pushToast: (message: string, type?: Toast['type']) => void
  filteredMachines: Machine[]
  streamConnected: boolean
  latestEnergy: Record<string, EnergyTick>
  energyHistory: EnergyTick[]
  connectStream: () => void
  disconnectStream: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

const STORAGE_KEY = 'ecolean-ai-state-v1'

function normalizeMachines(machines: Machine[]): Machine[] {
  return machines.map((machine) => {
    const canonical = initialMachines.find((item) => item.id === machine.id)
    return canonical
      ? { ...machine, factory: canonical.factory, line: canonical.line }
      : machine
  })
}

function loadState(): { machines: Machine[]; alerts: Alert[]; settings: Settings } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const savedSettings = { ...DEFAULT_SETTINGS, ...parsed.settings }
      return {
        machines: normalizeMachines(parsed.machines ?? initialMachines),
        alerts: parsed.alerts ?? initialAlerts,
        settings: {
          ...savedSettings,
          factory: savedSettings.factory === 'Plant A' ? 'Factory A' : savedSettings.factory === 'Plant B' ? 'Factory B' : savedSettings.factory,
          productionLine: savedSettings.productionLine === 'Line 1' ? 'CNC 1' : savedSettings.productionLine === 'Line 2' ? 'CNC 2' : savedSettings.productionLine,
        },
      }
    }
  } catch {}
  return { machines: initialMachines, alerts: initialAlerts, settings: DEFAULT_SETTINGS }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const loaded = loadState()
  const [machines, setMachines] = useState<Machine[]>(loaded.machines)
  const [alerts, setAlerts] = useState<Alert[]>(loaded.alerts)
  const [settings, setSettingsState] = useState<Settings>(loaded.settings)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [streamConnected, setStreamConnected] = useState(false)
  const [latestEnergy, setLatestEnergy] = useState<Record<string, EnergyTick>>({})
  const [energyHistory, setEnergyHistory] = useState<EnergyTick[]>([])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ machines, alerts, settings })
    )
  }, [machines, alerts, settings])

  const setSettings = useCallback((s: Settings | ((prev: Settings) => Settings)) => {
    setSettingsState(s)
  }, [])

  const pushToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = `t-${Date.now()}`
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  const updateAlert = useCallback((id: string, patch: Partial<Alert>) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              ...patch,
              history: patch.history
                ? [...a.history, ...patch.history]
                : a.history,
            }
          : a
      )
    )
  }, [])

  const addAlert = useCallback((a: Alert) => {
    setAlerts((prev) => [a, ...prev])
  }, [])

  const resetDemo = useCallback(() => {
    setMachines(initialMachines)
    setAlerts(initialAlerts)
    setSettingsState(DEFAULT_SETTINGS)
    localStorage.removeItem(STORAGE_KEY)
    pushToast('Demo reset to default state', 'success')
  }, [pushToast])

  const simulateHighDefectRisk = useCallback(() => {
    setMachines((prev) =>
      prev.map((m) =>
        m.id === 'CNC-01'
          ? {
              ...m,
              status: 'high_risk',
              defectRisk: 91,
              vibration: 9.1,
              spindleLoad: 94,
              acoustic: 95,
            }
          : m
      )
    )
    const id = `ALT-DEMO-D-${Date.now()}`
    addAlert({
      id,
      machineId: 'CNC-01',
      type: 'defect_risk',
      severity: 'critical',
      riskScore: 91,
      detectedAt: new Date().toISOString(),
      status: 'active',
      explanation:
        'DEMO: Simulated high defect-risk event on CNC-01 — abnormal vibration and spindle load.',
      recommendedAction: 'Inspect tool and workpiece (DEMO).',
      history: [{ action: 'DEMO high defect risk simulated', at: new Date().toISOString() }],
    })
    pushToast('Simulated high defect risk on CNC-01', 'warning')
  }, [addAlert, pushToast])

  const simulateEnergyAnomaly = useCallback(() => {
    setMachines((prev) =>
      prev.map((m) =>
        m.id === 'CNC-04'
          ? { ...m, status: 'energy_anomaly', power: 9.2, energyAnomaly: true }
          : m
      )
    )
    const id = `ALT-DEMO-E-${Date.now()}`
    addAlert({
      id,
      machineId: 'CNC-04',
      type: 'energy_anomaly',
      severity: 'warning',
      power: 9.2,
      expectedPowerRange: '5–7 kW',
      detectedAt: new Date().toISOString(),
      status: 'active',
      explanation: 'DEMO: Simulated energy anomaly — power above expected range.',
      recommendedAction: 'Review parameters and idle time (DEMO).',
      history: [{ action: 'DEMO energy anomaly simulated', at: new Date().toISOString() }],
    })
    pushToast('Simulated energy anomaly on CNC-04', 'warning')
  }, [addAlert, pushToast])

  const clearDemoAnomalies = useCallback(() => {
    setMachines(initialMachines)
    setAlerts((prev) =>
      prev.map((a) =>
        a.id.startsWith('ALT-DEMO')
          ? {
              ...a,
              status: 'resolved' as const,
              history: [
                ...a.history,
                { action: 'Cleared via Demo Control', at: new Date().toISOString() },
              ],
            }
          : a
      )
    )
    pushToast('Demo anomalies cleared', 'success')
  }, [pushToast])

  const handleEnergyTick = useCallback((tick: EnergyTick) => {
    setLatestEnergy((prev) => ({ ...prev, [tick.machineId]: tick }))
    setEnergyHistory((prev) => [...prev.slice(-119), tick])
    setMachines((prev) =>
      prev.map((machine) =>
        machine.id === tick.machineId
          ? {
              ...machine,
              power: tick.powerKw,
              energyToday: tick.energyTodayKwh,
              energyAnomaly: tick.energyAnomaly,
              status: tick.energyAnomaly ? 'energy_anomaly' : machine.status === 'energy_anomaly' ? 'normal' : machine.status,
            }
          : machine
      )
    )
    if (tick.energyAnomaly) {
      setAlerts((prev) => {
        const recent = prev.find(
          (alert) =>
            alert.id.startsWith('ALT-STREAM') &&
            alert.machineId === tick.machineId &&
            alert.status === 'active'
        )
        if (recent) return prev
        return [
          {
            id: `ALT-STREAM-${Date.now()}`,
            machineId: tick.machineId,
            type: 'energy_anomaly',
            severity: tick.anomalyScore >= 0.9 ? 'critical' : 'warning',
            power: tick.powerKw,
            expectedPowerRange: `${tick.expectedMinKw.toFixed(2)}–${tick.expectedMaxKw.toFixed(2)} kW`,
            detectedAt: tick.ts,
            status: 'active',
            explanation: `Mendeley replay power is outside the rolling expected band (score ${(tick.anomalyScore * 100).toFixed(0)}%).`,
            recommendedAction: 'Review the process phase and compare against the expected power band.',
            history: [{ action: 'Energy anomaly detected by replay stream', at: tick.ts }],
          },
          ...prev,
        ]
      })
    }
  }, [])

  const connectStream = useCallback(() => {
    if (streamConnected) return
    const socketUrl = import.meta.env.VITE_API_WS_URL || 'ws://127.0.0.1:8000/ws/telemetry'
    const socket = new WebSocket(socketUrl)
    socket.onopen = () => {
      setStreamConnected(true)
      setSettingsState((prev) => ({ ...prev, streamMode: 'mendeley_replay' }))
      pushToast('Connected to Mendeley energy replay', 'success')
    }
    socket.onmessage = (event) => handleEnergyTick(JSON.parse(event.data) as EnergyTick)
    socket.onerror = () => pushToast('Energy stream connection failed. Start the FastAPI backend.', 'error')
    socket.onclose = () => setStreamConnected(false)
    ;(window as Window & { ecoLeanSocket?: WebSocket }).ecoLeanSocket = socket
  }, [handleEnergyTick, pushToast, streamConnected])

  const disconnectStream = useCallback(() => {
    ;(window as Window & { ecoLeanSocket?: WebSocket }).ecoLeanSocket?.close()
    setStreamConnected(false)
    setSettingsState((prev) => ({ ...prev, streamMode: 'offline_sim' }))
    pushToast('Disconnected from energy stream', 'info')
  }, [pushToast])

  const totals = useMemo(() => totalsFromMachines(machines), [machines])
  const activeAlertCount = useMemo(
    () => alerts.filter((a) => a.status === 'active').length,
    [alerts]
  )

  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      const factoryMatches =
        (settings.factory === 'All' || settings.factory === 'All Factories') ||
        m.factory === settings.factory ||
        (settings.factory === 'Factory A' && m.factory === 'Plant A') ||
        (settings.factory === 'Factory B' && m.factory === 'Plant B')
      if (!factoryMatches) return false
      if (
        settings.productionLine !== 'All Lines' &&
        m.line !== settings.productionLine &&
        !(
          (settings.productionLine === 'CNC 1' && m.line === 'Line 1') ||
          (settings.productionLine === 'CNC 2' && m.line === 'Line 2')
        )
      )
        return false
      return true
    })
  }, [machines, settings.factory, settings.productionLine])

  const value: AppContextValue = {
    machines,
    alerts,
    settings,
    setSettings,
    updateAlert,
    addAlert,
    resetDemo,
    simulateHighDefectRisk,
    simulateEnergyAnomaly,
    clearDemoAnomalies,
    totals,
    activeAlertCount,
    toasts,
    pushToast,
    filteredMachines,
    streamConnected,
    latestEnergy,
    energyHistory,
    connectStream,
    disconnectStream,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}