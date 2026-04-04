import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { reportId: string; email: string; filters: Record<string, unknown>; kpisData: unknown }
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json({ error: 'N8N_WEBHOOK_URL not configured' }, { status: 500 })
    }

    const payload = {
      email: body.email,
      reportId: body.reportId,
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

    return NextResponse.json({ sent: true, email: body.email })
  } catch {
    return NextResponse.json({ error: 'Send failed' }, { status: 500 })
  }
}
