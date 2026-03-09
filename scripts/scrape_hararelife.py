"""
Scrape restaurant listings from hararelife.com/listing_cat/01-restaurants/

The site uses the Townhub WordPress theme with GeoDirectory plugin.
Images are lazy-loaded via data-src attributes.

Usage:
  python3 scripts/scrape_hararelife.py
  python3 scripts/scrape_hararelife.py --output harare_restaurants.csv
  python3 scripts/scrape_hararelife.py --limit 20
"""

from __future__ import annotations

import argparse
import csv
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
    "address",
    "phone",
    "email",
    "website",
    "description",
    "image_url",
    "gallery_images",
    "facilities",
    "status",
    "listing_url",
]

session = requests.Session()
session.headers.update(HEADERS)


def fetch(url: str) -> BeautifulSoup | None:
    try:
        resp = session.get(url, timeout=20)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "lxml")
    except requests.RequestException as e:
        print(f"  Warning fetching {url}: {e}", file=sys.stderr)
        return None


def get_image(tag) -> str:
    """Extract image URL from lazy-loaded img tags (data-src or src)."""
    if not tag:
        return ""
    return tag.get("data-src") or tag.get("data-lazy") or tag.get("src") or ""


def parse_card(article, base_url: str) -> dict:
    """
    Parse a listing card from the listing page.
    Structure: article.geodir-category-listing
    """
    # Name — h4 > a (listing page) or h3.title-sin_map > a (grid page)
    name_el = article.select_one("h4 a") or article.select_one("h3.title-sin_map a") or article.select_one("h3 a")
    name = name_el.get_text(strip=True) if name_el else ""
    listing_url = name_el["href"] if name_el and name_el.get("href") else ""

    # Address
    addr_el = article.select_one(".geodir-category-location a")
    address = addr_el.get_text(strip=True) if addr_el else ""

    # Main image (lazy loaded via data-src)
    img_wrap = article.select_one(".geodir-category-img-wrap img, .listing-thumb-link img")
    image_url = get_image(img_wrap)

    # Status (Now Open / Closed)
    status_el = article.select_one(".geodir_status_date")
    status = status_el.get_text(strip=True) if status_el else ""

    # Phone
    phone_el = article.select_one("a[href^='tel:']")
    phone = phone_el.get_text(strip=True) if phone_el else ""

    # Email
    email_el = article.select_one("a[href^='mailto:']")
    email = email_el.get_text(strip=True) if email_el else ""

    # Website — external link in contacts section
    website_el = article.select_one(".geodir-category_contacts a[href^='http']:not([href*='hararelife'])")
    website = website_el["href"] if website_el else ""

    # Description
    desc_el = article.select_one(".geodir-category-text")
    description = desc_el.get_text(strip=True) if desc_el else ""

    # Facilities (tooltip text from data-tooltip)
    facility_items = article.select(".facilities-list li")
    facilities = ", ".join(
        li.get("data-tooltip", "") or li.get_text(strip=True)
        for li in facility_items
    )

    # Gallery images from data-dynamicPath JSON
    gallery_images = ""
    gal_el = article.select_one("[data-dynamicpath]")
    if gal_el:
        try:
            import json
            paths = json.loads(gal_el["data-dynamicpath"])
            gallery_images = " | ".join(p["src"] for p in paths if "src" in p)
        except Exception:
            pass

    return {
        "name": name,
        "address": address,
        "phone": phone,
        "email": email,
        "website": website,
        "description": description,
        "image_url": image_url,
        "gallery_images": gallery_images,
        "facilities": facilities,
        "status": status,
        "listing_url": listing_url,
    }


def scrape_listing_page(url: str) -> tuple[list[dict], str | None]:
    """Scrape one listing page, return (cards, next_page_url)."""
    soup = fetch(url)
    if not soup:
        return [], None

    articles = soup.select("article.geodir-category-listing")
    cards = [parse_card(a, BASE_URL) for a in articles]

    # Pagination
    next_link = soup.select_one("a.next.page-numbers, a[rel='next']")
    next_url = next_link["href"] if next_link else None

    return cards, next_url


