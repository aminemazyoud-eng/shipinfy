'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Pencil, Trash2, Plus } from 'lucide-react'

interface WH { id: string; name: string; code: string; _count: { stores: number } }

export default function WarehouseTab() {
  const [warehouses, setWarehouses] = useState<WH[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<WH | null>(null)
  const [form, setForm] = useState({ name: '', code: '' })
  const { toast } = useToast()

  const load = () => fetch('/api/warehouses').then(r => r.json()).then(setWarehouses)
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm({ name: '', code: '' }); setOpen(true) }
  const openEdit = (wh: WH) => { setEditing(wh); setForm({ name: wh.name, code: wh.code }); setOpen(true) }

  const save = async () => {
    if (editing) {
      await fetch(`/api/warehouses/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      toast({ title: 'Warehouse mis à jour' })
    } else {
      await fetch('/api/warehouses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      toast({ title: 'Warehouse créé' })
    }
    setOpen(false); load()
  }

  const del = async (id: string) => {
    if (!confirm('Supprimer ce warehouse ?')) return
    await fetch(`/api/warehouses/${id}`, { method: 'DELETE' })
    toast({ title: 'Warehouse supprimé' }); load()
  }

  return (
    <div className="mt-4">
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Ajouter un WH</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Code Hub</TableHead>
            <TableHead>Nb Magasins</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {warehouses.map(wh => (
            <TableRow key={wh.id}>
              <TableCell className="font-medium">{wh.name}</TableCell>
              <TableCell>{wh.code}</TableCell>
              <TableCell>{wh._count.stores}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(wh)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => del(wh.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Modifier Warehouse' : 'Ajouter un Warehouse'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-sm font-medium">Nom du WH</label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="ex: CARREFOUR" /></div>
            <div><label className="text-sm font-medium">Code Hub</label><Input value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value}))} placeholder="ex: WAREHOUSE CENTRAL" /></div>
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
