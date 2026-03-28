export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  const contacts = await prisma.storeContact.findMany({
    where: storeId ? { storeId } : {},
    include: { store: { include: { warehouse: true } } },
    orderBy: { destinationLastname: 'asc' }
  })
  return NextResponse.json(contacts)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const contact = await prisma.storeContact.create({ data: body })
  return NextResponse.json(contact, { status: 201 })
}
