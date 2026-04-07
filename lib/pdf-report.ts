import type { EmailKpisData } from './email-template'

type PDFKit = typeof import('pdfkit')
type PDFDocument = InstanceType<PDFKit>

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR')
const fmtPct = (n: number) => `${n.toFixed(1)}%`
const fmtMAD = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} MAD`
const fmtMin = (n: number) => {
  const h = Math.floor(n / 60)
  const m = Math.round(n % 60)
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`
}
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

const BLUE      = '#2563eb'
const DARK_BLUE = '#1e3a5f'
const GREEN     = '#16a34a'
const RED       = '#dc2626'
const ORANGE    = '#d97706'
const PURPLE    = '#7c3aed'
const GRAY      = '#64748b'
const LIGHT_BG  = '#f8faff'
const BORDER    = '#e2e8f0'
const WHITE     = '#ffffff'
const DARK_TEXT = '#0f172a'

const PAGE_W = 595
const PAGE_H = 842
const MARGIN = 44
const CONTENT_W = PAGE_W - MARGIN * 2

function rateColor(rate: number): string {
  return rate >= 80 ? GREEN : rate >= 60 ? ORANGE : RED
}

function drawHeader(doc: PDFDocument, date: string) {
  // Blue header background
  doc.rect(0, 0, PAGE_W, 90).fill(DARK_BLUE)
  // Accent stripe
  doc.rect(0, 90, PAGE_W, 4).fill(BLUE)

  // Logo text
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(22)
    .text('SHIPINFY', MARGIN, 24)
  doc.fillColor('#93c5fd').font('Helvetica').fontSize(9)
    .text('RAPPORT KPIs — PERFORMANCES LIVRAISON', MARGIN, 50)

  // Date badge
  const badgeX = PAGE_W - MARGIN - 120
  doc.rect(badgeX, 22, 120, 44).fill(BLUE)
  doc.fillColor('#bfdbfe').font('Helvetica').fontSize(8)
    .text('GÉNÉRÉ LE', badgeX + 8, 28)
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
    .text(date, badgeX + 8, 40, { width: 104 })
}

function drawPageFooter(doc: PDFDocument, pageNum: number, total: number) {
  const y = PAGE_H - 30
  doc.rect(0, y - 4, PAGE_W, 1).fill(BORDER)
  doc.fillColor(GRAY).font('Helvetica').fontSize(8)
    .text('© Shipinfy · shipinfy.mediflows.shop', MARGIN, y + 4)
    .text(`Page ${pageNum} / ${total}`, 0, y + 4, { align: 'right', width: PAGE_W - MARGIN })
}

function drawSectionTitle(doc: PDFDocument, title: string, y: number): number {
  doc.rect(MARGIN, y, 4, 18).fill(BLUE)
  doc.fillColor(DARK_TEXT).font('Helvetica-Bold').fontSize(12)
    .text(title, MARGIN + 10, y + 2)
  return y + 28
}

function drawTable(
  doc: PDFDocument,
  headers: string[],
  rows: string[][],
  colWidths: number[],
  alignments: ('left' | 'right')[],
  y: number
): number {
  const HEADER_H = 24
  const ROW_H    = 20
  const totalW   = colWidths.reduce((a, b) => a + b, 0)

  // Header background
  doc.rect(MARGIN, y, totalW, HEADER_H).fill(DARK_BLUE)

  // Header text
  let cx = MARGIN
  headers.forEach((h, i) => {
    doc.fillColor('#e2e8f0').font('Helvetica-Bold').fontSize(8)
      .text(h.toUpperCase(), cx + 5, y + 8, {
        width: colWidths[i] - 10,
        align: alignments[i] ?? 'left',
        lineBreak: false,
      })
    cx += colWidths[i]
  })

  // Rows
  rows.forEach((row, ri) => {
    const ry = y + HEADER_H + ri * ROW_H
    doc.rect(MARGIN, ry, totalW, ROW_H).fill(ri % 2 === 0 ? WHITE : LIGHT_BG)

    let cx2 = MARGIN
    row.forEach((cell, ci) => {
      doc.fillColor(DARK_TEXT).font('Helvetica').fontSize(8)
        .text(cell, cx2 + 5, ry + 6, {
          width: colWidths[ci] - 10,
          align: alignments[ci] ?? 'left',
          lineBreak: false,
        })
      cx2 += colWidths[ci]
    })
  })

  // Border rect around entire table
  const tableH = HEADER_H + rows.length * ROW_H
  doc.rect(MARGIN, y, totalW, tableH).stroke(BORDER)

  return y + tableH + 12
}

