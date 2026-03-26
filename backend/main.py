"""
ShadeSense AI — Backend API
FastAPI server that processes face images, detects skin tone + undertone,
and recommends matching foundation products.
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import numpy as np
import cv2
from PIL import Image
import io
import traceback

from modules.face_detection import FaceDetector
from modules.skin_analysis import SkinAnalyzer
from modules.intent_parser import IntentParser
from modules.recommender import Recommender

# ─── Initialize App ───────────────────────────────────────────────
app = FastAPI(
    title="ShadeSense AI",
    description="AI-powered makeup shade recommendation system",
    version="1.0.0"
)

# ─── CORS (allow frontend to call backend) ────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Initialize Modules ───────────────────────────────────────────
face_detector = FaceDetector()
skin_analyzer = SkinAnalyzer()
intent_parser = IntentParser()
recommender = Recommender()


# ─── Health Check ──────────────────────────────────────────────────
@app.get("/api/health")
async def health_check():
    """Health check endpoint for deployment monitoring."""
    return {"status": "ok", "service": "ShadeSense AI", "version": "1.0.0"}


# ─── Main Analysis Endpoint ───────────────────────────────────────
@app.post("/api/analyze")
async def analyze(
    image: UploadFile = File(..., description="Face selfie image"),
    text: str = Form(default="", description="User preferences text")
):
    """
    Main endpoint: Analyze a face image and return shade recommendations.

    Steps:
    1. Validate image
    2. Detect face
    3. Extract skin tone
    4. Parse user intent
    5. Generate recommendations
    """
    try:
        # Step 1: Validate & read image
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="Please upload a valid image file (JPEG, PNG, or WebP)."
            )

        # Read image bytes
        contents = await image.read()
        if len(contents) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(
                status_code=400,
                detail="Image is too large. Please upload an image under 10MB."
            )

        # Convert to numpy array (OpenCV format)
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(
                status_code=400,
                detail="Could not read the image. Please try a different file."
            )

        # Resize if too large (for speed)
        max_dim = 1024
        h, w = img.shape[:2]
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)))

        # Step 2: Detect face
        face_result = face_detector.detect_face(img)

        if "error" in face_result:
            return JSONResponse(
                status_code=200,
                content={
                    "success": False,
                    "error": face_result["error"]
                }
            )

        # Step 3: Analyze skin tone
        skin_pixels = face_result["skin_regions"]["all_pixels"]
        skin_data = skin_analyzer.analyze(skin_pixels)

        if "error" in skin_data:
            return JSONResponse(
                status_code=200,
                content={
                    "success": False,
                    "error": skin_data["error"]
                }
            )

        # Step 4: Parse user intent
        intent = intent_parser.parse(text)
        style_tips = intent_parser.get_style_tips(intent)

        # Step 5: Get product recommendations
        products = recommender.recommend(skin_data, intent, top_n=5)

        # Build response
        return {
            "success": True,
            "skin_analysis": {
                "hex_color": skin_data["hex_color"],
                "rgb": skin_data["rgb"],
                "shade_name": skin_data["shade_name"],
                "shade_code": skin_data["shade_code"],
                "undertone": skin_data["undertone"],
                "undertone_description": skin_data["undertone_description"],
                "confidence": skin_data["confidence"]
            },
            "intent": {
                "occasion": intent["occasion"],
                "look": intent["look"],
                "coverage": intent["coverage"],
                "finish": intent["finish"],
                "preferences_detected": intent["preferences_detected"]
            },
            "recommendations": [
                {
                    "id": p["id"],
                    "brand": p["brand"],
                    "line": p["line"],
                    "shade_code": p["shade_code"],
                    "shade_name": p["shade_name"],
                    "hex_color": p["hex_color"],
                    "finish": p["finish"],
                    "coverage": p["coverage"],
                    "price": p["price"],
                    "match_percentage": p["match_percentage"],
                    "image_url": p["image_url"],
                    "buy_url": p["buy_url"]
                }
                for p in products
            ],
            "style_tips": style_tips
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during analysis: {traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Something went wrong while analyzing your image. Please try again."
            }
        )


# ─── Run with Uvicorn ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
