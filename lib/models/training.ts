// Model training and validation pipeline

import { buildRandomForest, type RandomForestModel } from "./random-forest-predictor"
import { calculateRMSE, calculateMAPE, calculateRSquared } from "@/lib/analysis/statistics"

export interface TrainingData {
  features: Record<string, number>[]
  targets: number[]
}

export interface ModelMetrics {
  rmse: number
  mape: number
  rSquared: number
  trainTime: number
}

export interface TrainedModel {
  model: RandomForestModel
  metrics: ModelMetrics
  trainDate: string
}

/**
 * Train-test split following chronological order (no data leakage for time series)
 */
export function chronologicalSplit(
  features: Record<string, number>[],
  targets: number[],
  trainRatio = 0.7,
): {
  trainFeatures: Record<string, number>[]
  trainTargets: number[]
  testFeatures: Record<string, number>[]
  testTargets: number[]
} {
  const splitIdx = Math.floor(features.length * trainRatio)

  return {
    trainFeatures: features.slice(0, splitIdx),
    trainTargets: targets.slice(0, splitIdx),
    testFeatures: features.slice(splitIdx),
    testTargets: targets.slice(splitIdx),
  }
}

/**
 * Complete training pipeline
 */
export function trainModel(data: TrainingData, numTrees = 10): TrainedModel {
  const startTime = performance.now()

  // Chronological split
  const { trainFeatures, trainTargets, testFeatures, testTargets } = chronologicalSplit(
    data.features,
    data.targets,
    0.8,
  )

  // Train model
  const model = buildRandomForest(trainFeatures, trainTargets, numTrees)

  // Get predictions on test set
  const predictions = testFeatures.map((sample) => {
    const treePredictions = model.trees.map((tree) => predictSample(sample, tree))
    return treePredictions.reduce((a, b) => a + b) / treePredictions.length
  })

  // Calculate metrics
  const rmse = calculateRMSE(testTargets, predictions)
  const mape = calculateMAPE(testTargets, predictions)
  const rSquared = calculateRSquared(testTargets, predictions)

  const trainTime = performance.now() - startTime

  return {
    model,
    metrics: { rmse, mape, rSquared, trainTime },
    trainDate: new Date().toISOString(),
  }
}

/**
 * Cross-validation for model robustness (k-fold)
 */
export function kFoldCrossValidation(
  data: TrainingData,
  k = 5,
  numTrees = 10,
): { avgRMSE: number; avgMAPE: number; avgRSquared: number } {
  const foldSize = Math.floor(data.features.length / k)
  let totalRMSE = 0
  let totalMAPE = 0
  let totalRSquared = 0

  for (let fold = 0; fold < k; fold++) {
    const testStart = fold * foldSize
    const testEnd = fold === k - 1 ? data.features.length : (fold + 1) * foldSize

    const trainFeatures = [...data.features.slice(0, testStart), ...data.features.slice(testEnd)]
    const trainTargets = [...data.targets.slice(0, testStart), ...data.targets.slice(testEnd)]
    const testFeatures = data.features.slice(testStart, testEnd)
    const testTargets = data.targets.slice(testStart, testEnd)

    const model = buildRandomForest(trainFeatures, trainTargets, numTrees)

    const predictions = testFeatures.map((sample) => {
      const treePredictions = model.trees.map((tree) => predictSample(sample, tree))
      return treePredictions.reduce((a, b) => a + b) / treePredictions.length
    })

    totalRMSE += calculateRMSE(testTargets, predictions)
    totalMAPE += calculateMAPE(testTargets, predictions)
    totalRSquared += calculateRSquared(testTargets, predictions)
  }

  return {
    avgRMSE: totalRMSE / k,
    avgMAPE: totalMAPE / k,
    avgRSquared: totalRSquared / k,
  }
}

/**
 * Helper: Predict single sample through tree
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
 * Model persistence: Serialize to JSON for storage
 */
export function serializeModel(trainedModel: TrainedModel): string {
  return JSON.stringify(trainedModel, null, 2)
}

/**
 * Model persistence: Deserialize from JSON
 */
export function deserializeModel(json: string): TrainedModel {
  return JSON.parse(json)
}

/**
 * Hyperparameter optimization (grid search)
 */
export function gridSearchHyperparameters(
  data: TrainingData,
  numTreesOptions = [5, 10, 20, 50],
): { bestNumTrees: number; bestRSquared: number } {
  let bestNumTrees = numTreesOptions[0]
  let bestRSquared = Number.NEGATIVE_INFINITY

  numTreesOptions.forEach((numTrees) => {
    const cvResult = kFoldCrossValidation(data, 3, numTrees)
    if (cvResult.avgRSquared > bestRSquared) {
      bestRSquared = cvResult.avgRSquared
      bestNumTrees = numTrees
    }
  })

  return { bestNumTrees, bestRSquared }
}
