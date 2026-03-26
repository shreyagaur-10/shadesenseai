"""
Shade Comparison Engine
Calculates Delta-E color differences between skin tone and product shades,
and finds color-close product dupes.
"""

import math
import numpy as np
import cv2


def _hex_to_lab(hex_color: str) -> tuple:
    """Convert a hex color string to CIE-LAB values."""
    hex_color = hex_color.lstrip("#")
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)

    pixel = np.array([[[b, g, r]]], dtype=np.uint8)
    lab = cv2.cvtColor(pixel, cv2.COLOR_BGR2LAB)
    L, a, b_val = lab[0][0].astype(float)
    # OpenCV LAB range: L: 0-255, a: 0-255, b: 0-255 (128 is zero)
    # Convert to standard LAB: L: 0-100, a: -128-127, b: -128-127
    L = L * 100.0 / 255.0
    a = a - 128.0
    b_val = b_val - 128.0
    return (L, a, b_val)


class ShadeComparator:
    def compare_shades(self, skin_hex: str, product_hexes: list) -> list:
        """
        Compare skin color against a list of product hex colors.

        Args:
            skin_hex: Skin hex color string (e.g. "#C8A07A")
            product_hexes: List of product hex color strings

        Returns:
            List of dicts with delta_e, match_quality, color_shift_description
        """
        skin_lab = _hex_to_lab(skin_hex)
        results = []

        for p_hex in product_hexes:
            p_lab = _hex_to_lab(p_hex)

            delta_e = math.sqrt(
                (skin_lab[0] - p_lab[0]) ** 2 +
                (skin_lab[1] - p_lab[1]) ** 2 +
                (skin_lab[2] - p_lab[2]) ** 2
            )

            match_quality = self._get_match_quality(delta_e)
            color_shift = self._get_color_shift(skin_lab, p_lab)

            results.append({
                "hex_color": p_hex,
                "delta_e": round(delta_e, 2),
                "match_quality": match_quality,
                "color_shift_description": color_shift,
            })

        return results

    def find_dupes(self, target_hex: str, all_products: list, max_delta_e: float = 8.0) -> list:
        """
        Find products that are color-close (dupes) to a given hex color.

        Args:
            target_hex: Target hex color to match against
            all_products: Full product list (each must have "hex_color" key)
            max_delta_e: Maximum Delta-E threshold for a dupe

        Returns:
            List of product dicts with delta_e and match_quality added, sorted by delta_e
        """
        target_lab = _hex_to_lab(target_hex)
        dupes = []

        for product in all_products:
            p_hex = product.get("hex_color", "")
            if not p_hex:
                continue

            p_lab = _hex_to_lab(p_hex)
            delta_e = math.sqrt(
                (target_lab[0] - p_lab[0]) ** 2 +
                (target_lab[1] - p_lab[1]) ** 2 +
                (target_lab[2] - p_lab[2]) ** 2
            )

            if delta_e <= max_delta_e:
                dupes.append({
                    **product,
                    "delta_e": round(delta_e, 2),
                    "match_quality": self._get_match_quality(delta_e),
                    "color_shift_description": self._get_color_shift(target_lab, p_lab),
                })

        dupes.sort(key=lambda x: x["delta_e"])
        return dupes

    def _get_match_quality(self, delta_e: float) -> str:
        if delta_e < 3:
            return "exact"
        elif delta_e < 6:
            return "great"
        elif delta_e < 10:
            return "good"
        elif delta_e < 15:
            return "fair"
        else:
            return "poor"

    def _get_color_shift(self, lab1: tuple, lab2: tuple) -> str:
        """Describe the color shift from lab1 (skin) to lab2 (product)."""
        dL = lab2[0] - lab1[0]
        da = lab2[1] - lab1[1]
        db = lab2[2] - lab1[2]

        total = math.sqrt(dL ** 2 + da ** 2 + db ** 2)

        if total < 3:
            return "nearly identical"

        # Determine the dominant shift
        abs_dL = abs(dL)
        abs_db = abs(db)

        # b-channel: positive = yellow (warm), negative = blue (cool)
        if abs_db > abs_dL and abs_db > abs(da):
            if db > 0:
                return "slightly warmer"
            else:
                return "slightly cooler"
        elif abs_dL > abs(da):
            if dL > 0:
                return "lighter"
            else:
                return "darker"
        else:
            if da > 0:
                return "slightly warmer"
            else:
                return "slightly cooler"
