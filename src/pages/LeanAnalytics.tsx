import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { scrapTrend, defectCategories } from '@/data/simulatedData'
import { scenarioScrapAvoided, scrapCost } from '@/lib/calculations'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const COLORS = ['#22d3ee', '#14b8a6', '#f59e0b', '#8b5cf6']

export function LeanAnalytics() {
  const { totals, settings, setSettings, filteredMachines } = useApp()
  const [target, setTarget] = useState(settings.scrapRateTarget)
  const avoided = scenarioScrapAvoided(totals.production, totals.scrapRate, target)
  const costAvoided = scrapCost(avoided, settings)

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {[
          ['Production', totals.production],
          ['Scrap Rate', `${totals.scrapRate.toFixed(1)}%`],
          ['Good Parts', totals.good],
          ['Defective', totals.scrap],
          ['Rework', filteredMachines.reduce((s, m) => s + m.reworkCount, 0)],
          ['Waste kg', (totals.scrap * settings.materialWeightPerPartKg).toFixed(1)],
          ['Scrap $', `$${scrapCost(totals.scrap, settings).toFixed(0)}`],
        ].map(([l, v]) => (
          <div key={l as string} className="card py-3 text-center">
            <div className="text-lg font-bold text-white">{v}</div>
            <div className="text-[10px] text-slate-500">{l}</div>
            <div className="text-[9px] text-slate-600">DEMO</div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card h-72">
          <h3 className="mb-2 text-sm text-lean">Scrap Rate Trend</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={scrapTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e3640" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1f26', border: '1px solid #2e3640' }} />
              <Line type="monotone" dataKey="scrapRate" stroke="#14b8a6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card h-72">
          <h3 className="mb-2 text-sm text-lean">Defect Categories</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={defectCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {defectCategories.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card h-72">
          <h3 className="mb-2 text-sm text-lean">Scrap by Machine</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={filteredMachines.map((m) => ({ name: m.id, scrap: m.scrapParts }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e3640" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1f26', border: '1px solid #2e3640' }} />
              <Bar dataKey="scrap" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-lean">Scrap Reduction Scenario Calculator</h3>
          <p className="mb-3 text-xs text-slate-500">
            Baseline scrap rate ~{totals.scrapRate.toFixed(1)}%. All outputs are{' '}
            <strong className="text-slate-300">hypothetical estimates</strong>.
          </p>
          <label className="label">Target scrap rate (%)</label>
          <input
            type="number"
            className="input mb-3"
            value={target}
            min={0}
            max={20}
            step={0.5}
            onChange={(e) => {
              const v = Number(e.target.value)
              setTarget(v)
              setSettings((s) => ({ ...s, scrapRateTarget: v }))
            }}
          />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Scrap parts avoided (hyp.)</span>
              <span className="font-medium text-white">{avoided.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Material waste avoided</span>
              <span>{(avoided * settings.materialWeightPerPartKg).toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Potential scrap cost avoided</span>
              <span className="text-lean font-semibold">${costAvoided.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}