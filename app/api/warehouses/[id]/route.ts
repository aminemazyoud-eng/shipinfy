export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const wh = await prisma.warehouse.update({ where: { id }, data: { name: body.name, code: body.code } })
  return NextResponse.json(wh)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.warehouse.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
