export interface EmailKpisData {
  summary: {
    totalOrders: number
    delivered: number
    noShow: number
    deliveryRate: number
    onTimeRate: number
    totalCOD: number
    avgOrdersPerDay: number
  }
  timing: {
    orderToAssign: number
    assignToTransport: number
    transportToStart: number
    startToDelivered: number
    totalDuration: number
  } | null
  byLivreur: Array<{
    rank: number
    name: string
    total: number
    delivered: number
    noShow: number
    deliveryRate: number
    onTimeRate: number
    avgDuration: number
    totalCOD: number
  }>
  byHub: Array<{
    hubName: string
    hubCity: string
    total: number
    delivered: number
    deliveryRate: number
    avgDuration: number
    totalCOD: number
  }>
  byDay: Array<{
    date: string
    total: number
    delivered: number
    noShow: number
    totalCOD: number
    deliveryRate: number
  }>
  generatedAt: string
}

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

const rateColor = (rate: number) =>
  rate >= 80 ? '#16a34a' : rate >= 60 ? '#d97706' : '#dc2626'

const rateEmoji = (rate: number) => (rate >= 80 ? '🟢' : rate >= 60 ? '🟡' : '🔴')

function kpiCard(emoji: string, value: string, label: string, color = '#1d4ed8') {
  return `<td width="145" style="padding:6px;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%"
      style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:10px;">
      <tr><td style="padding:14px 10px;text-align:center;">
        <div style="font-size:22px;margin-bottom:4px;">${emoji}</div>
        <div style="font-size:19px;font-weight:800;color:${color};font-family:Arial,sans-serif;line-height:1.2;">${value}</div>
        <div style="font-size:10px;color:#64748b;font-family:Arial,sans-serif;margin-top:4px;text-transform:uppercase;letter-spacing:0.3px;">${label}</div>
      </td></tr>
    </table>
  </td>`
}

function pipelineStep(label: string, value: string, isLast = false) {
  return `<td style="text-align:center;vertical-align:top;padding:0 2px;">
      <div style="width:52px;height:52px;border-radius:50%;background:#dbeafe;border:2.5px solid #2563eb;
        margin:0 auto;font-size:11px;font-weight:800;color:#1d4ed8;font-family:Arial,sans-serif;
        line-height:52px;text-align:center;">${value}</div>
      <div style="font-size:9px;color:#64748b;font-family:Arial,sans-serif;margin-top:6px;max-width:62px;line-height:1.3;">${label}</div>
    </td>${isLast ? '' : `<td style="vertical-align:middle;padding-bottom:22px;">
      <div style="width:18px;height:2px;background:#bfdbfe;margin:0 auto;"></div>
    </td>`}`
}

function sectionHeader(title: string) {
  return `<tr><td style="padding:20px 0 10px;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td style="border-left:4px solid #2563eb;padding-left:12px;">
        <span style="font-size:15px;font-weight:700;color:#0f172a;font-family:Arial,sans-serif;">${title}</span>
      </td>
    </tr></table>
  </td></tr>`
}

