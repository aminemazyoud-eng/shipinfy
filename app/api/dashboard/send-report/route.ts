import { NextResponse } from 'next/server'

interface KpisData {
  totalOrders: number
  delivered: number
  noShow: number
  deliveryRate: number
  onTimeRate: number
  totalCOD: number
  avgOrdersPerDay: number
  timing: {
    orderToAssign: number
    assignToTransport: number
    transportToStart: number
    startToDelivered: number
    totalDuration: number
  }
  byLivreur: Array<{
    name: string; rank: number; total: number; delivered: number
    noShow: number; deliveryRate: number; onTimeRate: number; avgDuration: number; totalCOD: number
  }>
  byCreneau: Array<{
    creneau: string; total: number; delivered: number; noShow: number
    deliveryRate: number; onTimeRate: number; avgDuration: number
  }>
  byDay: Array<{
    date: string; total: number; delivered: number; noShow: number
    totalCOD: number; deliveryRate: number
  }>
  byHub: Array<{
    hubName: string; hubCity: string; total: number; delivered: number
    deliveryRate: number; avgDuration: number; totalCOD: number
  }>
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      reportId: string
      emails?: string[]
      email?: string
      mode?: string
      filters: Record<string, unknown>
      kpisData: KpisData
    }

    const webhookUrl    = process.env.N8N_WEBHOOK_URL
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET ?? ''

    if (!webhookUrl) {
      return NextResponse.json({ error: 'N8N_WEBHOOK_URL not configured' }, { status: 500 })
    }

    const emails = body.emails ?? (body.email ? [body.email] : [])
    const kpis   = body.kpisData ?? {}

    // Structured payload — N8n peut construire l'email directement sans recalcul
    const payload = {
      reportId:    body.reportId,
      emails,
      mode:        body.mode ?? 'instant',
      generatedAt: new Date().toISOString(),
      filters:     body.filters,

      // Résumé top-level pour l'email
      summary: {
        totalOrders:     kpis.totalOrders,
        delivered:       kpis.delivered,
        noShow:          kpis.noShow,
        deliveryRate:    kpis.deliveryRate,
        onTimeRate:      kpis.onTimeRate,
        totalCOD:        kpis.totalCOD,
        avgOrdersPerDay: kpis.avgOrdersPerDay,
      },

      // Pipeline timing
      timing: kpis.timing ?? null,

      // Classement livreurs (top 10)
      byLivreur: (kpis.byLivreur ?? []).slice(0, 10).map(l => ({
        rank:         l.rank,
        name:         l.name,
        total:        l.total,
        delivered:    l.delivered,
        noShow:       l.noShow,
        deliveryRate: l.deliveryRate,
        onTimeRate:   l.onTimeRate,
        avgDuration:  l.avgDuration,
        totalCOD:     Math.round(l.totalCOD),
      })),

      // Performance par créneau
      byCreneau: (kpis.byCreneau ?? []).filter(c => c.total > 0).map(c => ({
        creneau:      c.creneau,
        total:        c.total,
        delivered:    c.delivered,
        noShow:       c.noShow,
        deliveryRate: c.deliveryRate,
        onTimeRate:   c.onTimeRate,
        avgDuration:  c.avgDuration,
      })),

      // Données journalières
      byDay: (kpis.byDay ?? []).map(d => ({
        date:         d.date,
        total:        d.total,
        delivered:    d.delivered,
        noShow:       d.noShow,
        totalCOD:     Math.round(d.totalCOD),
        deliveryRate: d.deliveryRate,
      })),

      // Hubs
      byHub: (kpis.byHub ?? []).map(h => ({
        hubName:      h.hubName,
        hubCity:      h.hubCity,
        total:        h.total,
        delivered:    h.delivered,
        deliveryRate: h.deliveryRate,
        avgDuration:  h.avgDuration,
        totalCOD:     Math.round(h.totalCOD),
      })),
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'X-Shipinfy-Secret': webhookSecret,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return NextResponse.json({ error: 'N8n webhook failed', status: res.status, detail: errText }, { status: 502 })
    }

    return NextResponse.json({ sent: true, emails, mode: payload.mode })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Send failed' }, { status: 500 })
  }
}
