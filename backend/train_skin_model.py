"""
Train a skin tone classification model using the UTKFace-based dataset.

Dataset structure:
    dataset/
        Black/   (500 images)
        Brown/   (500 images)
        White/   (500 images)

Features extracted per image:
    - Mean LAB (L, a, b) values from skin-filtered pixels
    - Mean HSV (H, S, V) values
    - Mean RGB (R, G, B) values
    - ITA angle
    - Color channel std devs
    - R/B ratio, R/G ratio

Model: SVM with RBF kernel (works well with small datasets + color features)
Output: backend/models/skin_tone_model.pkl
"""

import os
import sys
import math
import json
import pickle
import numpy as np
import cv2
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix

# Paths
DATASET_DIR = os.path.join(os.path.dirname(__file__), "..", "dataset")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "skin_tone_model.pkl")

CLASSES = ["Black", "Brown", "White"]


def filter_skin_pixels(pixels):
    """Filter pixels to keep only likely skin-colored ones using HSV ranges."""
    pixel_img = pixels.reshape(1, -1, 3).astype(np.uint8)
    hsv = cv2.cvtColor(pixel_img, cv2.COLOR_BGR2HSV).reshape(-1, 3)

    mask = (
        (hsv[:, 0] <= 50) &
        (hsv[:, 1] >= 15) & (hsv[:, 1] <= 220) &
        (hsv[:, 2] >= 40) & (hsv[:, 2] <= 250)
    )

    filtered = pixels[mask]
    return filtered if len(filtered) >= 10 else pixels


def extract_features(img):
    """
    Extract color-based features from a face image.
    Includes multi-region sampling, percentile features, and color histograms.
    """
    h, w = img.shape[:2]

    # Sample from multiple face regions for robustness
    regions = [
        img[int(h*0.1):int(h*0.35), int(w*0.25):int(w*0.75)],   # forehead
        img[int(h*0.4):int(h*0.7), int(w*0.05):int(w*0.35)],    # left cheek
        img[int(h*0.4):int(h*0.7), int(w*0.65):int(w*0.95)],    # right cheek
        img[int(h*0.15):int(h*0.85), int(w*0.15):int(w*0.85)],  # center face
    ]

    all_pixels = []
    for region in regions:
        if region.size > 0:
            all_pixels.append(region.reshape(-1, 3).astype(np.float32))

    if not all_pixels:
        return None

    pixels = np.vstack(all_pixels)
    filtered = filter_skin_pixels(pixels)

    if len(filtered) < 10:
        return None

    # Convert to different color spaces
    pixel_img = filtered.reshape(1, -1, 3).astype(np.uint8)
    hsv = cv2.cvtColor(pixel_img, cv2.COLOR_BGR2HSV).reshape(-1, 3).astype(np.float32)
    lab = cv2.cvtColor(pixel_img, cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32)

    # Mean BGR
    mean_b, mean_g, mean_r = filtered.mean(axis=0)

    # Mean HSV
    mean_h, mean_s, mean_v = hsv.mean(axis=0)

    # Mean LAB (convert to standard scale)
    mean_L = lab[:, 0].mean() * 100.0 / 255.0
    mean_a = lab[:, 1].mean() - 128.0
    mean_lab_b = lab[:, 2].mean() - 128.0

    # ITA angle
    b_val = mean_lab_b if abs(mean_lab_b) > 1e-6 else 1e-6
    ita = math.atan2(mean_L - 50, b_val) * (180.0 / math.pi)

    # Luminance
    luminance = 0.299 * mean_r + 0.587 * mean_g + 0.114 * mean_b

    # Channel ratios
    rb_ratio = mean_r / (mean_b + 1e-6)
    rg_ratio = mean_r / (mean_g + 1e-6)
    gb_ratio = mean_g / (mean_b + 1e-6)

    # Std deviations (capture color variation)
    std_l = float(np.std(lab[:, 0]))
    std_a = float(np.std(lab[:, 1]))
    std_lab_b = float(np.std(lab[:, 2]))
    std_s = float(np.std(hsv[:, 1]))
    std_v = float(np.std(hsv[:, 2]))

    # Percentile features (robust to outliers)
    L_vals = lab[:, 0] * 100.0 / 255.0
    p10_L = float(np.percentile(L_vals, 10))
    p90_L = float(np.percentile(L_vals, 90))
    median_L = float(np.median(L_vals))
    p25_v = float(np.percentile(hsv[:, 2], 25))
    p75_v = float(np.percentile(hsv[:, 2], 75))

    # Color histogram features (compact representation)
    l_hist = np.histogram(L_vals, bins=8, range=(0, 100))[0].astype(float)
    l_hist = l_hist / (l_hist.sum() + 1e-6)

    s_hist = np.histogram(hsv[:, 1], bins=6, range=(0, 255))[0].astype(float)
    s_hist = s_hist / (s_hist.sum() + 1e-6)

    features = [
        mean_r, mean_g, mean_b,                 # 3: RGB means
        mean_h, mean_s, mean_v,                  # 3: HSV means
        mean_L, mean_a, mean_lab_b,              # 3: LAB means
        ita,                                     # 1: ITA angle
        luminance,                               # 1: Luminance
        rb_ratio, rg_ratio, gb_ratio,            # 3: Channel ratios
        std_l, std_a, std_lab_b, std_s, std_v,   # 5: Std deviations
        p10_L, median_L, p90_L,                  # 3: L percentiles
        p25_v, p75_v,                            # 2: V percentiles
        float(len(filtered)) / len(pixels),      # 1: Skin pixel ratio
    ]
    features.extend(l_hist.tolist())              # 8: L histogram
    features.extend(s_hist.tolist())              # 6: S histogram

    return np.array(features, dtype=np.float64)


