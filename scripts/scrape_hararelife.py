"""
Scrape restaurant listings from hararelife.com/listing_cat/01-restaurants/

The site uses the Townhub WordPress theme with GeoDirectory plugin.
Images are lazy-loaded via data-src attributes.
Coordinates are embedded in JSON-LD or map data attributes.

Usage:
  python3 scripts/scrape_hararelife.py
  python3 scripts/scrape_hararelife.py --output harare_restaurants.csv
  python3 scripts/scrape_hararelife.py --limit 20
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://hararelife.com"
LISTING_URL = "https://hararelife.com/listing_cat/01-restaurants/"
DEFAULT_OUTPUT = "harare_restaurants.csv"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.9",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": BASE_URL,
}

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

session = requests.Session()
session.headers.update(HEADERS)


def fetch(url: str, retries: int = 4) -> BeautifulSoup | None:
    """Fetch URL with exponential-backoff retry on timeout/connection errors."""
    delay = 2
    for attempt in range(retries + 1):
        try:
            resp = session.get(url, timeout=40)
            resp.raise_for_status()
            return BeautifulSoup(resp.text, "lxml")
        except requests.exceptions.Timeout as e:
            if attempt < retries:
                print(f"  Timeout fetching {url} (attempt {attempt+1}), retrying in {delay}s…", file=sys.stderr)
                time.sleep(delay)
                delay *= 2
            else:
                print(f"  Failed after {retries+1} attempts: {url}", file=sys.stderr)
                return None
        except requests.RequestException as e:
            print(f"  Warning fetching {url}: {e}", file=sys.stderr)
            return None
    return None


def page_url(page_num: int) -> str:
    """Build the listing page URL for a given page number."""
    if page_num == 1:
        return LISTING_URL
    return f"{LISTING_URL}page/{page_num}/"


def get_image(tag) -> str:
    """Extract image URL from lazy-loaded img tags (data-src or src)."""
    if not tag:
        return ""
    return tag.get("data-src") or tag.get("data-lazy") or tag.get("src") or ""


def parse_card(article) -> dict:
    """
    Parse a listing card from the listing page.
    Structure: article.geodir-category-listing
    """
    # Name
    name_el = (
        article.select_one("h4 a")
        or article.select_one("h3.title-sin_map a")
        or article.select_one("h3 a")
    )
    name = name_el.get_text(strip=True) if name_el else ""
    listing_url = name_el["href"] if name_el and name_el.get("href") else ""

    # Address
    addr_el = article.select_one(".geodir-category-location a")
    address = addr_el.get_text(strip=True) if addr_el else ""

    # Category
    cat_el = article.select_one(".geodir-category-opt a, .listing-item-cat a")
    category = cat_el.get_text(strip=True) if cat_el else "Restaurant"

    # Main image (lazy loaded via data-src)
    img_wrap = article.select_one(".geodir-category-img-wrap img, .listing-thumb-link img")
    image_url = get_image(img_wrap)

    # Phone
    phone_el = article.select_one("a[href^='tel:']")
    phone = phone_el.get_text(strip=True) if phone_el else ""

    # Tags / facilities from card
    facility_items = article.select(".facilities-list li")
    tags = ", ".join(
        li.get("data-tooltip", "") or li.get_text(strip=True)
        for li in facility_items
    )

    return {
        "name": name,
        "category": category,
        "address": address,
        "phone": phone,
        "image_url": image_url,
        "tags": tags,
        "listing_url": listing_url,
        # fields populated from detail page
        "description": "",
        "city": "",
        "country": "",
        "menu_url": "",
        "image_url_2": "",
        "image_url_3": "",
        "logo_url": "",
        "latitude": "",
        "longitude": "",
    }


def scrape_listing_page(url: str) -> list[dict]:
    """Scrape one listing page and return cards. Empty list = no more pages."""
    soup = fetch(url)
    if not soup:
        return []

    articles = soup.select("article.geodir-category-listing")
    return [parse_card(a) for a in articles]


def _extract_coords_from_jsonld(soup: BeautifulSoup) -> tuple[str, str]:
    """Try to get lat/lng from JSON-LD schema.org markup."""
    for script in soup.select("script[type='application/ld+json']"):
        try:
            data = json.loads(script.string or "")
            if isinstance(data, list):
                data = data[0]
            geo = data.get("geo", {})
            lat = str(geo.get("latitude", ""))
            lng = str(geo.get("longitude", ""))
            if lat and lng:
                return lat, lng
        except Exception:
            pass
    return "", ""


def _extract_coords_from_map(soup: BeautifulSoup) -> tuple[str, str]:
    """Try to get lat/lng from map embed data attributes."""
    # GeoDirectory map marker
    for sel in [
        "[data-lat][data-lng]",
        ".geodir-map-canvas[data-lat][data-lng]",
        "#listing-map[data-lat][data-lng]",
    ]:
        el = soup.select_one(sel)
        if el:
            return el.get("data-lat", ""), el.get("data-lng", "")

    # Embedded Google Maps iframe src
    iframe = soup.select_one("iframe[src*='maps.google']")
    if iframe:
        m = re.search(r"q=([-\d.]+),([-\d.]+)", iframe.get("src", ""))
        if m:
            return m.group(1), m.group(2)

    # GeoDirectory JS params in inline script
    for script in soup.find_all("script", string=True):
        txt = script.string or ""
        m = re.search(r'"lat"\s*:\s*"?([-\d.]+)"?.*?"lng"\s*:\s*"?([-\d.]+)"?', txt)
        if m:
            return m.group(1), m.group(2)
        m = re.search(r'latitude["\s:]+(["\']?)([-\d.]+)\1.*?longitude["\s:]+(["\']?)([-\d.]+)\3', txt, re.S)
        if m:
            return m.group(2), m.group(4)

    return "", ""


def _extract_gallery(soup: BeautifulSoup) -> list[str]:
    """Return list of full-size gallery image URLs."""
    links = soup.select(".single-carousel a.gal-link.popup-image[href]")
    if links:
        return [a["href"] for a in links if a.get("href")]
    imgs = soup.select(".single-carousel img")
    return [u for u in (get_image(i) for i in imgs) if u]


def parse_detail_page(url: str) -> dict:
    """
    Fetch the individual listing detail page for complete info.
    """
    soup = fetch(url)
    if not soup:
        return {}

    def text(sel):
        el = soup.select_one(sel)
        return el.get_text(strip=True) if el else ""

    # Full description
    description = (
        text(".ldescription .lsingle-block-content")
        or text(".geodir-listing-description")
        or text(".listing-description")
    )

    # Phone
    phone_el = (
        soup.select_one(".list-single-header-item a[href^='tel:']")
        or soup.select_one(".list-author-widget-contacts a[href^='tel:']")
        or soup.select_one("a[href^='tel:']")
    )
    phone = phone_el.get_text(strip=True) if phone_el else ""

    # Category from breadcrumb or meta
    cat_el = (
        soup.select_one(".listing-item-cat a")
        or soup.select_one(".geodir-category-name a")
        or soup.select_one(".list-single-header-category a")
    )
    category = cat_el.get_text(strip=True) if cat_el else ""

    # Address fields — GeoDirectory splits into parts
    address_parts = []
    for sel in [
        ".geodir-field-address",
        ".list-single-header-address",
        ".geodir-output-location",
    ]:
        el = soup.select_one(sel)
        if el:
            address_parts.append(el.get_text(strip=True))
            break

    full_address = address_parts[0] if address_parts else ""

    # City — from address schema or dedicated field
    city = text(".geodir-field-city") or text(".geodir-city") or "Harare"
    country = text(".geodir-field-country") or text(".geodir-country") or "Zimbabwe"

    # Infer city/country from JSON-LD
    for script in soup.select("script[type='application/ld+json']"):
        try:
            data = json.loads(script.string or "")
            if isinstance(data, list):
                data = data[0]
            addr = data.get("address", {})
            if isinstance(addr, dict):
                city = city or addr.get("addressLocality", "")
                country = country or addr.get("addressCountry", "")
        except Exception:
            pass

    # Menu URL — look for a dedicated menu link
    menu_url = ""
    for a in soup.select("a[href]"):
        href = a.get("href", "")
        txt = a.get_text(strip=True).lower()
        if "menu" in txt and href and "hararelife.com" not in href:
            menu_url = href
            break
    if not menu_url:
        # Website link (external) as fallback for menu_url
        for a in soup.select(
            ".list-widget-social a[href^='http'], "
            ".list-author-widget-contacts a[href^='http']"
        ):
            href = a.get("href", "")
            if href and "hararelife.com" not in href and "gravatar.com" not in href:
                menu_url = href
                break

    # Hero background image
    hero_bg = soup.select_one(".listing-hero-section .bg[data-bg]")
    image_url = hero_bg["data-bg"] if hero_bg else ""

    # Gallery images
    gallery = _extract_gallery(soup)
    # If hero image duplicates first gallery item, skip it
    images = [img for img in gallery if img != image_url]
    # If no hero image, use first gallery image as main
    if not image_url and images:
        image_url = images.pop(0)

    image_url_2 = images[0] if len(images) > 0 else ""
    image_url_3 = images[1] if len(images) > 1 else ""

    # Logo — author/business avatar or dedicated logo element
    logo_el = (
        soup.select_one(".author-img img")
        or soup.select_one(".listing-author img")
        or soup.select_one(".geodir-author img")
    )
    logo_url = get_image(logo_el) if logo_el else ""
    # Skip generic gravatar placeholders
    if logo_url and "gravatar.com" in logo_url and "d=mm" in logo_url:
        logo_url = ""

    # Tags from listing features / tags section
    tag_els = soup.select(".listing-features li a, .geodir-listing-tags a, .listing-tags a")
    tags = ", ".join(a.get_text(strip=True) for a in tag_els) if tag_els else ""

    # Facilities as fallback tags
    if not tags:
        fac_els = soup.select(".listing-features li")
        tags = ", ".join(li.get_text(strip=True) for li in fac_els)

    # Coordinates
    latitude, longitude = _extract_coords_from_jsonld(soup)
    if not latitude or not longitude:
        latitude, longitude = _extract_coords_from_map(soup)

    return {
        "description": description,
        "phone": phone,
        "category": category,
        "city": city,
        "country": country,
        "address": full_address,
        "menu_url": menu_url,
        "image_url": image_url,
        "image_url_2": image_url_2,
        "image_url_3": image_url_3,
        "logo_url": logo_url,
        "tags": tags,
        "latitude": latitude,
        "longitude": longitude,
    }


def run(output: str, limit: int | None, skip_detail: bool = False):
    all_cards: list[dict] = []
    seen_urls: set[str] = set()
    page_num = 1

    # Pass 1: walk numbered pages until one returns 0 results (= past last page)
    while True:
        url = page_url(page_num)
        print(f"Fetching listing page {page_num}: {url}")
        cards = scrape_listing_page(url)
        print(f"  Found {len(cards)} listing(s)")

        if not cards:
            print(f"  No listings on page {page_num} — stopping pagination.")
            break

        for card in cards:
            u = card["listing_url"]
            if u and u not in seen_urls:
                seen_urls.add(u)
                all_cards.append(card)

        if limit and len(all_cards) >= limit:
            all_cards = all_cards[:limit]
            break

        page_num += 1
        time.sleep(1.5)

    if not all_cards:
        print("No listings found. The site structure may have changed.", file=sys.stderr)
        sys.exit(1)

    print(f"\nCollected {len(all_cards)} listing(s) across {page_num} page(s).")

    # Pass 2: enrich with detail page data
    if not skip_detail:
        print("Fetching detail pages for full info…")
        for i, card in enumerate(all_cards, 1):
            if not card["listing_url"]:
                continue
            print(f"  [{i}/{len(all_cards)}] {card['listing_url']}")
            detail = parse_detail_page(card["listing_url"])
            for key, val in detail.items():
                # Prefer longer description; otherwise take detail value if card has none
                if key == "description":
                    if len(val) > len(card.get("description", "")):
                        card[key] = val
                elif val and not card.get(key):
                    card[key] = val
            # Default city/country if still blank
            if not card.get("city"):
                card["city"] = "Harare"
            if not card.get("country"):
                card["country"] = "Zimbabwe"
            time.sleep(0.8)

    # Write CSV
    rows = [{field: card.get(field, "") for field in CSV_FIELDS} for card in all_cards]
    with open(output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nSaved {len(rows)} restaurant(s) → {output}")
    for row in rows:
        print(f"  • {row['name']} | {row['address']} | lat={row['latitude']} lng={row['longitude']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape hararelife.com restaurants to CSV")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help=f"Output CSV (default: {DEFAULT_OUTPUT})")
    parser.add_argument("--limit", type=int, default=None, help="Max restaurants to scrape (default: all)")
    parser.add_argument("--no-detail", action="store_true", help="Skip individual detail pages (faster, less data)")
    args = parser.parse_args()
    run(args.output, args.limit, skip_detail=args.no_detail)
