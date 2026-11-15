Chart.defaults.color = '#78ff0a'
Chart.defaults.font.family = '"Courier New", monospace'
Chart.defaults.font.size = 12
Chart.defaults.borderColor = 'rgba(120,255,10,0.2)'
Chart.defaults.maintainAspectRatio = false

const LINE_COLOR = '#78ff0a'
const day = (ts) => ts.slice(0, 10)
const shortDate = (iso) => new Date(iso + 'T00:00:00Z')
  .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
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

// getValue is either a function (one line) or an array of
// { label, value, dashed } objects (several lines on one chart, e.g. BP).
function lineChart(title, rows, getValue, yTitle, bands) {
  const series = Array.isArray(getValue) ? getValue : [{ label: title, value: getValue }]
  const labels = [...new Set(rows.map(r => day(r.timestamp)))].sort()
  const datasets = series.map(s => {
    const byDay = {}
    rows.forEach(r => {
      const v = s.value(r)
      if (v != null) byDay[day(r.timestamp)] = v
    })
    return {
      label: s.label,
      data: labels.map(l => byDay[l] ?? null),
      borderColor: LINE_COLOR,
      backgroundColor: LINE_COLOR,
      borderDash: s.dashed ? [5, 5] : [],
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
        x: {
          ticks: {
            maxTicksLimit: 5,
            maxRotation: 0,
            font: { size: 10 },
            callback(value) { return shortDate(this.getLabelForValue(value)) }
          }
        }
      },
      plugins: {
        ...(bands ? { zones: { bands } } : {}),
        // show a legend only when the chart has more than one line
        ...(series.length > 1 ? { legend: { display: true } } : {})
      }
    }
  })
}

// Data comes from data.js (HealthData), which also holds records saved by the task questionnaires
function renderCharts(d) {
  charts.forEach(c => c.destroy())
  charts = []
  container.innerHTML = ''

  lineChart('Heart Rate',
    d.cardiac.filter(r => r.heart_rate != null),
    r => r.heart_rate, 'bpm', [
      { min: 0, max: 50, color: RED, label: 'TOO LOW' },
      { min: 160, max: 250, color: RED, label: 'TOO HIGH' }
    ])

  lineChart('Blood Pressure',
    d.cardiac.filter(r => r.bp_systolic != null && r.bp_diastolic != null), [
      { label: 'Systolic', value: r => r.bp_systolic },
      { label: 'Diastolic', value: r => r.bp_diastolic, dashed: true }
    ], 'mmHg', [
      { min: 0, max: 60, color: RED, label: 'TOO LOW' },
      { min: 140, max: 250, color: RED, label: 'TOO HIGH' }
    ])

  lineChart('Pulse Oximetry',
    d.cardiac.filter(r => r.pulse_oximetry != null),
    r => r.pulse_oximetry, '%', [
      { max: 90, color: RED, label: 'TOO LOW' },
    ])

  lineChart('Sleep: duration per night',
    d.sleep_team_questionnaire.filter(r => r.type === 'wake'),
    r => r.sleep_duration_hours, 'hours', [
      { max: 6, color: RED},
      { min: 6, max: 7, color: AMBER, label: 'TOO SHORT' },
      { min: 9, color: AMBER, label: 'TOO LONG' }
    ])

  lineChart('Biochemical: vitamin D',
    d.biochemical_markers,
    r => r.blood?.vitamin_d_ng_ml, 'ng/mL', [
      { max: 20, color: RED, label: 'DEFICIENT' },
      { min: 20, max: 30, color: AMBER, label: 'INSUFFICIENT' },
      { min: 100, color: RED, label: 'EXCESS' }
    ])

  lineChart('Microbiome: fecal Shannon diversity index',
    d.microbiome.filter(r => r.sample_site === 'fecal'),
    r => r.shannon_diversity, 'index', [
      { max: 2.5, color: RED, label: 'LOW DIVERSITY' },
      { min: 2.5, max: 3.0, color: AMBER, label: 'WATCH' }
    ])

  lineChart('Cellular: Saliva Cortisol',
    d.cellular_profile,
    r => r.saliva?.cortisol_nmol_l, 'nmol/L', [
      { max: 3, color: RED, label: 'LOW' },
      { min: 20, max: 30, color: AMBER, label: 'ELEVATED' },
      { min: 30, color: RED, label: 'HIGH' }
    ])
}

HealthData.ready.then(renderCharts).catch((err) => {
  console.error(err)
  container.textContent = 'Failed to load charts: ' + err.message
})

// Redraw when a questionnaire saves new data
document.addEventListener('health-data-changed', () => renderCharts(HealthData.data))