"use client"

// This client-side module now calls the server-side proxy at /api/weather
// which hides the Tomorrow.io API key and implements caching/retries.

interface TomorrowIOCurrentWeather {
  data: {
    values: {
      temperature: number
      humidity: number
      windSpeed: number
      precipitation: number
    }
    location: {
      lat: number
      lon: number
    }
  }
}

interface TomorrowIOForecast {
  data: {
    timelines: Array<{
      timestep: string
      intervals: Array<{
        startTime: string
        values: {
          temperature: number
          humidity: number
          windSpeed: number
          precipitationProbability: number
        }
      }>
    }>
  }
}

export async function fetchWeatherData(lat: number, lon: number) {
  try {

    console.log("[v0] Fetching weather data via server proxy for coordinates:", lat, lon)
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon) })
    const url = `/api/weather?${params.toString()}`

    const forecastResponse = await fetch(url, { method: "GET", headers: { Accept: "application/json" } })
    console.log("[v0] Proxy response status:", forecastResponse.status)

    if (!forecastResponse.ok) {
      const errorText = await forecastResponse.text()
      console.log("[v0] Proxy error response:", forecastResponse.status, errorText)
      throw new Error(`Weather proxy error: ${forecastResponse.status}`)
    }

    const forecastData = await forecastResponse.json()

    console.log("[v0] Raw proxy response:", JSON.stringify(forecastData).substring(0, 1000))
    console.log("[v0] Response structure - Root keys:", Object.keys(forecastData || {}))

    // Check if response contains an error
    if (forecastData.errors) {
      console.error("[v0] API returned errors:", forecastData.errors)
      throw new Error(`Tomorrow.io API error: ${JSON.stringify(forecastData.errors)}`)
    }

    // Check if response has data object (expected structure)
    if (!forecastData?.data) {
      console.log("[v0] Response structure keys:", Object.keys(forecastData))
      console.log("[v0] Checking for alternative response structures...")

      // Check if the response itself contains timelines at root level
      // Some Tomorrow.io responses return `{ timelines: { hourly: [...] }, location: ... }`
      if (forecastData.timelines) {
        // Case: timelines is an object with keyed timelines (e.g., `hourly`)
          if (Array.isArray(forecastData.timelines.hourly)) {
            console.log("[v0] Found hourly timeline at root level")
            const intervals = forecastData.timelines.hourly.map((h: any) => ({
              startTime: h.time || h.startTime,
              values: h.values || h.values,
            }))
            const result = processIntervals(intervals)
            result.locationName = forecastData.location?.name || forecastData.location?.address || null
            return result
          }

        // Case: timelines is an array (older shape)
        if (Array.isArray(forecastData.timelines)) {
          console.log("[v0] Found timelines array at root level")
          const result = processIntervals(forecastData.timelines[0]?.intervals || [])
          result.locationName = forecastData.location?.name || forecastData.location?.address || null
          return result
        }
      }

      // Check if response is the intervals array directly
      if (Array.isArray(forecastData) && forecastData.length > 0) {
        console.log("[v0] Response is an array of intervals")
        const result = processIntervals(forecastData)
        result.locationName = null
        return result
      }

      console.error("[v0] Invalid response structure - cannot find data object or alternative structures")
      throw new Error("Invalid API response: missing data object")
    }

    const timelines = forecastData.data.timelines

    if (!Array.isArray(timelines)) {
      console.log("[v0] Timelines is not an array, checking data structure:")
      console.log("[v0] Available properties in data:", Object.keys(forecastData.data))

      if (forecastData.data.intervals && Array.isArray(forecastData.data.intervals)) {
        console.log("[v0] Found intervals directly in data object")
        const result = processIntervals(forecastData.data.intervals)
        result.locationName = forecastData.location?.name || forecastData.location?.address || null
        return result
      }

      throw new Error("Invalid API response: missing timelines array")
    }

    if (timelines.length === 0) {
      console.error("[v0] Invalid response structure: timelines array is empty")
      throw new Error("Invalid API response: empty timelines")
    }

    const hourlyTimeline = timelines.find((t: any) => t.timestep === "1h")
    if (!hourlyTimeline || !hourlyTimeline.intervals || hourlyTimeline.intervals.length === 0) {
      console.error("[v0] No hourly data found in response")
      throw new Error("No hourly timeline data in response")
    }

    return processIntervals(hourlyTimeline.intervals)
  } catch (error) {
    console.warn(
      "[v0] Tomorrow.io API fetch failed, using fallback data:",
      error instanceof Error ? error.message : String(error),
    )
    return generateFallbackWeatherData()
  }
}