def parse_detail_page(url: str) -> dict:
    """
    Fetch the individual listing detail page for more complete info.
    Uses selectors confirmed from the Townhub WordPress theme structure.
    """
    soup = fetch(url)
    if not soup:
        return {}

    def text(sel):
        el = soup.select_one(sel)
        return el.get_text(strip=True) if el else ""

    # Full description — inside .ldescription block
    description = text(".ldescription .lsingle-block-content")

    # Phone — in hero header or sidebar contacts
    phone_el = (
        soup.select_one(".list-single-header-item a[href^='tel:']")
        or soup.select_one(".list-author-widget-contacts a[href^='tel:']")
        or soup.select_one("a[href^='tel:']")
    )
    phone = phone_el.get_text(strip=True) if phone_el else ""

    # Email
    email_el = (
        soup.select_one(".list-single-header-item a[href^='mailto:']")
        or soup.select_one(".list-author-widget-contacts a[href^='mailto:']")
        or soup.select_one("a[href^='mailto:']")
    )
    email = email_el.get_text(strip=True) if email_el else ""

    # Website — social/contact links in sidebar, excluding hararelife.com
    for a in soup.select(".list-widget-social a[href^='http'], .list-author-widget-contacts a[href^='http']"):
        href = a.get("href", "")
        if href and "hararelife.com" not in href and "gravatar.com" not in href:
            website = href
            break
    else:
        website = ""

    # Hero background image (highest quality main image)
    hero_bg = soup.select_one(".listing-hero-section .bg[data-bg]")
    image_url = hero_bg["data-bg"] if hero_bg else ""

    # Gallery: full-size images from lightgallery popup links
    gal_links = soup.select(".single-carousel a.gal-link.popup-image[href]")
    if gal_links:
        gallery_images = " | ".join(a["href"] for a in gal_links if a.get("href"))
    else:
        # Fallback: thumbnail data-src images
        imgs = soup.select(".single-carousel img")
        gallery_images = " | ".join(get_image(i) for i in imgs if get_image(i))

    # Facilities from .listing-features section on detail page
    facility_items = soup.select(".listing-features li a")
    facilities = ", ".join(a.get_text(strip=True) for a in facility_items)

    return {
        "description": description,
        "phone": phone,
        "email": email,
        "website": website,
        "image_url": image_url,
        "gallery_images": gallery_images,
        "facilities": facilities,
    }


def run(output: str, limit: int | None, skip_detail: bool = False):
    all_cards: list[dict] = []
    seen_urls: set[str] = set()
    page_url: str | None = LISTING_URL

    # Pass 1: collect all listing cards from paginated listing pages
    while page_url:
        print(f"Fetching listing page: {page_url}")
        cards, next_url = scrape_listing_page(page_url)
        print(f"  Found {len(cards)} listing(s)")

        for card in cards:
            url = card["listing_url"]
            if url and url not in seen_urls:
                seen_urls.add(url)
                all_cards.append(card)
                if limit and len(all_cards) >= limit:
                    page_url = None
                    break
        else:
            page_url = next_url
            if page_url:
                time.sleep(1)

    if not all_cards:
        print("No listings found. The site structure may have changed.", file=sys.stderr)
        sys.exit(1)

    print(f"\nCollected {len(all_cards)} listing(s).")

    # Pass 2: enrich with detail page data
    if not skip_detail:
        print("Fetching detail pages for full info…")
        for i, card in enumerate(all_cards, 1):
            if not card["listing_url"]:
                continue
            print(f"  [{i}/{len(all_cards)}] {card['listing_url']}")
            detail = parse_detail_page(card["listing_url"])
            # Merge detail into card — detail wins for non-empty fields
            for key, val in detail.items():
                if val and not card.get(key):
                    card[key] = val
                elif val and key == "description" and len(val) > len(card.get("description", "")):
                    card[key] = val
            time.sleep(0.8)

    # Write CSV
    rows = [{field: card.get(field, "") for field in CSV_FIELDS} for card in all_cards]
    with open(output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nSaved {len(rows)} restaurant(s) → {output}")
    for row in rows:
        print(f"  • {row['name']} | {row['address']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape hararelife.com restaurants to CSV")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help=f"Output CSV (default: {DEFAULT_OUTPUT})")
    parser.add_argument("--limit", type=int, default=None, help="Max restaurants to scrape (default: all)")
    parser.add_argument("--no-detail", action="store_true", help="Skip fetching individual detail pages (faster, less data)")
    args = parser.parse_args()
    run(args.output, args.limit, skip_detail=args.no_detail)