function kpiBox(
  doc: PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  color: string
) {
  doc.rect(x, y, w, h).fill('#f0f7ff').stroke(BORDER)
  doc.fillColor(color).font('Helvetica-Bold').fontSize(16)
    .text(value, x + 8, y + 10, { width: w - 16, align: 'center', lineBreak: false })
  doc.fillColor(GRAY).font('Helvetica').fontSize(8)
    .text(label.toUpperCase(), x + 4, y + h - 18, { width: w - 8, align: 'center', lineBreak: false })
}

function pipelineBox(
  doc: PDFDocument,
  x: number,
  y: number,
  label: string,
  value: string,
  isLast: boolean
) {
  const W = 82
  const H = 60
  // Circle
  doc.circle(x + W / 2, y + 24, 22).fill('#dbeafe').stroke(BLUE)
  doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(9)
    .text(value, x, y + 18, { width: W, align: 'center', lineBreak: false })
  doc.fillColor(GRAY).font('Helvetica').fontSize(7.5)
    .text(label, x, y + H - 14, { width: W, align: 'center' })

  // Arrow connector
  if (!isLast) {
    const ax = x + W + 3
    const ay = y + 22
    doc.moveTo(ax, ay).lineTo(ax + 14, ay).stroke(BORDER)
    doc.moveTo(ax + 14, ay - 4).lineTo(ax + 20, ay).lineTo(ax + 14, ay + 4).fill(BORDER)
  }
}

