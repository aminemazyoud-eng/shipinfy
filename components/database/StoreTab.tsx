'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Pencil, Trash2, Plus } from 'lucide-react'

interface WH { id: string; name: string }
interface Store { id: string; destinationAddress: string; destinationDistrict: string; destinationAddressLatitude: number; destinationAddressLongitude: number; warehouse: WH }

export default function StoreTab() {
  const [warehouses, setWarehouses] = useState<WH[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [whFilter, setWhFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Store | null>(null)
  const [form, setForm] = useState({ warehouseId: '', destinationAddress: '', destinationDistrict: '', destinationAddressLatitude: '', destinationAddressLongitude: '' })
  const { toast } = useToast()

  useEffect(() => { fetch('/api/warehouses').then(r => r.json()).then(setWarehouses) }, [])
  const loadStores = (wid = whFilter) => {
    const url = wid ? `/api/stores?warehouseId=${wid}` : '/api/stores'
    fetch(url).then(r => r.json()).then(setStores)
  }
  useEffect(() => { loadStores() }, [whFilter])

  const openCreate = () => { setEditing(null); setForm({ warehouseId: '', destinationAddress: '', destinationDistrict: '', destinationAddressLatitude: '', destinationAddressLongitude: '' }); setOpen(true) }
  const openEdit = (s: Store) => { setEditing(s); setForm({ warehouseId: s.warehouse.id, destinationAddress: s.destinationAddress, destinationDistrict: s.destinationDistrict, destinationAddressLatitude: String(s.destinationAddressLatitude), destinationAddressLongitude: String(s.destinationAddressLongitude) }); setOpen(true) }

  const save = async () => {
    const data = { ...form, destinationAddressLatitude: parseFloat(form.destinationAddressLatitude), destinationAddressLongitude: parseFloat(form.destinationAddressLongitude) }
    if (editing) {
      await fetch(`/api/stores/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      toast({ title: 'Magasin mis à jour' })
    } else {
      await fetch('/api/stores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      toast({ title: 'Magasin créé' })
    }
    setOpen(false); loadStores()
  }

  const del = async (id: string) => {
    if (!confirm('Supprimer ce magasin ?')) return
    await fetch(`/api/stores/${id}`, { method: 'DELETE' })
    toast({ title: 'Magasin supprimé' }); loadStores()
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between mb-4">
        <Select value={whFilter} onValueChange={(v: string | null) => setWhFilter(!v || v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filtrer par WH" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les WH</SelectItem>
            {warehouses.map(wh => <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Ajouter un Magasin</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Adresse</TableHead>
            <TableHead>District</TableHead>
            <TableHead>Latitude</TableHead>
            <TableHead>Longitude</TableHead>
            <TableHead>WH</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stores.map(s => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.destinationAddress}</TableCell>
              <TableCell>{s.destinationDistrict}</TableCell>
              <TableCell>{s.destinationAddressLatitude}</TableCell>
              <TableCell>{s.destinationAddressLongitude}</TableCell>
              <TableCell>{s.warehouse.name}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => del(s.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Modifier Magasin' : 'Ajouter un Magasin'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Warehouse</label>
              <Select value={form.warehouseId} onValueChange={(v: string | null) => setForm(f => ({...f, warehouseId: v || ''}))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner WH" /></SelectTrigger>
                <SelectContent>{warehouses.map(wh => <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">Adresse</label><Input value={form.destinationAddress} onChange={e => setForm(f => ({...f, destinationAddress: e.target.value}))} /></div>
            <div><label className="text-sm font-medium">District</label><Input value={form.destinationDistrict} onChange={e => setForm(f => ({...f, destinationDistrict: e.target.value}))} /></div>
            <div><label className="text-sm font-medium">Latitude</label><Input type="number" step="any" value={form.destinationAddressLatitude} onChange={e => setForm(f => ({...f, destinationAddressLatitude: e.target.value}))} /></div>
            <div><label className="text-sm font-medium">Longitude</label><Input type="number" step="any" value={form.destinationAddressLongitude} onChange={e => setForm(f => ({...f, destinationAddressLongitude: e.target.value}))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
