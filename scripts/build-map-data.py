#!/usr/bin/env python3
"""Build map aggregates for all ACE records and each final outcome."""
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / "ace_manhattan_cleaned.csv"
STOP_SUMMARY = ROOT.parent / "stop_summary.csv"
OUTPUT = ROOT / "public" / "data" / "stops.json"

keys = ["route", "stop_canonical", "neighborhood"]
use = keys + ["is_violation", "is_exempt", "is_technical", "is_dmv", "is_nonissued"]
parts = []

for chunk in pd.read_csv(SOURCE, usecols=use, chunksize=250_000):
    parts.append(
        chunk.groupby(keys, dropna=False)
        .agg(
            records=("is_nonissued", "size"),
            violations=("is_violation", "sum"),
            exemptions=("is_exempt", "sum"),
            technical=("is_technical", "sum"),
            dmv=("is_dmv", "sum"),
            nonissued=("is_nonissued", "sum"),
        )
        .reset_index()
    )

data = (
    pd.concat(parts)
    .groupby(keys, as_index=False, dropna=False)
    .agg(
        records=("records", "sum"),
        violations=("violations", "sum"),
        exemptions=("exemptions", "sum"),
        technical=("technical", "sum"),
        dmv=("dmv", "sum"),
        nonissued=("nonissued", "sum"),
    )
)
coordinates = pd.read_csv(STOP_SUMMARY)[["stop_canonical", "longitude", "latitude"]]
data = data.merge(coordinates, on="stop_canonical", how="left", validate="many_to_one")
if data[["longitude", "latitude"]].isna().any().any():
    raise RuntimeError("One or more canonical intersections lack display coordinates.")

data = data.rename(columns={"stop_canonical": "stop", "neighborhood": "nta"})
data = data.sort_values("records", ascending=False)
data[["longitude", "latitude"]] = data[["longitude", "latitude"]].round(6)
OUTPUT.write_text(data.to_json(orient="records") + "\n")
print(
    {
        "rows": len(data),
        "records": int(data.records.sum()),
        "issued": int(data.violations.sum()),
        "nonissued": int(data.nonissued.sum()),
    }
)
