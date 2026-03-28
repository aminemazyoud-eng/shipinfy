import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [nbWarehouses, nbStores, nbContacts, exportsAgg] = await Promise.all([
    prisma.warehouse.count(),
    prisma.store.count(),
    prisma.storeContact.count(),
    prisma.csvExport.aggregate({ _count: true, _sum: { nbTournees: true } })
  ])

  const lastExport = await prisma.csvExport.findFirst({ orderBy: { createdAt: 'desc' } })
  const mostActive = await prisma.csvExport.groupBy({
    by: ['warehouseName'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 1
  })

  return NextResponse.json({
    nbWarehouses,
    nbStores,
    nbContacts,
    nbExports: exportsAgg._count,
    nbTournees: exportsAgg._sum.nbTournees || 0,
    lastExport: lastExport?.createdAt || null,
    mostActiveWH: mostActive[0]?.warehouseName || null
  })
}
