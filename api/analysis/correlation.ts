import type { NextRequest } from "next/server"
import { calculateCorrelation } from "@/lib/analysis/degree-days"

export async function POST(request: NextRequest) {
  try {
    const { temperatures, loads } = await request.json()

    if (!temperatures || !loads || temperatures.length !== loads.length) {
      return Response.json({ error: "Invalid input data" }, { status: 400 })
    }

    const correlation = calculateCorrelation(temperatures, loads)

    return Response.json({
      correlation,
      strength: Math.abs(correlation) > 0.7 ? "strong" : Math.abs(correlation) > 0.4 ? "moderate" : "weak",
      direction: correlation > 0 ? "positive" : "negative",
    })
  } catch (error) {
    return Response.json({ error: "Analysis failed" }, { status: 500 })
  }
}
