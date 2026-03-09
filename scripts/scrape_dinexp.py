"""
Scrape venue information from DineXp and export to CSV.
Extracts restaurant data from the Next.js RSC payload embedded in the page.

Usage:
  python scripts/scrape_dinexp.py
  python scripts/scrape_dinexp.py --city Bulawayo
  python scripts/scrape_dinexp.py --query harare --output venues_harare.csv
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import urllib.parse
import urllib.request
import urllib.error

DEFAULT_OUTPUT = "venues.csv"

CSV_FIELDS = [
    "name",
    "city",
    "country",
    "address",
    "latitude",
    "longitude",
    "cuisine_types",
    "service_types",
    "atmosphere_features",
    "special_features",
    "dietary_options",
    "cover_url",
    "logo_url",
    "google_place_id",
    "google_place_rating",
    "google_place_ratings_count",
    "dinexp_url",
    "slug",
]


def fetch_page(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode("utf-8", errors="replace")


def extract_restaurants(html: str) -> list[dict]:
    """Pull restaurant objects from Next.js RSC payload chunks."""
    restaurants: dict[str, dict] = {}

    # The RSC data is split across multiple self.__next_f.push([1, "..."]) calls.
    # Reassemble all the JSON string fragments first.
    chunks = re.findall(r'self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)', html)
    combined = ""
    for chunk in chunks:
        try:
            combined += json.loads(chunk)  # unescape the JS string
        except Exception:
            pass

    # The staffPicks and communityPicksInitial arrays live inside a large JSON object.
    # We look for any object that has "name", "slug", "city", and "latitude" fields.
    # Use a broad regex to find JSON objects with these keys.
    pattern = re.compile(
        r'\{[^{}]*"slug"\s*:\s*"([^"]+)"[^{}]*"city"\s*:\s*"([^"]+)"[^{}]*\}',
        re.DOTALL,
    )

    # Better: parse the whole combined string as a series of known arrays.
    # Find staffPicks and communityPicksInitial arrays.
    for array_key in ("staffPicks", "communityPicksInitial"):
        match = re.search(
            rf'"{array_key}"\s*:\s*(\[.*?\])\s*(?:,\s*"|\}})',
            combined,
            re.DOTALL,
        )
        if not match:
            continue
        try:
            items = json.loads(match.group(1))
        except json.JSONDecodeError:
            continue
        for item in items:
            slug = item.get("slug")
            if slug and slug not in restaurants:
                restaurants[slug] = item

    # Also parse JSON-LD structured data as a fallback for basic info.
    ld_blocks = re.findall(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html,
        re.DOTALL,
    )
    for block in ld_blocks:
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        if data.get("@type") == "ItemList":
            for entry in data.get("itemListElement", []):
                item = entry.get("item", {})
                url = item.get("url", "")
                slug = url.rstrip("/").split("/")[-1] if url else None
                if slug and slug not in restaurants:
                    restaurants[slug] = {
                        "name": item.get("name"),
                        "slug": slug,
                        "city": item.get("address", {}).get("addressLocality"),
                        "country": item.get("address", {}).get("addressCountry"),
                        "cuisine_types": item.get("servesCuisine", []),
                        "google_place_rating": item.get("aggregateRating", {}).get("ratingValue"),
                        "google_place_ratings_count": item.get("aggregateRating", {}).get("ratingCount"),
                        "cover_url": item.get("image"),
                        "dinexp_url": url,
                    }

    return list(restaurants.values())


def to_row(r: dict) -> dict:
    slug = r.get("slug", "")
    dinexp_url = r.get("dinexp_url") or (
        f"https://www.dinexp.club/restaurants/{slug}" if slug else ""
    )

    def join(val):
        if isinstance(val, list):
            return ", ".join(str(v) for v in val)
        return val or ""

    country = r.get("country", "")
    city = r.get("city", "")
    # Infer country from city if not provided
    if not country:
        zim_cities = {"harare", "bulawayo", "victoria falls", "mutare", "gweru"}
        if city.lower() in zim_cities:
            country = "ZW"

    return {
        "name": r.get("name", ""),
        "city": city,
        "country": country,
        "address": r.get("venue_address") or r.get("address", ""),
        "latitude": r.get("latitude", ""),
        "longitude": r.get("longitude", ""),
        "cuisine_types": join(r.get("cuisine_types")),
        "service_types": join(r.get("service_types")),
        "atmosphere_features": join(r.get("atmosphere_features")),
        "special_features": join(r.get("special_features")),
        "dietary_options": join(r.get("dietary_options")),
        "cover_url": r.get("cover_url") or r.get("cover_image", ""),
        "logo_url": r.get("logo_url", ""),
        "google_place_id": r.get("google_place_id", ""),
        "google_place_rating": r.get("google_place_rating", ""),
        "google_place_ratings_count": r.get("google_place_ratings_count", ""),
        "dinexp_url": dinexp_url,
        "slug": slug,
    }


def scrape_from_file(path: str, city_filter: str | None, output: str):
    with open(path, encoding="utf-8") as f:
        html = f.read()
    _process(html, city_filter, output)


def scrape(query: str, city_filter: str | None, output: str):
    url = f"https://www.dinexp.club/explore?q={urllib.parse.quote(query)}"
    print(f"Fetching {url} …")
    try:
        html = fetch_page(url)
    except urllib.error.URLError as e:
        print(f"Error fetching page: {e}", file=sys.stderr)
        sys.exit(1)
    _process(html, city_filter, output)


def _process(html: str, city_filter: str | None, output: str):
    restaurants = extract_restaurants(html)

    if city_filter:
        restaurants = [
            r for r in restaurants
            if city_filter.lower() in (r.get("city") or "").lower()
        ]

    if not restaurants:
        print("No venues found. The page structure may have changed.", file=sys.stderr)
        sys.exit(1)

    rows = [to_row(r) for r in restaurants]

    with open(output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Saved {len(rows)} venues to {output}")
    for row in rows:
        print(f"  • {row['name']} — {row['city']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape DineXp venue data to CSV")
    parser.add_argument("--query", default="harare", help="Search query (default: harare)")
    parser.add_argument("--city", default=None, help="Filter results by city name")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help=f"Output CSV path (default: {DEFAULT_OUTPUT})")
    parser.add_argument("--file", default=None, help="Parse a locally saved HTML file instead of fetching")
    args = parser.parse_args()

    if args.file:
        scrape_from_file(args.file, args.city, args.output)
    else:
        scrape(args.query, args.city, args.output)
