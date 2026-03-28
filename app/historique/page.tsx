'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { FileText, Truck, Calendar, Factory, Eye, Download, Trash2 } from 'lucide-react'

interface Export { id: string; filename: string; warehouseName: string; nbTournees: number; createdAt: string }
interface ExportDetail extends Export { csvContent: string }

const CSV_HEADERS = ['shipperReference','shipperCode','partyLogisticsCode','originHubCode','destinationFirstname','destinationLastname','destinationEmailAddress','destinationMobileNumber','destinationAddress','destinationDistrict','destinationAddressLatitude','destinationAddressLongitude','deliveryTimeStart','deliveryTimeEnd','shippingFees','paymentOnDeliveryAmount','contentDescription','externalReference','shippingStrategy','paymentStrategy']

function parseCSV(content: string) {
  const lines = content.split('\n').filter(Boolean)
  if (lines.length < 2) return []
  return lines.slice(1).map(line => {
    const vals = line.split(',')
    return Object.fromEntries(CSV_HEADERS.map((h, i) => [h, vals[i] || '']))
  })
}

export default function HistoriquePage() {
  const [exports, setExports] = useState<Export[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [whFilter, setWhFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [warehouses, setWarehouses] = useState<{name: string}[]>([])
  const [preview, setPreview] = useState<ExportDetail | null>(null)
  const [stats, setStats] = useState({ total: 0, totalTournees: 0, lastExport: '', mostActive: '' })
  const { toast } = useToast()

  const load = () => {
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    if (whFilter) params.set('warehouseName', whFilter)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    fetch(`/api/exports?${params}`).then(r => r.json()).then(d => { setExports(d.exports); setTotal(d.total) })
  }

  useEffect(() => { load() }, [page, search, whFilter, dateFrom, dateTo])
  useEffect(() => {
    fetch('/api/warehouses').then(r => r.json()).then(setWarehouses)
    fetch('/api/stats').then(r => r.json()).then(d => setStats({ total: d.nbExports, totalTournees: d.nbTournees, lastExport: d.lastExport ? new Date(d.lastExport).toLocaleDateString('fr-FR') : '-', mostActive: d.mostActiveWH || '-' }))
  }, [])

  const openPreview = async (id: string) => {
    const d = await fetch(`/api/exports/${id}`).then(r => r.json())
    setPreview(d)
  }

  const download = async (id: string) => {
    const d = await fetch(`/api/exports/${id}`).then(r => r.json())
    const blob = new Blob([d.csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = d.filename; a.click()
    URL.revokeObjectURL(url)
  }

  const del = async (id: string) => {
    if (!confirm('Supprimer cet export ?')) return
    await fetch(`/api/exports/${id}`, { method: 'DELETE' })
    toast({ title: 'Export supprimé' }); load()
  }

  const clearAll = async () => {
    if (!confirm('Vider tout l\'historique ?')) return
    await fetch('/api/exports', { method: 'DELETE' })
    toast({ title: 'Historique vidé' }); load()
  }

  const reset = () => { setSearch(''); setWhFilter(''); setDateFrom(''); setDateTo(''); setPage(1) }
  const totalPages = Math.ceil(total / 20)
  const fmt = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historique des générations</h2>
          <p className="text-sm text-gray-500">{total} fichiers générés</p>
        </div>
        <Button variant="destructive" onClick={clearAll}><Trash2 className="h-4 w-4 mr-2" /> Vider l&apos;historique</Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total fichiers', value: stats.total, icon: FileText, color: 'text-blue-600' },
          { label: 'Total tournées', value: stats.totalTournees, icon: Truck, color: 'text-green-600' },
          { label: 'Dernier export', value: stats.lastExport, icon: Calendar, color: 'text-purple-600' },
          { label: 'WH le plus actif', value: stats.mostActive, icon: Factory, color: 'text-orange-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent><p className="text-xl font-bold">{value}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 p-4 bg-white rounded-lg border">
        <Input className="w-48" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        <Input type="date" className="w-40" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <Input type="date" className="w-40" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <Select value={whFilter} onValueChange={(v: string | null) => setWhFilter(!v || v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Warehouse" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {warehouses.map(w => <SelectItem key={w.name} value={w.name}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={reset}>Réinitialiser</Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Nom du fichier</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Nb Tournées</TableHead>
              <TableHead>Date de génération</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exports.map((e, i) => (
              <TableRow key={e.id}>
                <TableCell>{(page - 1) * 20 + i + 1}</TableCell>
                <TableCell className="font-mono text-xs">{e.filename}</TableCell>
                <TableCell>{e.warehouseName}</TableCell>
                <TableCell>{e.nbTournees}</TableCell>
                <TableCell>{fmt(e.createdAt)}</TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openPreview(e.id)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => download(e.id)}><Download className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => del(e.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 justify-center">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
          <span className="py-2 px-3 text-sm">{page} / {totalPages}</span>
          <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-mono text-sm">{preview.filename}</DialogTitle>
              <p className="text-sm text-gray-500">{preview.warehouseName} &bull; {preview.nbTournees} tournées &bull; {fmt(preview.createdAt)}</p>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              {parseCSV(preview.csvContent).map((row, i) => (
                <div key={i} className="p-3 border rounded-lg bg-gray-50">
                  <p className="font-medium text-sm mb-1">Tournée {i + 1}</p>
                  <p className="text-sm text-gray-600">Magasin: {row.destinationAddress}</p>
                  <p className="text-sm text-gray-600">Contact: {row.destinationFirstname} {row.destinationLastname} | {row.destinationEmailAddress}</p>
                  <p className="text-sm text-gray-600">Lat: {row.destinationAddressLatitude} | Lng: {row.destinationAddressLongitude}</p>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreview(null)}>Fermer</Button>
              <Button onClick={() => download(preview.id)}><Download className="h-4 w-4 mr-2" /> Télécharger</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
