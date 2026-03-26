"""
Face Detection Module
Uses MediaPipe to detect faces and extract skin regions (cheeks + forehead)
for skin tone analysis.
"""

import cv2
import numpy as np
import mediapipe as mp


class FaceDetector:
    def __init__(self):
        """Initialize MediaPipe Face Detection + Face Mesh for landmarks."""
        self.mp_face_detection = mp.solutions.face_detection
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=1,  # Full-range model (better for varied distances)
            min_detection_confidence=0.5
        )
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            min_detection_confidence=0.5
        )

    def detect_face(self, image: np.ndarray) -> dict:
        """
        Detect face in image and extract skin regions.

        Args:
            image: BGR image as numpy array

        Returns:
            dict with face_bbox, skin_regions, or error
        """
        h, w, _ = image.shape
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Step 1: Detect faces
        detection_results = self.face_detection.process(rgb_image)

        if not detection_results.detections:
            return {"error": "No face detected. Please upload a clear selfie with good lighting."}

        if len(detection_results.detections) > 1:
            return {"error": "Multiple faces detected. Please upload a photo with only one face."}

        # Step 2: Get face bounding box
        detection = detection_results.detections[0]
        bbox = detection.location_data.relative_bounding_box
        face_bbox = {
            "x": int(bbox.xmin * w),
            "y": int(bbox.ymin * h),
            "width": int(bbox.width * w),
            "height": int(bbox.height * h)
        }

        # Step 3: Use Face Mesh to get precise skin regions
        mesh_results = self.face_mesh.process(rgb_image)

        if not mesh_results.multi_face_landmarks:
            return {"error": "Could not analyze facial features. Please try a clearer photo."}

        landmarks = mesh_results.multi_face_landmarks[0]

        # Extract skin sampling regions (cheeks + forehead)
        skin_regions = self._extract_skin_regions(image, landmarks, w, h)

        return {
            "face_bbox": face_bbox,
            "skin_regions": skin_regions,
            "confidence": detection.score[0]
        }

    def _extract_skin_regions(self, image: np.ndarray, landmarks, w: int, h: int) -> dict:
        """
        Extract skin pixel samples from cheek and forehead regions using face landmarks.
        These regions typically have the most representative skin color.

        MediaPipe Face Mesh landmark indices:
        - Left cheek area: around landmarks 234, 93, 132
        - Right cheek area: around landmarks 454, 323, 361
        - Forehead area: around landmarks 10, 338, 297, 67, 109
        """
        skin_pixels = []

        # Region definitions: (center_landmark_idx, sample_radius_ratio)
        # We sample a small square around each landmark point
        regions = {
            "left_cheek": [234, 93, 132, 147, 187],
            "right_cheek": [454, 323, 361, 376, 411],
            "forehead": [10, 338, 297, 67, 109, 151]
        }

        region_pixels = {}

        for region_name, landmark_indices in regions.items():
            region_px = []
            for idx in landmark_indices:
                lm = landmarks.landmark[idx]
                cx, cy = int(lm.x * w), int(lm.y * h)

                # Sample a 10x10 pixel area around the landmark
                radius = 5
                y_start = max(0, cy - radius)
                y_end = min(h, cy + radius)
                x_start = max(0, cx - radius)
                x_end = min(w, cx + radius)

                patch = image[y_start:y_end, x_start:x_end]
                if patch.size > 0:
                    pixels = patch.reshape(-1, 3)
                    region_px.extend(pixels.tolist())
                    skin_pixels.extend(pixels.tolist())

            region_pixels[region_name] = region_px

        return {
            "all_pixels": skin_pixels,
            "regions": region_pixels,
            "total_samples": len(skin_pixels)
        }

    def __del__(self):
        """Clean up MediaPipe resources."""
        self.face_detection.close()
        self.face_mesh.close()
