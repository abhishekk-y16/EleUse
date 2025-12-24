// Simplified Random Forest implementation for load forecasting

export interface DecisionTree {
  feature: string | null
  threshold?: number
  left?: DecisionTree
  right?: DecisionTree
  value?: number
}

export interface RandomForestModel {
  trees: DecisionTree[]
  featureNames: string[]
  predictions?: number[]
}

/**
 * Build a single decision tree node
 */
function buildTree(features: Record<string, number>[], targets: number[], maxDepth = 10, depth = 0): DecisionTree {
  if (targets.length === 0 || depth >= maxDepth) {
    return {
      feature: null,
      value: targets.length > 0 ? targets.reduce((a, b) => a + b) / targets.length : 0,
    }
  }

  // Check if all targets are the same (pure leaf)
  if (new Set(targets).size === 1) {
    return { feature: null, value: targets[0] }
  }

  let bestFeature = ""
  let bestThreshold = 0
  let bestGain = 0

  const featureNames = Object.keys(features[0])

  // Find best split
  featureNames.forEach((feature) => {
    const values = features.map((f) => f[feature])
    const sortedValues = [...new Set(values)].sort((a, b) => a - b)

    for (let i = 0; i < sortedValues.length - 1; i++) {
      const threshold = (sortedValues[i] + sortedValues[i + 1]) / 2

      const leftIndices = features.map((f, idx) => (f[feature] <= threshold ? idx : -1)).filter((idx) => idx !== -1)

      const leftTargets = leftIndices.map((idx) => targets[idx])
      const rightTargets = targets.map((_, idx) => (leftIndices.includes(idx) ? 0 : targets[idx])).filter((v) => v)

      if (leftTargets.length === 0 || rightTargets.length === 0) continue

      // Information gain using variance reduction
      const variance = (arr: number[]) => {
        const mean = arr.reduce((a, b) => a + b) / arr.length
        return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length
      }

      const totalVariance = variance(targets)
      const weightedVariance =
        (leftTargets.length * variance(leftTargets) + rightTargets.length * variance(rightTargets)) / targets.length

      const gain = totalVariance - weightedVariance

      if (gain > bestGain) {
        bestGain = gain
        bestFeature = feature
        bestThreshold = threshold
      }
    }
  })

  if (bestGain === 0) {
    return { feature: null, value: targets.reduce((a, b) => a + b) / targets.length }
  }

  // Split data
  const leftIndices = features.map((f, idx) => (f[bestFeature] <= bestThreshold ? idx : -1)).filter((idx) => idx !== -1)

  const leftFeatures = leftIndices.map((idx) => features[idx])
  const leftTargets = leftIndices.map((idx) => targets[idx])

  const rightIndices = features.map((f, idx) => (!leftIndices.includes(idx) ? idx : -1)).filter((idx) => idx !== -1)

  const rightFeatures = rightIndices.map((idx) => features[idx])
  const rightTargets = rightIndices.map((idx) => targets[idx])

  return {
    feature: bestFeature,
    threshold: bestThreshold,
    left: buildTree(leftFeatures, leftTargets, maxDepth, depth + 1),
    right: buildTree(rightFeatures, rightTargets, maxDepth, depth + 1),
  }
}

/**
 * Predict a single sample using tree
 */
function predictSample(sample: Record<string, number>, tree: DecisionTree): number {
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
 * Build Random Forest model
 */
export function buildRandomForest(
  features: Record<string, number>[],
  targets: number[],
  numTrees = 10,
): RandomForestModel {
  const trees: DecisionTree[] = []
  const n = features.length

  for (let t = 0; t < numTrees; t++) {
    const indices: number[] = []
    for (let i = 0; i < n; i++) {
      indices.push(Math.floor(Math.random() * n))
    }

    const bootstrapFeatures = indices.map((idx) => features[idx])
    const bootstrapTargets = indices.map((idx) => targets[idx])

    trees.push(buildTree(bootstrapFeatures, bootstrapTargets))
  }

  return {
    trees,
    featureNames: Object.keys(features[0]),
  }
}

/**
 * Make predictions with Random Forest
 */
export function predictRandomForest(samples: Record<string, number>[], model: RandomForestModel): number[] {
  return samples.map((sample) => {
    const predictions = model.trees.map((tree) => predictSample(sample, tree))
    return predictions.reduce((a, b) => a + b) / predictions.length
  })
}
