export function validateResponse(raw) {
  try {
    const parsed = JSON.parse(raw);

    return {
      diagnosis: parsed.diagnosis || "Unknown",
      advice: parsed.advice || "No advice available",
      confidence: parsed.confidence || "low"
    };

  } catch (e) {
    // 🚨 fallback if JSON breaks
    return {
      diagnosis: "Unknown",
      advice: "System failed. Try again.",
      confidence: "low"
    };
  }
}