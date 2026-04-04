'use client'
import { useState } from 'react'
import { Mail, X, Loader2, CheckCircle } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  reportId: string
  filters: Record<string, unknown>
  kpisData: unknown
}

export function SendReportModal({ open, onClose, reportId, filters, kpisData }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (!open) return null

  const handleSend = async () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setErrorMsg('Email invalide')
      return
    }
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/dashboard/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, email, filters, kpisData }),
      })
      if (!res.ok) throw new Error('Échec envoi')
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Erreur lors de l\'envoi. Vérifiez la configuration N8n.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Envoyer le rapport</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle className="mb-3 h-12 w-12 text-green-500" />
            <p className="font-semibold text-gray-900">Rapport envoyé !</p>
            <p className="text-sm text-gray-500">Transmis à {email} via N8n</p>
            <button onClick={onClose} className="mt-4 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200">
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="exemple@domaine.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errorMsg && <p className="mt-1 text-xs text-red-600">{errorMsg}</p>}
            </div>
            <p className="mb-4 text-xs text-gray-500">
              Le rapport complet avec tous les KPIs sera envoyé via votre webhook N8n configuré.
            </p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={handleSend}
                disabled={status === 'loading'}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {status === 'loading' ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
