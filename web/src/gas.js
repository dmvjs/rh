import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'

function fmt(n) {
  return n != null ? `$${n.toFixed(3)}` : '—'
}

function fmtPeriod(p) {
  if (!p) return ''
  const [y, m, d] = p.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function sparkline(history) {
  if (!history || history.length < 2) return ''
  const W = 120, H = 40, PAD = 3
  const min = Math.min(...history) - 0.05
  const max = Math.max(...history) + 0.05
  const xs = history.map((_, i) => PAD + (i / (history.length - 1)) * (W - PAD * 2))
  const ys = history.map(v => H - PAD - ((v - min) / (max - min)) * (H - PAD * 2))
  const points = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  const last = history[history.length - 1]
  const first = history[0]
  const color = last >= first ? '#ef4444' : '#22c55e'
  return `<svg class="gas-spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
    <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>
    <circle cx="${xs[xs.length-1].toFixed(1)}" cy="${ys[ys.length-1].toFixed(1)}" r="3" fill="${color}"/>
  </svg>`
}

function render(d) {
  const up      = d.change > 0
  const chgCls  = d.change > 0 ? 'gas-up' : d.change < 0 ? 'gas-down' : 'gas-flat'
  const chgSign = d.change > 0 ? '+' : ''
  const chgArrow = d.change > 0 ? '↑' : d.change < 0 ? '↓' : '→'

  const yoyUp   = d.yoyChange > 0
  const yoyCls  = d.yoyChange > 0 ? 'gas-up' : d.yoyChange < 0 ? 'gas-down' : 'gas-flat'
  const yoySign = d.yoyChange > 0 ? '+' : ''

  return `
    <div class="gas-intro">
      <p class="gas-intro-label">Ridgelea Hills · ${d.areaLabel}</p>
      <h1 class="gas-intro-title">Gas Prices</h1>
      <p class="gas-intro-sub">${d.areaLabel ?? 'DC Metro'} weekly retail average · ${fmtPeriod(d.period)}</p>
    </div>

    <div class="gas-hero">
      <div class="gas-hero-left">
        <p class="gas-grade-label">All Grades · ${d.areaLabel}</p>
        <p class="gas-price">${fmt(d.current)}</p>
        <p class="gas-price-sub">per gallon</p>
        ${d.change != null ? `
          <p class="gas-change ${chgCls}">
            ${chgArrow} ${chgSign}${d.change.toFixed(3)} vs last week
          </p>` : ''}
      </div>
      <div class="gas-hero-right">
        ${sparkline(d.sparkline)}
        <p class="gas-spark-label">12-week trend</p>
      </div>
    </div>

    <div class="gas-stats">
      ${d.vsNat != null ? `
        <div class="gas-stat">
          <p class="gas-stat-label">vs. U.S. national</p>
          <p class="gas-stat-value ${d.vsNat > 0 ? 'gas-up' : 'gas-down'}">${d.vsNat > 0 ? '+' : ''}${d.vsNat.toFixed(3)}</p>
          <p class="gas-stat-sub">National avg ${fmt(d.national)}</p>
        </div>` : ''}
      ${d.yoyChange != null ? `
        <div class="gas-stat">
          <p class="gas-stat-label">vs. one year ago</p>
          <p class="gas-stat-value ${yoyCls}">${yoySign}${d.yoyChange.toFixed(3)}</p>
          <p class="gas-stat-sub">${yoySign}${d.yoyPct}%</p>
        </div>` : ''}
      <div class="gas-stat">
        <p class="gas-stat-label">52-week high</p>
        <p class="gas-stat-value">${fmt(d.high52)}</p>
      </div>
      <div class="gas-stat">
        <p class="gas-stat-label">52-week low</p>
        <p class="gas-stat-value">${fmt(d.low52)}</p>
      </div>
    </div>

    <p class="gas-credit">
      Data from <a href="https://www.eia.gov/petroleum/gasdiesel/" target="_blank" rel="noopener">U.S. Energy Information Administration</a>. Updated weekly.
    </p>
  `
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const el = document.getElementById('gas-page')
  el.innerHTML = `
    <div class="gas-intro">
      <p class="gas-intro-label">Ridgelea Hills · United States</p>
      <h1 class="gas-intro-title">Gas Prices</h1>
      <p class="gas-intro-sub"><span class="skeleton" style="display:inline-block;width:180px;height:13px;vertical-align:middle;"></span></p>
    </div>
    <div class="gas-hero" style="align-items:center;">
      <div class="gas-hero-left">
        <div class="skeleton" style="width:60px;height:14px;margin-bottom:12px;"></div>
        <div class="skeleton" style="width:180px;height:72px;margin-bottom:8px;"></div>
        <div class="skeleton" style="width:140px;height:14px;"></div>
      </div>
      <div class="gas-hero-right">
        <div class="skeleton" style="width:120px;height:40px;border-radius:4px;"></div>
      </div>
    </div>`

  try {
    const data = await api.get('/api/gas')
    el.innerHTML = render(data)
  } catch {
    el.innerHTML = `
      <div class="gas-intro">
        <p class="gas-intro-label">Ridgelea Hills</p>
        <h1 class="gas-intro-title">Gas Prices</h1>
      </div>
      <p style="color:var(--muted);padding:32px 0;">Price data unavailable right now.</p>`
  }
}

init()
