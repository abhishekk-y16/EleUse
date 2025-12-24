import { NextResponse } from "next/server"

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes
const MAX_RETRIES = 3

type CacheEntry = { ts: number; status: number; body: any }
const cache = new Map<string, CacheEntry>()

function cacheKey(lat: string, lon: string) {
  // round to 4 decimals to reduce cache fragmentation
  const rlat = Number(lat).toFixed(4)
  const rlon = Number(lon).toFixed(4)
  return `${rlat},${rlon}`
}

async function fetchWithRetries(url: string, init: RequestInit) {
  let attempt = 0
  let lastRes: Response | null = null
  while (attempt <= MAX_RETRIES) {
    try {
      const res = await fetch(url, init)
      lastRes = res
      if (res.ok) return res
      if (res.status === 429) {
        attempt++
        const backoff = 500 * Math.pow(2, attempt - 1)
        await new Promise((r) => setTimeout(r, backoff))
        continue
      }
      return res
    } catch (err) {
      attempt++
      const backoff = 500 * Math.pow(2, attempt - 1)
      await new Promise((r) => setTimeout(r, backoff))
    }
  }
  return lastRes
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const lat = url.searchParams.get("lat")
    const lon = url.searchParams.get("lon")

    if (!lat || !lon) {
      return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 })
    }

    const key = cacheKey(lat, lon)
    const now = Date.now()

    // return cached when fresh
    const cached = cache.get(key)
    if (cached && now - cached.ts < CACHE_TTL_MS) {
      return NextResponse.json(cached.body, { status: cached.status })
    }

    const API_KEY = process.env.TOMORROW_IO_API_KEY

    const location = `${lat}, ${lon}`
    const fields = ["temperature", "humidity", "windSpeed", "precipitationProbability"]
    const timesteps = ["1h"]
    const units = "metric"

    if (API_KEY) {
      const params = new URLSearchParams({
        location,
        fields: fields.join(","),
        timesteps: timesteps.join(","),
        units,
        apikey: API_KEY,
      })

      const upstream = `https://api.tomorrow.io/v4/weather/forecast?${params.toString()}`

      const res = await fetchWithRetries(upstream, { method: "GET", headers: { Accept: "application/json" } })
      if (!res) {
        return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 })
      }

      const body = await res.json().catch(() => null)
      const status = res.status || 502

      // cache successful responses (2xx)
      if (status >= 200 && status < 300 && body) {
        cache.set(key, { ts: now, status, body })
      }

      return NextResponse.json(body, { status })
    }

    // Fallback: use Open-Meteo (no API key required) and normalize to timelines format
    try {
      const omParams = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        hourly: "temperature_2m,relativehumidity_2m,windspeed_10m,precipitation_probability",
        timezone: "UTC",
      })

      const omUrl = `https://api.open-meteo.com/v1/forecast?${omParams.toString()}`
      const omRes = await fetchWithRetries(omUrl, { method: "GET", headers: { Accept: "application/json" } })
      if (!omRes) return NextResponse.json({ error: "Open-Meteo fetch failed" }, { status: 502 })
      const omBody = await omRes.json().catch(() => null)

      // normalize
      const times: string[] = omBody?.hourly?.time || []
      const temps: number[] = omBody?.hourly?.temperature_2m || []
      const hums: number[] = omBody?.hourly?.relativehumidity_2m || []
      const winds: number[] = omBody?.hourly?.windspeed_10m || []
      const precs: number[] = omBody?.hourly?.precipitation_probability || []

      const intervals = times.map((t: string, i: number) => ({
        startTime: new Date(t).toISOString(),
        values: {
          temperature: temps[i] ?? null,
          humidity: hums[i] ?? null,
          windSpeed: winds[i] ?? null,
          precipitationProbability: precs[i] ?? null,
        },
      }))

      const body = {
        data: {
          timelines: [
            {
              timestep: "1h",
              intervals,
            },
          ],
        },
        location: {
          name: "Open-Meteo",
          lat: Number(lat),
          lon: Number(lon),
        },
      }

      cache.set(key, { ts: now, status: 200, body })
      return NextResponse.json(body, { status: 200 })
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
