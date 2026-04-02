import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { count: number }
    const count = Number(body.count)
    if (!count || count < 1) {
      return NextResponse.json({ error: 'count must be >= 1' }, { status: 400 })
    }

    const existing = await prisma.shipperReference.findMany({ select: { code: true } })
    const existingSet = new Set(existing.map(r => r.code))

    const newCodes: string[] = []
    const newCodesSet = new Set<string>()
    let attempts = 0
    const maxAttempts = count * 200

    while (newCodes.length < count && attempts < maxAttempts) {
      const code = generateCode()
      if (!existingSet.has(code) && !newCodesSet.has(code)) {
        newCodes.push(code)
        newCodesSet.add(code)
      }
      attempts++
    }

    if (newCodes.length < count) {
      return NextResponse.json({ error: 'Failed to generate enough unique codes' }, { status: 500 })
    }

    await prisma.shipperReference.createMany({
      data: newCodes.map(code => ({ code })),
    })

    return NextResponse.json({ codes: newCodes })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
