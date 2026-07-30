#!/usr/bin/env python3
"""Extract the ACE route geometries from the MTA Current Bus Routes export."""

import csv
import json
import re
import sys
from pathlib import Path


ROUTE_IDS = {
    "M100": {"M100"},
    "M101": {"M101"},
    "M116": {"M116"},
    "M14+": {"M14A+", "M14D+"},
    "M15+": {"M15+"},
    "M2": {"M2"},
    "M23+": {"M23+"},
    "M31": {"M31"},
    "M34+": {"M34+", "M34A+"},
    "M4": {"M4"},
    "M42": {"M42"},
    "M57": {"M57"},
    "M60+": {"M60+"},
    "M7": {"M7"},
    "M79+": {"M79+"},
    "M86+": {"M86+"},
    "M96": {"M96"},
}


def parse_multilinestring(wkt):
    """Convert the dataset's simple MULTILINESTRING WKT to GeoJSON coordinates."""
    match = re.fullmatch(r"MULTILINESTRING\s*\(\((.*)\)\)", wkt.strip())
    if not match:
        raise ValueError("Unexpected geometry format")
    segments = re.split(r"\)\s*,\s*\(", match.group(1))
    return [
        [[float(value) for value in pair.strip().split()] for pair in segment.split(",")]
        for segment in segments
    ]


def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: build-route-shapes.py INPUT.csv OUTPUT.geojson")

    source = Path(sys.argv[1])
    destination = Path(sys.argv[2])
    source_to_map_route = {
        source_id: map_route
        for map_route, source_ids in ROUTE_IDS.items()
        for source_id in source_ids
    }
    features = []

    with source.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            map_route = source_to_map_route.get(row["Route ID"])
            if not map_route or row["In Effect"].lower() != "true":
                continue
            features.append(
                {
                    "type": "Feature",
                    "properties": {
                        "route": map_route,
                        "mta_route": row["Route ID"],
                        "direction": row["Direction"],
                        "shape_id": row["Shape ID"],
                    },
                    "geometry": {
                        "type": "MultiLineString",
                        "coordinates": parse_multilinestring(row["Geometry"]),
                    },
                }
            )

    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(
        json.dumps({"type": "FeatureCollection", "features": features}, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Wrote {len(features)} route shapes to {destination}")


if __name__ == "__main__":
    main()
