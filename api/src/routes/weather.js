import { Hono } from 'hono'

const router = new Hono()

const LAT = 38.841
const LON = -77.252

const WMO = {
  0: 'Clear sky',
  1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Freezing fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light showers', 81: 'Showers', 82: 'Heavy showers',
  85: 'Light snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail',
}

function windDir(deg) {
  if (deg == null) return '—'
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

async function fetchOpenMeteo() {
  const params = new URLSearchParams({
    latitude: LAT, longitude: LON,
    current: [
      'temperature_2m','apparent_temperature','relative_humidity_2m',
      'dew_point_2m','precipitation','weather_code','cloud_cover',
      'wind_speed_10m','wind_direction_10m','wind_gusts_10m',
      'pressure_msl','visibility','uv_index',
    ].join(','),
    hourly: [
      'temperature_2m','apparent_temperature','precipitation_probability',
      'precipitation','weather_code','cloud_cover',
      'cloud_cover_low','cloud_cover_mid','cloud_cover_high',
      'wind_speed_10m','wind_direction_10m','wind_gusts_10m','visibility',
    ].join(','),
    daily: [
      'weather_code','temperature_2m_max','temperature_2m_min',
      'sunrise','sunset','precipitation_probability_max',
      'precipitation_sum','wind_speed_10m_max','wind_gusts_10m_max',
      'uv_index_max',
    ].join(','),
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
    timezone: 'America/New_York',
    forecast_days: 7,
    forecast_hours: 24,
  })

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  const d = await res.json()

  const c = d.current
  const current = {
    temp:       Math.round(c.temperature_2m),
    feelsLike:  Math.round(c.apparent_temperature),
    humidity:   c.relative_humidity_2m,
    dewPoint:   Math.round(c.dew_point_2m),
    precip:     c.precipitation,
    condition:  WMO[c.weather_code] ?? 'Unknown',
    code:       c.weather_code,
    cloudCover: c.cloud_cover,
    windSpeed:  Math.round(c.wind_speed_10m),
    windDir:    windDir(c.wind_direction_10m),
    windDirDeg: c.wind_direction_10m,
    windGusts:  Math.round(c.wind_gusts_10m),
    pressure:   Math.round(c.pressure_msl),
    visibility: c.visibility != null ? (c.visibility / 1000).toFixed(1) : null,
    uvIndex:    c.uv_index,
    time:       c.time,
  }

  const h = d.hourly
  const hourly = h.time.map((t, i) => ({
    time:       t,
    temp:       Math.round(h.temperature_2m[i]),
    feelsLike:  Math.round(h.apparent_temperature[i]),
    precipProb: h.precipitation_probability[i],
    precip:     h.precipitation[i],
    condition:  WMO[h.weather_code[i]] ?? '',
    code:       h.weather_code[i],
    cloudCover: h.cloud_cover[i],
    cloudLow:   h.cloud_cover_low[i],
    cloudMid:   h.cloud_cover_mid[i],
    cloudHigh:  h.cloud_cover_high[i],
    windSpeed:  Math.round(h.wind_speed_10m[i]),
    windDir:    windDir(h.wind_direction_10m[i]),
    windGusts:  Math.round(h.wind_gusts_10m[i]),
    visibility: h.visibility[i] != null ? (h.visibility[i] / 1000).toFixed(1) : null,
  }))

  const dd = d.daily
  const daily = dd.time.map((t, i) => ({
    date:       t,
    condition:  WMO[dd.weather_code[i]] ?? '',
    code:       dd.weather_code[i],
    tempMax:    Math.round(dd.temperature_2m_max[i]),
    tempMin:    Math.round(dd.temperature_2m_min[i]),
    sunrise:    dd.sunrise[i],
    sunset:     dd.sunset[i],
    precipProb: dd.precipitation_probability_max[i],
    precipSum:  dd.precipitation_sum[i],
    windMax:    Math.round(dd.wind_speed_10m_max[i]),
    gustMax:    Math.round(dd.wind_gusts_10m_max[i]),
    uvMax:      dd.uv_index_max[i],
  }))

  return { current, hourly, daily }
}

async function fetchMetar(station) {
  const res = await fetch(
    `https://aviationweather.gov/api/data/metar?ids=${station}&format=json&taf=false`,
    { headers: { 'User-Agent': 'ridgeleahills/1.0' } }
  )
  const data = await res.json()
  const m = data?.[0]
  if (!m) return null

  const sky = (m.sky ?? []).map(layer => ({
    cover:     layer.cover,
    baseFt:    layer.base != null ? layer.base * 100 : null,
    cloudType: layer.cloudType ?? null,
  }))

  return {
    station:    m.icaoId,
    obsTime:    m.obsTime,
    tempC:      m.temp,
    dewpC:      m.dewp,
    windDirDeg: m.wdir,
    windDir:    windDir(m.wdir),
    windKts:    m.wspd,
    gustKts:    m.wgst ?? null,
    visibMi:    m.visib,
    altimInHg:  m.altim,
    wx:         m.wxString ?? null,
    sky,
    raw:        m.rawOb,
  }
}

async function fetchModelConsensus() {
  const shared = new URLSearchParams({
    latitude: LAT, longitude: LON,
    daily: ['temperature_2m_max','temperature_2m_min','precipitation_probability_max','precipitation_sum'].join(','),
    temperature_unit: 'fahrenheit',
    precipitation_unit: 'inch',
    timezone: 'America/New_York',
    forecast_days: 3,
  })

  const sources = [
    { name: 'GFS',   url: `https://api.open-meteo.com/v1/gfs?${shared}` },
    { name: 'ECMWF', url: `https://api.open-meteo.com/v1/ecmwf?${shared}` },
    { name: 'ICON',  url: `https://api.open-meteo.com/v1/dwd-icon?${shared}` },
  ]

  const results = await Promise.all(sources.map(async ({ name, url }) => {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'ridgeleahills/1.0' } })
      if (!res.ok) return null
      const d = await res.json()
      if (!d.daily?.time) return null
      return {
        name,
        daily: d.daily.time.map((t, i) => ({
          date:       t,
          tempMax:    Math.round(d.daily.temperature_2m_max[i]),
          tempMin:    Math.round(d.daily.temperature_2m_min[i]),
          precipProb: d.daily.precipitation_probability_max?.[i] ?? null,
          precipSum:  d.daily.precipitation_sum[i],
        })),
      }
    } catch { return null }
  }))

  return results.filter(Boolean)
}

