// Thermal regime analysis (heating vs cooling)

export interface ThermalRegimeAnalysis {
  baseTemperature: number
  heatingCorrelation: number
  coolingCorrelation: number
  heatingSlope: number
  coolingSlope: number
  comfortZone: { min: number; max: number }
}

/**
 * Identify the optimal base temperature that minimizes model error
 * Tests a range of base temperatures and returns the one with best R-squared
 */
export function optimizeBaseTemperature(
  temperatures: number[],
  loads: number[],
  minTemp = 10,
  maxTemp = 25,
  step = 0.5,
): { baseTemp: number; rSquared: number } {
  let bestBaseTemp = minTemp
  let bestRSquared = Number.NEGATIVE_INFINITY

  for (let baseTemp = minTemp; baseTemp <= maxTemp; baseTemp += step) {
    const predicted = temperatures.map((temp) => {
      if (temp < baseTemp) {
        return 3000 - (baseTemp - temp) * 100
      } else {
        return 2000 + (temp - baseTemp) * 120
      }
    })

    const rSquared = calculateRSquared(loads, predicted)

    if (rSquared > bestRSquared) {
      bestRSquared = rSquared
      bestBaseTemp = baseTemp
    }
  }

  return { baseTemp: bestBaseTemp, rSquared: bestRSquared }
}

/**
 * Analyze temperature sensitivity in heating and cooling regimes separately
 */
export function analyzeRegimes(temperatures: number[], loads: number[], baseTemp: number): ThermalRegimeAnalysis {
  const heatingTemps: number[] = []
  const heatingLoads: number[] = []
  const coolingTemps: number[] = []
  const coolingLoads: number[] = []

  temperatures.forEach((temp, i) => {
    if (temp < baseTemp) {
      heatingTemps.push(temp)
      heatingLoads.push(loads[i])
    } else if (temp > baseTemp) {
      coolingTemps.push(temp)
      coolingLoads.push(loads[i])
    }
  })

  const heatingCorr = calculateCorrelation(heatingTemps, heatingLoads)
  const coolingCorr = calculateCorrelation(coolingTemps, coolingLoads)

  const heatingSlope = calculateSlope(heatingTemps, heatingLoads)
  const coolingSlope = calculateSlope(coolingTemps, coolingLoads)

  return {
    baseTemperature: baseTemp,
    heatingCorrelation: heatingCorr,
    coolingCorrelation: coolingCorr,
    heatingSlope,
    coolingSlope,
    comfortZone: {
      min: Math.min(...temperatures.filter((_, i) => loads[i] === Math.min(...loads))),
      max: Math.max(...temperatures.filter((_, i) => loads[i] === Math.min(...loads))),
    },
  }
}

/**
 * Calculate linear regression slope
 */
function calculateSlope(x: number[], y: number[]): number {
  if (x.length === 0) return 0

  let sumXY = 0
  let sumX = 0
  let sumX2 = 0
  let sumY = 0

  for (let i = 0; i < x.length; i++) {
    sumXY += x[i] * y[i]
    sumX += x[i]
    sumX2 += x[i] * x[i]
    sumY += y[i]
  }

  const n = x.length
  const numerator = n * sumXY - sumX * sumY
  const denominator = n * sumX2 - sumX * sumX

  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * Helper: Pearson correlation
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length === 0) return 0

  const n = x.length
  const mean_x = x.reduce((a, b) => a + b) / n
  const mean_y = y.reduce((a, b) => a + b) / n

  let numerator = 0
  let denomX = 0
  let denomY = 0

  for (let i = 0; i < n; i++) {
    const dx = x[i] - mean_x
    const dy = y[i] - mean_y
    numerator += dx * dy
    denomX += dx * dx
    denomY += dy * dy
  }

  return numerator / Math.sqrt(denomX * denomY)
}

/**
 * Helper: R-squared
 */
function calculateRSquared(actual: number[], predicted: number[]): number {
  const mean = actual.reduce((a, b) => a + b) / actual.length
  const ssTot = actual.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0)
  const ssRes = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0)

  return 1 - ssRes / ssTot
}
