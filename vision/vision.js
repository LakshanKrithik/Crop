// Vision Module - Image analysis & simulated model inference
// In production, this would connect to a TensorFlow.js or ONNX model.
// For now, it uses pixel-analysis heuristics to simulate detection.

import { applyRules } from './rules.js';

/**
 * Analyze an uploaded crop image for disease detection.
 * Uses canvas pixel analysis to produce a simulated prediction.
 * @param {File} imageFile - The uploaded image file.
 * @returns {Promise<Object>} Detection results with label, confidence, and metadata.
 */
export async function analyzeImage(imageFile) {
  const imageData = await extractImageData(imageFile);
  const colorProfile = analyzeColors(imageData);
  const rawPrediction = simulatePrediction(colorProfile);
  const validated = applyRules(rawPrediction, colorProfile);
  return validated;
}

/**
 * Load an image file into an offscreen canvas and extract pixel data.
 */
function extractImageData(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 224; // standard input size
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(data);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Analyze the color distribution of the image.
 * Returns average RGB, dominant hue ranges, and brownness/greenness scores.
 */
function analyzeColors(imageData) {
  const { data, width, height } = imageData;
  const totalPixels = width * height;

  let rTotal = 0, gTotal = 0, bTotal = 0;
  let brownCount = 0, greenCount = 0, yellowCount = 0, darkCount = 0, orangeCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    rTotal += r; gTotal += g; bTotal += b;

    // Heuristic color classification
    const brightness = (r + g + b) / 3;

    if (brightness < 60) darkCount++;
    if (r > 100 && g > 80 && b < 60 && r > g) brownCount++;
    if (g > 100 && g > r * 1.2 && g > b * 1.2) greenCount++;
    if (r > 150 && g > 150 && b < 80) yellowCount++;
    if (r > 160 && g > 80 && g < 140 && b < 80) orangeCount++;
  }

  return {
    avgR: rTotal / totalPixels,
    avgG: gTotal / totalPixels,
    avgB: bTotal / totalPixels,
    brownRatio: brownCount / totalPixels,
    greenRatio: greenCount / totalPixels,
    yellowRatio: yellowCount / totalPixels,
    darkRatio: darkCount / totalPixels,
    orangeRatio: orangeCount / totalPixels,
    totalPixels
  };
}

/**
 * Produce a simulated prediction based on color profile.
 * Maps color signatures to likely disease categories.
 */
function simulatePrediction(profile) {
  const { brownRatio, greenRatio, yellowRatio, darkRatio, orangeRatio } = profile;

  const candidates = [];

  // High green → likely healthy
  if (greenRatio > 0.35) {
    candidates.push({ label: 'healthy', confidence: 0.70 + greenRatio * 0.3 });
  }

  // Brown spots → blight / rot
  if (brownRatio > 0.15) {
    candidates.push({ label: 'tomato_early_blight', confidence: 0.55 + brownRatio * 0.8 });
    candidates.push({ label: 'potato_early_blight', confidence: 0.50 + brownRatio * 0.7 });
    candidates.push({ label: 'apple_black_rot', confidence: 0.45 + brownRatio * 0.6 });
  }

  // Dark patches → late blight / black rot
  if (darkRatio > 0.25) {
    candidates.push({ label: 'tomato_late_blight', confidence: 0.50 + darkRatio * 0.6 });
    candidates.push({ label: 'potato_late_blight', confidence: 0.48 + darkRatio * 0.55 });
    candidates.push({ label: 'grape_black_rot', confidence: 0.45 + darkRatio * 0.5 });
  }

  // Yellow/orange → rust / scab / leaf mold
  if (yellowRatio > 0.10) {
    candidates.push({ label: 'corn_common_rust', confidence: 0.50 + yellowRatio * 0.9 });
    candidates.push({ label: 'apple_scab', confidence: 0.45 + yellowRatio * 0.7 });
    candidates.push({ label: 'tomato_leaf_mold', confidence: 0.42 + yellowRatio * 0.6 });
  }

  if (orangeRatio > 0.08) {
    candidates.push({ label: 'apple_cedar_rust', confidence: 0.55 + orangeRatio * 1.0 });
    candidates.push({ label: 'wheat_rust', confidence: 0.50 + orangeRatio * 0.9 });
  }

  // Fallback
  if (candidates.length === 0) {
    candidates.push({ label: 'healthy', confidence: 0.60 });
  }

  // Sort by confidence descending, cap at 0.97
  candidates.sort((a, b) => b.confidence - a.confidence);
  const top = candidates.slice(0, 5).map(c => ({
    ...c,
    confidence: Math.min(c.confidence, 0.97)
  }));

  return {
    topPrediction: top[0],
    allPredictions: top,
    analysisTimestamp: new Date().toISOString()
  };
}