async function fetchAqi() {
  const params = new URLSearchParams({
    latitude: LAT, longitude: LON,
    current: ['us_aqi','pm10','pm2_5','ozone','nitrogen_dioxide'].join(','),
    hourly: ['us_aqi','pm2_5','ozone'].join(','),
    timezone: 'America/New_York',
    forecast_days: 1,
  })
  const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`)
  const d = await res.json()
  const c = d.current
  return {
    aqi:   c.us_aqi,
    pm25:  c.pm2_5,
    pm10:  c.pm10,
    ozone: c.ozone,
    no2:   c.nitrogen_dioxide,
    hourly: d.hourly.time.map((t, i) => ({
      time:  t,
      aqi:   d.hourly.us_aqi[i],
      pm25:  d.hourly.pm2_5[i],
      ozone: d.hourly.ozone[i],
    })),
  }
}

async function fetchAfd() {
  const listRes = await fetch('https://api.weather.gov/products/types/AFD/locations/LWX', {
    headers: { 'User-Agent': 'ridgeleahills/1.0 (admin@ridgeleahills.com)' },
  })
  const list = await listRes.json()
  const latest = list['@graph']?.[0]
  if (!latest) return null
  const prodRes = await fetch(latest['@id'], {
    headers: { 'User-Agent': 'ridgeleahills/1.0 (admin@ridgeleahills.com)' },
  })
  const prod = await prodRes.json()
  return {
    issuedAt:    prod.issuanceTime,
    productText: prod.productText,
  }
}

async function fetchNws() {
  try {
    const ptRes = await fetch(`https://api.weather.gov/points/${LAT},${LON}`, {
      headers: { 'User-Agent': 'ridgeleahills/1.0 (admin@ridgeleahills.com)' },
    })
    const pt = await ptRes.json()
    const forecastUrl = pt.properties?.forecast
    const alertsUrl   = `https://api.weather.gov/alerts/active?point=${LAT},${LON}`

    const [fRes, aRes] = await Promise.all([
      fetch(forecastUrl, { headers: { 'User-Agent': 'ridgeleahills/1.0' } }),
      fetch(alertsUrl,   { headers: { 'User-Agent': 'ridgeleahills/1.0' } }),
    ])

    const [fd, ad] = await Promise.all([fRes.json(), aRes.json()])

    const periods = (fd.properties?.periods ?? []).slice(0, 6).map(p => ({
      name:             p.name,
      temp:             p.temperature,
      tempUnit:         p.temperatureUnit,
      windSpeed:        p.windSpeed,
      windDir:          p.windDirection,
      shortForecast:    p.shortForecast,
      detailedForecast: p.detailedForecast,
      isDaytime:        p.isDaytime,
    }))

    const alerts = (ad.features ?? []).map(f => ({
      event:       f.properties.event,
      headline:    f.properties.headline,
      description: f.properties.description,
      severity:    f.properties.severity,
      onset:       f.properties.onset,
      expires:     f.properties.expires,
      url:         f.properties['@id'] ?? f.id ?? null,
    }))

    return { periods, alerts }
  } catch {
    return { periods: [], alerts: [] }
  }
}

router.get('/', async (c) => {
  const kv        = c.env.CACHE
  const CACHE_KEY = 'weather:full'
  const TTL       = 15 * 60

  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return c.json(JSON.parse(cached))
  }

  const [meteo, metarKdca, metarKiad, nws, aqi, afd, consensus] = await Promise.all([
    fetchOpenMeteo(),
    fetchMetar('KDCA').catch(() => null),
    fetchMetar('KIAD').catch(() => null),
    fetchNws(),
    fetchAqi().catch(() => null),
    fetchAfd().catch(() => null),
    fetchModelConsensus().catch(() => []),
  ])

  const result = {
    ...meteo,
    metar:     metarKdca,
    metarKiad,
    nws,
    aqi,
    afd,
    consensus,
    fetchedAt: new Date().toISOString(),
  }

  if (kv) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })

  return c.json(result)
})

export default router
