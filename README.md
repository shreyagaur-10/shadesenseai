# ShadeSense AI 🎨

AI-powered makeup shade recommendation system designed for Indian & South Asian skin tones. Upload a selfie, describe your vibe, and get personalized foundation, lipstick, blush, and concealer recommendations — powered by computer vision and machine learning.

![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- **📸 Selfie-Based Skin Analysis** — Upload a photo or use your camera; AI extracts your skin tone, undertone, and shade
- **🤖 ML Skin Tone Classification** — Trained SVM model predicts skin tone category (Black/Brown/White) with probability scores
- **🎯 Smart Shade Matching** — Matches your skin to the closest foundation shades from brands like Maybelline, Lakme, MAC, and more
- **💄 Multi-Product Recommendations** — Foundation, lipstick, blush, and concealer suggestions with match percentages
- **🪞 Virtual Try-On** — Preview makeup colors overlaid on your face in real time
- **👥 Party Mode (Multi-Face)** — Analyze multiple faces in a group photo
- **🌈 Color Harmony** — Personalized clothing, jewelry, and lip color recommendations based on your undertone
- **🩺 Skin Health Indicators** — Hydration estimate, evenness score, and skincare tips
- **💡 Style Tips** — Occasion-based makeup advice (wedding, everyday, glam, etc.)
- **🌙 Dark Mode** — Full dark mode support
- **📱 PWA Ready** — Installable as a mobile app

---

## 🏗️ Architecture

```
shadesenseai/
├── backend/                  # FastAPI server
│   ├── main.py               # API endpoints & pipeline orchestration
│   ├── requirements.txt      # Python dependencies
│   ├── render.yaml            # Render deployment config
│   ├── train_skin_model.py   # ML model training script
│   ├── data/
│   │   └── products.json     # Product catalog (50+ products)
│   ├── models/
│   │   ├── skin_tone_model.pkl      # Trained SVM model
│   │   └── model_metadata.json      # Training metrics
│   └── modules/
│       ├── face_detection.py     # Haar Cascade face & skin region detection
│       ├── lighting.py           # Lighting normalization (CLAHE)
│       ├── skin_analysis.py      # K-Means skin color + undertone classification
│       ├── skin_tone_model.py    # ML model inference wrapper
│       ├── intent_parser.py      # NLP-based user preference parsing
│       ├── recommender.py        # Product matching engine
│       ├── shade_comparison.py   # Delta-E shade comparison & dupe finder
│       ├── look_generator.py     # Complete look builder
│       └── virtual_tryon.py      # Makeup overlay rendering
├── frontend/                 # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.jsx               # Main app with state management
│   │   └── components/
│   │       ├── Hero.jsx          # Landing section
│   │       ├── ImageUpload.jsx   # Camera/file upload with drag-and-drop
│   │       ├── TextInput.jsx     # Preference input
│   │       ├── Results.jsx       # Results container
│   │       ├── ShadeCard.jsx     # Skin analysis + ML prediction display
│   │       ├── SkinToneViz.jsx   # Skin tone scale visualization
│   │       ├── SkinHealth.jsx    # Hydration & evenness dashboard
│   │       ├── ColorPalette.jsx  # Color harmony recommendations
│   │       ├── ProductCard.jsx   # Product recommendation cards
│   │       ├── LookGuide.jsx     # Complete look suggestions
│   │       ├── VirtualTryOn.jsx  # Try-on modal
│   │       ├── ShareCard.jsx     # Shareable results card
│   │       └── LoadingSpinner.jsx
│   └── vite.config.js        # Vite config with API proxy
└── dataset/                  # Training dataset (UTKFace subset)
    ├── Black/                # 500 face images
    ├── Brown/                # 500 face images
    └── White/                # 500 face images
```

---

## 🔬 How It Works

```
User Selfie → Face Detection (Haar Cascade) → Skin Region Extraction (cheeks + forehead)
    → Lighting Normalization (CLAHE) → Skin Pixel Filtering (HSV mask)
    → K-Means Dominant Color → ITA Angle + Undertone Classification (rule-based)
    → ML Skin Tone Prediction (trained SVM) → Product Matching → Recommendations
```

### Analysis Pipeline

| Step | Method | Output |
|------|--------|--------|
| Face Detection | OpenCV Haar Cascade (frontal + profile) | Face bounding box |
| Skin Sampling | Geometric region extraction (cheeks, forehead) | Skin pixel arrays |
| Lighting Fix | CLAHE histogram equalization | Normalized image |
| Dominant Color | K-Means clustering (k=3) | BGR color value |
| Shade Name | Luminance-based lookup (12 shade ranges) | e.g., "Golden Beige" |
| Undertone | RGB channel ratio analysis | warm / cool / neutral |
| ITA Angle | CIE-LAB arctan formula | Skin darkness category |
| ML Prediction | SVM on 39 color features | Black / Brown / White |
| Matching | Delta-E color distance + undertone filtering | Top 5 products |

### ML Model Details

| Property | Value |
|----------|-------|
| Algorithm | SVM (RBF kernel, C=10) |
| Features | 39 (RGB/HSV/LAB means, ITA, histograms, percentiles, channel ratios) |
| Training Data | 1,500 images (UTKFace subset — 500 per class) |
| Classes | Black, Brown, White |
| Test Accuracy | 71.3% |
| 5-Fold CV Accuracy | 69.5% |
| Direct Pixel Accuracy | ~88% |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+

### 1. Clone the Repository

```bash
git clone https://github.com/shreyagaur-10/shadesenseai.git
cd shadesenseai
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

#### Train the ML Model (optional — pre-trained model included)

```bash
python3 train_skin_model.py
```

#### Start the Backend

```bash
python3 main.py
```

Backend runs at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` (proxies API calls to backend)

### 4. Open the App

Visit **http://localhost:5173** in your browser, upload a selfie, and get your shade recommendations!

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/analyze` | Analyze a face image → shade + product recommendations |
| `POST` | `/api/analyze-multi` | Multi-face analysis (Party Mode) |
| `POST` | `/api/tryon` | Virtual try-on — overlay makeup color on face |
| `POST` | `/api/find-dupes` | Find color-similar product dupes |
| `GET` | `/api/products` | Full product catalog grouped by type |
| `POST` | `/api/color-palette` | Color harmony data from hex + undertone |

### Example: Analyze Endpoint

```bash
curl -X POST http://localhost:8000/api/analyze \
  -F "image=@selfie.jpg" \
  -F "text=wedding glam look" \
  -F "product_type=foundation"
```

**Response:**
```json
{
  "success": true,
  "skin_analysis": {
    "hex_color": "#c8a88e",
    "shade_name": "Sand Beige",
    "shade_code": "SB01",
    "undertone": "warm",
    "confidence": 0.85,
    "ita_angle": 35.2,
    "ita_category": "Intermediate",
    "ml_skin_tone": {
      "predicted_tone": "Brown",
      "confidence": 0.72,
      "probabilities": { "Black": 0.12, "Brown": 0.72, "White": 0.16 }
    }
  },
  "recommendations": [ ... ],
  "complete_look": { ... },
  "style_tips": [ ... ]
}
```

---

## 📦 Dataset

The training dataset is a curated subset of [UTKFace](https://www.kaggle.com/datasets/jangedoo/utkface-new/data), reorganized into 3 skin tone classes:

| Class | Images | Dominant Ethnicity | Age Range |
|-------|--------|-------------------|-----------|
| Black | 500 | Black (476) | 1–115 |
| Brown | 500 | Indian (360), Asian (46) | 1–116 |
| White | 500 | White (372), Asian (113) | 1–99 |

Images are 200×200 px cropped faces with filename encoding: `[age]_[gender]_[race]_[timestamp].jpg`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python, FastAPI, Uvicorn |
| **ML/CV** | OpenCV, scikit-learn (SVM, K-Means), NumPy |
| **Frontend** | React 18, Vite 6, Tailwind CSS 4 |
| **Deployment** | Render (backend), Vercel (frontend) |


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

<p align="center">Made with 💖 by ShadeSense AI<br><sub>AI-powered shade matching for Indian & South Asian skin tones</sub></p>
