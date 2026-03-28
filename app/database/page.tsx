import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import WarehouseTab from '@/components/database/WarehouseTab'
import StoreTab from '@/components/database/StoreTab'
import ContactTab from '@/components/database/ContactTab'

export default function DatabasePage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Base de données</h2>
      <Tabs defaultValue="warehouses">
        <TabsList>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
          <TabsTrigger value="stores">Magasins</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>
        <TabsContent value="warehouses"><WarehouseTab /></TabsContent>
        <TabsContent value="stores"><StoreTab /></TabsContent>
        <TabsContent value="contacts"><ContactTab /></TabsContent>
      </Tabs>
    </div>
  )
}
