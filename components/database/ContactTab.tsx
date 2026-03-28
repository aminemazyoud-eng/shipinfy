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
interface Store { id: string; destinationAddress: string; warehouseId: string }
interface Contact { id: string; destinationFirstname: string; destinationLastname: string; destinationEmailAddress: string; destinationMobileNumber: string; store: Store & { warehouse: WH } }

export default function ContactTab() {
  const [warehouses, setWarehouses] = useState<WH[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [whFilter, setWhFilter] = useState('')
  const [storeFilter, setStoreFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [formWH, setFormWH] = useState('')
  const [formStores, setFormStores] = useState<Store[]>([])
  const [form, setForm] = useState({ storeId: '', destinationFirstname: '', destinationLastname: '', destinationEmailAddress: '', destinationMobileNumber: '' })
  const { toast } = useToast()

  useEffect(() => { fetch('/api/warehouses').then(r => r.json()).then(setWarehouses) }, [])
  useEffect(() => {
    if (whFilter) fetch(`/api/stores?warehouseId=${whFilter}`).then(r => r.json()).then(setStores)
    else fetch('/api/stores').then(r => r.json()).then(setStores)
    setStoreFilter('')
  }, [whFilter])
  useEffect(() => {
    const url = storeFilter ? `/api/contacts?storeId=${storeFilter}` : '/api/contacts'
    fetch(url).then(r => r.json()).then(setContacts)
  }, [storeFilter])

  useEffect(() => {
    if (formWH) fetch(`/api/stores?warehouseId=${formWH}`).then(r => r.json()).then(setFormStores)
    else setFormStores([])
  }, [formWH])

  const openCreate = () => { setEditing(null); setFormWH(''); setFormStores([]); setForm({ storeId: '', destinationFirstname: '', destinationLastname: '', destinationEmailAddress: '', destinationMobileNumber: '' }); setOpen(true) }
  const openEdit = (c: Contact) => {
    setEditing(c)
    setFormWH(c.store.warehouse.id)
    setForm({ storeId: c.store.id, destinationFirstname: c.destinationFirstname, destinationLastname: c.destinationLastname, destinationEmailAddress: c.destinationEmailAddress, destinationMobileNumber: c.destinationMobileNumber })
    setOpen(true)
  }

  const reload = () => {
    const url = storeFilter ? `/api/contacts?storeId=${storeFilter}` : '/api/contacts'
    fetch(url).then(r => r.json()).then(setContacts)
  }

  const save = async () => {
    if (editing) {
      await fetch(`/api/contacts/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      toast({ title: 'Contact mis à jour' })
    } else {
      await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      toast({ title: 'Contact créé' })
    }
    setOpen(false); reload()
  }

  const del = async (id: string) => {
    if (!confirm('Supprimer ce contact ?')) return
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    toast({ title: 'Contact supprimé' }); reload()
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <Select value={whFilter} onValueChange={(v: string | null) => setWhFilter(!v || v === 'all' ? '' : v)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Filtrer WH" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous WH</SelectItem>
              {warehouses.map(wh => <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={storeFilter} onValueChange={(v: string | null) => setStoreFilter(!v || v === 'all' ? '' : v)}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Filtrer Magasin" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous magasins</SelectItem>
              {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.destinationAddress}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Ajouter un Contact</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Magasin</TableHead>
            <TableHead>Prénom</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map(c => (
            <TableRow key={c.id}>
              <TableCell>{c.store.destinationAddress}</TableCell>
              <TableCell>{c.destinationFirstname}</TableCell>
              <TableCell>{c.destinationLastname}</TableCell>
              <TableCell>{c.destinationEmailAddress}</TableCell>
              <TableCell>{c.destinationMobileNumber}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => del(c.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Modifier Contact' : 'Ajouter un Contact'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Warehouse</label>
              <Select value={formWH} onValueChange={(v: string | null) => setFormWH(v || '')}>
                <SelectTrigger><SelectValue placeholder="Sélectionner WH" /></SelectTrigger>
                <SelectContent>{warehouses.map(wh => <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Magasin</label>
              <Select value={form.storeId} onValueChange={(v: string | null) => setForm(f => ({...f, storeId: v || ''}))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner Magasin" /></SelectTrigger>
                <SelectContent>{formStores.map(s => <SelectItem key={s.id} value={s.id}>{s.destinationAddress}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">Prénom</label><Input value={form.destinationFirstname} onChange={e => setForm(f => ({...f, destinationFirstname: e.target.value}))} /></div>
            <div><label className="text-sm font-medium">Nom</label><Input value={form.destinationLastname} onChange={e => setForm(f => ({...f, destinationLastname: e.target.value}))} /></div>
            <div><label className="text-sm font-medium">Email</label><Input type="email" value={form.destinationEmailAddress} onChange={e => setForm(f => ({...f, destinationEmailAddress: e.target.value}))} /></div>
            <div><label className="text-sm font-medium">Téléphone</label><Input value={form.destinationMobileNumber} onChange={e => setForm(f => ({...f, destinationMobileNumber: e.target.value}))} /></div>
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
