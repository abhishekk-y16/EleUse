// Seasonal adjustment using decomposition

export interface SeasonalDecomposition {
  original: number[]
  trend: number[]
  seasonal: number[]
  residual: number[]
}

/**
 * Moving average for trend extraction
 */
export function movingAverage(data: number[], windowSize: number): number[] {
  const result: number[] = []

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2))
    const end = Math.min(data.length, i + Math.ceil(windowSize / 2))
    const window = data.slice(start, end)
    result.push(window.reduce((a, b) => a + b) / window.length)
  }

  return result
}

/**
 * Seasonal decomposition (additive model)
 */
export function seasonalDecompose(data: number[], period = 24): SeasonalDecomposition {
  // Extract trend using centered moving average
  const trend = movingAverage(data, period)

  // Extract seasonal component
  const detrended = data.map((val, i) => val - trend[i])
  const seasonal: number[] = new Array(data.length).fill(0)

  for (let i = 0; i < period; i++) {
    let sum = 0
    let count = 0
    for (let j = i; j < data.length; j += period) {
      sum += detrended[j]
      count++
    }
    const seasonalValue = sum / count
    for (let j = i; j < data.length; j += period) {
      seasonal[j] = seasonalValue
    }
  }

  // Extract residual
  const residual = data.map((val, i) => val - trend[i] - seasonal[i])

  return { original: data, trend, seasonal, residual }
}

/**
 * Recompose seasonally adjusted data
 */
export function seasonallyAdjustData(decomposition: SeasonalDecomposition): number[] {
  return decomposition.trend.map((t, i) => t + decomposition.residual[i])
}
