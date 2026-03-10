"""
Scrape venue information from DineXp and export to CSV.

DineXp is a pure Next.js SSR app — there is no separate REST API.
All venue data is embedded in the initial HTML as RSC payload chunks.
We try several URL patterns to find city-specific venues, then scrape
each restaurant detail page for full JSON-LD data.

Usage:
  python3 scripts/scrape_dinexp.py
  python3 scripts/scrape_dinexp.py --city Harare --output harare_venues.csv
  python3 scripts/scrape_dinexp.py --city Bulawayo --output bulawayo_venues.csv
  python3 scripts/scrape_dinexp.py --probe-city Harare   # just print found slugs
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


# ── Step 1: collect slugs ────────────────────────────────────────────────────
#
# DineXp is pure Next.js SSR — no XHR/REST API exists (only analytics pings).
# All venue data is embedded in the initial HTML.  We try every URL pattern
# that might surface city-specific listings.

def extract_slugs_from_html(html: str, seen: set[str], slugs: list[str]):
    def add(slug: str):
        s = slug.strip().lower()
        if s and s not in seen:
            seen.add(s)
            slugs.append(s)

    # 1) JSON-LD ItemList / Restaurant blocks
    for block in parse_ld_json(html):
        t = block.get("@type", "")
        if t == "ItemList":
            for entry in block.get("itemListElement", []):
                item_url = entry.get("item", {}).get("url", "")
                slug = item_url.rstrip("/").split("/")[-1]
                add(slug)
        elif t == "Restaurant":
            url = block.get("url", "")
            slug = url.rstrip("/").split("/")[-1]
            add(slug)

    # 2) All /restaurants/<slug> hrefs
    for m in re.finditer(r'/restaurants/([a-z0-9][a-z0-9\-]+)', html):
        add(m.group(1))

    # 3) RSC payload chunks
    chunks = re.findall(r'self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)', html)
    combined = ""
    for chunk in chunks:
        try:
            combined += json.loads(chunk)
        except Exception:
            pass
    if combined:
        # slug fields in RSC data
        for m in re.finditer(r'"slug"\s*:\s*"([a-z0-9][a-z0-9\-]+)"', combined):
            add(m.group(1))
        # any /restaurants/ paths embedded in the RSC stream
        for m in re.finditer(r'/restaurants/([a-z0-9][a-z0-9\-]+)', combined):
            add(m.group(1))


# Known venue slugs per city, seeded manually from browsing the site.
# Expand this list whenever you discover new venues.
KNOWN_SLUGS: dict[str, list[str]] = {
    "harare": [
        "upstate-by-pariah-harare",
    ],
    "bulawayo": [],
}

# URL patterns to try for a given city / query.
# DineXp's explore page is the only server-rendered listing page.
def listing_urls(city: str | None, query: str) -> list[str]:
    urls = []
    if city:
        c = urllib.parse.quote(city)
        # Exact city name as search query
        urls.append(f"{BASE_URL}/explore?q={c}")
        # Some Next.js sites also use ?city= or ?location= params
        urls.append(f"{BASE_URL}/explore?q=&city={c}")
        urls.append(f"{BASE_URL}/explore?city={c}")
        # Possible kebab-case city slug pages
        slug = city.lower().replace(" ", "-")
        urls.append(f"{BASE_URL}/cities/{slug}")
        urls.append(f"{BASE_URL}/explore/{slug}")
    urls.append(f"{BASE_URL}/explore?q={urllib.parse.quote(query)}")
    return urls


def collect_slugs(city: str | None, query: str) -> list[str]:
    slugs: list[str] = []
    seen: set[str] = set()

    for url in listing_urls(city, query):
        print(f"Fetching listing: {url}")
        try:
            html = fetch(url)
        except urllib.error.URLError as e:
            print(f"  Warning: {e}", file=sys.stderr)
            continue
        before = len(slugs)
        extract_slugs_from_html(html, seen, slugs)
        print(f"  +{len(slugs) - before} slug(s) (total {len(slugs)})")
        time.sleep(0.4)

    # Seed with any manually known slugs for this city
    if city:
        for s in KNOWN_SLUGS.get(city.lower(), []):
            s = s.strip().lower()
            if s and s not in seen:
                seen.add(s)
                slugs.append(s)

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

def run(query: str, city: str | None, output: str, probe: bool = False):
    slugs = collect_slugs(city, query)

    if not slugs:
        print("No slugs found. Try a different --query.", file=sys.stderr)
        sys.exit(1)

    if probe:
        print(f"\n{'='*60}")
        print(f"Probed {len(slugs)} slug(s) for city={city!r}:")
        for s in slugs:
            print(f"  {s}")
        print("Add any correct ones to KNOWN_SLUGS in the script.")
        return

    print(f"\nFound {len(slugs)} venue slug(s). Fetching detail pages…")

    rows = []
    for slug in slugs:
        print(f"  → {slug}")
        detail = scrape_detail(slug)
        if detail is None:
            continue
        venue_city = (detail.get("city") or "").lower()
        if city and city.lower() not in venue_city:
            print(f"     skipped (city on record: '{detail.get('city', '?')}')")
            continue
        rows.append({field: detail.get(field, "") for field in CSV_FIELDS})
        time.sleep(0.5)

    if not rows:
        print(
            f"\nNo venues matched city='{city}'.\n"
            "Try:\n"
            "  python3 scripts/scrape_dinexp.py --probe-city Harare\n"
            "  python3 scripts/scrape_dinexp.py  (no --city, write all to CSV)\n"
            "Then add confirmed Harare slugs to KNOWN_SLUGS in the script.",
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
    parser.add_argument(
        "--probe-city", dest="probe_city", default=None,
        metavar="CITY",
        help="Print all slugs found for a city without writing CSV (for discovery)",
    )
    args = parser.parse_args()

    if args.probe_city:
        run(query=args.probe_city, city=args.probe_city, output=args.output, probe=True)
    else:
        run(args.query, args.city, args.output)
