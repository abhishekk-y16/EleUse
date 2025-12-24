// API endpoint for predictions

import { makeForecast } from "@/lib/models/forecast-engine"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model, features, steps = 24 } = body

    if (!model || !features) {
      return Response.json({ error: "Missing model or features" }, { status: 400 })
    }

    const forecast = makeForecast(model, features, steps)

    return Response.json({
      success: true,
      forecast,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return Response.json({ error: "Prediction failed" }, { status: 500 })
  }
}
