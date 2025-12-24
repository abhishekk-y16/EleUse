// Forecasting engine for multi-step predictions

export interface ForecastResult {
  timestamp: string
  predicted: number
  confidence: number
  lowerBound: number
  upperBound: number
}

/**
 * Make multi-step forecasts with uncertainty quantification
 */
export function makeForecast(model: any, currentFeatures: Record<string, number>[], steps = 24): ForecastResult[] {
  const forecast: ForecastResult[] = []
  const features = [...currentFeatures]

  for (let step = 0; step < steps; step++) {
    const lastFeature = features[features.length - 1]
    const treePredictions = model.trees.map((tree: any) => predictSample(lastFeature, tree))
    const meanPrediction = treePredictions.reduce((a: number, b: number) => a + b) / treePredictions.length
    const variance = treePredictions.reduce((sum: number, pred: number) => sum + Math.pow(pred - meanPrediction, 2), 0)
    const stdDev = Math.sqrt(variance / treePredictions.length)

    const timestamp = new Date(Date.now() + step * 3600000).toISOString()

    forecast.push({
      timestamp,
      predicted: meanPrediction,
      confidence: 1 - stdDev / meanPrediction, // Inverse of normalized std dev
      lowerBound: meanPrediction - 1.96 * stdDev,
      upperBound: meanPrediction + 1.96 * stdDev,
    })

    // Update features for next step (rolling forward with mock temp update)
    const updatedFeature = { ...lastFeature }
    updatedFeature.temperature += (Math.random() - 0.5) * 0.5 // Small random walk
    features.push(updatedFeature)
  }

  return forecast
}

/**
 * Helper: Tree prediction
 */
function predictSample(sample: Record<string, number>, tree: any): number {
  if (tree.feature === null) {
    return tree.value ?? 0
  }

  const value = sample[tree.feature]
  const threshold = tree.threshold ?? 0

  if (value <= threshold) {
    return tree.left ? predictSample(sample, tree.left) : (tree.value ?? 0)
  } else {
    return tree.right ? predictSample(sample, tree.right) : (tree.value ?? 0)
  }
}

/**
 * Calculate forecast accuracy metrics
 */
export function evaluateForecastAccuracy(
  actual: number[],
  predicted: number[],
  confidenceBounds: { lower: number; upper: number }[],
): {
  mape: number
  rmse: number
  picp: number // Prediction interval coverage probability
} {
  let mape = 0
  let rmse = 0
  let coverage = 0

  for (let i = 0; i < actual.length; i++) {
    mape += Math.abs((actual[i] - predicted[i]) / actual[i])
    rmse += Math.pow(actual[i] - predicted[i], 2)

    if (actual[i] >= confidenceBounds[i].lower && actual[i] <= confidenceBounds[i].upper) {
      coverage++
    }
  }

  return {
    mape: (mape / actual.length) * 100,
    rmse: Math.sqrt(rmse / actual.length),
    picp: coverage / actual.length,
  }
}
