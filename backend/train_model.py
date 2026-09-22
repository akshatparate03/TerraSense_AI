"""
Reproducible training pipeline for the landslide risk classifier.

Run:
    python train_model.py

Produces:
    models/landslide_pipeline.joblib   -- best-performing full sklearn Pipeline
                                           (preprocessing + classifier)
    models/model_metadata.json         -- selected model name, metrics, training info
    artifacts/model_comparison.json    -- metrics for every candidate model
    artifacts/feature_importance.json  -- feature importances of the selected model
    artifacts/confusion_matrix.png
    artifacts/confusion_matrix.json    -- raw TP/TN/FP/FN counts for interactive UI
    artifacts/roc_curve.png
    artifacts/roc_curve.json           -- raw (fpr, tpr) points for interactive UI
    artifacts/precision_recall_curve.png
    artifacts/precision_recall_curve.json  -- raw (precision, recall) points for interactive UI
    artifacts/model_comparison.png
    artifacts/dataset_summary.json     -- EDA summary (missing values, distributions)
    artifacts/correlation_heatmap.png
    artifacts/correlation_matrix.json  -- raw correlation matrix for interactive UI
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    PrecisionRecallDisplay,
    RocCurveDisplay,
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier

sys.path.insert(0, str(Path(__file__).parent))
from app.ml.data_pipeline import (  # noqa: E402
    ALL_FEATURE_COLS,
    ALL_FEATURE_COLS_V2,
    GEO_FEATURE_COLS,
    REAL_FEATURE_COLS,
    SIMULATED_FEATURE_COLS,
    TARGET_COL,
    build_training_dataset,
    clean_catalog,
    load_raw_catalog,
)

try:
    from xgboost import XGBClassifier

    HAS_XGB = True
except ImportError:
    HAS_XGB = False

BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "global_landslide_catalog.csv"
MODELS_DIR = BASE_DIR / "models"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
MODELS_DIR.mkdir(exist_ok=True)
ARTIFACTS_DIR.mkdir(exist_ok=True)

RANDOM_STATE = 42


def run_eda(raw_df: pd.DataFrame, clean_df: pd.DataFrame, dataset: pd.DataFrame) -> dict:
    missing = raw_df.isna().mean().sort_values(ascending=False)
    missing_top = {k: round(float(v), 4) for k, v in missing.head(15).items()}

    summary = {
        "raw_rows": int(len(raw_df)),
        "raw_columns": int(raw_df.shape[1]),
        "clean_rows": int(len(clean_df)),
        "duplicates_removed": int(clean_df.attrs.get("duplicates_removed", 0)),
        "training_rows_total": int(len(dataset)),
        "training_rows_positive": int((dataset[TARGET_COL] == 1).sum()),
        "training_rows_negative": int((dataset[TARGET_COL] == 0).sum()),
        "missing_value_fraction_top_columns": missing_top,
        "landslide_size_distribution": clean_df["landslide_size"].value_counts().to_dict(),
        "landslide_trigger_rain_fraction": float(clean_df["trigger_is_rain"].mean()),
        "top_countries": clean_df["country_name"].value_counts().head(10).to_dict(),
        "feature_columns": ALL_FEATURE_COLS,
        "real_feature_columns": REAL_FEATURE_COLS,
        "simulated_feature_columns": SIMULATED_FEATURE_COLS,
    }

    # correlation heatmap of the numeric feature set used for training
    fig, ax = plt.subplots(figsize=(8, 6))
    corr = dataset[ALL_FEATURE_COLS + [TARGET_COL]].corr()
    im = ax.imshow(corr, cmap="RdBu_r", vmin=-1, vmax=1)
    ax.set_xticks(range(len(corr.columns)))
    ax.set_yticks(range(len(corr.columns)))
    ax.set_xticklabels(corr.columns, rotation=90, fontsize=7)
    ax.set_yticklabels(corr.columns, fontsize=7)
    fig.colorbar(im)
    ax.set_title("Feature Correlation Heatmap")
    fig.tight_layout()
    fig.savefig(ARTIFACTS_DIR / "correlation_heatmap.png", dpi=140)
    plt.close(fig)

    # Same correlation matrix as JSON, for the frontend's interactive hoverable
    # heatmap (no static image needed there).
    corr_json = {
        "columns": list(corr.columns),
        "matrix": [[round(float(v), 4) for v in row] for row in corr.to_numpy()],
    }
    with open(ARTIFACTS_DIR / "correlation_matrix.json", "w") as f:
        json.dump(corr_json, f)

    return summary


def build_candidates() -> dict:
    candidates = {
        "Logistic Regression": Pipeline(
            [("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000, random_state=RANDOM_STATE))]
        ),
        "Decision Tree": Pipeline(
            [("scaler", StandardScaler()), ("clf", DecisionTreeClassifier(max_depth=8, random_state=RANDOM_STATE))]
        ),
        "Random Forest": Pipeline(
            [
                ("scaler", StandardScaler()),
                (
                    "clf",
                    RandomForestClassifier(
                        n_estimators=300, max_depth=12, random_state=RANDOM_STATE, n_jobs=-1
                    ),
                ),
            ]
        ),
        "Gradient Boosting": Pipeline(
            [("scaler", StandardScaler()), ("clf", GradientBoostingClassifier(random_state=RANDOM_STATE))]
        ),
    }
    if HAS_XGB:
        candidates["XGBoost"] = Pipeline(
            [
                ("scaler", StandardScaler()),
                (
                    "clf",
                    XGBClassifier(
                        n_estimators=300,
                        max_depth=6,
                        learning_rate=0.08,
                        subsample=0.9,
                        colsample_bytree=0.9,
                        eval_metric="logloss",
                        random_state=RANDOM_STATE,
                        n_jobs=-1,
                    ),
                ),
            ]
        )
    return candidates


def evaluate(model, X_test, y_test) -> dict:
    preds = model.predict(X_test)
    proba = model.predict_proba(X_test)[:, 1]
    return {
        "accuracy": float(accuracy_score(y_test, preds)),
        "precision": float(precision_score(y_test, preds)),
        "recall": float(recall_score(y_test, preds)),
        "f1_score": float(f1_score(y_test, preds)),
        "roc_auc": float(roc_auc_score(y_test, proba)),
    }


def get_feature_importance(model: Pipeline, feature_names: list[str]) -> dict:
    clf = model.named_steps["clf"]
    if hasattr(clf, "feature_importances_"):
        importances = clf.feature_importances_
    elif hasattr(clf, "coef_"):
        importances = np.abs(clf.coef_[0])
    else:
        return {}
    importances = importances / (importances.sum() + 1e-12)
    ranked = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
    return {name: float(round(val, 5)) for name, val in ranked}


def main():
    parser = argparse.ArgumentParser(description="Train the TerraSense landslide risk model")
    parser.add_argument(
        "--dataset",
        choices=["legacy", "master"],
        default="legacy",
        help="'legacy' (default): original NASA-GLC-only + simulated-features pipeline, unchanged. "
        "'master': train on data/master/terrasense_master_dataset.parquet (built via "
        "scripts/build_master_dataset.py) with the expanded geo/soil/construction feature set.",
    )
    parser.add_argument(
        "--promote",
        action="store_true",
        help="With --dataset master: overwrite the ACTIVE model (models/landslide_pipeline.joblib) "
        "that the running API serves. Without this flag, a master-trained model is saved only under "
        "models/versions/<version>/ and registered in models/model_registry.json, without touching "
        "the currently active model (spec section 51 -- never silently overwrite).",
    )
    args = parser.parse_args()

    if args.dataset == "master":
        return train_on_master_dataset(promote=args.promote)
    return train_on_legacy_catalog()


def train_on_legacy_catalog():
    t0 = time.time()
    print("[1/8] Loading raw Global Landslide Catalog...")
    raw_df = load_raw_catalog(str(DATA_PATH))

    print("[2/8] Cleaning catalog (dedup, geo validation, trigger parsing)...")
    clean_df = clean_catalog(raw_df)

    print("[3/8] Building training dataset (real positives + documented simulated negatives)...")
    dataset = build_training_dataset(clean_df, negative_ratio=1.0)
    dataset = dataset.dropna(subset=ALL_FEATURE_COLS + [TARGET_COL])

    print("[4/8] Running EDA / dataset summary...")
    eda_summary = run_eda(raw_df, clean_df, dataset)
    with open(ARTIFACTS_DIR / "dataset_summary.json", "w") as f:
        json.dump(eda_summary, f, indent=2, default=str)

    _train_evaluate_and_save(
        dataset,
        feature_cols=ALL_FEATURE_COLS,
        dataset_version="global_landslide_catalog_v1+pseudo_absence_v1",
        model_path=MODELS_DIR / "landslide_pipeline.joblib",
        metadata_path=MODELS_DIR / "model_metadata.json",
        t0=t0,
        version_tag="v1_legacy",
    )


def train_on_master_dataset(promote: bool):
    t0 = time.time()
    master_path = BASE_DIR / "data" / "master" / "terrasense_master_dataset.parquet"
    if not master_path.exists():
        print(
            f"ERROR: {master_path} not found. Run `python scripts/build_master_dataset.py` first "
            "(add --mode live for real environmental features, or --mode mock for an offline demo run)."
        )
        sys.exit(1)

    print(f"[1/6] Loading master dataset from {master_path}...")
    dataset = pd.read_parquet(master_path)
    dataset = dataset.dropna(subset=ALL_FEATURE_COLS_V2 + [TARGET_COL])
    print(f"    {len(dataset)} rows, feature_source breakdown: {dataset['feature_source'].value_counts().to_dict() if 'feature_source' in dataset else 'n/a'}")

    print("[2/6] Running EDA / dataset summary...")
    eda_summary = {
        "training_rows_total": int(len(dataset)),
        "training_rows_positive": int((dataset[TARGET_COL] == 1).sum()),
        "training_rows_negative": int((dataset[TARGET_COL] == 0).sum()),
        "feature_columns": ALL_FEATURE_COLS_V2,
        "real_feature_columns": REAL_FEATURE_COLS,
        "simulated_feature_columns": SIMULATED_FEATURE_COLS,
        "geo_feature_columns": GEO_FEATURE_COLS,
        "feature_source_breakdown": dataset["feature_source"].value_counts().to_dict() if "feature_source" in dataset else {},
        "india_specific_rows": int((dataset.get("country_name") == "India").sum()) if "country_name" in dataset else None,
        "top_countries": dataset["country_name"].value_counts().head(10).to_dict() if "country_name" in dataset else {},
    }
    with open(ARTIFACTS_DIR / "dataset_summary_master.json", "w") as f:
        json.dump(eda_summary, f, indent=2, default=str)

    version_tag = f"v2_master_{pd.Timestamp.now('UTC').strftime('%Y%m%d_%H%M%S')}"
    version_dir = MODELS_DIR / "versions" / version_tag
    version_dir.mkdir(parents=True, exist_ok=True)

    metrics = _train_evaluate_and_save(
        dataset,
        feature_cols=ALL_FEATURE_COLS_V2,
        dataset_version=f"terrasense_master_dataset ({dataset.get('feature_source', pd.Series(['unknown'])).mode()[0] if 'feature_source' in dataset else 'unknown'} features)",
        model_path=version_dir / "landslide_pipeline.joblib",
        metadata_path=version_dir / "model_metadata.json",
        t0=t0,
        version_tag=version_tag,
        artifacts_suffix="_master",
    )

    registry_path = MODELS_DIR / "model_registry.json"
    registry = json.loads(registry_path.read_text()) if registry_path.exists() else {"versions": []}
    registry["versions"].append(
        {
            "version": version_tag,
            "dataset": "master",
            "trained_at": pd.Timestamp.now("UTC").isoformat(),
            "metrics": metrics,
            "path": str(version_dir),
            "promoted_to_active": promote,
        }
    )
    with open(registry_path, "w") as f:
        json.dump(registry, f, indent=2, default=str)

    if promote:
        print(f"[PROMOTE] Copying {version_tag} to the active model path (models/landslide_pipeline.joblib)...")
        import shutil

        shutil.copy(version_dir / "landslide_pipeline.joblib", MODELS_DIR / "landslide_pipeline.joblib")
        shutil.copy(version_dir / "model_metadata.json", MODELS_DIR / "model_metadata.json")
        print("    Active model updated. Restart the API (or it will pick this up on next load) to serve it.")
    else:
        print(
            f"    Model version {version_tag} saved but NOT promoted -- the currently active model is unchanged. "
            "Re-run with --promote to make this the model the API serves."
        )


def _train_evaluate_and_save(
    dataset: pd.DataFrame,
    feature_cols: list[str],
    dataset_version: str,
    model_path: Path,
    metadata_path: Path,
    t0: float,
    version_tag: str,
    artifacts_suffix: str = "",
) -> dict:
    X = dataset[feature_cols]
    y = dataset[TARGET_COL]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    print(f"[training] Training candidate models on {len(feature_cols)} features...")
    candidates = build_candidates()
    comparison = {}
    fitted = {}
    for name, pipe in candidates.items():
        pipe.fit(X_train, y_train)
        metrics = evaluate(pipe, X_test, y_test)
        cv_scores = cross_val_score(pipe, X_train, y_train, cv=5, scoring="f1")
        metrics["cv_f1_mean"] = float(cv_scores.mean())
        metrics["cv_f1_std"] = float(cv_scores.std())
        comparison[name] = metrics
        fitted[name] = pipe
        print(f"    {name}: acc={metrics['accuracy']:.3f} f1={metrics['f1_score']:.3f} auc={metrics['roc_auc']:.3f}")

    with open(ARTIFACTS_DIR / f"model_comparison{artifacts_suffix}.json", "w") as f:
        json.dump(comparison, f, indent=2)

    best_name = max(comparison, key=lambda n: comparison[n]["roc_auc"])
    best_model = fitted[best_name]
    best_metrics = comparison[best_name]
    print(f"    Selected: {best_name} (roc_auc={best_metrics['roc_auc']:.4f})")

    y_proba = best_model.predict_proba(X_test)[:, 1]
    y_pred = best_model.predict(X_test)

    fig, ax = plt.subplots(figsize=(5, 5))
    ConfusionMatrixDisplay.from_estimator(best_model, X_test, y_test, ax=ax, cmap="Blues")
    ax.set_title(f"Confusion Matrix - {best_name}")
    fig.tight_layout()
    fig.savefig(ARTIFACTS_DIR / f"confusion_matrix{artifacts_suffix}.png", dpi=140)
    plt.close(fig)

    cm = confusion_matrix(y_test, y_pred)
    with open(ARTIFACTS_DIR / f"confusion_matrix{artifacts_suffix}.json", "w") as f:
        json.dump(
            {
                "model": best_name,
                "labels": ["No Landslide (0)", "Landslide (1)"],
                "matrix": cm.tolist(),
                "tn": int(cm[0][0]), "fp": int(cm[0][1]), "fn": int(cm[1][0]), "tp": int(cm[1][1]),
            },
            f, indent=2,
        )

    fig, ax = plt.subplots(figsize=(5, 5))
    RocCurveDisplay.from_estimator(best_model, X_test, y_test, ax=ax)
    ax.set_title(f"ROC Curve - {best_name}")
    fig.tight_layout()
    fig.savefig(ARTIFACTS_DIR / f"roc_curve{artifacts_suffix}.png", dpi=140)
    plt.close(fig)

    fpr, tpr, _ = roc_curve(y_test, y_proba)
    roc_idx = np.linspace(0, len(fpr) - 1, min(120, len(fpr))).astype(int)
    with open(ARTIFACTS_DIR / f"roc_curve{artifacts_suffix}.json", "w") as f:
        json.dump(
            {"model": best_name, "auc": float(best_metrics["roc_auc"]),
             "points": [{"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)} for i in roc_idx]},
            f,
        )

    fig, ax = plt.subplots(figsize=(5, 5))
    PrecisionRecallDisplay.from_estimator(best_model, X_test, y_test, ax=ax)
    ax.set_title(f"Precision-Recall Curve - {best_name}")
    fig.tight_layout()
    fig.savefig(ARTIFACTS_DIR / f"precision_recall_curve{artifacts_suffix}.png", dpi=140)
    plt.close(fig)

    precision_arr, recall_arr, _ = precision_recall_curve(y_test, y_proba)
    pr_idx = np.linspace(0, len(precision_arr) - 1, min(120, len(precision_arr))).astype(int)
    with open(ARTIFACTS_DIR / f"precision_recall_curve{artifacts_suffix}.json", "w") as f:
        json.dump(
            {"model": best_name,
             "points": [{"recall": round(float(recall_arr[i]), 4), "precision": round(float(precision_arr[i]), 4)} for i in pr_idx]},
            f,
        )

    fig, ax = plt.subplots(figsize=(8, 5))
    names = list(comparison.keys())
    aucs = [comparison[n]["roc_auc"] for n in names]
    f1s = [comparison[n]["f1_score"] for n in names]
    x_pos = np.arange(len(names))
    width = 0.35
    ax.bar(x_pos - width / 2, aucs, width, label="ROC-AUC")
    ax.bar(x_pos + width / 2, f1s, width, label="F1 Score")
    ax.set_xticks(x_pos)
    ax.set_xticklabels(names, rotation=20, ha="right")
    ax.set_ylim(0, 1)
    ax.legend()
    ax.set_title("Model Comparison")
    fig.tight_layout()
    fig.savefig(ARTIFACTS_DIR / f"model_comparison{artifacts_suffix}.png", dpi=140)
    plt.close(fig)

    feature_importance = get_feature_importance(best_model, feature_cols)
    with open(ARTIFACTS_DIR / f"feature_importance{artifacts_suffix}.json", "w") as f:
        json.dump(feature_importance, f, indent=2)

    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_model, model_path)

    metadata = {
        "model_version": version_tag,
        "selected_model": best_name,
        "metrics": best_metrics,
        "feature_columns": feature_cols,
        "real_feature_columns": REAL_FEATURE_COLS,
        "simulated_feature_columns": SIMULATED_FEATURE_COLS,
        "geo_feature_columns": GEO_FEATURE_COLS if set(GEO_FEATURE_COLS).issubset(set(feature_cols)) else [],
        "training_samples": int(len(X_train)),
        "testing_samples": int(len(X_test)),
        "dataset_version": dataset_version,
        "trained_at_unix": time.time(),
        "trained_at_iso": pd.Timestamp.now("UTC").isoformat(),
        "all_candidates_evaluated": list(comparison.keys()),
        "sklearn_random_state": RANDOM_STATE,
        "training_duration_seconds": round(time.time() - t0, 2),
    }
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2, default=str)

    print(f"Done in {time.time() - t0:.1f}s. Best model: {best_name} -> {model_path}")
    return best_metrics


if __name__ == "__main__":
    main()