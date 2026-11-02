/**
 * mlClassifier.js
 * Production-ready Random Forest / Decision Tree Ensemble Classifier
 * for URL phishing detection.
 * Includes Gini impurity splitting, bagging, continuous probability prediction,
 * and JSON serialization for MongoDB persistence.
 */

import { FEATURE_NAMES } from './mlFeatureExtractor.js';

// Calculate Gini Impurity of a binary target array
function giniImpurity(labels) {
  if (labels.length === 0) return 0;
  let p1 = 0;
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] === 1) p1++;
  }
  const prob1 = p1 / labels.length;
  const prob0 = 1 - prob1;
  return 1 - (prob0 * prob0 + prob1 * prob1);
}

// Single Decision Tree Node
class DecisionTreeNode {
  constructor(depth = 0, maxDepth = 8) {
    this.depth = depth;
    this.maxDepth = maxDepth;
    this.featureIndex = null;
    this.threshold = null;
    this.left = null;
    this.right = null;
    this.prediction = 0; // Probability of class 1
    this.isLeaf = false;
  }

  train(X, y, featureSubsetSize) {
    const numSamples = X.length;
    const numFeatures = X[0].length;

    // Calculate leaf probability
    const positiveCount = y.reduce((acc, val) => acc + val, 0);
    this.prediction = positiveCount / numSamples;

    // Termination conditions
    if (this.depth >= this.maxDepth || numSamples <= 5 || this.prediction === 0 || this.prediction === 1) {
      this.isLeaf = true;
      return;
    }

    const currentGini = giniImpurity(y);
    let bestGain = 0;
    let bestFeature = null;
    let bestThreshold = null;
    let bestSplits = null;

    // Random feature subspacing
    const featureIndices = [];
    while (featureIndices.length < featureSubsetSize) {
      const idx = Math.floor(Math.random() * numFeatures);
      if (!featureIndices.includes(idx)) featureIndices.push(idx);
    }

    for (const fIdx of featureIndices) {
      // Sample candidate thresholds
      const values = X.map(row => row[fIdx]).sort((a, b) => a - b);
      const step = Math.max(1, Math.floor(values.length / 10));

      for (let i = step; i < values.length; i += step) {
        const threshold = values[i];

        const leftX = [], leftY = [];
        const rightX = [], rightY = [];

        for (let s = 0; s < numSamples; s++) {
          if (X[s][fIdx] <= threshold) {
            leftX.push(X[s]);
            leftY.push(y[s]);
          } else {
            rightX.push(X[s]);
            rightY.push(y[s]);
          }
        }

        if (leftY.length === 0 || rightY.length === 0) continue;

        const leftGini = giniImpurity(leftY);
        const rightGini = giniImpurity(rightY);
        const weightedGini = (leftY.length / numSamples) * leftGini + (rightY.length / numSamples) * rightGini;
        const gain = currentGini - weightedGini;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = fIdx;
          bestThreshold = threshold;
          bestSplits = { leftX, leftY, rightX, rightY };
        }
      }
    }

    if (bestGain <= 0.001 || !bestSplits) {
      this.isLeaf = true;
      return;
    }

    this.featureIndex = bestFeature;
    this.threshold = bestThreshold;

    this.left = new DecisionTreeNode(this.depth + 1, this.maxDepth);
    this.left.train(bestSplits.leftX, bestSplits.leftY, featureSubsetSize);

    this.right = new DecisionTreeNode(this.depth + 1, this.maxDepth);
    this.right.train(bestSplits.rightX, bestSplits.rightY, featureSubsetSize);
  }

  predict(x) {
    if (this.isLeaf) return this.prediction;
    if (x[this.featureIndex] <= this.threshold) {
      return this.left.predict(x);
    } else {
      return this.right.predict(x);
    }
  }

  toJSON() {
    if (this.isLeaf) {
      return { isLeaf: true, prediction: this.prediction };
    }
    return {
      isLeaf: false,
      featureIndex: this.featureIndex,
      threshold: this.threshold,
      left: this.left.toJSON(),
      right: this.right.toJSON()
    };
  }

  static fromJSON(json) {
    const node = new DecisionTreeNode();
    if (json.isLeaf) {
      node.isLeaf = true;
      node.prediction = json.prediction;
      return node;
    }
    node.isLeaf = false;
    node.featureIndex = json.featureIndex;
    node.threshold = json.threshold;
    node.left = DecisionTreeNode.fromJSON(json.left);
    node.right = DecisionTreeNode.fromJSON(json.right);
    return node;
  }
}

// Random Forest Ensemble
export class RandomForestModel {
  constructor(numTrees = 15, maxDepth = 7) {
    this.numTrees = numTrees;
    this.maxDepth = maxDepth;
    this.trees = [];
    this.featureImportances = {};
  }

  train(X, y) {
    const numSamples = X.length;
    const numFeatures = X[0].length;
    const featureSubsetSize = Math.max(2, Math.floor(Math.sqrt(numFeatures)));

    this.trees = [];

    for (let t = 0; t < this.numTrees; t++) {
      // Bootstrap sample (sampling with replacement)
      const bootX = [];
      const bootY = [];
      for (let i = 0; i < numSamples; i++) {
        const randIdx = Math.floor(Math.random() * numSamples);
        bootX.push(X[randIdx]);
        bootY.push(y[randIdx]);
      }

      const tree = new DecisionTreeNode(0, this.maxDepth);
      tree.train(bootX, bootY, featureSubsetSize);
      this.trees.push(tree);
    }

    this.computeFeatureImportances();
  }

  predictProbability(vector) {
    if (!this.trees || this.trees.length === 0) return 0.5;
    let sum = 0;
    for (const tree of this.trees) {
      sum += tree.predict(vector);
    }
    return Math.min(1, Math.max(0, sum / this.trees.length));
  }

  computeFeatureImportances() {
    const counts = {};
    for (let i = 0; i < FEATURE_NAMES.length; i++) {
      counts[FEATURE_NAMES[i]] = 0;
    }

    const traverse = (node) => {
      if (!node || node.isLeaf) return;
      const fName = FEATURE_NAMES[node.featureIndex];
      if (fName) counts[fName] = (counts[fName] || 0) + 1;
      traverse(node.left);
      traverse(node.right);
    };

    for (const tree of this.trees) {
      traverse(tree);
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    this.featureImportances = {};
    for (const f of FEATURE_NAMES) {
      this.featureImportances[f] = Math.round((counts[f] / total) * 1000) / 1000;
    }
  }

  toJSON() {
    return {
      numTrees: this.numTrees,
      maxDepth: this.maxDepth,
      featureNames: FEATURE_NAMES,
      featureImportances: this.featureImportances,
      trees: this.trees.map(t => t.toJSON())
    };
  }

  static fromJSON(json) {
    const model = new RandomForestModel(json.numTrees, json.maxDepth);
    model.featureImportances = json.featureImportances || {};
    model.trees = (json.trees || []).map(t => DecisionTreeNode.fromJSON(t));
    return model;
  }
}
