"""
Fetch Harare restaurant data from OpenStreetMap via the Overpass API.

No API key required. Free, no rate limits for reasonable use.

Usage:
  python3 scripts/fetch_osm_restaurants.py
  python3 scripts/fetch_osm_restaurants.py --output harare_restaurants.csv
  python3 scripts/fetch_osm_restaurants.py --radius-km 20
"""

from __future__ import annotations

import argparse
import csv
import sys
import time

import requests

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Harare city centre coordinates
HARARE_LAT = -17.8292
HARARE_LNG = 31.0522

DEFAULT_OUTPUT = "harare_restaurants.csv"
DEFAULT_RADIUS_KM = 15

CSV_FIELDS = [
    "name",
    "description",
    "category",
    "city",
    "country",
    "address",
    "phone",
    "menu_url",
    "image_url",
    "image_url_2",
    "image_url_3",
    "logo_url",
    "tags",
    "latitude",
    "longitude",
]

# OSM amenity values that represent restaurants / food venues
FOOD_AMENITIES = {
    "restaurant", "fast_food", "cafe", "food_court",
    "bar", "pub", "biergarten", "ice_cream",
}


def build_query(lat: float, lng: float, radius_m: int) -> str:
    """Build an Overpass QL query for food venues around a point."""
    amenity_filter = "|".join(sorted(FOOD_AMENITIES))
    return f"""
[out:json][timeout:60];
(
  node["amenity"~"^({amenity_filter})$"](around:{radius_m},{lat},{lng});
  way["amenity"~"^({amenity_filter})$"](around:{radius_m},{lat},{lng});
  relation["amenity"~"^({amenity_filter})$"](around:{radius_m},{lat},{lng});
);
out center tags;
""".strip()


def run_query(query: str, retries: int = 4) -> list[dict]:
    """POST the Overpass query and return the elements list."""
    delay = 3
    for attempt in range(retries + 1):
        try:
            resp = requests.post(
                OVERPASS_URL,
                data={"data": query},
                timeout=90,
                headers={"User-Agent": "harare-restaurant-scraper/1.0"},
            )
            resp.raise_for_status()
            return resp.json().get("elements", [])
        except requests.exceptions.Timeout:
            if attempt < retries:
                print(f"  Timeout (attempt {attempt+1}), retrying in {delay}s…", file=sys.stderr)
                time.sleep(delay)
                delay *= 2
            else:
                print("  Overpass query timed out after all retries.", file=sys.stderr)
                return []
        except Exception as e:
            print(f"  Overpass error: {e}", file=sys.stderr)
            return []
    return []


def _tag(tags: dict, *keys: str) -> str:
    """Return the first non-empty value for a list of tag keys."""
    for k in keys:
        v = tags.get(k, "").strip()
        if v:
            return v
    return ""


def element_to_row(el: dict) -> dict | None:
    """Convert an OSM element to a CSV row dict. Returns None if no name."""
    tags = el.get("tags", {})
    name = _tag(tags, "name", "name:en")
    if not name:
        return None

    # Coordinates: nodes have lat/lon directly; ways/relations have a center
    center = el.get("center", {})
    lat = str(el.get("lat") or center.get("lat") or "")
    lng = str(el.get("lon") or center.get("lon") or "")

    # Address
    addr_parts = filter(None, [
        _tag(tags, "addr:housenumber"),
        _tag(tags, "addr:street"),
        _tag(tags, "addr:suburb"),
    ])
    address = " ".join(addr_parts) or _tag(tags, "addr:full")

    # Category
    amenity = tags.get("amenity", "restaurant")
    cuisine = _tag(tags, "cuisine")
    category = cuisine.replace(";", ", ") if cuisine else amenity.replace("_", " ").title()

    # Phone — OSM uses "phone" or "contact:phone"
    phone = _tag(tags, "phone", "contact:phone")
    # Normalise: strip leading/trailing spaces
    phone = phone.strip()

    # Website / menu
    website = _tag(tags, "website", "contact:website", "url")
    menu_url = _tag(tags, "menu:url", "menu") or website

    # Tags from OSM (cuisine, diet options, opening hours note, etc.)
    tag_bits = []
    for key in ("cuisine", "diet:vegetarian", "diet:vegan", "diet:halal",
                "outdoor_seating", "takeaway", "delivery"):
        v = tags.get(key, "")
        if v and v not in ("no",):
            tag_bits.append(f"{key}={v}")
    extra_tags = ", ".join(tag_bits)

    return {
        "name": name,
        "description": _tag(tags, "description"),
        "category": category,
        "city": _tag(tags, "addr:city") or "Harare",
        "country": _tag(tags, "addr:country") or "Zimbabwe",
        "address": address,
        "phone": phone,
        "menu_url": menu_url,
        "image_url": "",
        "image_url_2": "",
        "image_url_3": "",
        "logo_url": "",
        "tags": extra_tags,
        "latitude": lat,
        "longitude": lng,
    }


def run(output: str, radius_km: float):
    radius_m = int(radius_km * 1000)
    print(f"Querying Overpass API for restaurants within {radius_km} km of Harare centre…")
    query = build_query(HARARE_LAT, HARARE_LNG, radius_m)
    elements = run_query(query)

    if not elements:
        print("No results returned. Check your network or try increasing --radius-km.", file=sys.stderr)
        sys.exit(1)

    print(f"  Got {len(elements)} OSM element(s), converting…")
    rows = [r for el in elements if (r := element_to_row(el)) is not None]

    # Sort by name
    rows.sort(key=lambda r: r["name"].lower())

    with open(output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nSaved {len(rows)} restaurant(s) → {output}")
    for row in rows:
        print(f"  • {row['name']} | {row['address']} | {row['category']} | lat={row['latitude']} lng={row['longitude']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fetch Harare restaurants from OpenStreetMap (free, no API key)")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help=f"Output CSV (default: {DEFAULT_OUTPUT})")
    parser.add_argument("--radius-km", type=float, default=DEFAULT_RADIUS_KM,
                        help=f"Search radius in km from Harare centre (default: {DEFAULT_RADIUS_KM})")
    args = parser.parse_args()
    run(args.output, args.radius_km)
