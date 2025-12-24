import type { NextRequest } from "next/server"
import { calculateDegreeDays } from "@/lib/analysis/degree-days"

export async function POST(request: NextRequest) {
  try {
    const { maxTemp, minTemp, baseTemp = 18.3 } = await request.json()

    if (typeof maxTemp !== "number" || typeof minTemp !== "number") {
      return Response.json({ error: "Invalid temperature values" }, { status: 400 })
    }

    const result = calculateDegreeDays(maxTemp, minTemp, {
      baseTemperature: baseTemp,
      unit: "celsius",
    })

    return Response.json({
      hdd: result.hdd,
      cdd: result.cdd,
      date: result.date,
      base_temperature: baseTemp,
    })
  } catch (error) {
    return Response.json({ error: "Calculation failed" }, { status: 500 })
  }
}
