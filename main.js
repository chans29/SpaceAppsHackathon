Chart.defaults.color = '#78ff0a'
Chart.defaults.font.family = '"Courier New", monospace'
Chart.defaults.font.size = 10
Chart.defaults.borderColor = 'rgba(120,255,10,0.2)'
Chart.defaults.maintainAspectRatio = false

const CREW_COLORS = { 'CM-01': '#78ff0a'}
const crews = Object.keys(CREW_COLORS)
const day = (ts) => ts.slice(0, 10)
const container = document.getElementById('charts')
let charts = []

const RED = 'rgba(255, 60, 60, 0.20)'
const AMBER = 'rgba(224, 160, 48, 0.20)'

// Draws horizontal shaded bands behind the data.
// Each band: { min, max, color, label }. Leave min or max out to extend to the edge.
const zonePlugin = {
  id: 'zones',
  beforeDatasetsDraw(chart, args, opts) {
    if (!opts || !opts.bands) return
    const { ctx, chartArea, scales } = chart
    const y = scales.y
    ctx.save()
    ctx.font = '9px "Courier New", monospace'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    opts.bands.forEach(b => {
      const clamp = v => Math.max(chartArea.top, Math.min(chartArea.bottom, v))
      const top = clamp(y.getPixelForValue(b.max ?? y.max))
      const bottom = clamp(y.getPixelForValue(b.min ?? y.min))
      if (bottom - top < 1) return
      ctx.fillStyle = b.color
      ctx.fillRect(chartArea.left, top, chartArea.right - chartArea.left, bottom - top)
      if (b.label && bottom - top > 12) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.fillText(b.label, chartArea.right - 4, top + 2)
      }
    })
    ctx.restore()
  }
}
Chart.register(zonePlugin)

// Expand the y-axis so the bands are visible even when the data stays in the safe range
function rangeFor(bands) {
  const edges = bands.flatMap(b => [b.min, b.max]).filter(v => v != null)
  const lo = Math.min(...edges), hi = Math.max(...edges)
  const pad = (hi - lo) * 0.15 || 1
  return { suggestedMin: lo - pad, suggestedMax: hi + pad }
}

function addChart(title, config) {
  const card = document.createElement('div')
  card.className = 'report-card'
  const canvas = document.createElement('canvas')
  card.appendChild(canvas)
  container.appendChild(card)
  config.options = config.options || {}
  config.options.plugins = {
    title: { display: true, text: title, color: '#78ff0a' },
    legend: { display: false },
    ...(config.options.plugins || {})
  }
  charts.push(new Chart(canvas, config))
}

function lineByCrew(title, rows, getValue, yTitle, bands) {
  const labels = [...new Set(rows.map(r => day(r.timestamp)))].sort()
  const datasets = crews.map(id => {
    const byDay = {}
    rows.filter(r => r.crew_id === id).forEach(r => {
      const v = getValue(r)
      if (v != null) byDay[day(r.timestamp)] = v
    })
    return {
      label: id,
      data: labels.map(l => byDay[l] ?? null),
      borderColor: CREW_COLORS[id],
      backgroundColor: CREW_COLORS[id],
      tension: 0.25,
      pointRadius: 2,
      borderWidth: 1.5,
      spanGaps: true
    }
  })
  addChart(title, {
    type: 'line',
    data: { labels, datasets },
    options: {
      scales: {
        y: { title: { display: !!yTitle, text: yTitle } },
        x: { ticks: { maxTicksLimit: 6 } }
      },
      plugins: bands ? { zones: { bands } } : {}
    }
  })
}

// Data comes from data.js (HealthData), which also holds records saved by the task questionnaires
function renderCharts(d) {
  charts.forEach(c => c.destroy())
  charts = []
  container.innerHTML = ''

  lineByCrew('Microbiome: fecal Shannon diversity',
  d.microbiome.filter(r => r.sample_site === 'fecal'),
  r => r.shannon_diversity, 'index', [
    { max: 2.5, color: RED, label: 'low diversity' },
    { min: 2.5, max: 3.0, color: AMBER, label: 'watch' }
  ])

lineByCrew('Cellular: saliva cortisol',
  d.cellular_profile, r => r.saliva?.cortisol_nmol_l, 'nmol/L', [
    { max: 3, color: RED, label: 'low' },
    { min: 20, max: 30, color: AMBER, label: 'elevated' },
    { min: 30, color: RED, label: 'high' }
  ])

lineByCrew('Cognition: psychomotor vigilance',
  d.cognition,
  r => r.tests.find(t => t.test === 'psychomotor_vigilance')?.score, 'ms', [
    { min: 300, max: 350, color: AMBER, label: 'slowed' },
    { min: 350, color: RED, label: 'impaired' }
  ])

lineByCrew('Sleep: duration per night',
  d.sleep_team_questionnaire.filter(r => r.type === 'wake'),
  r => r.sleep_duration_hours, 'hours', [
    { max: 6, color: RED, label: 'too little' },
    { min: 6, max: 7, color: AMBER, label: 'short' },
    { min: 9, color: AMBER, label: 'long' }
  ])

// Sway has no absolute limit, so compare against this person's pre-flight average
const preSway = d.sensorimotor.filter(r => r.phase === 'pre-flight').map(r => r.balance_sway_path_cm)
const swayBase = preSway.reduce((a, b) => a + b, 0) / preSway.length
lineByCrew('Sensorimotor: balance sway path',
  d.sensorimotor, r => r.balance_sway_path_cm, 'cm', [
    { min: swayBase * 1.25, max: swayBase * 1.5, color: AMBER, label: '+25% vs baseline' },
    { min: swayBase * 1.5, color: RED, label: '+50% vs baseline' }
  ])

lineByCrew('Biochemical: vitamin D',
  d.biochemical_markers, r => r.blood?.vitamin_d_ng_ml, 'ng/mL', [
    { max: 20, color: RED, label: 'deficient' },
    { min: 20, max: 30, color: AMBER, label: 'insufficient' },
    { min: 100, color: RED, label: 'excess' }
  ])

lineByCrew('Carotid intima-media thickness',
  d.carotid_intima_media_thickness,
  r => (r.left_cca_imt + r.right_cca_imt) / 2, 'mm', [
    { min: 0.8, max: 0.9, color: AMBER, label: 'borderline' },
    { min: 0.9, color: RED, label: 'thickened' }
  ])
}

HealthData.ready.then(renderCharts).catch((err) => {
  console.error(err)
  container.textContent = 'Failed to load charts: ' + err.message
})

// Redraw when a questionnaire saves new data
document.addEventListener('health-data-changed', () => renderCharts(HealthData.data))