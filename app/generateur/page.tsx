'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { generateCSV, Tournee } from '@/lib/csv'
import { Plus, Download, Trash2 } from 'lucide-react'

interface WH { id: string; name: string; code: string }
interface Store { id: string; destinationAddress: string; destinationDistrict: string; destinationAddressLatitude: number; destinationAddressLongitude: number }
interface Contact { id: string; destinationFirstname: string; destinationLastname: string; destinationEmailAddress: string; destinationMobileNumber: string }

export default function GenerateurPage() {
  const [warehouses, setWarehouses] = useState<WH[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedWH, setSelectedWH] = useState<WH | null>(null)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [optional, setOptional] = useState({ shipperReference: '', deliveryTimeStart: '', deliveryTimeEnd: '', shippingFees: '', paymentOnDeliveryAmount: '', contentDescription: '', externalReference: '' })
  const [tournees, setTournees] = useState<Tournee[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => { fetch('/api/warehouses').then(r => r.json()).then(setWarehouses) }, [])

  const handleWHChange = (id: string | null) => {
    const wh = id ? (warehouses.find(w => w.id === id) || null) : null
    setSelectedWH(wh)
    setSelectedStore(null)
    setSelectedContact(null)
    setStores([]); setContacts([])
    if (id) fetch(`/api/stores?warehouseId=${id}`).then(r => r.json()).then(setStores)
  }

  const handleStoreChange = (id: string | null) => {
    const s = id ? (stores.find(x => x.id === id) || null) : null
    setSelectedStore(s)
    setSelectedContact(null)
    setContacts([])
    if (id) fetch(`/api/contacts?storeId=${id}`).then(r => r.json()).then(setContacts)
  }

  const handleContactChange = (id: string | null) => {
    setSelectedContact(id ? (contacts.find(x => x.id === id) || null) : null)
  }

  const validate = () => {
    const errs: string[] = []
    if (!selectedWH) errs.push('Veuillez sélectionner un Warehouse')
    if (!selectedStore) errs.push('Veuillez sélectionner un Magasin')
    if (!selectedContact) errs.push('Veuillez sélectionner un Contact')
    setErrors(errs)
    return errs.length === 0
  }

  const addTournee = () => {
    if (!validate()) return
    const t: Tournee = {
      ...optional,
      destinationFirstname: selectedContact!.destinationFirstname,
      destinationLastname: selectedContact!.destinationLastname,
      destinationEmailAddress: selectedContact!.destinationEmailAddress,
      destinationMobileNumber: selectedContact!.destinationMobileNumber,
      destinationAddress: selectedStore!.destinationAddress,
      destinationDistrict: selectedStore!.destinationDistrict,
      destinationAddressLatitude: selectedStore!.destinationAddressLatitude,
      destinationAddressLongitude: selectedStore!.destinationAddressLongitude,
    }
    setTournees(prev => [...prev, t])
    setSelectedStore(null); setSelectedContact(null); setContacts([])
    setOptional({ shipperReference: '', deliveryTimeStart: '', deliveryTimeEnd: '', shippingFees: '', paymentOnDeliveryAmount: '', contentDescription: '', externalReference: '' })
    toast({ title: 'Tournée ajoutée' })
  }

  const generateAndDownload = async () => {
    let rows: Tournee[] | null = null

    if (tournees.length > 0) {
      rows = tournees
    } else if (validate()) {
      rows = [{
        ...optional,
        destinationFirstname: selectedContact!.destinationFirstname,
        destinationLastname: selectedContact!.destinationLastname,
        destinationEmailAddress: selectedContact!.destinationEmailAddress,
        destinationMobileNumber: selectedContact!.destinationMobileNumber,
        destinationAddress: selectedStore!.destinationAddress,
        destinationDistrict: selectedStore!.destinationDistrict,
        destinationAddressLatitude: selectedStore!.destinationAddressLatitude,
        destinationAddressLongitude: selectedStore!.destinationAddressLongitude,
      }]
    }

    if (!rows) return
    if (!selectedWH && tournees.length === 0) { setErrors(['Veuillez sélectionner un Warehouse']); return }

    // Auto-generate shipperReference for rows that don't have one
    const countNeedingRef = rows.filter(t => !t.shipperReference).length
    let finalRows = rows

    if (countNeedingRef > 0) {
      const refRes = await fetch('/api/shipper-references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: countNeedingRef }),
      })
      if (!refRes.ok) {
        toast({ title: 'Erreur', description: 'Impossible de générer les codes de tracking', variant: 'destructive' })
        return
      }
      const { codes } = await refRes.json() as { codes: string[] }
      let codeIdx = 0
      finalRows = rows.map(t => ({
        ...t,
        shipperReference: t.shipperReference || codes[codeIdx++],
      }))
    }

    const now = new Date()
    const ts = now.getFullYear().toString() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + '_' + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0') + String(now.getSeconds()).padStart(2,'0')
    const whName = selectedWH?.name || 'EXPORT'
    const filename = `SHIPINFY_${whName}_${ts}.csv`
    const csvContent = generateCSV(finalRows)

    await fetch('/api/exports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, warehouseName: whName, nbTournees: finalRows.length, csvContent })
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'CSV généré et téléchargé !', description: filename })
    setTournees([])
  }

  const ReadOnlyField = ({ label, value }: { label: string; value: string | number }) => (
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      <div className="mt-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm font-medium text-blue-800">{value}</div>
    </div>
  )

  return (
    <div className="p-8 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Générateur CSV</h2>

      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          {errors.map((e, i) => <p key={i} className="text-sm text-red-600">{e}</p>)}
        </div>
      )}

      {/* Block 1 */}
      <Card className="mb-4 border-blue-200">
        <CardHeader className="pb-3"><CardTitle className="text-base text-blue-700">Warehouse & Transporteur</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">Warehouse</label>
            <Select onValueChange={handleWHChange} value={selectedWH?.id ?? ''}>
              <SelectTrigger>
                <span data-slot="select-value" className={`flex flex-1 text-left text-sm${!selectedWH ? ' text-muted-foreground' : ''}`}>
                  {selectedWH ? selectedWH.name : 'Sélectionner un Warehouse'}
                </span>
              </SelectTrigger>
              <SelectContent>{warehouses.map(wh => <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {selectedWH && (
            <div className="grid grid-cols-3 gap-3">
              <ReadOnlyField label="Transporteur" value="TRANSPORT EXPRESS" />
              <ReadOnlyField label="Hub Code" value={selectedWH.code} />
              <ReadOnlyField label="Shipper Code" value="FMCG" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block 2 */}
      <Card className="mb-4 border-green-200">
        <CardHeader className="pb-3"><CardTitle className="text-base text-green-700">Sélection du Magasin</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">Magasin</label>
            <Select onValueChange={handleStoreChange} disabled={!selectedWH} value={selectedStore?.id ?? ''}>
              <SelectTrigger>
                <span data-slot="select-value" className={`flex flex-1 text-left text-sm${!selectedStore ? ' text-muted-foreground' : ''}`}>
                  {selectedStore ? selectedStore.destinationAddress : 'Sélectionner un Magasin'}
                </span>
              </SelectTrigger>
              <SelectContent>{stores.map(s => <SelectItem key={s.id} value={s.id}>{s.destinationAddress}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {selectedStore && (
            <div className="grid grid-cols-2 gap-3">
              <ReadOnlyField label="Adresse" value={selectedStore.destinationAddress} />
              <ReadOnlyField label="District" value={selectedStore.destinationDistrict} />
              <ReadOnlyField label="Latitude" value={selectedStore.destinationAddressLatitude} />
              <ReadOnlyField label="Longitude" value={selectedStore.destinationAddressLongitude} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block 3 */}
      <Card className="mb-4 border-yellow-200">
        <CardHeader className="pb-3"><CardTitle className="text-base text-yellow-700">Contact du Magasin</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">Contact</label>
            <Select onValueChange={handleContactChange} disabled={!selectedStore} value={selectedContact?.id ?? ''}>
              <SelectTrigger>
                <span data-slot="select-value" className={`flex flex-1 text-left text-sm${!selectedContact ? ' text-muted-foreground' : ''}`}>
                  {selectedContact ? `${selectedContact.destinationFirstname} ${selectedContact.destinationLastname}` : 'Sélectionner un Contact'}
                </span>
              </SelectTrigger>
              <SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.destinationFirstname} {c.destinationLastname}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {selectedContact && (
            <div className="grid grid-cols-2 gap-3">
              <ReadOnlyField label="Prénom" value={selectedContact.destinationFirstname} />
              <ReadOnlyField label="Nom" value={selectedContact.destinationLastname} />
              <ReadOnlyField label="Email" value={selectedContact.destinationEmailAddress} />
              <ReadOnlyField label="Téléphone" value={selectedContact.destinationMobileNumber} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block 4 */}
      <Card className="mb-6 border-red-200">
        <CardHeader className="pb-3"><CardTitle className="text-base text-red-700">Champs Optionnels</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {([
            ['shipperReference', 'Référence expéditeur'],
            ['deliveryTimeStart', 'Heure début livraison'],
            ['deliveryTimeEnd', 'Heure fin livraison'],
            ['shippingFees', 'Frais de livraison'],
            ['paymentOnDeliveryAmount', 'Montant COD'],
            ['contentDescription', 'Description contenu'],
            ['externalReference', 'Référence externe'],
          ] as [keyof typeof optional, string][]).map(([key, label]) => (
            <div key={key}>
              <label className="text-sm font-medium">{label}</label>
              <Input value={optional[key]} onChange={e => setOptional(f => ({...f, [key]: e.target.value}))} placeholder="Optionnel" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tournees table */}
      {tournees.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Tournées ajoutées ({tournees.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Magasin</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Lat</TableHead>
                  <TableHead>Lng</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournees.map((t, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{t.destinationAddress}</TableCell>
                    <TableCell>{t.destinationFirstname} {t.destinationLastname}</TableCell>
                    <TableCell>{t.destinationDistrict}</TableCell>
                    <TableCell>{t.destinationAddressLatitude}</TableCell>
                    <TableCell>{t.destinationAddressLongitude}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setTournees(prev => prev.filter((_, j) => j !== i))}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={addTournee}><Plus className="h-4 w-4 mr-2" /> Ajouter une tournée</Button>
        <Button onClick={generateAndDownload}><Download className="h-4 w-4 mr-2" /> Générer CSV</Button>
      </div>
    </div>
  )
}
