'use client'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface Livreur { name: string; deliveryRate: number; onTimeRate: number; avgDuration: number; total: number }

export function ChartLivreurRadar({ data }: { data: Livreur[] }) {
  if (data.length === 0) return null
  const maxDuration = Math.max(...data.map(l => l.avgDuration), 1)
  const maxTotal = Math.max(...data.map(l => l.total), 1)

  const radarData = [
    { metric: 'Taux livraison', ...Object.fromEntries(data.map(l => [l.name, l.deliveryRate])) },
    { metric: 'On-time', ...Object.fromEntries(data.map(l => [l.name, l.onTimeRate])) },
    { metric: 'Rapidité', ...Object.fromEntries(data.map(l => [l.name, Math.round((1 - l.avgDuration / maxDuration) * 100)])) },
    { metric: 'Volume', ...Object.fromEntries(data.map(l => [l.name, Math.round((l.total / maxTotal) * 100)])) },
  ]

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h3 className="mb-1 text-base font-semibold text-gray-900">Comparaison livreurs (Radar)</h3>
      <p className="mb-4 text-sm text-gray-500">Performance multi-dimensionnelle par livreur (score /100)</p>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#374151' }} />
          {data.map((l, i) => (
            <Radar key={l.name} name={l.name} dataKey={l.name} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.15} strokeWidth={2} />
          ))}
          <Tooltip formatter={(v) => {
            const num = typeof v === 'number' ? v : 0
            return [`${num}/100`, '']
          }} />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