function tableHeaderRow(cols: Array<{ label: string; align?: string }>) {
  return `<tr style="background:#1e3a5f;">${cols
    .map(
      (c) =>
        `<th style="padding:10px 10px;font-size:10px;font-weight:700;color:#e2e8f0;
          text-align:${c.align ?? 'left'};font-family:Arial,sans-serif;
          text-transform:uppercase;letter-spacing:0.4px;">${c.label}</th>`
    )
    .join('')}</tr>`
}

export function buildEmailHTML(data: EmailKpisData): string {
  const { summary, timing, byLivreur, byHub, byDay, generatedAt } = data
  const date = fmtDate(generatedAt)
  const topLivreurs = byLivreur.slice(0, 10)
  const topHubs = byHub.slice(0, 8)
  const recentDays = [...byDay].slice(-10)

  const livreurRows = topLivreurs
    .map(
      (l, i) => `<tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8faff'};">
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;color:#1e3a5f;font-weight:700;">#${l.rank}</td>
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;color:#0f172a;font-weight:500;">${l.name}</td>
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;text-align:right;">${fmt(l.total)}</td>
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;color:#16a34a;text-align:right;font-weight:600;">${fmt(l.delivered)}</td>
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;text-align:right;">
        ${rateEmoji(l.deliveryRate)} <span style="color:${rateColor(l.deliveryRate)};font-weight:700;">${fmtPct(l.deliveryRate)}</span>
      </td>
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;text-align:right;color:#475569;">${fmtMin(l.avgDuration)}</td>
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;text-align:right;color:#7c3aed;font-weight:600;">${fmtMAD(l.totalCOD)}</td>
    </tr>`
    )
    .join('')

  const hubRows = topHubs
    .map(
      (h, i) => `<tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8faff'};">
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;color:#0f172a;font-weight:500;">${h.hubName}</td>
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;color:#64748b;">${h.hubCity || '—'}</td>
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;text-align:right;">${fmt(h.total)}</td>
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;text-align:right;">
        ${rateEmoji(h.deliveryRate)} <span style="color:${rateColor(h.deliveryRate)};font-weight:700;">${fmtPct(h.deliveryRate)}</span>
      </td>
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;text-align:right;color:#475569;">${fmtMin(h.avgDuration)}</td>
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;text-align:right;color:#7c3aed;font-weight:600;">${fmtMAD(h.totalCOD)}</td>
    </tr>`
    )
    .join('')

  const dayRows = recentDays
    .map(
      (d, i) => `<tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8faff'};">
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;color:#0f172a;">${d.date}</td>
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;text-align:right;">${fmt(d.total)}</td>
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;color:#16a34a;text-align:right;font-weight:600;">${fmt(d.delivered)}</td>
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;color:#dc2626;text-align:right;">${fmt(d.noShow)}</td>
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;text-align:right;">
        <span style="color:${rateColor(d.deliveryRate)};font-weight:700;">${fmtPct(d.deliveryRate)}</span>
      </td>
      <td style="padding:9px 10px;font-size:12px;font-family:Arial;text-align:right;color:#7c3aed;">${fmtMAD(d.totalCOD)}</td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Rapport KPIs Livraisons — Shipinfy</title>
