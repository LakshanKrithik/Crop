# Farm Advisor Zero

AI-powered farm advisory system with computer vision and LLM capabilities for crop disease detection and recommendations.

## Project Structure

```
farm-advisor-zero/
│
├── frontend/              # Frontend UI
│   ├── index.html         # Main HTML page
│   ├── app.js             # Frontend application logic
│   ├── style.css          # Styles
│
├── vision/                # Computer Vision module
│   ├── vision.js          # Image analysis & model inference
│   ├── rules.js           # Rule-based detection logic
│
├── llm/                   # LLM Integration module
│   ├── llm.js             # LLM API interaction
│   ├── validate.js        # Response validation
│
├── data/                  # Static data files
│   ├── diseases.json      # Disease definitions & metadata
│   ├── label_map.json     # Label-to-class mapping
│
├── public/                # Public static assets
├── README.md
└── package.json
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000` in your browser.
