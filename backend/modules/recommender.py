"""
Recommendation Engine
Matches detected skin tone + undertone + user preferences to
the best foundation products from our curated database.
"""

import json
import os
from typing import List, Optional


class Recommender:
    def __init__(self):
        """Load product database from JSON file."""
        data_path = os.path.join(os.path.dirname(__file__), "..", "data", "products.json")
        with open(data_path, "r", encoding="utf-8") as f:
            self.products = json.load(f)

    def recommend(self, skin_data: dict, intent: dict, top_n: int = 5,
                  product_type: str = "foundation") -> List[dict]:
        """
        Find the best matching products.

        Args:
            skin_data: Output from SkinAnalyzer.analyze()
                       Contains: hex_color, luminance, undertone, shade_name
            intent: Output from IntentParser.parse()
                    Contains: occasion, look, coverage, finish
            product_type: Filter by product type (default "foundation")

        Returns:
            List of top N product matches with scores
        """
        luminance = skin_data.get("luminance", 150)
        undertone = skin_data.get("undertone", "neutral")

        scored_products = []

        filtered_products = [
            p for p in self.products
            if p.get("type", "foundation") == product_type
        ]

        for product in filtered_products:
            score = self._score_product(product, luminance, undertone, intent)
            if score > 0:
                scored_products.append({
                    **product,
                    "match_score": round(score, 1)
                })

        # Sort by match score (highest first)
        scored_products.sort(key=lambda x: x["match_score"], reverse=True)

        # Return top N
        results = scored_products[:top_n]

        # Add match percentage (normalize to 0-100) and ensure type is present
        if results:
            max_score = results[0]["match_score"]
            for product in results:
                product["match_percentage"] = round(
                    (product["match_score"] / max_score) * 100
                ) if max_score > 0 else 0
                if "type" not in product:
                    product["type"] = product_type

        return results

    def _score_product(self, product: dict, luminance: float,
                       undertone: str, intent: dict) -> float:
        """
        Score a product based on how well it matches.

        Scoring weights:
        - Shade match (luminance): 50 points max (most important)
        - Undertone match: 25 points max
        - Finish preference: 15 points max
        - Coverage preference: 10 points max
        """
        score = 0.0

        # 1. SHADE MATCH (50 points) — Most important
        lum_min, lum_max = product.get("luminance_range", [0, 255])
        lum_center = (lum_min + lum_max) / 2
        lum_range = (lum_max - lum_min) / 2

        if lum_min <= luminance <= lum_max:
            # Within range — high score
            # Closer to center = higher score
            distance = abs(luminance - lum_center)
            score += 50 - (distance / lum_range * 15)
        else:
            # Outside range — penalize based on distance
            if luminance < lum_min:
                distance = lum_min - luminance
            else:
                distance = luminance - lum_max
            # Allow some tolerance (within 15 units of range border)
            if distance <= 15:
                score += max(0, 35 - distance * 2)
            else:
                return 0  # Too far, skip this product

        # 2. UNDERTONE MATCH (25 points)
        product_undertones = product.get("undertone", [])
        if undertone in product_undertones:
            score += 25
        elif any(undertone.split("-")[0] in ut for ut in product_undertones):
            # Partial match (e.g., "neutral-warm" partially matches "warm")
            score += 15
        elif "neutral" in product_undertones:
            # Neutral products work for everyone
            score += 10

        # 3. FINISH PREFERENCE (15 points)
        preferred_finish = intent.get("finish", "satin")
        product_finish = product.get("finish", "satin")

        if product_finish == preferred_finish:
            score += 15
        elif preferred_finish == "satin":
            # Satin is a middle ground — partially matches everything
            score += 8
        else:
            score += 3

        # 4. COVERAGE PREFERENCE (10 points)
        preferred_coverage = intent.get("coverage", "medium")
        product_coverage = product.get("coverage", "medium")

        coverage_map = {"light": 1, "medium": 2, "full": 3}
        pref_level = coverage_map.get(preferred_coverage, 2)
        prod_level = coverage_map.get(product_coverage, 2)

        coverage_diff = abs(pref_level - prod_level)
        if coverage_diff == 0:
            score += 10
        elif coverage_diff == 1:
            score += 5
        else:
            score += 1

        # Budget boost — affordable products get a small bonus for college students
        price_str = product.get("price", "₹500")
        try:
            price = int(price_str.replace("₹", "").replace(",", ""))
            if price <= 350:
                score += 3  # Budget-friendly bonus
        except (ValueError, AttributeError):
            pass

        return score

    def get_shade_matches(self, luminance: float) -> List[dict]:
        """
        Get all products that match a given luminance, regardless of other preferences.
        Useful for showing "All shades in your range" section.
        """
        matches = []
        for product in self.products:
            lum_min, lum_max = product.get("luminance_range", [0, 255])
            if lum_min - 10 <= luminance <= lum_max + 10:
                matches.append(product)
        return matches