export async function generateReportPDF(data: EmailKpisData): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default

  const date = fmtDate(data.generatedAt)
  const { summary, timing, byLivreur, byHub, byDay } = data

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true })
    const buffers: Buffer[] = []
    doc.on('data', (chunk: Buffer) => buffers.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    // ───────────────────────────────────────────────────────────────────
    // PAGE 1 : Cover + KPI Summary
    // ───────────────────────────────────────────────────────────────────
    drawHeader(doc, date)

    let y = 108

    // Title
    doc.fillColor(DARK_TEXT).font('Helvetica-Bold').fontSize(18)
      .text('Rapport de Performance', MARGIN, y)
    doc.fillColor(GRAY).font('Helvetica').fontSize(11)
      .text('Analyse KPIs des tournées de livraison', MARGIN, y + 24)
    y += 56

    // 4 KPI boxes row 1
    const BOX_W = 115
    const BOX_H = 58
    const GAP   = 10
    const boxesY = y

    kpiBox(doc, MARGIN,               boxesY, BOX_W, BOX_H, 'Total commandes', fmt(summary.totalOrders), BLUE)
    kpiBox(doc, MARGIN + BOX_W + GAP, boxesY, BOX_W, BOX_H, 'Taux livraison',  fmtPct(summary.deliveryRate), rateColor(summary.deliveryRate))
    kpiBox(doc, MARGIN + (BOX_W + GAP) * 2, boxesY, BOX_W, BOX_H, 'On-Time', fmtPct(summary.onTimeRate), rateColor(summary.onTimeRate))
    kpiBox(doc, MARGIN + (BOX_W + GAP) * 3, boxesY, BOX_W, BOX_H, 'Total COD', fmtMAD(summary.totalCOD), PURPLE)
    y = boxesY + BOX_H + 10

    // KPI boxes row 2
    kpiBox(doc, MARGIN,               y, BOX_W, BOX_H, 'Livrées',       fmt(summary.delivered), GREEN)
    kpiBox(doc, MARGIN + BOX_W + GAP, y, BOX_W, BOX_H, 'NO_SHOW',       fmt(summary.noShow),    RED)
    kpiBox(doc, MARGIN + (BOX_W + GAP) * 2, y, BOX_W, BOX_H, 'Cmd / jour', summary.avgOrdersPerDay.toFixed(0), '#0891b2')
    kpiBox(doc, MARGIN + (BOX_W + GAP) * 3, y, BOX_W, BOX_H, 'Moy. COD/cmd', fmtMAD(summary.totalCOD / Math.max(summary.delivered, 1)), PURPLE)
    y += BOX_H + 20

    // Divider
    doc.rect(MARGIN, y, CONTENT_W, 1).fill(BORDER)
    y += 16

    // ─── Pipeline ───
    if (timing) {
      y = drawSectionTitle(doc, 'Pipeline des délais', y)

      const steps = [
        { label: 'Création\n→ Assigné',     value: fmtMin(timing.orderToAssign) },
        { label: 'Assigné\n→ Transport',    value: fmtMin(timing.assignToTransport) },
        { label: 'Transport\n→ Départ',     value: fmtMin(timing.transportToStart) },
        { label: 'Départ\n→ Livré',         value: fmtMin(timing.startToDelivered) },
        { label: 'Durée\ntotale',           value: fmtMin(timing.totalDuration) },
      ]

      const STEP_W = 100
      const startX = MARGIN + (CONTENT_W - STEP_W * 5) / 2
      steps.forEach((s, i) => {
        pipelineBox(doc, startX + i * STEP_W, y, s.label, s.value, i === steps.length - 1)
      })
      y += 80
    }

    drawPageFooter(doc, 1, byLivreur.length > 0 ? (byHub.length > 0 || byDay.length > 0 ? 3 : 2) : 1)

    // ───────────────────────────────────────────────────────────────────
    // PAGE 2 : Livreur Ranking
    // ───────────────────────────────────────────────────────────────────
    if (byLivreur.length > 0) {
      doc.addPage()
      drawHeader(doc, date)
      y = 108

      y = drawSectionTitle(doc, 'Classement des Livreurs', y)

      const livreurRows = byLivreur.slice(0, 25).map((l) => [
        `#${l.rank}`,
        l.name,
        fmt(l.total),
        fmt(l.delivered),
        `${fmtPct(l.deliveryRate)}`,
        `${fmtPct(l.onTimeRate)}`,
        fmtMin(l.avgDuration),
        fmtMAD(l.totalCOD),
      ])

      y = drawTable(
        doc,
        ['Rang', 'Livreur', 'Total', 'Livrées', 'Taux liv.', 'On-Time', 'Durée', 'COD'],
        livreurRows,
        [36, 120, 44, 46, 52, 50, 48, 76],
        ['left', 'left', 'right', 'right', 'right', 'right', 'right', 'right'],
        y
      )

      drawPageFooter(doc, 2, byHub.length > 0 || byDay.length > 0 ? 3 : 2)
    }

    // ───────────────────────────────────────────────────────────────────
    // PAGE 3 : Hub Performance + Daily Trend
    // ───────────────────────────────────────────────────────────────────
    if (byHub.length > 0 || byDay.length > 0) {
      doc.addPage()
      drawHeader(doc, date)
      y = 108

      if (byHub.length > 0) {
        y = drawSectionTitle(doc, 'Performance par Hub', y)

        const hubRows = byHub.slice(0, 15).map((h) => [
          h.hubName,
          h.hubCity || '—',
          fmt(h.total),
          fmt(h.delivered),
          fmtPct(h.deliveryRate),
          fmtMin(h.avgDuration),
          fmtMAD(h.totalCOD),
        ])

        y = drawTable(
          doc,
          ['Hub', 'Ville', 'Total', 'Livrées', 'Taux', 'Durée', 'COD Total'],
          hubRows,
          [110, 80, 46, 50, 52, 50, 84],
          ['left', 'left', 'right', 'right', 'right', 'right', 'right'],
          y
        )
        y += 8
      }

      if (byDay.length > 0) {
        y = drawSectionTitle(doc, 'Tendance Journalière', y)

        const dayRows = byDay.slice(-20).map((d) => [
          d.date,
          fmt(d.total),
          fmt(d.delivered),
          fmt(d.noShow),
          fmtPct(d.deliveryRate),
          fmtMAD(d.totalCOD),
        ])

        drawTable(
          doc,
          ['Date', 'Total', 'Livrées', 'NO_SHOW', 'Taux livraison', 'COD Total'],
          dayRows,
          [90, 58, 60, 64, 100, 100],
          ['left', 'right', 'right', 'right', 'right', 'right'],
          y
        )
      }

      drawPageFooter(doc, 3, 3)
    }

    doc.end()
  })
}
