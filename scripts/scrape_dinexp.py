"""
Scrape venue information from DineXp and export to CSV.
Step 1: pulls slugs from the explore/search listing page.
Step 2: visits each restaurant detail page for the full JSON-LD data
        (address, phone, description, coordinates, price range, etc.)

Usage:
  python3 scripts/scrape_dinexp.py
  python3 scripts/scrape_dinexp.py --city Harare
  python3 scripts/scrape_dinexp.py --query harare --output venues_harare.csv
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE_URL = "https://www.dinexp.club"
DEFAULT_OUTPUT = "venues.csv"

CSV_FIELDS = [
    "name",
    "description",
    "city",
    "country",
    "street_address",
    "latitude",
    "longitude",
    "telephone",
    "price_range",
    "cuisine_types",
    "service_types",
    "atmosphere_features",
    "special_features",
    "dietary_options",
    "cover_url",
    "logo_url",
    "google_place_rating",
    "google_place_ratings_count",
    "dinexp_url",
    "slug",
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


def fetch_page(url: str) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_ld_json(html: str, type_filter: str | None = None) -> list[dict]:
    """Return all JSON-LD blocks from a page, optionally filtered by @type."""
    results = []
    for block in re.findall(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html,
        re.DOTALL,
    ):
        try:
            data = json.loads(block)
            if type_filter is None or data.get("@type") == type_filter:
                results.append(data)
        except json.JSONDecodeError:
            pass
    return results


# ── Step 1: get slugs from the listing page ──────────────────────────────────

def extract_slugs_from_listing(html: str) -> list[str]:
    """Pull restaurant slugs from the explore page (RSC payload + JSON-LD)."""
    slugs: list[str] = []
    seen: set[str] = set()

    def add(slug: str):
        if slug and slug not in seen:
            seen.add(slug)
            slugs.append(slug)

    # 1. RSC payload (staffPicks / communityPicksInitial)
    chunks = re.findall(r'self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)', html)
    combined = ""
    for chunk in chunks:
        try:
            combined += json.loads(chunk)
        except Exception:
            pass

    for array_key in ("staffPicks", "communityPicksInitial"):
        match = re.search(
            rf'"{array_key}"\s*:\s*(\[.*?\])\s*(?:,\s*"|\}})',
            combined,
            re.DOTALL,
        )
        if match:
            try:
                for item in json.loads(match.group(1)):
                    add(item.get("slug", ""))
            except json.JSONDecodeError:
                pass

    # 2. JSON-LD ItemList fallback
    for block in parse_ld_json(html, "ItemList"):
        for entry in block.get("itemListElement", []):
            url = entry.get("item", {}).get("url", "")
            slug = url.rstrip("/").split("/")[-1]
            add(slug)

    return slugs


# ── Step 2: scrape each detail page ──────────────────────────────────────────

def scrape_detail_page(slug: str) -> dict:
    """Fetch the restaurant detail page and parse its JSON-LD."""
    url = f"{BASE_URL}/restaurants/{slug}"
    try:
        html = fetch_page(url)
    except urllib.error.URLError as e:
        print(f"  ✗ {slug}: {e}", file=sys.stderr)
        return {"slug": slug, "dinexp_url": url}

    blocks = parse_ld_json(html, "Restaurant")
    if not blocks:
        print(f"  ✗ {slug}: no Restaurant JSON-LD found", file=sys.stderr)
        return {"slug": slug, "dinexp_url": url}

    r = blocks[0]
    address = r.get("address", {})
    geo = r.get("geo", {})
    rating = r.get("aggregateRating", {})

    cuisine = r.get("servesCuisine", [])
    amenities = [
        f["name"] for f in r.get("amenityFeature", []) if f.get("value")
    ]

    city = address.get("addressLocality", "")
    country = address.get("addressCountry", "")
    if not country or country == "ZA":
        zim_cities = {"harare", "bulawayo", "victoria falls", "mutare", "gweru", "masvingo"}
        if city.lower() in zim_cities:
            country = "ZW"

    return {
        "slug": slug,
        "dinexp_url": url,
        "name": r.get("name", ""),
        "description": r.get("description", ""),
        "city": city,
        "country": country,
        "street_address": address.get("streetAddress", ""),
        "latitude": geo.get("latitude", ""),
        "longitude": geo.get("longitude", ""),
        "telephone": r.get("telephone", ""),
        "price_range": r.get("priceRange", ""),
        "cuisine_types": ", ".join(cuisine) if isinstance(cuisine, list) else cuisine,
        "service_types": "",   # not in detail JSON-LD; available from listing RSC
        "atmosphere_features": ", ".join(amenities),
        "special_features": "",
        "dietary_options": "",
        "cover_url": r.get("image", ""),
        "logo_url": r.get("logo", ""),
        "google_place_rating": rating.get("ratingValue", ""),
        "google_place_ratings_count": rating.get("ratingCount", ""),
    }


# ── Orchestration ─────────────────────────────────────────────────────────────

def _process(listing_html: str, city_filter: str | None, output: str):
    slugs = extract_slugs_from_listing(listing_html)

    if not slugs:
        print("No venue slugs found on listing page.", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(slugs)} venues on listing page. Fetching detail pages…")

    rows = []
    for slug in slugs:
        print(f"  → {BASE_URL}/restaurants/{slug}")
        detail = scrape_detail_page(slug)
        if city_filter and city_filter.lower() not in (detail.get("city") or "").lower():
            continue
        rows.append({field: detail.get(field, "") for field in CSV_FIELDS})
        time.sleep(0.4)   # be polite

    if not rows:
        print("No venues matched the city filter.", file=sys.stderr)
        sys.exit(1)

    with open(output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nSaved {len(rows)} venues to {output}")
    for row in rows:
        print(f"  • {row['name']} — {row['city']}")


def scrape(query: str, city_filter: str | None, output: str):
    url = f"{BASE_URL}/explore?q={urllib.parse.quote(query)}"
    print(f"Fetching listing: {url}")
    try:
        html = fetch_page(url)
    except urllib.error.URLError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    _process(html, city_filter, output)


def scrape_from_file(path: str, city_filter: str | None, output: str):
    with open(path, encoding="utf-8") as f:
        html = f.read()
    _process(html, city_filter, output)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape DineXp venue data to CSV")
    parser.add_argument("--query", default="harare", help="Search query (default: harare)")
    parser.add_argument("--city", default=None, help="Filter results by city name")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help=f"Output CSV (default: {DEFAULT_OUTPUT})")
    parser.add_argument("--file", default=None, help="Parse a locally saved listing HTML file instead of fetching")
    args = parser.parse_args()

    if args.file:
        scrape_from_file(args.file, args.city, args.output)
    else:
        scrape(args.query, args.city, args.output)
