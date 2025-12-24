// Degree Day Calculations

export interface DegreeDayConfig {
  baseTemperature: number // Typically 65°F or 18.3°C
  unit: "celsius" | "fahrenheit"
}

export interface DegreeDayResult {
  hdd: number // Heating Degree Days
  cdd: number // Cooling Degree Days
  date: string
}

/**
 * Calculate Heating and Cooling Degree Days
 * HDD = max(T_base - avg_temp, 0)
 * CDD = max(avg_temp - T_base, 0)
 */
export function calculateDegreeDays(maxTemp: number, minTemp: number, config: DegreeDayConfig): DegreeDayResult {
  const avgTemp = (maxTemp + minTemp) / 2
  const baseTemp = config.baseTemperature

  const hdd = Math.max(baseTemp - avgTemp, 0)
  const cdd = Math.max(avgTemp - baseTemp, 0)

  return {
    hdd,
    cdd,
    date: new Date().toISOString().split("T")[0],
  }
}

/**
 * Calculate Pearson correlation coefficient
 */
export function calculateCorrelation(temperatures: number[], loads: number[]): number {
  if (temperatures.length !== loads.length || temperatures.length === 0) {
    return 0
  }

  const n = temperatures.length
  const tempMean = temperatures.reduce((a, b) => a + b, 0) / n
  const loadMean = loads.reduce((a, b) => a + b, 0) / n

  let numerator = 0
  let denomTempSum = 0
  let denomLoadSum = 0

  for (let i = 0; i < n; i++) {
    const tempDev = temperatures[i] - tempMean
    const loadDev = loads[i] - loadMean
    numerator += tempDev * loadDev
    denomTempSum += tempDev * tempDev
    denomLoadSum += loadDev * loadDev
  }

  const denominator = Math.sqrt(denomTempSum * denomLoadSum)
  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * Thermal elasticity: kWh increase per degree change
 */
export function calculateThermalElasticity(temperatures: number[], loads: number[]): number {
  if (temperatures.length < 2) return 0

  let sumXY = 0
  let sumX = 0
  let sumX2 = 0

  temperatures.forEach((temp, i) => {
    sumXY += temp * loads[i]
    sumX += temp
    sumX2 += temp * temp
  })

  const n = temperatures.length
  const slope = (n * sumXY - sumX * loads.reduce((a, b) => a + b, 0)) / (n * sumX2 - sumX * sumX)

  return slope
}
