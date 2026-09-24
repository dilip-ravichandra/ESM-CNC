import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Overview } from './pages/Overview'
import { MachineMonitoring } from './pages/MachineMonitoring'
import { MachineDetail } from './pages/MachineDetail'
import { AnomalyCenter } from './pages/AnomalyCenter'
import { AlertInvestigation } from './pages/AlertInvestigation'
import { LeanAnalytics } from './pages/LeanAnalytics'
import { GreenAnalytics } from './pages/GreenAnalytics'
import { CostWaste } from './pages/CostWaste'
import { SystemArchitecture } from './pages/SystemArchitecture'
import { FutureWorks } from './pages/FutureWorks'
import { SettingsPage } from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/machines" element={<MachineMonitoring />} />
        <Route path="/machines/:id" element={<MachineDetail />} />
        <Route path="/anomalies" element={<AnomalyCenter />} />
        <Route path="/investigate/:id" element={<AlertInvestigation />} />
        <Route path="/lean" element={<LeanAnalytics />} />
        <Route path="/green" element={<GreenAnalytics />} />
        <Route path="/cost" element={<CostWaste />} />
        <Route path="/architecture" element={<SystemArchitecture />} />
        <Route path="/future" element={<FutureWorks />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}