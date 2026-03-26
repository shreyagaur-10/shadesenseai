"""
Skin Analysis Module
Extracts dominant skin color using K-Means clustering and classifies
the undertone as warm, cool, or neutral.
"""

import numpy as np
from sklearn.cluster import KMeans


# Shade name mapping — covers the full range of Indian/South Asian skin tones
SHADE_RANGES = [
    {"name": "Porcelain Ivory", "range": (220, 255), "code": "IV01"},
    {"name": "Fair Ivory", "range": (200, 220), "code": "IV02"},
    {"name": "Light Beige", "range": (185, 200), "code": "LB01"},
    {"name": "Natural Beige", "range": (170, 185), "code": "NB01"},
    {"name": "Sand Beige", "range": (155, 170), "code": "SB01"},
    {"name": "Golden Beige", "range": (140, 155), "code": "GB01"},
    {"name": "Warm Honey", "range": (125, 140), "code": "WH01"},
    {"name": "Caramel", "range": (110, 125), "code": "CR01"},
    {"name": "Warm Almond", "range": (95, 110), "code": "WA01"},
    {"name": "Rich Mocha", "range": (80, 95), "code": "RM01"},
    {"name": "Deep Espresso", "range": (60, 80), "code": "DE01"},
    {"name": "Deep Mahogany", "range": (0, 60), "code": "DM01"},
]


class SkinAnalyzer:
    def __init__(self):
        pass

    def analyze(self, skin_pixels: list) -> dict:
        """
        Analyze skin pixels to determine skin tone and undertone.

        Args:
            skin_pixels: List of [B, G, R] pixel values from face regions

        Returns:
            dict with hex_color, shade_name, undertone, confidence
        """
        if not skin_pixels or len(skin_pixels) < 10:
            return {"error": "Not enough skin pixels to analyze. Please try a clearer photo."}

        pixels = np.array(skin_pixels, dtype=np.float32)

        # Step 1: Filter out non-skin pixels (too dark/bright or saturated)
        filtered = self._filter_skin_pixels(pixels)

        if len(filtered) < 10:
            return {"error": "Could not isolate skin area. Please try a photo with better lighting."}

        # Step 2: K-Means clustering to find dominant skin color
        dominant_color = self._find_dominant_color(filtered)

        # dominant_color is in BGR format (from OpenCV)
        b, g, r = dominant_color

        # Step 3: Determine shade name
        # Use luminance as the primary selector
        luminance = 0.299 * r + 0.587 * g + 0.114 * b
        shade_info = self._get_shade_name(luminance)

        # Step 4: Classify undertone
        undertone = self._classify_undertone(r, g, b)

        # Step 5: Convert to hex
        hex_color = "#{:02x}{:02x}{:02x}".format(int(r), int(g), int(b))

        return {
            "hex_color": hex_color,
            "rgb": {"r": int(r), "g": int(g), "b": int(b)},
            "shade_name": shade_info["name"],
            "shade_code": shade_info["code"],
            "undertone": undertone["type"],
            "undertone_description": undertone["description"],
            "luminance": round(float(luminance), 1),
            "confidence": round(undertone["confidence"], 2)
        }

    def _filter_skin_pixels(self, pixels: np.ndarray) -> np.ndarray:
        """
        Filter pixels to keep only likely skin-colored ones.
        Removes very dark shadows, bright highlights, and non-skin colors.
        """
        # Convert BGR to HSV for better skin detection
        # Reshape for OpenCV conversion
        import cv2

        pixel_img = pixels.reshape(1, -1, 3).astype(np.uint8)
        hsv = cv2.cvtColor(pixel_img, cv2.COLOR_BGR2HSV).reshape(-1, 3)

        # Skin color ranges in HSV
        # Hue: 0-50 (red-yellow range covers most skin tones)
        # Saturation: 20-200 (avoid very grey or very saturated)
        # Value: 50-250 (avoid very dark shadows and blown-out highlights)
        mask = (
            (hsv[:, 0] <= 50) &
            (hsv[:, 1] >= 20) & (hsv[:, 1] <= 200) &
            (hsv[:, 2] >= 50) & (hsv[:, 2] <= 250)
        )

        filtered = pixels[mask]
        return filtered if len(filtered) >= 10 else pixels

    def _find_dominant_color(self, pixels: np.ndarray) -> tuple:
        """
        Use K-Means clustering to find the dominant skin color.
        We use k=3 to separate skin from minor shadows/highlights,
        then pick the cluster closest to typical skin color.
        """
        k = min(3, len(pixels))
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(pixels)

        # Find the largest cluster — most likely the dominant skin tone
        labels, counts = np.unique(kmeans.labels_, return_counts=True)
        dominant_idx = labels[np.argmax(counts)]
        dominant = kmeans.cluster_centers_[dominant_idx]

        return tuple(dominant)

    def _get_shade_name(self, luminance: float) -> dict:
        """Map luminance value to a shade name."""
        for shade in SHADE_RANGES:
            low, high = shade["range"]
            if low <= luminance < high:
                return {"name": shade["name"], "code": shade["code"]}

        # Default fallback
        if luminance >= 255:
            return {"name": SHADE_RANGES[0]["name"], "code": SHADE_RANGES[0]["code"]}
        return {"name": SHADE_RANGES[-1]["name"], "code": SHADE_RANGES[-1]["code"]}

    def _classify_undertone(self, r: float, g: float, b: float) -> dict:
        """
        Classify undertone as warm, cool, or neutral based on RGB channel ratios.

        Warm: Higher red/yellow — R > B, and green is relatively high
        Cool: Higher blue/pink — B >= R, or strong pink hue
        Neutral: Balanced — R and B are close together
        """
        # Calculate ratios
        rb_ratio = r / (b + 1e-6)  # Avoid division by zero
        rg_ratio = r / (g + 1e-6)

        # Calculate the difference between R and B channels
        rb_diff = abs(r - b)
        total = r + g + b + 1e-6

        # Normalized channel proportions
        r_prop = r / total
        b_prop = b / total

        # Classification logic
        confidence = 0.0

        if rb_diff < 15:
            # R and B are very close → Neutral
            undertone_type = "neutral"
            description = "Your skin has a balanced undertone — neither warm nor cool. You can wear both gold and silver jewelry."
            confidence = 0.7 + (15 - rb_diff) / 15 * 0.3

        elif r > b and rb_ratio > 1.1:
            # Significantly more red → Warm
            undertone_type = "warm"
            description = "Your skin has warm, golden-yellow undertones. Gold jewelry and earthy tones complement you best."
            confidence = min(0.95, 0.6 + (rb_ratio - 1.0) * 0.3)

        elif b >= r and rb_ratio < 0.95:
            # More blue → Cool
            undertone_type = "cool"
            description = "Your skin has cool, pink-blue undertones. Silver jewelry and jewel tones look great on you."
            confidence = min(0.95, 0.6 + (1.0 / rb_ratio - 1.0) * 0.3)

        else:
            # Slight lean but not definitive → Neutral-leaning
            if r > b:
                undertone_type = "neutral-warm"
                description = "Your skin has a neutral-warm undertone — slightly golden. Both warm and neutral shades work well."
            else:
                undertone_type = "neutral-cool"
                description = "Your skin has a neutral-cool undertone — slightly pink. Both cool and neutral shades work well."
            confidence = 0.6

        return {
            "type": undertone_type,
            "description": description,
            "confidence": confidence
        }
