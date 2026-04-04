'use client'
import { RotateCcw } from 'lucide-react'

export interface FilterState {
  preset: 'yesterday' | 'today' | 'week' | 'month' | 'all'
  dateFrom: string
  dateTo: string
  creneau: string
  hubName: string
  sprintName: string
}

export const DEFAULT_FILTERS: FilterState = {
  preset: 'all', dateFrom: '', dateTo: '', creneau: 'all', hubName: '', sprintName: ''
}

const PRESETS = [
  { value: 'yesterday', label: 'Hier' },
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'all', label: 'Tout' },
] as const

const CRENEAUX = [
  { value: 'all', label: 'Tous les créneaux' },
  { value: '09:00-12:00', label: '09:00 - 12:00' },
  { value: '12:00-15:00', label: '12:00 - 15:00' },
  { value: '15:00-18:00', label: '15:00 - 18:00' },
  { value: '18:00-21:00', label: '18:00 - 21:00' },
  { value: '20:00-23:00', label: '20:00 - 23:00' },
]

interface Props {
  filters: FilterState
  onChange: (f: FilterState) => void
  hubs: string[]
  sprints: string[]
}

export function FilterBar({ filters, onChange, hubs, sprints }: Props) {
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch })

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <button
            key={p.value}
            onClick={() => set({ preset: p.value, dateFrom: '', dateTo: '' })}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filters.preset === p.value && !filters.dateFrom
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Date début</label>
          <input type="date" value={filters.dateFrom}
            onChange={e => set({ dateFrom: e.target.value, preset: 'all' })}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Date fin</label>
          <input type="date" value={filters.dateTo}
            onChange={e => set({ dateTo: e.target.value, preset: 'all' })}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Créneau</label>
          <select value={filters.creneau} onChange={e => set({ creneau: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CRENEAUX.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        {hubs.length > 1 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Hub</label>
            <select value={filters.hubName} onChange={e => set({ hubName: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les hubs</option>
              {hubs.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        )}
        {sprints.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Livreur</label>
            <select value={filters.sprintName} onChange={e => set({ sprintName: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les livreurs</option>
              {sprints.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        <button
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Réinitialiser
        </button>
      </div>
    </div>
  )
}
