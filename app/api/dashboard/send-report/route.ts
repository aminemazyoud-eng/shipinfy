import { NextResponse } from 'next/server'
import { transporter } from '@/lib/mailer'
import { buildEmailHTML, type EmailKpisData } from '@/lib/email-template'
import { generateReportPDF } from '@/lib/pdf-report'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      reportId:  string
      emails?:   string[]
      email?:    string
      mode?:     string
      filters:   Record<string, unknown>
      kpisData:  EmailKpisData & {
        totalOrders: number; delivered: number; noShow: number
        deliveryRate: number; onTimeRate: number; totalCOD: number
        avgOrdersPerDay: number
        timing?: EmailKpisData['timing']
        byLivreur: EmailKpisData['byLivreur']
        byHub:     EmailKpisData['byHub']
        byDay:     EmailKpisData['byDay']
      }
    }

    const emails = body.emails ?? (body.email ? [body.email] : [])
    if (emails.length === 0) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 })
    }

    const generatedAt = new Date().toISOString()

    // Build email payload
    const emailData: EmailKpisData = {
      summary: {
        totalOrders:     body.kpisData.totalOrders,
        delivered:       body.kpisData.delivered,
        noShow:          body.kpisData.noShow,
        deliveryRate:    body.kpisData.deliveryRate,
        onTimeRate:      body.kpisData.onTimeRate,
        totalCOD:        body.kpisData.totalCOD,
        avgOrdersPerDay: body.kpisData.avgOrdersPerDay,
      },
      timing:    body.kpisData.timing ?? null,
      byLivreur: (body.kpisData.byLivreur ?? []).slice(0, 25).map((l) => ({
        rank:         l.rank,
        name:         l.name,
        total:        l.total,
        delivered:    l.delivered,
        noShow:       l.noShow,
        deliveryRate: l.deliveryRate,
        onTimeRate:   l.onTimeRate,
        avgDuration:  l.avgDuration,
        totalCOD:     l.totalCOD,
      })),
      byHub: (body.kpisData.byHub ?? []).map((h) => ({
        hubName:      h.hubName,
        hubCity:      h.hubCity,
        total:        h.total,
        delivered:    h.delivered,
        deliveryRate: h.deliveryRate,
        avgDuration:  h.avgDuration,
        totalCOD:     h.totalCOD,
      })),
      byDay: (body.kpisData.byDay ?? []).map((d) => ({
        date:         d.date,
        total:        d.total,
        delivered:    d.delivered,
        noShow:       d.noShow,
        totalCOD:     d.totalCOD,
        deliveryRate: d.deliveryRate,
      })),
      generatedAt,
    }

    // Generate HTML template
    const htmlContent = buildEmailHTML(emailData)

    // Generate PDF attachment
    const pdfBuffer = await generateReportPDF(emailData)

    const dateStr = new Date(generatedAt)
      .toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      .replace(/\//g, '-')

    const subject = `📊 Rapport KPIs Livraisons — ${dateStr}`

    // Send via nodemailer
    await transporter.sendMail({
      from:    process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to:      emails.join(', '),
      subject,
      html:    htmlContent,
      attachments: [
        {
          filename:    `rapport-livraisons-${dateStr}.pdf`,
          content:     pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    })

    return NextResponse.json({ sent: true, emails, mode: body.mode ?? 'instant' })
  } catch (e) {
    console.error('[send-report]', e)
    return NextResponse.json({ error: 'Send failed', detail: String(e) }, { status: 500 })
  }
}
