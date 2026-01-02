"use client"

import React, { useEffect, useState } from "react"
import { fetchWeatherData, generateMockLoadData } from "@/lib/api/weather"
import { calculateDegreeDays } from "@/lib/analysis/degree-days"
import { HeatmapChart } from "@/components/charts/heatmap-chart"
import dynamic from "next/dynamic"
const InteractiveMap = dynamic(() => import("@/components/map/interactive-map").then((mod) => mod.InteractiveMap), { ssr: false })
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const REGIONS = [
  { id: "nyc", name: "New York, NY", lat: 40.7128, lon: -74.006 },
  { id: "chi", name: "Chicago, IL", lat: 41.8781, lon: -87.6298 },
  { id: "la", name: "Los Angeles, CA", lat: 34.0522, lon: -118.2437 },
  { id: "mia", name: "Miami, FL", lat: 25.7617, lon: -80.1918 },
]

export default function GeographicDataPage() {
  const [regionsData, setRegionsData] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])

  useEffect(() => {
    let mounted = true

    const loadRegions = async () => {
      try {
        const promises = REGIONS.map(async (r) => {
          const w = await fetchWeatherData(r.lat, r.lon)
          const loads = generateMockLoadData()
          const temps = w.hourlyData?.temperature_2m || []
          const avgTemp = temps.length ? (temps.reduce((a: number, b: number) => a + b, 0) / temps.length).toFixed(1) : "—"
          const avgLoad = loads.length ? Math.round(loads.reduce((a, b) => a + b.load, 0) / loads.length) : "—"
          const maxT = temps.length ? Math.max(...temps) : null
          const minT = temps.length ? Math.min(...temps) : null
          const dd = maxT !== null ? calculateDegreeDays(maxT, minT, { baseTemperature: 18.3, unit: "celsius" }) : null
          return {
            id: r.id,
            name: r.name,
            avgTemp,
            avgLoad,
            hdd: dd ? Number(dd.hdd.toFixed(2)) : null,
            cdd: dd ? Number(dd.cdd.toFixed(2)) : null,
            source: w.isFallback ? "fallback" : "tomorrow.io",
          }
        })

        const results = await Promise.all(promises)
        if (mounted) setRegionsData(results)
      } catch (error) {
        console.warn("Failed to load regional data", error)
      }
    }

    // try to get user's current position
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude
          const lon = pos.coords.longitude
          try {
            const w = await fetchWeatherData(lat, lon)
            const loads = generateMockLoadData()
            const temps = w.hourlyData?.temperature_2m || []
            const avgTemp = temps.length ? (temps.reduce((a: number, b: number) => a + b, 0) / temps.length).toFixed(1) : "—"
            const avgLoad = loads.length ? Math.round(loads.reduce((a, b) => a + b.load, 0) / loads.length) : "—"
            const maxT = temps.length ? Math.max(...temps) : null
            const minT = temps.length ? Math.min(...temps) : null
            const dd = maxT !== null ? calculateDegreeDays(maxT, minT, { baseTemperature: 18.3, unit: "celsius" }) : null

            // Try reverse geocoding via Nominatim to get a friendly place name
            let placeName = w.locationName || "Current Location"
            try {
              const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
              const revJson = await rev.json()
              if (revJson && revJson.display_name) placeName = revJson.display_name
            } catch (ge) {
              // ignore reverse geocode errors, keep existing name
            }

            const currentRegion = {
              id: "current",
              name: placeName,
              lat,
              lon,
              avgTemp,
              avgLoad,
              hdd: dd ? Number(dd.hdd.toFixed(2)) : null,
              cdd: dd ? Number(dd.cdd.toFixed(2)) : null,
              source: w.isFallback ? "fallback" : "tomorrow.io",
            }
            if (mounted) {
              setSelected(currentRegion)
              setRegionsData((prev) => [currentRegion, ...prev.filter((r) => r.id !== "current")])
            }
          } catch (e) {
            console.warn("Failed to fetch Weather for current location", e)
          }
        },
        (err) => console.warn("Geolocation Error", err),
      )
    }

    loadRegions()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Geographic Data</h1>
      {selected && selected.id === "current" && (
        <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
          <div className="flex items-baseline gap-2">
            <span className="text-sm">Current Location:</span>
            <strong>{selected.name || "Current Location"}</strong>
          </div>
          {selected.lat !== undefined && selected.lon !== undefined && (
            <div className="text-xs text-muted-foreground mt-1">
              Latitude: {Number(selected.lat).toFixed(4)} — Longitude: {Number(selected.lon).toFixed(4)}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 items-center">
        <Input placeholder="Search place (city, address)" value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)} />
        <Button onClick={async () => {
          if (!searchQuery) return
          try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`)
            const results = await resp.json()
            setSearchResults(results || [])
          } catch (e) {
            console.warn("Search failed", e)
          }
        }}>Search</Button>
        <Button onClick={() => {
          // clear selection
          setSelected(null)
        }}>Clear</Button>
      </div>

      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {searchResults.map((s: any, idx: number) => (
            <Card key={idx} className="cursor-pointer" onClick={async () => {
              const lat = Number(s.lat)
              const lon = Number(s.lon)
              try {
                const w = await fetchWeatherData(lat, lon)
                const loads = generateMockLoadData()
                const temps = w.hourlyData?.temperature_2m || []
                const avgTemp = temps.length ? (temps.reduce((a: number, b: number) => a + b, 0) / temps.length).toFixed(1) : "—"
                const avgLoad = loads.length ? Math.round(loads.reduce((a, b) => a + b.load, 0) / loads.length) : "—"
                const maxT = temps.length ? Math.max(...temps) : null
                const minT = temps.length ? Math.min(...temps) : null
                const dd = maxT !== null ? calculateDegreeDays(maxT, minT, { baseTemperature: 18.3, unit: "celsius" }) : null
                const region = {
                  id: `search-${idx}`,
                  name: s.display_name,
                  lat,
                  lon,
                  avgTemp,
                  avgLoad,
                  hdd: dd ? Number(dd.hdd.toFixed(2)) : null,
                  cdd: dd ? Number(dd.cdd.toFixed(2)) : null,
                  source: w.isFallback ? "fallback" : "tomorrow.io",
                }
                setSelected(region)
                setRegionsData((prev) => [region, ...prev.filter((r) => r.id !== region.id)])
                setSearchResults([])
              } catch (e) {
                console.warn("Failed to load place data", e)
              }
            }}>
              <CardHeader>
                <CardTitle className="text-sm">{s.display_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Lat: {s.lat} Lon: {s.lon}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {regionsData.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle>{r.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p>Avg Temp (24h): <strong>{r.avgTemp} °C</strong></p>
                <p>Avg Load: <strong>{r.avgLoad} kW</strong></p>
                <p>HDD: <strong>{r.hdd ?? "—"}</strong></p>
                <p>CDD: <strong>{r.cdd ?? "—"}</strong></p>
                <p className="text-xs text-muted-foreground">Data source: {r.source}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Regional Load Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <HeatmapChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spatial Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Interactive regional map — zoom and hover markers for details.</p>
            <div className="mt-4">
                <InteractiveMap
                  center={selected ? [selected.lat, selected.lon] : undefined}
                  regions={regionsData.map((r) => {
                    const ref = REGIONS.find((x) => x.id === r.id)
                    return {
                      id: r.id,
                      name: r.name,
                      lat: ref?.lat || r.lat || 0,
                      lon: ref?.lon || r.lon || 0,
                      avgTemp: r.avgTemp,
                      avgLoad: r.avgLoad,
                    }
                  })}
                />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

