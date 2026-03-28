export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const exp = await prisma.csvExport.findUnique({ where: { id } })
  if (!exp) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(exp)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.csvExport.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
