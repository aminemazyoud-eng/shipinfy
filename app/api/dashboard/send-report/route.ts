import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      reportId: string
      emails?: string[]
      email?: string
      mode?: string
      filters: Record<string, unknown>
      kpisData: unknown
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json({ error: 'N8N_WEBHOOK_URL not configured' }, { status: 500 })
    }

    // Support both single email (legacy) and emails array
    const emails = body.emails ?? (body.email ? [body.email] : [])

    const payload = {
      reportId: body.reportId,
      emails,
      mode: body.mode ?? 'instant',
      generatedAt: new Date().toISOString(),
      filters: body.filters,
      kpisData: body.kpisData,
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'N8n webhook failed', status: res.status }, { status: 502 })
    }

    return NextResponse.json({ sent: true, emails, mode: payload.mode })
  } catch {
    return NextResponse.json({ error: 'Send failed' }, { status: 500 })
  }
}
