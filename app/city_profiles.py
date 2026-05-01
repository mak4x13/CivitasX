from dataclasses import dataclass
from typing import Dict, List

from app.models import CityName, ZoneType


@dataclass(frozen=True)
class ZoneTemplate:
    zone_id: str
    label: str
    zone_type: ZoneType
    x: int
    y: int
    transport_weight: float
    economy_weight: float
    education_weight: float
    digital_weight: float
    sentiment_weight: float
    security_weight: float


@dataclass(frozen=True)
class CityProfile:
    name: CityName
    summary: str
    characteristics: List[str]
    density: float
    political_sensitivity: float
    government_dependency: float
    student_ratio: float
    freelancer_ratio: float
    business_dependency: float
    logistics_importance: float
    market_dependency: float
    bus_dependency: float
    traffic_sensitivity: float
    daily_wage_dependency: float
    protest_sensitivity: float
    digital_dependency: float
    event_pressure: float
    security_checkpoint_sensitivity: float
    zone_bias: Dict[str, float]


BASE_ZONES = [
    ZoneTemplate(
        zone_id="gov",
        label="Government Zone",
        zone_type=ZoneType.GOVERNMENT,
        x=0,
        y=0,
        transport_weight=0.75,
        economy_weight=0.35,
        education_weight=0.15,
        digital_weight=0.45,
        sentiment_weight=0.55,
        security_weight=0.95,
    ),
    ZoneTemplate(
        zone_id="uni",
        label="University Zone",
        zone_type=ZoneType.UNIVERSITY,
        x=1,
        y=0,
        transport_weight=0.65,
        economy_weight=0.30,
        education_weight=0.95,
        digital_weight=0.80,
        sentiment_weight=0.50,
        security_weight=0.35,
    ),
    ZoneTemplate(
        zone_id="commercial",
        label="Commercial Zone",
        zone_type=ZoneType.COMMERCIAL,
        x=2,
        y=0,
        transport_weight=0.60,
        economy_weight=0.85,
        education_weight=0.15,
        digital_weight=0.55,
        sentiment_weight=0.45,
        security_weight=0.35,
    ),
    ZoneTemplate(
        zone_id="residential",
        label="Residential Zone",
        zone_type=ZoneType.RESIDENTIAL,
        x=3,
        y=0,
        transport_weight=0.45,
        economy_weight=0.40,
        education_weight=0.50,
        digital_weight=0.60,
        sentiment_weight=0.75,
        security_weight=0.45,
    ),
    ZoneTemplate(
        zone_id="market",
        label="Market Zone",
        zone_type=ZoneType.MARKET,
        x=0,
        y=1,
        transport_weight=0.80,
        economy_weight=0.95,
        education_weight=0.10,
        digital_weight=0.35,
        sentiment_weight=0.60,
        security_weight=0.35,
    ),
    ZoneTemplate(
        zone_id="hub",
        label="Transport Hub",
        zone_type=ZoneType.TRANSPORT_HUB,
        x=1,
        y=1,
        transport_weight=0.95,
        economy_weight=0.55,
        education_weight=0.20,
        digital_weight=0.25,
        sentiment_weight=0.55,
        security_weight=0.50,
    ),
    ZoneTemplate(
        zone_id="industrial",
        label="Industrial Zone",
        zone_type=ZoneType.INDUSTRIAL,
        x=2,
        y=1,
        transport_weight=0.65,
        economy_weight=0.90,
        education_weight=0.05,
        digital_weight=0.35,
        sentiment_weight=0.35,
        security_weight=0.40,
    ),
    ZoneTemplate(
        zone_id="hospital",
        label="Hospital Zone",
        zone_type=ZoneType.HOSPITAL,
        x=3,
        y=1,
        transport_weight=0.50,
        economy_weight=0.25,
        education_weight=0.05,
        digital_weight=0.50,
        sentiment_weight=0.70,
        security_weight=0.55,
    ),
]


CITY_PROFILES = {
    CityName.ISLAMABAD: CityProfile(
        name=CityName.ISLAMABAD,
        summary="Capital city with elevated administrative sensitivity and fast sentiment shifts around restrictive measures.",
        characteristics=[
            "Capital city",
            "High political sensitivity",
            "Government and diplomatic activity",
            "Administrative work dependency",
        ],
        density=0.55,
        political_sensitivity=0.90,
        government_dependency=0.95,
        student_ratio=0.55,
        freelancer_ratio=0.60,
        business_dependency=0.60,
        logistics_importance=0.50,
        market_dependency=0.55,
        bus_dependency=0.45,
        traffic_sensitivity=0.60,
        daily_wage_dependency=0.45,
        protest_sensitivity=0.80,
        digital_dependency=0.65,
        event_pressure=0.40,
        security_checkpoint_sensitivity=0.75,
        zone_bias={
            "government": 0.18,
            "university": 0.08,
            "market": 0.04,
            "transport_hub": 0.06,
        },
    ),
    CityName.LAHORE: CityProfile(
        name=CityName.LAHORE,
        summary="Dense, event-heavy city where transport restrictions and public gatherings create visible ripple effects.",
        characteristics=[
            "High population density",
            "Student-heavy neighborhoods",
            "Traffic congestion pressure",
            "Strong cultural activity",
        ],
        density=0.85,
        political_sensitivity=0.55,
        government_dependency=0.45,
        student_ratio=0.78,
        freelancer_ratio=0.48,
        business_dependency=0.70,
        logistics_importance=0.55,
        market_dependency=0.72,
        bus_dependency=0.72,
        traffic_sensitivity=0.92,
        daily_wage_dependency=0.65,
        protest_sensitivity=0.58,
        digital_dependency=0.52,
        event_pressure=0.88,
        security_checkpoint_sensitivity=0.52,
        zone_bias={
            "university": 0.16,
            "transport_hub": 0.14,
            "commercial": 0.10,
            "market": 0.09,
        },
    ),
    CityName.KARACHI: CityProfile(
        name=CityName.KARACHI,
        summary="Economic hub with heavy logistics and digital-work dependence, making continuity a priority.",
        characteristics=[
            "Economic hub",
            "Very high population density",
            "Port and logistics importance",
            "Large freelancer and digital workforce",
        ],
        density=0.95,
        political_sensitivity=0.65,
        government_dependency=0.50,
        student_ratio=0.55,
        freelancer_ratio=0.85,
        business_dependency=0.95,
        logistics_importance=0.95,
        market_dependency=0.95,
        bus_dependency=0.75,
        traffic_sensitivity=0.80,
        daily_wage_dependency=0.90,
        protest_sensitivity=0.70,
        digital_dependency=0.92,
        event_pressure=0.55,
        security_checkpoint_sensitivity=0.58,
        zone_bias={
            "commercial": 0.18,
            "industrial": 0.16,
            "market": 0.15,
            "transport_hub": 0.12,
        },
    ),
}

