import os
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import List, Optional

from app.city_profiles import CITY_PROFILES
from app.models import CityName, LiveContextItem, LiveContextResponse


class LiveContextService:
    def __init__(self) -> None:
        self.provider = os.getenv("LIVE_CONTEXT_PROVIDER", "fallback").strip().lower()
        self.timeout_seconds = float(os.getenv("LIVE_CONTEXT_TIMEOUT_SECONDS", "3.5"))
        self.max_items = max(1, int(os.getenv("LIVE_CONTEXT_MAX_ITEMS", "5")))

    def get_context(self, city: CityName) -> LiveContextResponse:
        if self.provider == "rss":
            try:
                return self._fetch_rss_context(city)
            except Exception:
                pass

        return self._fallback_context(city)

    def _build_query(self, city: CityName) -> str:
        return (
            f"{city.value} traffic OR roads OR closure OR fuel OR internet OR protest OR security"
        )

    def _fetch_rss_context(self, city: CityName) -> LiveContextResponse:
        query = self._build_query(city)
        encoded_query = urllib.parse.quote_plus(query)
        url = (
            "https://news.google.com/rss/search"
            f"?q={encoded_query}&hl=en-PK&gl=PK&ceid=PK:en"
        )
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": "CivitasX/0.1 (+https://example.invalid)",
            },
        )

        with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
            payload = response.read()

        root = ET.fromstring(payload)
        items: List[LiveContextItem] = []
        seen_titles = set()

        for item in root.findall(".//item"):
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip() or None
            source = (item.findtext("source") or "News feed").strip()
            published_at = self._normalize_pubdate(item.findtext("pubDate"))

            if not title or title in seen_titles:
                continue

            seen_titles.add(title)
            items.append(
                LiveContextItem(
                    title=title,
                    source=source,
                    url=link,
                    published_at=published_at,
                )
            )

            if len(items) >= self.max_items:
                break

        if not items:
            return self._fallback_context(city)

        profile = self._derive_trigger_profile(city, items, live=True)
        summary, signal = self._summarize(city, items, profile=profile, live=True)
        return LiveContextResponse(
            city=city,
            mode="rss",
            trigger_type=profile["trigger_type"],
            severity=profile["severity"],
            confidence=profile["confidence"],
            affected_systems=profile["affected_systems"],
            summary=summary,
            signal=signal,
            query=query,
            updated_at=datetime.now(timezone.utc).isoformat(),
            items=items,
            suggested_scenario=profile["suggested_scenario"],
        )

    def _fallback_context(self, city: CityName) -> LiveContextResponse:
        profile = CITY_PROFILES[city]
        items = [
            LiveContextItem(
                title=entry,
                source="City profile fallback",
            )
            for entry in profile.characteristics[:3]
        ]
        trigger_profile = self._derive_trigger_profile(city, items, live=False)
        return LiveContextResponse(
            city=city,
            mode="fallback",
            trigger_type=trigger_profile["trigger_type"],
            severity=trigger_profile["severity"],
            confidence=trigger_profile["confidence"],
            affected_systems=trigger_profile["affected_systems"],
            summary=(
                f"Using the {city.value} city profile as the current trigger frame "
                "until a live external feed is enabled."
            ),
            signal=profile.summary,
            query=self._build_query(city),
            updated_at=datetime.now(timezone.utc).isoformat(),
            items=items,
            suggested_scenario=trigger_profile["suggested_scenario"],
        )

    def _normalize_pubdate(self, raw_value: Optional[str]) -> Optional[str]:
        if not raw_value:
            return None

        try:
            return parsedate_to_datetime(raw_value).astimezone(timezone.utc).isoformat()
        except Exception:
            return raw_value

    def _summarize(
        self,
        city: CityName,
        items: List[LiveContextItem],
        *,
        profile: dict,
        live: bool,
    ) -> tuple[str, str]:
        source_prefix = "Recent external signals" if live else "Current city-profile signals"
        summary = (
            f"{source_prefix} for {city.value} point to {profile['trigger_type']}. "
            "Use the candidate-decision controls below to test response options before anything is finalized."
        )
        signal = (
            f"Primary trigger: {profile['trigger_type']}. "
            f"Most exposed systems: {', '.join(profile['affected_systems'][:3])}."
        )
        return summary, signal

    def _derive_trigger_profile(
        self,
        city: CityName,
        items: List[LiveContextItem],
        *,
        live: bool,
    ) -> dict:
        text = " ".join(item.title.lower() for item in items)
        topic_map = [
            {
                "keywords": ("fuel", "petrol", "diesel", "price", "import", "supply"),
                "trigger_type": "Fuel supply and pricing pressure",
                "affected_systems": ["Transport", "Markets", "Daily wages"],
                "suggested_scenario": {
                    "scenario_type": "fuel_policy",
                    "fuel_price_increase_pct": 5,
                    "public_transport_support": "normal",
                    "announcement_quality": "clear",
                    "duration_days": 3,
                },
            },
            {
                "keywords": ("traffic", "road", "route", "closure", "diversion", "commute"),
                "trigger_type": "Mobility disruption",
                "affected_systems": ["Transport", "Emergency access", "Education"],
                "suggested_scenario": {
                    "scenario_type": "transport_restriction",
                    "road_closure_level": "partial",
                    "bus_routes_closed": 2,
                    "public_transport_support": "high",
                    "duration_days": 1,
                },
            },
            {
                "keywords": ("internet", "telecom", "network", "connectivity"),
                "trigger_type": "Connectivity strain",
                "affected_systems": ["Digital work", "Education", "Public communication"],
                "suggested_scenario": {
                    "scenario_type": "emergency",
                    "internet_shutdown": "partial",
                    "announcement_quality": "clear",
                    "duration_days": 1,
                },
            },
            {
                "keywords": ("protest", "rally", "march", "sit-in", "unrest"),
                "trigger_type": "Public tension build-up",
                "affected_systems": ["Public order", "Transport", "Markets"],
                "suggested_scenario": {
                    "scenario_type": "security_restriction",
                    "police_presence": "medium",
                    "road_closure_level": "minor",
                    "announcement_quality": "clear",
                    "duration_days": 2,
                },
            },
            {
                "keywords": ("security", "summit", "diplomatic", "checkpoint", "vip"),
                "trigger_type": "Security and access controls",
                "affected_systems": ["Government corridors", "Commuting", "Public access"],
                "suggested_scenario": {
                    "scenario_type": "security_restriction",
                    "road_closure_level": "partial",
                    "police_presence": "high",
                    "bus_routes_closed": 2,
                    "duration_days": 2,
                },
            },
            {
                "keywords": ("rain", "flood", "storm", "weather", "heatwave"),
                "trigger_type": "Weather disruption",
                "affected_systems": ["Mobility", "Safety", "Essential services"],
                "suggested_scenario": {
                    "scenario_type": "emergency",
                    "road_closure_level": "minor",
                    "announcement_quality": "clear",
                    "duration_days": 2,
                },
            },
        ]

        matched = next((entry for entry in topic_map if any(keyword in text for keyword in entry["keywords"])), None)

        if matched is None:
            matched = {
                "trigger_type": "Civic operating pressure",
                "affected_systems": ["Transport", "Markets", "Public sentiment"],
                "suggested_scenario": {
                    "scenario_type": "transport_restriction",
                    "duration_days": 1,
                    "announcement_quality": "neutral",
                },
            }

        severity = "elevated" if live else "baseline"
        confidence = "medium" if live else "low"

        return {
            "trigger_type": matched["trigger_type"],
            "severity": severity,
            "confidence": confidence,
            "affected_systems": matched["affected_systems"],
            "suggested_scenario": matched["suggested_scenario"],
        }


service = LiveContextService()
