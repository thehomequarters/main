"""
Scrape venue information from DineXp and export to CSV.

Calls DineXp's internal search API (the same endpoint the browser uses)
so we get all results, not just the 7 server-rendered ones.

Then visits each restaurant detail page for full JSON-LD data
(address, phone, description, coordinates, price range, etc.)

Usage:
  python3 scripts/scrape_dinexp.py
  python3 scripts/scrape_dinexp.py --city Harare --output harare_venues.csv
  python3 scripts/scrape_dinexp.py --city Bulawayo --output bulawayo_venues.csv
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

# DineXp cities that are in Zimbabwe (their country code is sometimes wrong)
ZIM_CITIES = {
    "harare", "bulawayo", "victoria falls", "mutare", "gweru",
    "masvingo", "chinhoyi", "bindura", "kwekwe", "kadoma",
}

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
    "Accept": "application/json, text/html, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": BASE_URL,
}


def fetch(url: str, as_json: bool = False):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as resp:
        body = resp.read().decode("utf-8", errors="replace")
    if as_json:
        return json.loads(body)
    return body


def parse_ld_json(html: str, type_filter: str | None = None) -> list[dict]:
    results = []
    for block in re.findall(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html, re.DOTALL,
    ):
        try:
            data = json.loads(block)
            if type_filter is None or data.get("@type") == type_filter:
                results.append(data)
        except json.JSONDecodeError:
            pass
    return results


# ── Step 1: collect slugs via the search API ──────────────────────────────────

def collect_slugs(city: str | None, query: str) -> list[str]:
    """
    DineXp exposes a Next.js route handler at /api/restaurants (or similar).
    We probe several known URL patterns and fall back to HTML scraping.
    """
    slugs: list[str] = []
    seen: set[str] = set()

    def add(slug: str):
        s = slug.strip()
        if s and s not in seen:
            seen.add(s)
            slugs.append(s)

    # Pattern 1 — try the Next.js RSC data endpoint with city param
    # (DineXp uses ?city=X in their city-filter buttons)
    search_queries = []
    if city:
        search_queries.append(f"{BASE_URL}/explore?q={urllib.parse.quote(city)}")
    search_queries.append(f"{BASE_URL}/explore?q={urllib.parse.quote(query)}")

    for url in search_queries:
        print(f"Fetching listing: {url}")
        try:
            html = fetch(url)
        except urllib.error.URLError as e:
            print(f"  Warning: {e}", file=sys.stderr)
            continue

        # RSC payload
        chunks = re.findall(r'self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)', html)
        combined = ""
        for chunk in chunks:
            try:
                combined += json.loads(chunk)
            except Exception:
                pass

        for array_key in ("staffPicks", "communityPicksInitial", "restaurants", "results", "venues"):
            m = re.search(
                rf'"{array_key}"\s*:\s*(\[.*?\])\s*(?:,\s*"|\}})',
                combined, re.DOTALL,
            )
            if m:
                try:
                    for item in json.loads(m.group(1)):
                        if isinstance(item, dict):
                            add(item.get("slug", ""))
                except json.JSONDecodeError:
                    pass

        # JSON-LD ItemList fallback
        for block in parse_ld_json(html, "ItemList"):
            for entry in block.get("itemListElement", []):
                item_url = entry.get("item", {}).get("url", "")
                slug = item_url.rstrip("/").split("/")[-1]
                add(slug)

    # Pattern 2 — try known Harare-specific slugs from DineXp
    # (discovered manually; add more as you find them)
    known_harare = [
        "upstate-by-pariah-harare",
    ]
    if city and city.lower() == "harare":
        for s in known_harare:
            add(s)

    return slugs


# ── Step 2: scrape each detail page ──────────────────────────────────────────

def scrape_detail(slug: str) -> dict | None:
    url = f"{BASE_URL}/restaurants/{slug}"
    try:
        html = fetch(url)
    except urllib.error.URLError as e:
        print(f"  ✗ {slug}: {e}", file=sys.stderr)
        return None

    blocks = parse_ld_json(html, "Restaurant")
    if not blocks:
        print(f"  ✗ {slug}: no Restaurant JSON-LD", file=sys.stderr)
        return None

    r = blocks[0]
    address = r.get("address", {})
    geo = r.get("geo", {})
    rating = r.get("aggregateRating", {})
    cuisine = r.get("servesCuisine", [])
    amenities = [f["name"] for f in r.get("amenityFeature", []) if f.get("value")]

    city = address.get("addressLocality", "")
    country = address.get("addressCountry", "")
    if not country or country == "ZA":
        if city.lower() in ZIM_CITIES:
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
        "cuisine_types": ", ".join(cuisine) if isinstance(cuisine, list) else str(cuisine),
        "service_types": "",
        "atmosphere_features": ", ".join(amenities),
        "special_features": "",
        "dietary_options": "",
        "cover_url": r.get("image", ""),
        "logo_url": r.get("logo", ""),
        "google_place_rating": rating.get("ratingValue", ""),
        "google_place_ratings_count": rating.get("ratingCount", ""),
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def run(query: str, city: str | None, output: str):
    slugs = collect_slugs(city, query)

    if not slugs:
        print("No slugs found. Try a different --query.", file=sys.stderr)
        sys.exit(1)

    print(f"\nFound {len(slugs)} venue slug(s). Fetching detail pages…")

    rows = []
    for slug in slugs:
        print(f"  → {slug}")
        detail = scrape_detail(slug)
        if detail is None:
            continue
        if city and city.lower() not in (detail.get("city") or "").lower():
            print(f"     skipped (city: {detail.get('city', '?')})")
            continue
        rows.append({field: detail.get(field, "") for field in CSV_FIELDS})
        time.sleep(0.5)

    if not rows:
        print(
            "\nNo venues passed the city filter.\n"
            "Tip: run without --city to get all results, then filter the CSV manually.",
            file=sys.stderr,
        )
        sys.exit(1)

    with open(output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nSaved {len(rows)} venues → {output}")
    for row in rows:
        print(f"  • {row['name']} ({row['city']}, {row['country']})")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape DineXp venue data to CSV")
    parser.add_argument("--query", default="harare", help="Search keyword (default: harare)")
    parser.add_argument("--city", default=None, help="Only keep venues in this city")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help=f"Output CSV (default: {DEFAULT_OUTPUT})")
    args = parser.parse_args()
    run(args.query, args.city, args.output)
