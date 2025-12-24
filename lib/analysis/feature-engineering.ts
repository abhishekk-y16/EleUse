// Feature engineering for weather-load correlation models

export interface FeatureVector {
  temperature: number
  humidity: number
  thermalMomentum3h: number
  thermalMomentum24h: number
  hourOfDay: number
  dayOfWeek: number
  dayOfYear: number
  isBusinessHour: boolean
  isPeakHour: boolean
  isWeekend: boolean
  temperatureSin: number
  temperatureCos: number
  hourSin: number
  hourCos: number
  monthSin: number
  monthCos: number
}

/**
 * Calculate thermal momentum (rolling mean) to account for building thermal inertia
 */
export function calculateThermalMomentum(temperatures: number[], windowSize: number): number[] {
  const result: number[] = []

  for (let i = 0; i < temperatures.length; i++) {
    const start = Math.max(0, i - windowSize + 1)
    const window = temperatures.slice(start, i + 1)
    const average = window.reduce((a, b) => a + b, 0) / window.length
    result.push(average)
  }

  return result
}

/**
 * Cyclical encoding for temporal features using sine/cosine transformation
 * This ensures that hour 23 is adjacent to hour 0, and month 12 is adjacent to month 1
 */
export function cyclicalEncode(value: number, max: number): { sin: number; cos: number } {
  const radians = (2 * Math.PI * value) / max
  return {
    sin: Math.sin(radians),
    cos: Math.cos(radians),
  }
}

/**
 * Extract temporal features from a timestamp
 */
export function extractTemporalFeatures(date: Date) {
  const hour = date.getHours()
  const dayOfWeek = date.getDay()
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
  const month = date.getMonth() + 1

  return {
    hour,
    dayOfWeek,
    dayOfYear,
    month,
    isBusinessHour: hour >= 9 && hour <= 17,
    isPeakHour: [8, 12, 18].includes(hour),
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
  }
}

/**
 * Build complete feature vector for a single observation
 */
export function buildFeatureVector(
  temperature: number,
  humidity: number,
  thermalMom3h: number,
  thermalMom24h: number,
  date: Date,
): FeatureVector {
  const temporal = extractTemporalFeatures(date)
  const tempCyclical = cyclicalEncode(temperature, 50)
  const hourCyclical = cyclicalEncode(temporal.hour, 24)
  const monthCyclical = cyclicalEncode(temporal.month, 12)

  return {
    temperature,
    humidity,
    thermalMomentum3h: thermalMom3h,
    thermalMomentum24h: thermalMom24h,
    hourOfDay: temporal.hour,
    dayOfWeek: temporal.dayOfWeek,
    dayOfYear: temporal.dayOfYear,
    isBusinessHour: temporal.isBusinessHour ? 1 : 0,
    isPeakHour: temporal.isPeakHour ? 1 : 0,
    isWeekend: temporal.isWeekend ? 1 : 0,
    temperatureSin: tempCyclical.sin,
    temperatureCos: tempCyclical.cos,
    hourSin: hourCyclical.sin,
    hourCos: hourCyclical.cos,
    monthSin: monthCyclical.sin,
    monthCos: monthCyclical.cos,
  }
}

/**
 * Feature importance scoring based on mutual information
 */
export interface FeatureImportance {
  feature: keyof FeatureVector
  score: number
}

export function scoreFeatureImportance(features: FeatureVector[], targets: number[]): FeatureImportance[] {
  const keys = Object.keys(features[0]) as Array<keyof FeatureVector>
  const scores: FeatureImportance[] = []

  keys.forEach((key) => {
    const values = features.map((f) => f[key] as number)
    const correlation = calculateCorrelation(values, targets)
    scores.push({
      feature: key,
      score: Math.abs(correlation),
    })
  })

  return scores.sort((a, b) => b.score - a.score)
}

/**
 * Helper: Pearson correlation
 */
function calculateCorrelation(x: number[], y: number[]): number {
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
 * Normalize and scale features for ML model input
 */
export function normalizeFeatures(features: FeatureVector[]): { normalized: FeatureVector[]; scaler: any } {
  const keys = Object.keys(features[0]) as Array<keyof FeatureVector>
  const scaler: any = {}

  keys.forEach((key) => {
    const values = features.map((f) => f[key] as number)
    const min = Math.min(...values)
    const max = Math.max(...values)
    scaler[key] = { min, max, range: max - min }
  })

  const normalized = features.map((feature) => {
    const result: any = {}
    keys.forEach((key) => {
      const val = feature[key] as number
      const { min, range } = scaler[key]
      result[key] = range === 0 ? 0 : (val - min) / range
    })
    return result as FeatureVector
  })

  return { normalized, scaler }
}

/**
 * Detect anomalies using rolling standard deviation
 */
export function detectAnomalies(values: number[], windowSize = 24, threshold = 3): boolean[] {
  const anomalies: boolean[] = []

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize + 1)
    const window = values.slice(start, i + 1)
    const mean = window.reduce((a, b) => a + b, 0) / window.length
    const variance = window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length
    const stdDev = Math.sqrt(variance)

    const isAnomaly = Math.abs(values[i] - mean) > threshold * stdDev
    anomalies.push(isAnomaly)
  }

  return anomalies
}
