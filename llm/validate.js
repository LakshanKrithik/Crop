// LLM Module - Response validation
// Validates advisory responses for completeness and safety.

/**
 * Validate the generated advisory response for completeness and correctness.
 * @param {Object} advisory - The generated advisory object.
 * @returns {Object} Validation result with `valid` boolean and optional `errors`.
 */
export function validateResponse(advisory) {
  const errors = [];

  if (!advisory) {
    return { valid: false, errors: ['Advisory is null or undefined'] };
  }

  // Check required fields
  if (!advisory.title || typeof advisory.title !== 'string') {
    errors.push('Missing or invalid title');
  }

  if (!advisory.summary || typeof advisory.summary !== 'string') {
    errors.push('Missing or invalid summary');
  }

  if (advisory.confidence === undefined || advisory.confidence === null) {
    errors.push('Missing confidence score');
  } else if (advisory.confidence < 0 || advisory.confidence > 1) {
    errors.push('Confidence score out of range [0, 1]');
  }

  if (!advisory.sections || !Array.isArray(advisory.sections)) {
    errors.push('Missing or invalid sections array');
  } else {
    // Validate each section
    advisory.sections.forEach((section, i) => {
      if (!section.heading) {
        errors.push(`Section ${i} missing heading`);
      }
      if (!section.points || !Array.isArray(section.points) || section.points.length === 0) {
        errors.push(`Section ${i} missing or empty points`);
      }
    });
  }

  // Check for valid severity
  const validSeverities = ['none', 'low', 'medium', 'high', 'critical'];
  if (advisory.severity && !validSeverities.includes(advisory.severity)) {
    errors.push(`Invalid severity level: ${advisory.severity}`);
  }

  // Safety check: ensure no harmful recommendations (basic keyword filter)
  const dangerousKeywords = ['poison', 'toxic to humans', 'drink', 'ingest pesticide'];
  const fullText = JSON.stringify(advisory).toLowerCase();
  for (const keyword of dangerousKeywords) {
    if (fullText.includes(keyword)) {
      errors.push(`Potentially unsafe content detected: "${keyword}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
