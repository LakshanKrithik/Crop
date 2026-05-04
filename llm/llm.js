import { validateResponse } from './validate.js';

export async function queryLLM(detection, diseaseDB) {
  const label = detection.final_disease;
  const confidence = detection.confidence_level;

  if (!label) {
    return {
      success: false,
      error: "No disease detected",
      advisory: null
    };
  }

  // 🔍 Get disease info from JSON
  const disease = diseaseDB.diseases.find(d => d.id === label);

  const info = disease
    ? `Symptoms: ${disease.symptoms}\nTreatment: ${disease.treatment}`
    : "No info available";

  // 🧠 Prompt (STRICT STRUCTURE)
  const prompt = `
You are a farming assistant.

Disease: ${label}
Confidence: ${confidence}

Info:
${info}

Return JSON:
{
 "diagnosis": "",
 "advice": "",
 "confidence": ""
}
`;

  try {
    // 🔥 OPTION 1: MOCK LLM (for demo)
    const rawOutput = JSON.stringify({
      diagnosis: label,
      advice: disease?.treatment || "Consult expert",
      confidence: confidence
    });

    // 🔥 OPTION 2: REAL LLM (later replace)
    /*
    const response = await fetch("YOUR_LLM_API", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    const rawOutput = data.output;
    */

    // ✅ Validate output
    const cleaned = validateResponse(rawOutput);

    return {
      success: true,
      advisory: cleaned
    };

  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}