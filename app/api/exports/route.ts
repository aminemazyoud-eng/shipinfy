export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const warehouseName = searchParams.get('warehouseName') || ''
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 20

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (search) where.OR = [{ filename: { contains: search } }, { warehouseName: { contains: search } }]
  if (warehouseName) where.warehouseName = { contains: warehouseName }
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) where.createdAt.lte = new Date(dateTo)
  }

  const [total, exports] = await Promise.all([
    prisma.csvExport.count({ where }),
    prisma.csvExport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, filename: true, warehouseName: true, nbTournees: true, createdAt: true }
    })
  ])

  return NextResponse.json({ exports, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const exp = await prisma.csvExport.create({ data: body })
  return NextResponse.json(exp, { status: 201 })
}

export async function DELETE() {
  await prisma.csvExport.deleteMany()
  return NextResponse.json({ ok: true })
}
