export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const warehouseId = searchParams.get('warehouseId')
  const stores = await prisma.store.findMany({
    where: warehouseId ? { warehouseId } : {},
    include: { warehouse: true, _count: { select: { contacts: true } } },
    orderBy: { destinationAddress: 'asc' }
  })
  return NextResponse.json(stores)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const store = await prisma.store.create({ data: body })
  return NextResponse.json(store, { status: 201 })
}
