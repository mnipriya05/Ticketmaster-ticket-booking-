import json
import time
from decimal import Decimal

import requests
from django.conf import settings
from django.db import transaction

from .models import MockEvent


TICKETMASTER_EVENTS_URL = (
    "https://app.ticketmaster.com/"
    "discovery/v2/events.json"
)


PAGE_SIZE = 200
MAX_PAGES = 1
REQUEST_DELAY = 0.3


EXCHANGE_RATES_TO_INR = {
    "INR": Decimal("1"),
    "USD": Decimal("84"),
    "EUR": Decimal("91"),
    "GBP": Decimal("108"),
    "AUD": Decimal("55"),
    "CAD": Decimal("62"),
}


def convert_to_inr(amount, currency):
    if amount is None:
        return None

    try:
        amount = Decimal(str(amount))
    except (TypeError, ValueError):
        return None

    rate = EXCHANGE_RATES_TO_INR.get(
        str(currency).upper(),
        Decimal("1"),
    )

    return (amount * rate).quantize(
        Decimal("0.01")
    )


def get_price_in_inr(event_data):
    price_ranges = (
        event_data.get("priceRanges") or []
    )

    prices = []

    for price_range in price_ranges:
        currency = price_range.get(
            "currency",
            "INR",
        )

        minimum = convert_to_inr(
            price_range.get("min"),
            currency,
        )

        if minimum is not None:
            prices.append(minimum)

    if not prices:
        return Decimal("999.00")

    return min(prices)


def get_first_venue(event_data):
    venues = (
        event_data
        .get("_embedded", {})
        .get("venues", [])
    )

    if not venues:
        return {}

    return venues[0]


def get_image_url(event_data):
    images = event_data.get(
        "images",
        [],
    )

    if not images:
        return ""

    images = sorted(
        images,
        key=lambda image: image.get(
            "width",
            0,
        ),
        reverse=True,
    )

    return images[0].get(
        "url",
        "",
    )


def normalize_event(event_data):
    venue = get_first_venue(event_data)

    start = (
        event_data
        .get("dates", {})
        .get("start", {})
    )

    venue_city = venue.get(
        "city",
        {},
    )

    event_date = start.get(
        "dateTime"
    )

    description = (
        event_data.get("info")
        or event_data.get("pleaseNote")
        or ""
    )

    return {
        "tm_event_id": event_data.get(
            "id",
            "",
        ),

        "name": event_data.get(
            "name",
            "Untitled event",
        ),

        "description": description,

        "event_date": event_date,

        "venue_name": venue.get(
            "name",
            "",
        ),

        "city": venue_city.get(
            "name",
            "",
        ),

        "price_per_seat": get_price_in_inr(
            event_data
        ),

        "seatmap_url": (
            event_data
            .get("seatmap", {})
            .get("staticUrl", "")
        ),

        "raw_data": json.dumps(
            event_data
        ),
    }


def fetch_ticketmaster_page(
    page=0,
    keyword=None,
    city=None,
    country_code=None,
    classification_name=None,
):
    params = {
        "apikey": settings.TICKETMASTER_API_KEY,
        "size": PAGE_SIZE,
        "page": page,
        "sort": "date,asc",
    }

    if keyword:
        params["keyword"] = keyword

    if city:
        params["city"] = city

    if country_code:
        params["countryCode"] = country_code

    if classification_name:
        params["classificationName"] = (
            classification_name
        )

    response = requests.get(
        TICKETMASTER_EVENTS_URL,
        params=params,
        timeout=30,
    )

    print(
        "Ticketmaster request:",
        response.url,
    )

    print(
        "Ticketmaster status:",
        response.status_code,
    )

    response.raise_for_status()

    return response.json()


def save_event(event_data):
    normalized = normalize_event(
        event_data
    )

    tm_event_id = normalized[
        "tm_event_id"
    ]

    if not tm_event_id:
        return None, False

    defaults = {
        "name": normalized["name"],

        "description": normalized[
            "description"
        ],

        "event_date": normalized[
            "event_date"
        ],

        "venue_name": normalized[
            "venue_name"
        ],

        "city": normalized[
            "city"
        ],

        "price_per_seat": normalized[
            "price_per_seat"
        ],

        "seatmap_url": normalized[
            "seatmap_url"
        ],

        "raw_data": normalized[
            "raw_data"
        ],
    }

    with transaction.atomic():
        event, created = (
            MockEvent.objects.update_or_create(
                tm_event_id=tm_event_id,
                defaults=defaults,
            )
        )

    return event, created


def sync_one_query(
    keyword=None,
    city=None,
    country_code=None,
    classification_name=None,
):
    created_count = 0
    updated_count = 0
    skipped_count = 0

    for page in range(MAX_PAGES):
        data = fetch_ticketmaster_page(
            page=page,
            keyword=keyword,
            city=city,
            country_code=country_code,
            classification_name=(
                classification_name
            ),
        )

        events = (
            data
            .get("_embedded", {})
            .get("events", [])
        )

        page_info = data.get(
            "page",
            {},
        )

        total_pages = page_info.get(
            "totalPages",
            0,
        )

        current_page = page_info.get(
            "number",
            page,
        )

        print(
            f"Page {current_page + 1}: "
            f"{len(events)} events"
        )

        if not events:
            break

        for event_data in events:
            try:
                event, created = save_event(
                    event_data
                )

            except Exception as error:
                skipped_count += 1

                print(
                    "Skipped event because of error:",
                    error,
                )

                continue

            if event is None:
                skipped_count += 1
                continue

            if created:
                created_count += 1
            else:
                updated_count += 1

        if (
            total_pages == 0
            or current_page + 1 >= total_pages
        ):
            break

        time.sleep(REQUEST_DELAY)

    print(
        "Skipped:",
        skipped_count,
    )

    return created_count, updated_count


def sync_ticketmaster_events():
    total_created = 0
    total_updated = 0

    queries = [
        {
            "country_code": "US",
            "classification_name": "Music",
        },

        {
            "country_code": "US",
            "classification_name": "Sports",
        },

        {
            "country_code": "US",
            "classification_name": (
                "Arts & Theatre"
            ),
        },

        {
            "country_code": "CA",
            "classification_name": "Music",
        },

        {
            "country_code": "GB",
            "classification_name": "Music",
        },
    ]

    for query in queries:
        print(
            "Running query:",
            query,
        )

        created_count, updated_count = (
            sync_one_query(**query)
        )

        total_created += created_count
        total_updated += updated_count

    return total_created, total_updated


def search_events(
    keyword="",
    city="",
    country_code="",
    classification_name="",
):
    events = []

    for page in range(MAX_PAGES):
        data = fetch_ticketmaster_page(
            page=page,
            keyword=keyword or None,
            city=city or None,
            country_code=country_code or None,
            classification_name=(
                classification_name or None
            ),
        )

        page_events = (
            data
            .get("_embedded", {})
            .get("events", [])
        )

        if not page_events:
            break

        for event_data in page_events:
            events.append(
                normalize_event(event_data)
            )

        page_info = data.get(
            "page",
            {},
        )

        total_pages = page_info.get(
            "totalPages",
            page + 1,
        )

        current_page = page_info.get(
            "number",
            page,
        )

        if current_page + 1 >= total_pages:
            break

        time.sleep(REQUEST_DELAY)

    return events