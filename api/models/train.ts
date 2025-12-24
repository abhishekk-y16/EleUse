// API endpoint for model training

import { trainModel } from "@/lib/models/training"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { features, targets, numTrees = 10 } = body

    if (!features || !targets || features.length !== targets.length) {
      return Response.json({ error: "Invalid training data" }, { status: 400 })
    }

    const trainedModel = trainModel(
      {
        features,
        targets,
      },
      numTrees,
    )

    return Response.json({
      success: true,
      model: trainedModel,
      message: "Model trained successfully",
    })
  } catch (error) {
    return Response.json({ error: "Training failed" }, { status: 500 })
  }
}