</head>
<body style="margin:0;padding:0;background:#e2e8f0;font-family:Arial,sans-serif;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#e2e8f0;padding:28px 0;">
<tr><td align="center">

  <!-- Outer card -->
  <table cellpadding="0" cellspacing="0" border="0" width="620"
    style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">

    <!-- ─── HEADER ─── -->
    <tr>
      <td style="padding:0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="background:#1e3a5f;padding:28px 36px 24px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <div style="font-size:24px;font-weight:900;color:#ffffff;font-family:Arial,sans-serif;letter-spacing:-0.5px;">
                      📦 SHIPINFY
                    </div>
                    <div style="font-size:12px;color:#93c5fd;font-family:Arial,sans-serif;margin-top:3px;letter-spacing:0.5px;">
                      RAPPORT KPIs — PERFORMANCES LIVRAISON
                    </div>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <div style="background:#2563eb;border-radius:8px;padding:10px 16px;display:inline-block;">
                      <div style="font-size:11px;color:#bfdbfe;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.5px;">Généré le</div>
                      <div style="font-size:15px;font-weight:700;color:#ffffff;font-family:Arial,sans-serif;margin-top:2px;">${date}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Blue accent bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#2563eb,#7c3aed,#2563eb);"></td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ─── BODY ─── -->
    <tr><td style="padding:28px 36px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">

        <!-- KPI CARDS — Row 1 -->
        <tr>
          <td>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                ${kpiCard('📦', fmt(summary.totalOrders), 'Total commandes', '#1d4ed8')}
                ${kpiCard('✅', fmtPct(summary.deliveryRate), 'Taux livraison', rateColor(summary.deliveryRate))}
                ${kpiCard('⏱', fmtPct(summary.onTimeRate), 'On-Time', rateColor(summary.onTimeRate))}
                ${kpiCard('💰', fmtMAD(summary.totalCOD), 'Total COD', '#7c3aed')}
              </tr>
              <tr>
                ${kpiCard('✔️', fmt(summary.delivered), 'Livrées', '#16a34a')}
                ${kpiCard('✕', fmt(summary.noShow), 'NO_SHOW', '#dc2626')}
                ${kpiCard('📅', summary.avgOrdersPerDay.toFixed(0), 'Cmd / jour', '#0891b2')}
                ${kpiCard('💵', fmtMAD(summary.totalCOD / Math.max(summary.delivered, 1)), 'Moy. COD/cmd', '#7c3aed')}
              </tr>
            </table>
          </td>
        </tr>

        <!-- DIVIDER -->
        <tr><td style="padding:8px 0;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>

        ${
          timing
            ? `<!-- PIPELINE -->
        ${sectionHeader('⏱ Pipeline des délais')}
        <tr><td style="padding-bottom:8px;">
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
            <tr>
              ${pipelineStep('Création → Assigné', fmtMin(timing.orderToAssign))}
              ${pipelineStep('Assigné → Transport', fmtMin(timing.assignToTransport))}
              ${pipelineStep('Transport → Départ', fmtMin(timing.transportToStart))}
              ${pipelineStep('Départ → Livré', fmtMin(timing.startToDelivered))}
              ${pipelineStep('Total', fmtMin(timing.totalDuration), true)}
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:8px 0;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>`
            : ''
        }

        ${
          topLivreurs.length > 0
            ? `<!-- LIVREURS -->
        ${sectionHeader('🏆 Classement Livreurs')}
        <tr><td>
          <table cellpadding="0" cellspacing="0" border="0" width="100%"
            style="border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
            ${tableHeaderRow([
              { label: 'Rang' },
              { label: 'Livreur' },
              { label: 'Total', align: 'right' },
              { label: 'Livrées', align: 'right' },
              { label: 'Taux', align: 'right' },
              { label: 'Durée moy.', align: 'right' },
              { label: 'COD Total', align: 'right' },
            ])}
            ${livreurRows}
          </table>
        </td></tr>
        <tr><td style="padding:8px 0;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>`
            : ''
        }

        ${
          topHubs.length > 0
            ? `<!-- HUBS -->
        ${sectionHeader('🏭 Performance par Hub')}
        <tr><td>
          <table cellpadding="0" cellspacing="0" border="0" width="100%"
            style="border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
            ${tableHeaderRow([
              { label: 'Hub' },
              { label: 'Ville' },
              { label: 'Total', align: 'right' },
              { label: 'Taux livraison', align: 'right' },
              { label: 'Durée moy.', align: 'right' },
              { label: 'COD Total', align: 'right' },
            ])}
            ${hubRows}
          </table>
        </td></tr>
        <tr><td style="padding:8px 0;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>`
            : ''
        }

        ${
          recentDays.length > 0
            ? `<!-- DAILY -->
        ${sectionHeader('📅 Tendance journalière')}
        <tr><td>
          <table cellpadding="0" cellspacing="0" border="0" width="100%"
            style="border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
            ${tableHeaderRow([
              { label: 'Date' },
              { label: 'Total', align: 'right' },
              { label: 'Livrées', align: 'right' },
              { label: 'NO_SHOW', align: 'right' },
              { label: 'Taux', align: 'right' },
              { label: 'COD', align: 'right' },
            ])}
            ${dayRows}
          </table>
        </td></tr>`
            : ''
        }

        <!-- CTA BUTTON -->
        <tr><td style="padding:28px 0 16px;text-align:center;">
          <a href="https://shipinfy.mediflows.shop/dashboard"
            style="background:#2563eb;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;
              font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;
              display:inline-block;letter-spacing:0.3px;">
            📊 Voir le Dashboard Complet
          </a>
        </td></tr>

        <!-- FOOTER NOTE -->
        <tr><td style="border-top:1px solid #f1f5f9;padding-top:16px;text-align:center;">
          <p style="font-size:11px;color:#94a3b8;font-family:Arial,sans-serif;margin:0;line-height:1.6;">
            Ce rapport a été généré automatiquement par <strong style="color:#64748b;">Shipinfy</strong> le ${date}.<br>
            Pour toute question, contactez votre administrateur.
          </p>
        </td></tr>

      </table>
    </td></tr>

  </table>

  <!-- Bottom footer -->
  <table cellpadding="0" cellspacing="0" border="0" width="620" style="margin-top:14px;">
    <tr>
      <td style="text-align:center;">
        <p style="font-size:10px;color:#94a3b8;font-family:Arial,sans-serif;margin:0;">
          © ${new Date().getFullYear()} Shipinfy · Gestion des livraisons · shipinfy.mediflows.shop
        </p>
      </td>
    </tr>
  </table>

</td></tr>
</table>
</body>
</html>`
}
