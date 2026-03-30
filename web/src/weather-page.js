import { renderHeader, renderFooter } from './header.js'
import { getMoonPhase } from './weather.js'
import { api } from './api.js'

const WMO_EMOJI = {
  0: '☀️', 1: '🌤', 2: '⛅️', 3: '☁️',
  45: '🌫', 48: '🌫',
  51: '🌦', 53: '🌦', 55: '🌧',
  61: '🌧', 63: '🌧', 65: '🌧',
  71: '🌨', 73: '🌨', 75: '🌨', 77: '🌨',
  80: '🌦', 81: '🌧', 82: '🌧',
  85: '🌨', 86: '🌨',
  95: '⛈', 96: '⛈', 99: '⛈',
}

const SKY_LABEL = { SKC: 'Clear', CLR: 'Clear', FEW: 'Few', SCT: 'Scattered', BKN: 'Broken', OVC: 'Overcast', OVX: 'Obscured' }
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtTime(iso) {
  const d = new Date(iso)
  const h = d.getHours(), m = d.getMinutes()
  return `${h % 12 || 12}${m ? ':' + String(m).padStart(2,'0') : ''} ${h < 12 ? 'AM' : 'PM'}`
}

// Open-Meteo returns sunrise/sunset as local-time strings with no tz offset: "2026-03-29T06:45"
function fmtLocalTime(str) {
  if (!str) return '—'
  const [h, m] = str.split('T')[1].split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h < 12 ? 'AM' : 'PM'}`
}

function dayLength(sunrise, sunset) {
  if (!sunrise || !sunset) return ''
  const [sh, sm] = sunrise.split('T')[1].split(':').map(Number)
  const [eh, em] = sunset.split('T')[1].split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  return `${Math.floor(mins / 60)}h ${mins % 60}m daylight`
}

function fmtDay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return DAYS[d.getDay()]
}

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

function uvLabel(uv) {
  if (uv == null) return '—'
  if (uv < 3)  return `${uv.toFixed(1)} Low`
  if (uv < 6)  return `${uv.toFixed(1)} Moderate`
  if (uv < 8)  return `${uv.toFixed(1)} High`
  if (uv < 11) return `${uv.toFixed(1)} Very High`
  return `${uv.toFixed(1)} Extreme`
}

function aqiInfo(aqi) {
  if (aqi == null) return { label: '—', color: 'var(--muted)', cat: '' }
  if (aqi <= 50)  return { label: String(aqi), color: '#16a34a', cat: 'Good' }
  if (aqi <= 100) return { label: String(aqi), color: '#ca8a04', cat: 'Moderate' }
  if (aqi <= 150) return { label: String(aqi), color: '#ea580c', cat: 'Unhealthy for Sensitive Groups' }
  if (aqi <= 200) return { label: String(aqi), color: '#dc2626', cat: 'Unhealthy' }
  if (aqi <= 300) return { label: String(aqi), color: '#9333ea', cat: 'Very Unhealthy' }
  return { label: String(aqi), color: '#7f1d1d', cat: 'Hazardous' }
}

// Parse NWS Area Forecast Discussion into labeled sections
function fmtAfd(text) {
  if (!text) return ''
  const start = text.search(/^\./m)
  if (start === -1) return `<p class="wx-afd-body">${text.trim()}</p>`
  const sections = text.slice(start).split(/\n&&\n?/).map(s => s.trim()).filter(Boolean)
  return sections.map(s => {
    const nl = s.indexOf('\n')
    const firstLine = nl === -1 ? s : s.slice(0, nl)
    const rest = nl === -1 ? '' : s.slice(nl + 1).trim()
    const m = firstLine.match(/^\.([^.]+)\.\.\./i)
    if (m) {
      return `<div class="wx-afd-section">
        <p class="wx-afd-header">${m[1].trim()}</p>
        ${rest ? `<p class="wx-afd-body">${rest}</p>` : ''}
      </div>`
    }
    return `<div class="wx-afd-section"><p class="wx-afd-body">${s}</p></div>`
  }).join('')
}

function renderConsensus(models) {
  if (!models?.length) return ''

  const days = models[0].daily.length
  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  // Compute spread per day
  const spreads = Array.from({ length: days }, (_, i) => {
    const highs = models.map(m => m.daily[i]?.tempMax).filter(v => v != null)
    const lows  = models.map(m => m.daily[i]?.tempMin).filter(v => v != null)
    return {
      hi: Math.max(...highs) - Math.min(...highs),
      lo: Math.max(...lows) - Math.min(...lows),
    }
  })

  // Check precip agreement per day
  const precipAgreement = Array.from({ length: days }, (_, i) => {
    const probs = models.map(m => m.daily[i]?.precipProb).filter(p => p != null)
    if (probs.length < 2) return true
    const allWet = probs.every(p => p >= 40)
    const allDry = probs.every(p => p < 30)
    return allWet || allDry
  })

  // Overall confidence
  const maxSpread = Math.max(...spreads.flatMap(s => [s.hi, s.lo]))
  const precipDisagree = precipAgreement.some(a => !a)
  let confidence, confColor, note
  if (maxSpread <= 3 && !precipDisagree) {
    confidence = 'High confidence'; confColor = '#16a34a'
    note = 'All models in close agreement.'
  } else if (maxSpread <= 6 && !precipDisagree) {
    confidence = 'Moderate confidence'; confColor = '#ca8a04'
    note = `Temperature spread up to ${maxSpread}°F — minor uncertainty.`
  } else if (precipDisagree && maxSpread <= 6) {
    confidence = 'Moderate confidence'; confColor = '#ca8a04'
    note = 'Models disagree on precipitation — timing or amounts uncertain.'
  } else {
    confidence = 'Low confidence'; confColor = '#dc2626'
    note = `Models diverge significantly — high uncertainty. Spread up to ${maxSpread}°F.`
  }

  // Day labels
  const dayLabels = models[0].daily.map((d, i) => {
    if (i === 0) return 'Today'
    if (i === 1) return 'Tomorrow'
    const dt = new Date(d.date + 'T12:00:00')
    return `${MONTHS_SHORT[dt.getMonth()]} ${dt.getDate()}`
  })

  const headerCells = dayLabels.map(l => `<span class="wx-con-cell wx-con-head">${l}</span>`).join('')
  const spreadCells = spreads.map((s, i) => {
    const max = Math.max(s.hi, s.lo)
    const color = max > 5 ? '#dc2626' : max > 3 ? '#ea580c' : 'var(--muted)'
    return `<span class="wx-con-cell" style="color:${color};font-size:12px">±${Math.ceil(max/2)}°</span>`
  }).join('')

  const modelRows = models.map(m => {
    const cells = m.daily.map((d, i) => {
      const probStr = d.precipProb != null ? `<span class="wx-con-rain ${!precipAgreement[i] ? 'wx-con-rain-warn' : ''}">${d.precipProb}%</span>` : ''
      return `<span class="wx-con-cell"><strong>${d.tempMax}°</strong> <span style="color:var(--muted)">${d.tempMin}°</span>${probStr}</span>`
    }).join('')
    return `
      <div class="wx-con-row">
        <span class="wx-con-model">${m.name}</span>
        ${cells}
      </div>
    `
  }).join('')

  return `
    <div class="wx-consensus">
      <div class="wx-con-row wx-con-header">
        <span class="wx-con-model"></span>
        ${headerCells}
      </div>
      ${modelRows}
      <div class="wx-con-row wx-con-spread">
        <span class="wx-con-model" style="font-size:11px;color:var(--muted)">Spread</span>
        ${spreadCells}
      </div>
    </div>
    <p class="wx-con-note"><span style="color:${confColor};font-weight:600">${confidence}</span> — ${note}</p>
  `
}

function metarReadable(m) {
  if (!m) return null
  const lines = []
  if (m.windKts != null) {
    const mph  = Math.round(m.windKts * 1.15078)
    const gust = m.gustKts ? `, gusting ${Math.round(m.gustKts * 1.15078)} mph` : ''
    const dir  = m.windDir !== '—' ? `from the ${m.windDir}` : 'variable'
    lines.push(`Wind ${dir} at ${mph} mph${gust}`)
  }
  if (m.visibMi != null)
    lines.push(`Visibility ${m.visibMi === 10 ? '10+ miles' : `${m.visibMi} miles`}`)
  if (m.sky?.length) {
    const skyDesc = m.sky.map(l => {
      const label = SKY_LABEL[l.cover] ?? l.cover
      const alt   = l.baseFt != null ? ` at ${l.baseFt.toLocaleString()} ft` : ''
      const type  = l.cloudType === 'CB' ? ' (cumulonimbus)' : l.cloudType === 'TCU' ? ' (towering cumulus)' : ''
      return `${label}${alt}${type}`
    }).join(', ')
    lines.push(`Clouds: ${skyDesc}`)
  }
  if (m.tempC != null) {
    const tempF = Math.round(m.tempC * 9/5 + 32)
    const dewF  = m.dewpC != null ? Math.round(m.dewpC * 9/5 + 32) : null
    lines.push(`Temperature ${tempF}°F${dewF != null ? `, dew point ${dewF}°F` : ''}`)
  }
  if (m.altimInHg != null) lines.push(`Altimeter ${m.altimInHg.toFixed(2)} inHg`)
  if (m.wx) lines.push(`Present weather: ${m.wx}`)
  return lines
}

function cloudLayerDesc(sky) {
  if (!sky?.length) return null
  return sky.map(l => {
    const label = SKY_LABEL[l.cover] ?? l.cover
    const alt   = l.baseFt != null ? ` at ${l.baseFt.toLocaleString()} ft` : ''
    const type  = l.cloudType === 'CB' ? ' (Cumulonimbus)' : l.cloudType === 'TCU' ? ' (Towering Cumulus)' : ''
    return `${label}${alt}${type}`
  }).join(' · ')
}

function stat(label, value, sub = '') {
  return `
    <div class="wx-stat">
      <span class="wx-stat-label">${label}</span>
      <span class="wx-stat-value">${value}</span>
      ${sub ? `<span class="wx-stat-sub">${sub}</span>` : ''}
    </div>
  `
}

function section(title, content) {
  return `
    <div class="wx-section">
      <p class="wx-section-title">${title}</p>
      ${content}
    </div>
  `
}

function metarBlock(m) {
  if (!m) return ''
  const lines = metarReadable(m)
  const name = m.station === 'KDCA' ? 'Reagan National' : m.station === 'KIAD' ? 'Dulles Intl' : m.station
  return `
    <p class="wx-metar-raw">${m.raw}</p>
    <p style="font-size:.75rem;color:var(--muted);margin-top:6px;">${name} (${m.station}) · ${fmtTime(new Date(m.obsTime * 1000).toISOString())}</p>
    ${lines?.length ? `<ul class="wx-metar-decoded">${lines.map(l => `<li>${l}</li>`).join('')}</ul>` : ''}
  `
}

function render(data) {
  const { current: c, hourly, daily, metar, metarKiad, nws, aqi, afd, consensus } = data
  const emoji   = WMO_EMOJI[c.code] ?? '🌡'
  const today   = daily[0]
  const aqiNow  = aqiInfo(aqi?.aqi)

  // Alert banner
  const alertsHtml = nws.alerts.length ? `
    <div class="wx-alert-bar">
      ${nws.alerts.map((a, i) => `
        <a class="wx-alert-bar-link" href="#alert-${i}">
          <span class="wx-alert-bar-event">${a.event}</span>
          <span class="wx-alert-bar-arrow">↓</span>
        </a>
      `).join('')}
    </div>
  ` : ''

  // Alert detail (anchor targets)
  const alertDetailHtml = nws.alerts.length ? nws.alerts.map((a, i) => {
    const expires = a.expires ? `Expires ${new Date(a.expires).toLocaleString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}` : ''
    return `
      <div class="wx-alert-detail" id="alert-${i}">
        <p class="wx-alert-title">${a.event}</p>
        <p class="wx-alert-headline">${a.headline}</p>
        ${a.description ? `<p class="wx-alert-desc">${a.description.trim().replace(/\n/g, '<br>')}</p>` : ''}
        <p class="wx-alert-meta">${[expires, a.severity ? `Severity: ${a.severity}` : ''].filter(Boolean).join(' · ')}</p>
        ${a.url ? `<a class="wx-alert-link" href="${a.url}" target="_blank" rel="noopener">NWS full alert →</a>` : ''}
      </div>
    `
  }).join('') : ''

  // Current conditions
  const currentHtml = `
    <div class="wx-current">
      <div class="wx-current-main">
        <span class="wx-temp">${c.temp}°</span>
        <span class="wx-emoji">${emoji}</span>
      </div>
      <p class="wx-condition">${c.condition}</p>
      <p class="wx-sublabel">Feels ${c.feelsLike}° · ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</p>
      ${aqi?.aqi != null ? `<p class="wx-aqi-line"><span style="color:${aqiNow.color};font-weight:600">AQI ${aqiNow.label}</span>&ensp;<span style="color:var(--muted);font-size:13px">${aqiNow.cat}</span></p>` : ''}
    </div>
  `

  // Sunrise / sunset / moon bar
  const moon = getMoonPhase()
  const daylightHtml = today?.sunrise ? `
    <div class="wx-daylight">
      <span>🌅 ${fmtLocalTime(today.sunrise)}</span>
      <span class="wx-daylight-length">${dayLength(today.sunrise, today.sunset)}</span>
      <span>🌇 ${fmtLocalTime(today.sunset)}</span>
      <span class="wx-daylight-moon">${moon.symbol} ${moon.name}</span>
    </div>
  ` : ''

  // Stats grid
  const clouds = cloudLayerDesc(metar?.sky)
  const statsHtml = `
    <div class="wx-stats">
      ${stat('Wind', `${c.windSpeed} mph ${c.windDir}`, c.windGusts > c.windSpeed + 5 ? `gusts ${c.windGusts} mph` : '')}
      ${stat('Humidity', `${c.humidity}%`, `Dew point ${c.dewPoint}°F`)}
      ${stat('Pressure', `${c.pressure} hPa`)}
      ${stat('Visibility', c.visibility ? `${c.visibility} km` : '—')}
      ${stat('UV Index', uvLabel(c.uvIndex))}
      ${stat('Cloud Cover', `${c.cloudCover}%`)}
    </div>
  `
  const cloudsHtml = clouds ? `<p class="wx-clouds"><span class="wx-clouds-label">Cloud layers</span> ${clouds} <span class="wx-metar-src">KDCA</span></p>` : ''

  // Hourly
  const hourlyHtml = `
    <div class="wx-hourly-scroll">
      ${hourly.map(h => `
        <div class="wx-hour">
          <span class="wx-hour-time">${fmtTime(h.time)}</span>
          <span class="wx-hour-emoji">${WMO_EMOJI[h.code] ?? '—'}</span>
          <span class="wx-hour-temp">${h.temp}°</span>
          <span class="wx-hour-precip">${h.precipProb > 0 ? h.precipProb + '%' : ''}</span>
          <span class="wx-hour-wind">${h.windSpeed} <span style="opacity:.5">${h.windDir}</span></span>
        </div>
      `).join('')}
    </div>
  `

  // Cloud layers by hour (high → mid → low)
  const cloudHourlyHtml = `
    <div class="wx-hourly-scroll">
      ${hourly.map(h => `
        <div class="wx-hour">
          <span class="wx-hour-time">${fmtTime(h.time)}</span>
          <span class="wx-hour-temp" style="font-size:.75rem;color:var(--muted)">High</span>
          <span class="wx-hour-temp">${h.cloudHigh}%</span>
          <span class="wx-hour-temp" style="font-size:.75rem;color:var(--muted)">Mid</span>
          <span class="wx-hour-temp">${h.cloudMid}%</span>
          <span class="wx-hour-temp" style="font-size:.75rem;color:var(--muted)">Low</span>
          <span class="wx-hour-temp">${h.cloudLow}%</span>
        </div>
      `).join('')}
    </div>
  `

  // Air quality breakdown + hourly AQI strip
  const aqiHtml = aqi ? (() => {
    const breakdown = [
      aqi.pm25  != null ? `PM2.5 <strong>${aqi.pm25.toFixed(1)}</strong> µg/m³`  : '',
      aqi.pm10  != null ? `PM10 <strong>${aqi.pm10.toFixed(1)}</strong> µg/m³`   : '',
      aqi.ozone != null ? `Ozone <strong>${aqi.ozone.toFixed(0)}</strong> µg/m³` : '',
      aqi.no2   != null ? `NO₂ <strong>${aqi.no2.toFixed(1)}</strong> µg/m³`     : '',
    ].filter(Boolean)
    return `
      <div class="wx-aqi-breakdown">
        ${breakdown.map(b => `<span>${b}</span>`).join('')}
      </div>
      <div class="wx-hourly-scroll">
        ${(aqi.hourly ?? []).map(h => {
          const info = aqiInfo(h.aqi)
          return `
            <div class="wx-hour">
              <span class="wx-hour-time">${fmtTime(h.time)}</span>
              <span class="wx-hour-temp" style="color:${info.color}">${h.aqi ?? '—'}</span>
              <span class="wx-hour-precip" style="color:var(--muted)">${info.cat.split(' ')[0]}</span>
            </div>
          `
        }).join('')}
      </div>
    `
  })() : ''

  // 7-day
  const dailyHtml = `
    <div class="wx-daily">
      ${daily.map(d => {
        const uvColor = d.uvMax >= 8 ? '#dc2626' : d.uvMax >= 6 ? '#ea580c' : d.uvMax >= 3 ? '#ca8a04' : 'var(--muted)'
        return `
          <div class="wx-day">
            <span class="wx-day-name">${fmtDay(d.date)}</span>
            <span class="wx-day-date">${fmtDate(d.date)}</span>
            <span class="wx-day-emoji">${WMO_EMOJI[d.code] ?? '—'}</span>
            <span class="wx-day-cond">${d.condition}</span>
            <span class="wx-day-hi">${d.tempMax}°</span>
            <span class="wx-day-lo">${d.tempMin}°</span>
            <span class="wx-day-precip">${d.precipProb > 0 ? d.precipProb + '%' : ''}</span>
            <span class="wx-day-rain">${d.precipSum > 0 ? d.precipSum.toFixed(2) + '"' : ''}</span>
            <span class="wx-day-uv" style="color:${uvColor}">UV ${Math.round(d.uvMax)}</span>
          </div>
        `
      }).join('')}
    </div>
  `

  // NWS text forecast
  const nwsHtml = nws.periods.length ? nws.periods.map(p => `
    <div class="wx-nws-period">
      <p class="wx-nws-name">${p.name} <span class="wx-nws-temp">${p.temp}°${p.tempUnit} · ${p.windSpeed} ${p.windDir}</span></p>
      <p class="wx-nws-detail">${p.detailedForecast}</p>
    </div>
  `).join('') : ''

  // Area Forecast Discussion
  const afdHtml = afd?.productText ? `
    <p class="wx-afd-issued">Issued ${new Date(afd.issuedAt).toLocaleString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} · NWS Sterling (LWX)</p>
    <div class="wx-afd-wrap">${fmtAfd(afd.productText)}</div>
  ` : ''

  // Aviation observations — KDCA + KIAD
  const aviationHtml = `
    ${metarBlock(metar)}
    ${metarKiad ? `<div class="wx-metar-second">${metarBlock(metarKiad)}</div>` : ''}
  `

  return `
    ${alertsHtml}
    <div class="wx-hero">
      ${currentHtml}
      ${statsHtml}
    </div>
    ${daylightHtml}
    ${cloudsHtml}
    ${section('Next 24 Hours', hourlyHtml)}
    ${section('Cloud Layers by Hour', cloudHourlyHtml)}
    ${aqiHtml ? section('Air Quality', aqiHtml) : ''}
    ${section('7-Day Forecast', dailyHtml)}
    ${consensus?.length ? section('Model Consensus · GFS · ECMWF · ICON', renderConsensus(consensus)) : ''}
    ${nwsHtml ? section('NWS Forecast', nwsHtml) : ''}
    ${alertDetailHtml ? section('Active Alerts', alertDetailHtml) : ''}
    ${afdHtml ? section('Area Forecast Discussion', afdHtml) : ''}
    ${section('Aviation Observations', aviationHtml)}
    <p class="wx-updated">Updated ${new Date(data.fetchedAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</p>
  `
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const el = document.getElementById('weather-page')

  try {
    const data = await api.get('/api/weather')
    el.innerHTML = render(data)
  } catch (e) {
    el.innerHTML = '<p style="color:var(--muted)">Weather unavailable.</p>'
  }
}

init()
