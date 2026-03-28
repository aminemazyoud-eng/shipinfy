import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Store, Users, FileSpreadsheet } from 'lucide-react'

export default async function DashboardPage() {
  const [nbWH, nbStores, nbContacts, nbExports] = await Promise.all([
    prisma.warehouse.count(),
    prisma.store.count(),
    prisma.storeContact.count(),
    prisma.csvExport.count(),
  ])

  const cards = [
    { title: 'Warehouses', value: nbWH, icon: Building2, color: 'text-blue-600' },
    { title: 'Magasins', value: nbStores, icon: Store, color: 'text-green-600' },
    { title: 'Contacts', value: nbContacts, icon: Users, color: 'text-purple-600' },
    { title: 'CSV Générés', value: nbExports, icon: FileSpreadsheet, color: 'text-orange-600' },
  ]

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(({ title, value, icon: Icon, color }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
              <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
