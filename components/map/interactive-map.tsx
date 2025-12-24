"use client"

import React, { useEffect, useState } from "react"
import { MapContainer, TileLayer, CircleMarker, Tooltip, ZoomControl } from "react-leaflet"

interface Region {
  id: string
  name: string
  lat: number
  lon: number
  avgTemp?: number | string
  avgLoad?: number | string
}

export function InteractiveMap({ regions, center }: { regions: Region[]; center?: [number, number] }) {
  const [layer, setLayer] = useState<"streets" | "satellite">("streets")

  useEffect(() => {
    // Add Leaflet CSS via CDN to avoid requiring global CSS imports in Next.js app router
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link")
      link.id = "leaflet-css"
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.3/dist/leaflet.css"
      document.head.appendChild(link)
    }
  }, [])

  const defaultCenter: [number, number] = regions.length ? [regions[0].lat, regions[0].lon] : [20, 0]
  const mapCenter = center || defaultCenter

  const tileProps = layer === "streets"
    ? { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "&copy; OpenStreetMap contributors" }
    : { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community" }

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setLayer("streets")}
          className={`px-3 py-1 rounded ${layer === "streets" ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
        >
          Streets
        </button>
        <button
          onClick={() => setLayer("satellite")}
          className={`px-3 py-1 rounded ${layer === "satellite" ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
        >
          Satellite
        </button>
      </div>

      <div className="h-64 md:h-96 rounded overflow-hidden">
        <MapContainer key={`${mapCenter[0]}-${mapCenter[1]}-${layer}`} center={mapCenter} zoom={6} style={{ height: "100%", width: "100%" }} zoomControl={false}>
          <ZoomControl position="topright" />
          <TileLayer url={tileProps.url} attribution={tileProps.attribution} />

          {regions.map((r) => (
            <CircleMarker
              key={r.id}
              center={[r.lat, r.lon]}
              radius={10}
              pathOptions={{ color: "#1f6feb", fillColor: "#1f6feb", fillOpacity: 0.6 }}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                <div className="text-sm">
                  <div className="font-semibold">{r.name}</div>
                  <div>Avg Temp: {r.avgTemp ?? "—"} °C</div>
                  <div>Avg Load: {r.avgLoad ?? "—"} kW</div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
