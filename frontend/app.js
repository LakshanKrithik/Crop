import { queryLLM } from "../llm/llm.js";

// UI Elements
const uploadContainer = document.getElementById("upload-container");
const fileInput = document.getElementById("file-input");
const browseText = document.getElementById("browse-text");
const progressContainer = document.getElementById("progress-container");
const resultsDashboard = document.getElementById("results-dashboard");
const errorContainer = document.getElementById("error-container");

// Load disease DB
let diseaseDB = {};
fetch("../data/diseases.json")
  .then(res => res.json())
  .then(data => diseaseDB = data);

// Helper to activate progress steps
function activateStep(stepId) {
  document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
  const step = document.getElementById(stepId);
  if (step) step.classList.add("active");
}

// Click events
browseText.addEventListener("click", (e) => {
  e.stopPropagation();
  fileInput.click();
});

uploadContainer.addEventListener("click", () => fileInput.click());

// Handle file upload
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 1. Prepare UI
  resultsDashboard.classList.add("hidden");
  errorContainer.classList.add("hidden");
  progressContainer.classList.remove("hidden");

  try {
    // 🧠 STEP 1: Image Received
    activateStep("step1");
    await new Promise(r => setTimeout(r, 800));

    // 🧠 STEP 2: Vision Model
    activateStep("step2");
    
    const formData = new FormData();
    formData.append("image", file);

    const visionRes = await fetch("/vision", {
      method: "POST",
      body: formData
    });

    if (!visionRes.ok) throw new Error("Vision analysis failed. Verify backend connection.");
    const detection = await visionRes.json();

    // 🧠 STEP 3: Mapping
    activateStep("step3");
    await new Promise(r => setTimeout(r, 1000));

    // 🧠 STEP 4: Advisory
    activateStep("step4");

    const llmResult = await queryLLM(detection, diseaseDB);

    if (!llmResult.success) {
      throw new Error(llmResult.error || "Advisory generation failed.");
    }

    const data = llmResult.advisory;

    // 🧠 FINISH: Render Results
    renderResults(data);

    // Scroll to results for smooth UX
    resultsDashboard.scrollIntoView({ behavior: 'smooth' });

    // 🔊 Tamil TTS
    speakTamil(data.advice);

  } catch (err) {
    console.error(err);
    showError(err.message);
  } finally {
    // Keep progress visible for a moment then hide
    await new Promise(r => setTimeout(r, 1000));
    progressContainer.classList.add("hidden");
  }
});

function renderResults(data) {
  const confidenceClass = data.confidence.toLowerCase();

  resultsDashboard.innerHTML = `
    <div class="result-card">
      <h2 class="section-title">🌾 Analysis Complete</h2>

      <p class="section-text">
        <strong>Diagnosis:</strong> ${data.diagnosis} 
        <span class="badge ${confidenceClass}">${data.confidence}</span>
      </p>

      <div class="advice-box">
        <h3>🧑‍🌾 Neural Advisory</h3>
        <p>${data.advice}</p>
      </div>

      <button class="dive-btn" style="margin-top: 30px; width: 100%;" onclick="location.reload()">New Analysis</button>
    </div>
  `;
  resultsDashboard.classList.remove("hidden");
}

function showError(msg) {
  errorContainer.innerHTML = `
    <div class="result-card" style="border-color: #ff4d4d; background: rgba(255, 77, 77, 0.1);">
      <h2 class="section-title" style="color: #ff4d4d;">❌ System Alert</h2>
      <p class="section-text">${msg}</p>
      <button class="dive-btn" onclick="location.reload()">Retry</button>
    </div>
  `;
  errorContainer.classList.remove("hidden");
  errorContainer.scrollIntoView({ behavior: 'smooth' });
}

// 🔊 Tamil Speech
function speakTamil(text) {
  if ('speechSynthesis' in window) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "ta-IN";
    speech.rate = 0.95;
    window.speechSynthesis.speak(speech);
  }
}

// Drag & Drop
uploadContainer.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadContainer.style.background = "rgba(255, 255, 255, 0.2)";
});

uploadContainer.addEventListener("dragleave", () => {
  uploadContainer.style.background = "rgba(255, 255, 255, 0.08)";
});

uploadContainer.addEventListener("drop", (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event('change'));
  }
});