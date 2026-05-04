// LLM Module - Advisory generation using disease data
// Generates contextual farming advice based on detection results.
// In production, this would call an external LLM API (OpenAI, Gemini, etc.).

import { validateResponse } from './validate.js';

/**
 * Generate advisory text based on disease detection results.
 * Uses the diseases database to produce structured recommendations.
 *
 * @param {Object} detection - Detection result from vision module.
 * @param {Object} diseaseDB - Loaded diseases.json data.
 * @returns {Promise<Object>} Advisory response with recommendations.
 */
export async function queryLLM(detection, diseaseDB) {
  const label = detection.topPrediction?.label;
  const confidence = detection.topPrediction?.confidence;

  if (!label) {
    return {
      success: false,
      error: 'No detection label provided',
      advisory: null
    };
  }

  // Look up disease in database
  const diseaseKey = normalizeLabelToKey(label);
  const disease = diseaseDB.diseases?.find(d => d.id === diseaseKey);

  let advisory;

  if (label === 'healthy' || label.includes('healthy')) {
    advisory = generateHealthyAdvisory(confidence);
  } else if (label === 'uncertain') {
    advisory = generateUncertainAdvisory(detection);
  } else if (disease) {
    advisory = generateDiseaseAdvisory(disease, confidence, detection);
  } else {
    advisory = generateGenericAdvisory(label, confidence);
  }

  // Validate the response
  const validation = validateResponse(advisory);
  if (!validation.valid) {
    advisory.warnings = validation.errors;
  }

  return {
    success: true,
    advisory,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Normalize a prediction label to a disease database key.
 */
function normalizeLabelToKey(label) {
  return label.replace(/_healthy$/, 'healthy');
}

/**
 * Generate advisory for healthy plant detection.
 */
function generateHealthyAdvisory(confidence) {
  return {
    title: '✅ Healthy Plant Detected',
    summary: 'Your crop appears to be in good health. No signs of disease were detected in the image.',
    confidence: confidence,
    severity: 'none',
    sections: [
      {
        heading: '🌱 Maintenance Tips',
        points: [
          'Continue regular watering schedule appropriate for your crop and season.',
          'Monitor for early signs of pest activity — check leaf undersides weekly.',
          'Ensure balanced fertilization based on soil test results.',
          'Maintain proper plant spacing for good air circulation.',
          'Remove any weeds that compete for nutrients and harbor pests.'
        ]
      },
      {
        heading: '🛡️ Preventive Care',
        points: [
          'Apply preventive organic fungicides during humid periods.',
          'Rotate crops each season to break disease cycles.',
          'Keep tools and equipment clean to prevent pathogen spread.',
          'Inspect new transplants before introducing them to your field.'
        ]
      }
    ]
  };
}

/**
 * Generate advisory for uncertain detection.
 */
function generateUncertainAdvisory(detection) {
  return {
    title: '⚠️ Uncertain Detection',
    summary: 'The analysis could not determine a confident diagnosis. This may be due to image quality or an uncommon condition.',
    confidence: detection.topPrediction?.confidence || 0,
    severity: 'low',
    sections: [
      {
        heading: '📸 Improve Your Results',
        points: [
          'Retake the photo in natural daylight, avoiding shadows.',
          'Focus on a single affected leaf or area.',
          'Ensure the image is sharp and well-lit.',
          'Include both healthy and affected parts for comparison.',
          'Try capturing from multiple angles.'
        ]
      },
      {
        heading: '👨‍🌾 Next Steps',
        points: [
          'Consult a local agricultural extension officer for in-person assessment.',
          'Take samples of affected tissue for laboratory analysis.',
          'Monitor the area daily for any progression of symptoms.'
        ]
      }
    ]
  };
}

/**
 * Generate advisory for a specific detected disease.
 */
function generateDiseaseAdvisory(disease, confidence, detection) {
  const urgency = getUrgencyLevel(disease.severity);

  return {
    title: `${urgency.icon} ${disease.name} Detected`,
    summary: `Analysis indicates ${disease.name} in your ${disease.crop.toLowerCase()} crop with ${(confidence * 100).toFixed(0)}% confidence. ${disease.symptoms}`,
    confidence: confidence,
    severity: disease.severity,
    diseaseName: disease.name,
    crop: disease.crop,
    sections: [
      {
        heading: '🔬 Diagnosis Details',
        points: [
          `Disease: ${disease.name}`,
          `Affected Crop: ${disease.crop}`,
          `Pathogen: ${disease.cause}`,
          `Severity Level: ${urgency.label}`,
          `Detection Confidence: ${(confidence * 100).toFixed(1)}%`
        ]
      },
      {
        heading: '🩺 Symptoms to Verify',
        points: [
          disease.symptoms,
          'Compare the detected symptoms with your plant\'s actual condition.',
          'Check neighboring plants for similar signs of infection.'
        ]
      },
      {
        heading: `💊 Recommended Treatment`,
        points: [
          disease.treatment,
          'Follow product label instructions carefully for dosage and timing.',
          'Wear appropriate protective equipment when applying treatments.',
          'Re-examine plants 7-10 days after treatment.'
        ]
      },
      {
        heading: '🛡️ Prevention Measures',
        points: [
          disease.prevention,
          'Implement integrated pest management (IPM) practices.',
          'Keep detailed records of disease occurrences for future planning.'
        ]
      },
      ...(detection.qualityNote ? [{
        heading: '📸 Image Quality Note',
        points: [detection.qualityNote]
      }] : [])
    ]
  };
}

/**
 * Fallback advisory for unrecognized labels.
 */
function generateGenericAdvisory(label, confidence) {
  return {
    title: '🔍 Possible Issue Detected',
    summary: `A potential issue ("${label.replace(/_/g, ' ')}") was detected with ${(confidence * 100).toFixed(0)}% confidence. Further investigation is recommended.`,
    confidence: confidence,
    severity: 'medium',
    sections: [
      {
        heading: '👨‍🌾 Recommended Actions',
        points: [
          'Consult a local agricultural extension service for expert diagnosis.',
          'Take multiple clear photos from different angles for comparison.',
          'Collect affected plant tissue samples for laboratory testing.',
          'Isolate severely affected plants to prevent potential spread.',
          'Document the progression of symptoms over several days.'
        ]
      }
    ]
  };
}

/**
 * Map severity string to urgency metadata.
 */
function getUrgencyLevel(severity) {
  const levels = {
    none: { icon: '✅', label: 'Healthy', priority: 0 },
    low: { icon: '💚', label: 'Low Risk', priority: 1 },
    medium: { icon: '🟡', label: 'Moderate Risk', priority: 2 },
    high: { icon: '🟠', label: 'High Risk — Act Soon', priority: 3 },
    critical: { icon: '🔴', label: 'Critical — Immediate Action Required', priority: 4 }
  };
  return levels[severity] || levels.medium;
}
