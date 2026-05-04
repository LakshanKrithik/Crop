// Vision Module - Rule-based post-processing and validation

/**
 * Apply rule-based validation and refinement to raw predictions.
 * Checks for unrealistic confidence, adjusts based on color ratios,
 * and enriches with metadata.
 *
 * @param {Object} prediction - Raw prediction from the vision model.
 * @param {Object} colorProfile - Color analysis data.
 * @returns {Object} Validated and enriched detection result.
 */
export function applyRules(prediction, colorProfile) {
  const result = { ...prediction };
  const top = { ...result.topPrediction };

  // Rule 1: If image is overwhelmingly green (>50%), boost healthy confidence
  if (colorProfile.greenRatio > 0.50 && top.label !== 'healthy') {
    top.label = 'healthy';
    top.confidence = 0.85;
    result.ruleApplied = 'green_override';
  }

  // Rule 2: Reject very low confidence predictions
  if (top.confidence < 0.30) {
    top.label = 'uncertain';
    top.confidence = top.confidence;
    result.ruleApplied = 'low_confidence_flag';
  }

  // Rule 3: If brown + dark are both high, escalate to late blight
  if (colorProfile.brownRatio > 0.20 && colorProfile.darkRatio > 0.20) {
    if (!top.label.includes('late_blight')) {
      const lateBlight = result.allPredictions.find(p => p.label.includes('late_blight'));
      if (lateBlight) {
        top.label = lateBlight.label;
        top.confidence = Math.min(lateBlight.confidence + 0.10, 0.95);
        result.ruleApplied = 'blight_escalation';
      }
    }
  }

  // Rule 4: Add severity classification based on confidence
  if (top.confidence >= 0.85) {
    top.severityNote = 'High confidence detection — immediate action recommended';
  } else if (top.confidence >= 0.65) {
    top.severityNote = 'Moderate confidence — verify with closer inspection';
  } else {
    top.severityNote = 'Low confidence — consider retaking image in better conditions';
  }

  // Rule 5: Add image quality assessment
  const avgBrightness = (colorProfile.avgR + colorProfile.avgG + colorProfile.avgB) / 3;
  if (avgBrightness < 40) {
    result.imageQuality = 'poor';
    result.qualityNote = 'Image appears too dark. Try capturing in better lighting.';
  } else if (avgBrightness > 230) {
    result.imageQuality = 'poor';
    result.qualityNote = 'Image appears overexposed. Try capturing with less direct light.';
  } else {
    result.imageQuality = 'acceptable';
    result.qualityNote = null;
  }

  result.topPrediction = top;
  return result;
}
