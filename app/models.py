from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CityName(str, Enum):
    ISLAMABAD = "Islamabad"
    LAHORE = "Lahore"
    KARACHI = "Karachi"


class ScenarioType(str, Enum):
    TRANSPORT_RESTRICTION = "transport_restriction"
    FUEL_POLICY = "fuel_policy"
    PUBLIC_EVENT = "public_event"
    EMERGENCY = "emergency"
    SECURITY_RESTRICTION = "security_restriction"


class RoadClosureLevel(str, Enum):
    NONE = "none"
    MINOR = "minor"
    PARTIAL = "partial"
    MAJOR = "major"


class PolicePresence(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class InternetShutdownLevel(str, Enum):
    OFF = "off"
    PARTIAL = "partial"
    FULL = "full"


class SupportLevel(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"


class AnnouncementQuality(str, Enum):
    POOR = "poor"
    NEUTRAL = "neutral"
    CLEAR = "clear"


class ZoneStatus(str, Enum):
    STABLE = "stable"
    STRESSED = "stressed"
    DISRUPTED = "disrupted"
    CRITICAL = "critical"


class ZoneType(str, Enum):
    GOVERNMENT = "government"
    UNIVERSITY = "university"
    COMMERCIAL = "commercial"
    RESIDENTIAL = "residential"
    MARKET = "market"
    TRANSPORT_HUB = "transport_hub"
    INDUSTRIAL = "industrial"
    HOSPITAL = "hospital"


class ScenarioRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "city": "Islamabad",
                "scenario_type": "transport_restriction",
                "fuel_price_increase_pct": 0,
                "bus_routes_closed": 5,
                "road_closure_level": "major",
                "police_presence": "medium",
                "internet_shutdown": "partial",
                "public_transport_support": "normal",
                "announcement_quality": "poor",
                "duration_days": 2,
                "exam_day": False,
                "event_day": False,
            }
        }
    )

    city: CityName
    scenario_type: ScenarioType = ScenarioType.TRANSPORT_RESTRICTION
    fuel_price_increase_pct: float = Field(0, ge=0, le=100)
    bus_routes_closed: int = Field(0, ge=0, le=20)
    road_closure_level: RoadClosureLevel = RoadClosureLevel.NONE
    police_presence: PolicePresence = PolicePresence.LOW
    internet_shutdown: InternetShutdownLevel = InternetShutdownLevel.OFF
    public_transport_support: SupportLevel = SupportLevel.NORMAL
    announcement_quality: AnnouncementQuality = AnnouncementQuality.NEUTRAL
    duration_days: int = Field(1, ge=1, le=14)
    exam_day: bool = False
    event_day: bool = False

    @field_validator("fuel_price_increase_pct")
    def normalize_fuel_price(cls, value: float) -> float:
        return round(value, 2)


class ScoreBundle(BaseModel):
    city_stability: int
    mobility: int
    commute_disruption: int
    congestion: int
    economic_impact: int
    economic_continuity: int
    education_disruption: int
    education_continuity: int
    internet_dependency_risk: int
    public_sentiment: int
    protest_probability: int


class AgentResult(BaseModel):
    score: int
    risk: str
    key_reason: str
    summary: str
    recommendation: str
    drivers: List[str] = Field(default_factory=list)


class CityProfileView(BaseModel):
    name: CityName
    summary: str
    characteristics: List[str]
    sensitivities: Dict[str, float]


class ZoneImpact(BaseModel):
    zone_id: str
    label: str
    zone_type: ZoneType
    x: int
    y: int
    status: ZoneStatus
    risk_score: int
    indicators: List[str] = Field(default_factory=list)
    summary: str


class NetworkNode(BaseModel):
    id: str
    label: str
    kind: str
    activity: int
    risk: str


class NetworkEdge(BaseModel):
    source: str
    target: str
    influence: int
    highlighted: bool
    label: str


class AgentNetwork(BaseModel):
    nodes: List[NetworkNode]
    edges: List[NetworkEdge]


class ScoreDeltaBundle(BaseModel):
    city_stability: int
    mobility: int
    economic_impact: int
    education_continuity: int
    internet_dependency_risk: int
    public_sentiment: int
    protest_probability: int


class ScenarioComparison(BaseModel):
    current_scores: ScoreBundle
    recommended_scores: ScoreBundle
    score_deltas: ScoreDeltaBundle
    headline: str


class SimulationResponse(BaseModel):
    city: CityName
    scenario: ScenarioRequest
    city_profile: CityProfileView
    scores: ScoreBundle
    agents: Dict[str, AgentResult]
    conflicts: List[str]
    main_risks: List[str]
    zone_impacts: List[ZoneImpact]
    agent_network: AgentNetwork
    executive_summary: str
    alternative_policy: Optional[ScenarioRequest] = None
    comparison: Optional[ScenarioComparison] = None
    generated_by: str


class ComparisonRequest(BaseModel):
    current: ScenarioRequest
    proposed: ScenarioRequest


class ComparisonResponse(BaseModel):
    current: SimulationResponse
    proposed: SimulationResponse
    deltas: ScoreDeltaBundle
    verdict: str


class CityCatalogItem(BaseModel):
    name: CityName
    summary: str
    highlights: List[str]


class CityCatalogResponse(BaseModel):
    cities: List[CityCatalogItem]


class LiveContextItem(BaseModel):
    title: str
    source: str
    url: Optional[str] = None
    published_at: Optional[str] = None


class LiveContextResponse(BaseModel):
    city: CityName
    mode: str
    trigger_type: str
    severity: str
    confidence: str
    affected_systems: List[str] = Field(default_factory=list)
    summary: str
    signal: str
    query: str
    updated_at: str
    items: List[LiveContextItem] = Field(default_factory=list)
    suggested_scenario: Dict[str, object] = Field(default_factory=dict)


class MetadataResponse(BaseModel):
    default_scenario: ScenarioRequest
    options: Dict[str, List[str]]
