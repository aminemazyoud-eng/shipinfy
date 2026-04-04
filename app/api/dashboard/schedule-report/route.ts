import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      reportId: string
      emails: string[]
      frequency: string
      time: string
      dayOfWeek?: number | null
      dayOfMonth?: number | null
    }

    const schedule = await prisma.scheduledReport.create({
      data: {
        reportId: body.reportId,
        emails: JSON.stringify(body.emails),
        frequency: body.frequency,
        time: body.time,
        dayOfWeek: body.dayOfWeek ?? null,
        dayOfMonth: body.dayOfMonth ?? null,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, scheduleId: schedule.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const schedules = await prisma.scheduledReport.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(schedules.map(s => ({
      ...s,
      emails: JSON.parse(s.emails) as string[],
    })))
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
