import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const warehouses = await prisma.warehouse.findMany({
    include: { _count: { select: { stores: true } } },
    orderBy: { createdAt: 'asc' }
  })
  return NextResponse.json(warehouses)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const wh = await prisma.warehouse.create({ data: { name: body.name, code: body.code } })
  return NextResponse.json(wh, { status: 201 })
}
