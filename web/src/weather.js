// Ridglea Hills, VA — update LAT/LON to match your exact location
const LAT = 38.841
const LON = -77.252

export async function getWeather() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m&temperature_unit=fahrenheit&timezone=America%2FChicago`
  const res = await fetch(url)
  const { current } = await res.json()
  return { temp: Math.round(current.temperature_2m) }
}

export function getMoonPhase(date = new Date()) {
  // Reference new moon: 2000-01-06T18:14:00Z
  const elapsed = (date - new Date('2000-01-06T18:14:00Z')) / 86400000
  const phase = ((elapsed % 29.53058867) + 29.53058867) % 29.53058867
  const f = phase / 29.53058867

  if (f < 0.0625) return { name: 'New Moon',        symbol: '🌑' }
  if (f < 0.1875) return { name: 'Waxing Crescent',  symbol: '🌒' }
  if (f < 0.3125) return { name: 'First Quarter',    symbol: '🌓' }
  if (f < 0.4375) return { name: 'Waxing Gibbous',   symbol: '🌔' }
  if (f < 0.5625) return { name: 'Full Moon',        symbol: '🌕' }
  if (f < 0.6875) return { name: 'Waning Gibbous',   symbol: '🌖' }
  if (f < 0.8125) return { name: 'Last Quarter',     symbol: '🌗' }
  return             { name: 'Waning Crescent',  symbol: '🌘' }
}
