// Statistical utilities for energy analysis

export interface CorrelationMatrix {
  temperature: number
  humidity: number
  windSpeed: number
  solarRadiation: number
}

/**
 * Calculate root mean square error (RMSE)
 */
export function calculateRMSE(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) return 0

  const sumSquaredErrors = actual.reduce((sum, actualVal, i) => {
    return sum + Math.pow(actualVal - predicted[i], 2)
  }, 0)

  return Math.sqrt(sumSquaredErrors / actual.length)
}

/**
 * Calculate mean absolute percentage error (MAPE)
 */
export function calculateMAPE(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) return 0

  const sumPercentageErrors = actual.reduce((sum, actualVal, i) => {
    if (actualVal === 0) return sum
    return sum + Math.abs((actualVal - predicted[i]) / actualVal)
  }, 0)

  return (sumPercentageErrors / actual.length) * 100
}

/**
 * Calculate R-squared (coefficient of determination)
 */
export function calculateRSquared(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) return 0

  const meanActual = actual.reduce((a, b) => a + b, 0) / actual.length
  const ssTot = actual.reduce((sum, val) => sum + Math.pow(val - meanActual, 2), 0)
  const ssRes = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0)

  return 1 - ssRes / ssTot
}

/**
 * Normalize values using min-max scaling
 */
export function minMaxNormalize(values: number[]): number[] {
  if (values.length === 0) return []

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min

  if (range === 0) return values.map(() => 0)

  return values.map((val) => (val - min) / range)
}

/**
 * Z-score standardization
 */
export function zScoreStandardize(values: number[]): number[] {
  if (values.length === 0) return []

  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) return values.map(() => 0)

  return values.map((val) => (val - mean) / stdDev)
}