def load_dataset():
    """Load all images and extract features."""
    features = []
    labels = []
    skipped = 0

    for class_name in CLASSES:
        class_dir = os.path.join(DATASET_DIR, class_name)
        if not os.path.isdir(class_dir):
            print(f"  WARNING: {class_dir} not found, skipping")
            continue

        files = [f for f in os.listdir(class_dir) if f.endswith(('.jpg', '.jpeg', '.png'))]
        print(f"  Processing {class_name}: {len(files)} images...")

        for fname in files:
            img = cv2.imread(os.path.join(class_dir, fname))
            if img is None:
                skipped += 1
                continue

            feat = extract_features(img)
            if feat is not None:
                features.append(feat)
                labels.append(class_name)
            else:
                skipped += 1

    print(f"  Loaded {len(features)} samples, skipped {skipped}")
    return np.array(features), np.array(labels)


def train():
    """Train the skin tone classification model."""
    print("=" * 60)
    print("ShadeSense AI — Skin Tone Model Training")
    print("=" * 60)

    # Load data
    print("\n[1/4] Loading dataset and extracting features...")
    X, y = load_dataset()

    if len(X) == 0:
        print("ERROR: No valid samples found. Check dataset path.")
        sys.exit(1)

    # Encode labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    print(f"  Classes: {list(label_encoder.classes_)}")
    print(f"  Total samples: {len(X)}")
    for cls in CLASSES:
        print(f"    {cls}: {sum(y == cls)}")

    # Split data
    print("\n[2/4] Splitting into train/test (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    print(f"  Train: {len(X_train)}, Test: {len(X_test)}")

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train SVM
    print("\n[3/4] Training SVM classifier...")
    svm_model = SVC(kernel='rbf', C=10, gamma='scale', probability=True, random_state=42)
    svm_model.fit(X_train_scaled, y_train)

    # Train Random Forest for comparison
    rf_model = RandomForestClassifier(n_estimators=200, max_depth=15, random_state=42)
    rf_model.fit(X_train_scaled, y_train)

    # Evaluate both
    svm_acc = svm_model.score(X_test_scaled, y_test)
    rf_acc = rf_model.score(X_test_scaled, y_test)
    print(f"\n  SVM Accuracy:           {svm_acc:.4f}")
    print(f"  Random Forest Accuracy: {rf_acc:.4f}")

    # Cross-validation on best model
    best_model = svm_model if svm_acc >= rf_acc else rf_model
    best_name = "SVM" if svm_acc >= rf_acc else "RandomForest"
    print(f"\n  Best model: {best_name}")

    cv_scores = cross_val_score(best_model, scaler.transform(X), y_encoded, cv=5, scoring='accuracy')
    print(f"  5-Fold CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # Detailed report
    y_pred = best_model.predict(X_test_scaled)
    print(f"\n  Classification Report ({best_name}):")
    print(classification_report(
        y_test, y_pred,
        target_names=label_encoder.classes_
    ))

    print("  Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"  {'':>8} ", "  ".join(f"{c:>6}" for c in label_encoder.classes_))
    for i, row in enumerate(cm):
        print(f"  {label_encoder.classes_[i]:>8}  ", "  ".join(f"{v:>6}" for v in row))

    # Save model
    print(f"\n[4/4] Saving model to {MODEL_PATH}...")
    os.makedirs(MODEL_DIR, exist_ok=True)

    model_data = {
        "model": best_model,
        "scaler": scaler,
        "label_encoder": label_encoder,
        "model_type": best_name,
        "accuracy": float(max(svm_acc, rf_acc)),
        "cv_accuracy": float(cv_scores.mean()),
        "feature_names": [
            "mean_r", "mean_g", "mean_b",
            "mean_h", "mean_s", "mean_v",
            "mean_L", "mean_a", "mean_lab_b",
            "ita", "luminance",
            "rb_ratio", "rg_ratio",
            "std_l", "std_s",
            "skin_pixel_ratio"
        ],
        "classes": list(label_encoder.classes_),
    }

    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model_data, f)

    # Also save a metadata JSON for reference
    meta = {
        "model_type": best_name,
        "accuracy": float(max(svm_acc, rf_acc)),
        "cv_accuracy": float(cv_scores.mean()),
        "classes": list(label_encoder.classes_),
        "feature_count": X.shape[1],
        "training_samples": len(X),
    }
    with open(os.path.join(MODEL_DIR, "model_metadata.json"), 'w') as f:
        json.dump(meta, f, indent=2)

    print(f"  Model saved successfully!")
    print(f"\n{'=' * 60}")
    print(f"Training complete! Accuracy: {max(svm_acc, rf_acc):.1%}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    train()