function processIntervals(intervals: any[]) {
  console.log("[v0] Successfully parsed", intervals.length, "hourly intervals")

  // Extract current weather from first interval
  const currentValues = intervals[0]?.values || {
    temperature: 20,
    humidity: 60,
    windSpeed: 5,
    precipitationProbability: 0,
  }

  console.log("[v0] Current weather:", currentValues)
  console.log("[v0] Weather data fetched successfully from Tomorrow.io")

  return {
    temperature: Math.round(currentValues.temperature * 10) / 10,
    humidity: Math.round(currentValues.humidity || 60),
    windSpeed: Math.round(currentValues.windSpeed * 10) / 10,
    load: 2500 + Math.random() * 1000,
    correlation: 0.78,
    peakLoad: 3200,
    hourlyData: {
      time: intervals.map((i: any) => i.startTime),
      temperature_2m: intervals.map((i: any) => i.values.temperature),
      humidity_2m: intervals.map((i: any) => i.values.humidity),
      windSpeed: intervals.map((i: any) => i.values.windSpeed),
      precipitation: intervals.map((i: any) => i.values.precipitationProbability),
    },
    success: true,
    isFallback: false,
  }
}

export function generateFallbackWeatherData() {
  const now = new Date()
  const hour = now.getHours()
  const temperature = 15 + Math.sin((hour - 6) * (Math.PI / 12)) * 8 + (Math.random() - 0.5) * 3
  const humidity = 50 + Math.sin((hour - 12) * (Math.PI / 24)) * 20 + (Math.random() - 0.5) * 10

  return {
    temperature: Math.round(temperature * 10) / 10,
    humidity: Math.max(20, Math.min(95, Math.round(humidity))),
    windSpeed: 5 + (Math.random() - 0.5) * 4,
    load: 2500 + Math.random() * 1000,
    correlation: 0.78,
    peakLoad: 3200,
    hourlyData: {
      time: generateHourlyArray(),
      temperature_2m: generateTemperatureArray(),
      humidity_2m: generateHumidityArray(),
      windSpeed: generateWindSpeedArray(),
      precipitation: generatePrecipitationArray(),
    },
    success: false,
    isFallback: true,
  }
}

// Helper functions for fallback data
function generateHourlyArray() {
  const now = new Date()
  return Array.from({ length: 24 }, (_, i) => {
    const date = new Date(now)
    date.setHours(now.getHours() + i)
    return date.toISOString()
  })
}

function generateTemperatureArray() {
  const now = new Date()
  return Array.from({ length: 24 }, (_, i) => {
    const hour = (now.getHours() + i) % 24
    return 15 + Math.sin((hour - 6) * (Math.PI / 12)) * 8 + (Math.random() - 0.5) * 2
  })
}

function generateHumidityArray() {
  return Array.from({ length: 24 }, () => 50 + (Math.random() - 0.5) * 30)
}

function generateWindSpeedArray() {
  return Array.from({ length: 24 }, () => 5 + (Math.random() - 0.5) * 4)
}

function generatePrecipitationArray() {
  return Array.from({ length: 24 }, () => Math.random() * 50)
}

export function generateMockLoadData() {
  const now = new Date()
  return Array.from({ length: 24 }, (_, i) => {
    const hour = (now.getHours() + i) % 24
    // Diurnal pattern with morning and evening peaks
    const baseLoad = 2000 + Math.sin((hour - 6) * (Math.PI / 12)) * 800 + Math.random() * 300

    return {
      hour: `${String(hour).padStart(2, "0")}:00`,
      load: Math.max(1500, Math.round(baseLoad)),
      temp: 15 + Math.sin((hour - 6) * (Math.PI / 12)) * 8 + (Math.random() - 0.5) * 2,
    }
  })
}
