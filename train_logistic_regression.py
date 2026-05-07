import argparse
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer


def load_data(csv_path: Path) -> pd.DataFrame:
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found at: {csv_path}")
    return pd.read_csv(csv_path)


def build_pipeline(df: pd.DataFrame, target_column: str) -> tuple[Pipeline, np.ndarray, np.ndarray]:
    if target_column not in df.columns:
        raise ValueError(
            f"Target column '{target_column}' not found in CSV. "
            f"Available columns: {list(df.columns)}"
        )

    X = df.drop(columns=[target_column])
    y = df[target_column]

    # For this dataset, we have text data (e.g. 'statement') and a label ('status').
    # Use TF‑IDF features over the text column instead of treating each full
    # sentence as a categorical value, which would hurt performance.
    text_col = None
    if "statement" in X.columns:
        text_col = "statement"
    else:
        # Fallback: pick the first object (string) column as text
        object_cols = [c for c in X.columns if X[c].dtype == "object"]
        if not object_cols:
            raise ValueError(
                "No text column found. Expected a column like 'statement' with string data."
            )
        text_col = object_cols[0]

    X_text = X[text_col].astype(str)

    model = Pipeline(
        steps=[
            (
                "tfidf",
                TfidfVectorizer(
                    ngram_range=(1, 2),
                    min_df=2,
                    max_features=20000,
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    max_iter=1000,
                    class_weight="balanced",
                    n_jobs=None,
                ),
            ),
        ]
    )

    return model, X_text, y


def train_and_evaluate(
    csv_path: str,
    target_column: str,
    test_size: float = 0.2,
    random_state: int = 42,
) -> None:
    csv_file = Path(csv_path)
    df = load_data(csv_file)

    print("Loaded CSV with shape:", df.shape)
    print("Columns:", list(df.columns))

    # Drop obvious index-like columns if present
    for col in list(df.columns):
        if col.lower().startswith("unnamed:"):
            df = df.drop(columns=[col])

    # Drop rows with missing target values, which break stratified splits
    before_rows = len(df)
    df = df.dropna(subset=[target_column])
    after_rows = len(df)
    if after_rows < before_rows:
        print(f"Dropped {before_rows - after_rows} rows with NaN in target '{target_column}'.")

    # Optionally drop rows with any missing feature values to avoid downstream errors
    before_rows = len(df)
    df = df.dropna()
    after_rows = len(df)
    if after_rows < before_rows:
        print(f"Dropped {before_rows - after_rows} rows with NaN in features.")

    print("Cleaned CSV shape:", df.shape)

    model, X, y = build_pipeline(df, target_column)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=y,
    )

    print(f"Training samples: {len(X_train)}, Test samples: {len(X_test)}")

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    print(f"\nAccuracy: {acc:.4f}")

    print("\nClassification report:")
    print(classification_report(y_test, y_pred))

    print("\nConfusion matrix:")
    print(confusion_matrix(y_test, y_pred))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train a logistic regression classifier on a CSV dataset."
    )
    parser.add_argument(
        "--csv-path",
        type=str,
        required=False,
        default="../Dataset/Mental Health data.csv",
        help="Path to the CSV dataset.",
    )
    parser.add_argument(
        "--target-column",
        type=str,
        required=True,
        help="Name of the target (label) column in the CSV.",
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.2,
        help="Proportion of the dataset to include in the test split.",
    )
    parser.add_argument(
        "--random-state",
        type=int,
        default=42,
        help="Random state for reproducibility.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    train_and_evaluate(
        csv_path=args.csv_path,
        target_column=args.target_column,
        test_size=args.test_size,
        random_state=args.random_state,
    )

