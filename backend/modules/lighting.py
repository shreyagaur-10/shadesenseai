"""
Lighting Normalization Module
Auto white-balance correction (gray-world algorithm) and histogram
equalization in LAB color space for consistent brightness.
"""

import cv2
import numpy as np


def normalize_lighting(image: np.ndarray) -> np.ndarray:
    """
    Normalize lighting in a BGR image.

    Steps:
    1. Gray-world white-balance correction
    2. CLAHE histogram equalization on the L channel in LAB space

    Args:
        image: BGR image as numpy array

    Returns:
        Corrected BGR image as numpy array
    """
    corrected = _gray_world_white_balance(image)
    corrected = _lab_histogram_equalization(corrected)
    return corrected


def _gray_world_white_balance(image: np.ndarray) -> np.ndarray:
    """
    Apply gray-world algorithm: scale each channel so its mean
    equals the overall mean across all channels.
    """
    img = image.astype(np.float32)
    avg_b = np.mean(img[:, :, 0])
    avg_g = np.mean(img[:, :, 1])
    avg_r = np.mean(img[:, :, 2])
    overall_avg = (avg_b + avg_g + avg_r) / 3.0

    img[:, :, 0] *= overall_avg / (avg_b + 1e-6)
    img[:, :, 1] *= overall_avg / (avg_g + 1e-6)
    img[:, :, 2] *= overall_avg / (avg_r + 1e-6)

    return np.clip(img, 0, 255).astype(np.uint8)


def _lab_histogram_equalization(image: np.ndarray) -> np.ndarray:
    """
    Convert to LAB, apply CLAHE on the L channel for consistent
    brightness, then convert back to BGR.
    """
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)

    lab = cv2.merge([l, a, b])
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
