from copy import deepcopy
from typing import Dict, List, Tuple

from app.city_profiles import BASE_ZONES, CITY_PROFILES, CityProfile
from app.llm import GroqExplanationService
from app.models import (
    AgentNetwork,
    AgentResult,
    AnnouncementQuality,
    CityCatalogItem,
    CityCatalogResponse,
    CityProfileView,
    ComparisonResponse,
    MetadataResponse,
    NetworkEdge,
    NetworkNode,
    PolicePresence,
    RoadClosureLevel,
    ScenarioComparison,
    ScenarioRequest,
    ScoreBundle,
    ScoreDeltaBundle,
    SimulationResponse,
    SupportLevel,
    ZoneImpact,
    ZoneStatus,
)


ROAD_FACTORS = {
    RoadClosureLevel.NONE: 0.00,
    RoadClosureLevel.MINOR: 0.25,
    RoadClosureLevel.PARTIAL: 0.60,
    RoadClosureLevel.MAJOR: 0.95,
}

POLICE_FACTORS = {
    PolicePresence.LOW: 0.20,
    PolicePresence.MEDIUM: 0.50,
    PolicePresence.HIGH: 0.85,
}

SUPPORT_FACTORS = {
    SupportLevel.LOW: 0.25,
    SupportLevel.NORMAL: 0.55,
    SupportLevel.HIGH: 0.85,
}

ANNOUNCEMENT_FACTORS = {
    AnnouncementQuality.POOR: 0.20,
    AnnouncementQuality.NEUTRAL: 0.55,
    AnnouncementQuality.CLEAR: 0.90,
}

INTERNET_FACTORS = {
    "off": 0.00,
    "partial": 0.55,
    "full": 1.00,
}

ROAD_SEQUENCE = [
    RoadClosureLevel.NONE,
    RoadClosureLevel.MINOR,
    RoadClosureLevel.PARTIAL,
    RoadClosureLevel.MAJOR,
]


def clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def to_score(value: float) -> int:
    return int(round(max(0.0, min(100.0, value * 100))))


def invert_score(value: float) -> int:
    return int(round(max(0.0, min(100.0, (1.0 - value) * 100))))


def risk_label(score: int) -> str:
    if score >= 85:
        return "Critical"
    if score >= 70:
        return "High"
    if score >= 55:
        return "Medium-High"
    if score >= 35:
        return "Medium"
    return "Low"


def zone_status(score: int) -> ZoneStatus:
    if score >= 75:
        return ZoneStatus.CRITICAL
    if score >= 55:
        return ZoneStatus.DISRUPTED
    if score >= 35:
        return ZoneStatus.STRESSED
    return ZoneStatus.STABLE


def model_copy(instance):
    if hasattr(instance, "model_copy"):
        return instance.model_copy(deep=True)
    return instance.copy(deep=True)


def model_dump(instance):
    if hasattr(instance, "model_dump"):
        return instance.model_dump()
    return instance.dict()


class PolicySimulationEngine:
    def __init__(self) -> None:
        self.llm_service = GroqExplanationService()

    def get_city_catalog(self) -> CityCatalogResponse:
        cities = []
        for profile in CITY_PROFILES.values():
            cities.append(
                CityCatalogItem(
                    name=profile.name,
                    summary=profile.summary,
                    highlights=profile.characteristics,
                )
            )
        return CityCatalogResponse(cities=cities)

    def get_metadata(self) -> MetadataResponse:
        return MetadataResponse(
            default_scenario=ScenarioRequest(city="Islamabad"),
            options={
                "cities": [city.value for city in CITY_PROFILES.keys()],
                "scenario_types": [
                    "transport_restriction",
                    "fuel_policy",
                    "public_event",
                    "emergency",
                    "security_restriction",
                ],
                "road_closure_levels": [level.value for level in ROAD_SEQUENCE],
                "police_presence_levels": ["low", "medium", "high"],
                "internet_shutdown_levels": ["off", "partial", "full"],
                "public_transport_support_levels": ["low", "normal", "high"],
                "announcement_quality_levels": ["poor", "neutral", "clear"],
            },
        )

    def simulate(
        self,
        scenario: ScenarioRequest,
        include_alternative: bool = True,
        use_llm: bool = False,
    ) -> SimulationResponse:
        result = self._simulate(scenario, include_alternative=False, use_llm=use_llm)
        if not include_alternative:
            return result

        alternative = self._build_alternative_policy(scenario, result)
        comparison = None
        if model_dump(alternative) != model_dump(scenario):
            recommended = self._simulate(
                alternative,
                include_alternative=False,
                use_llm=False,
            )
            comparison = ScenarioComparison(
                current_scores=result.scores,
                recommended_scores=recommended.scores,
                score_deltas=ScoreDeltaBundle(
                    city_stability=recommended.scores.city_stability
                    - result.scores.city_stability,
                    mobility=recommended.scores.mobility - result.scores.mobility,
                    economic_impact=result.scores.economic_impact
                    - recommended.scores.economic_impact,
                    education_continuity=recommended.scores.education_continuity
                    - result.scores.education_continuity,
                    internet_dependency_risk=result.scores.internet_dependency_risk
                    - recommended.scores.internet_dependency_risk,
                    public_sentiment=recommended.scores.public_sentiment
                    - result.scores.public_sentiment,
                    protest_probability=result.scores.protest_probability
                    - recommended.scores.protest_probability,
                ),
                headline=self._build_comparison_headline(result.scores, recommended.scores),
            )
            result.alternative_policy = alternative
            result.comparison = comparison
            if use_llm:
                result.executive_summary = self._maybe_enhance_summary(result)
        return result

    def compare(
        self,
        current: ScenarioRequest,
        proposed: ScenarioRequest,
        use_llm: bool = False,
    ) -> ComparisonResponse:
        current_result = self.simulate(
            current,
            include_alternative=False,
            use_llm=use_llm,
        )
        proposed_result = self.simulate(
            proposed,
            include_alternative=False,
            use_llm=use_llm,
        )
        deltas = ScoreDeltaBundle(
            city_stability=proposed_result.scores.city_stability
            - current_result.scores.city_stability,
            mobility=proposed_result.scores.mobility - current_result.scores.mobility,
            economic_impact=current_result.scores.economic_impact
            - proposed_result.scores.economic_impact,
            education_continuity=proposed_result.scores.education_continuity
            - current_result.scores.education_continuity,
            internet_dependency_risk=current_result.scores.internet_dependency_risk
            - proposed_result.scores.internet_dependency_risk,
            public_sentiment=proposed_result.scores.public_sentiment
            - current_result.scores.public_sentiment,
            protest_probability=current_result.scores.protest_probability
            - proposed_result.scores.protest_probability,
        )
        verdict = self._build_comparison_headline(
            current_result.scores,
            proposed_result.scores,
        )
        return ComparisonResponse(
            current=current_result,
            proposed=proposed_result,
            deltas=deltas,
            verdict=verdict,
        )

    def _simulate(
        self,
        scenario: ScenarioRequest,
        include_alternative: bool = False,
        use_llm: bool = False,
    ) -> SimulationResponse:
        profile = CITY_PROFILES[scenario.city]
        context = self._build_context(scenario, profile)
        transport = self._run_transport_agent(profile, context)
        internet_base = self._run_internet_baseline_agent(profile, context, transport)
        economy = self._run_economy_agent(profile, context, transport, internet_base)
        education = self._run_education_agent(profile, context, transport, internet_base)
        internet = self._run_internet_final_agent(
            profile,
            context,
            transport,
            internet_base,
            economy,
            education,
        )
        economy = self._refine_economy_agent(economy, internet)
        education = self._refine_education_agent(education, context, internet)
        sentiment = self._run_sentiment_agent(
            profile,
            context,
            transport,
            economy,
            education,
            internet,
        )
        conflicts = self._detect_conflicts(
            scenario,
            transport,
            economy,
            education,
            internet,
            sentiment,
        )
        scores = self._build_scores(transport, economy, education, internet, sentiment, conflicts)
        agents = self._build_agent_cards(
            scenario,
            profile,
            transport,
            economy,
            education,
            internet,
            sentiment,
            scores,
            conflicts,
        )
        zones = self._build_zone_impacts(profile, transport, economy, education, internet, sentiment)
        network = self._build_network(transport, economy, education, internet, sentiment)
        main_risks = self._build_main_risks(scores, conflicts, agents)
        executive_summary = self._build_executive_summary(
            scenario,
            profile,
            scores,
            conflicts,
            main_risks,
        )
        response = SimulationResponse(
            city=scenario.city,
            scenario=scenario,
            city_profile=self._profile_view(profile),
            scores=scores,
            agents=agents,
            conflicts=conflicts,
            main_risks=main_risks,
            zone_impacts=zones,
            agent_network=network,
            executive_summary=executive_summary,
            alternative_policy=None,
            comparison=None,
            generated_by="rule_based",
        )
        if use_llm:
            response.executive_summary = self._maybe_enhance_summary(response)
            response.generated_by = "groq" if response.executive_summary != executive_summary else "rule_based"
        return response

    def _profile_view(self, profile: CityProfile) -> CityProfileView:
        return CityProfileView(
            name=profile.name,
            summary=profile.summary,
            characteristics=profile.characteristics,
            sensitivities={
                "density": round(profile.density, 2),
                "political_sensitivity": round(profile.political_sensitivity, 2),
                "student_ratio": round(profile.student_ratio, 2),
                "freelancer_ratio": round(profile.freelancer_ratio, 2),
                "business_dependency": round(profile.business_dependency, 2),
                "digital_dependency": round(profile.digital_dependency, 2),
            },
        )

    def _build_context(self, scenario: ScenarioRequest, profile: CityProfile) -> Dict[str, float]:
        road_factor = ROAD_FACTORS[scenario.road_closure_level]
        bus_factor = clamp01(scenario.bus_routes_closed / 8.0)
        fuel_factor = clamp01(scenario.fuel_price_increase_pct / 25.0)
        duration_factor = clamp01(scenario.duration_days / 3.0)
        police_factor = POLICE_FACTORS[scenario.police_presence]
        support_factor = SUPPORT_FACTORS[scenario.public_transport_support]
        announcement_factor = ANNOUNCEMENT_FACTORS[scenario.announcement_quality]
        internet_factor = INTERNET_FACTORS[scenario.internet_shutdown.value]
        exam_factor = 1.0 if scenario.exam_day else 0.0
        event_factor = 1.0 if scenario.event_day else 0.0
        if scenario.scenario_type.value == "public_event":
            event_factor = max(event_factor, profile.event_pressure)
        return {
            "road_factor": road_factor,
            "bus_factor": bus_factor,
            "fuel_factor": fuel_factor,
            "duration_factor": duration_factor,
            "police_factor": police_factor,
            "support_factor": support_factor,
            "announcement_factor": announcement_factor,
            "internet_factor": internet_factor,
            "exam_factor": exam_factor,
            "event_factor": event_factor,
        }

    def _run_transport_agent(self, profile: CityProfile, ctx: Dict[str, float]) -> Dict[str, float]:
        commute_risk = clamp01(
            0.52 * ctx["road_factor"] * (0.5 + 0.5 * profile.traffic_sensitivity)
            + 0.32 * ctx["bus_factor"] * (0.45 + 0.55 * profile.bus_dependency)
            + 0.10 * ctx["fuel_factor"] * (0.4 + 0.6 * profile.market_dependency)
            + 0.12 * ctx["duration_factor"]
            + 0.10 * ctx["police_factor"] * profile.security_checkpoint_sensitivity
            + 0.08 * ctx["event_factor"] * profile.event_pressure
            - 0.12 * ctx["support_factor"]
        )
        congestion_risk = clamp01(
            0.48 * ctx["road_factor"] * (0.4 + 0.6 * profile.traffic_sensitivity)
            + 0.22 * ctx["bus_factor"]
            + 0.16 * profile.density
            + 0.12 * ctx["duration_factor"]
            + 0.10 * ctx["fuel_factor"] * 0.6
            - 0.12 * ctx["support_factor"]
        )
        market_access = clamp01(
            1.0
            - (
                0.55 * commute_risk
                + 0.25 * ctx["road_factor"]
                + 0.10 * ctx["bus_factor"]
                - 0.20 * ctx["support_factor"]
            )
        )
        online_shift_pressure = clamp01(
            0.65 * commute_risk + 0.20 * ctx["road_factor"] + 0.15 * ctx["bus_factor"]
        )
        return {
            "commute_risk": commute_risk,
            "congestion_risk": congestion_risk,
            "mobility_score": clamp01(1.0 - (0.62 * commute_risk + 0.38 * congestion_risk)),
            "market_access": market_access,
            "online_shift_pressure": online_shift_pressure,
        }

    def _run_internet_baseline_agent(
        self,
        profile: CityProfile,
        ctx: Dict[str, float],
        transport: Dict[str, float],
    ) -> Dict[str, float]:
        digital_dependency = clamp01(
            0.45 * profile.digital_dependency
            + 0.20 * profile.freelancer_ratio
            + 0.15 * profile.student_ratio
            + 0.20 * transport["online_shift_pressure"]
        )
        freelancer_risk = clamp01(
            0.55 * ctx["internet_factor"]
            + 0.20 * profile.freelancer_ratio
            + 0.15 * ctx["duration_factor"]
            + 0.10 * transport["online_shift_pressure"]
        )
        education_risk = clamp01(
            0.52 * ctx["internet_factor"]
            + 0.22 * profile.student_ratio
            + 0.16 * transport["online_shift_pressure"]
            + 0.10 * ctx["exam_factor"]
        )
        economy_risk = clamp01(
            0.50 * ctx["internet_factor"]
            + 0.22 * profile.business_dependency
            + 0.18 * profile.logistics_importance
            + 0.10 * ctx["duration_factor"]
        )
        return {
            "digital_dependency": digital_dependency,
            "freelancer_risk": freelancer_risk,
            "education_risk": education_risk,
            "economy_risk": economy_risk,
        }

    def _run_economy_agent(
        self,
        profile: CityProfile,
        ctx: Dict[str, float],
        transport: Dict[str, float],
        internet: Dict[str, float],
    ) -> Dict[str, float]:
        remote_fallback_need = clamp01(
            0.45 * transport["commute_risk"]
            + 0.25 * ctx["road_factor"]
            + 0.15 * ctx["bus_factor"]
            + 0.15 * profile.freelancer_ratio
        )
        economic_disruption = clamp01(
            0.30 * transport["commute_risk"]
            + 0.26 * internet["freelancer_risk"]
            + 0.20 * (1.0 - transport["market_access"])
            + 0.10 * ctx["duration_factor"]
            + 0.09 * profile.market_dependency
            + 0.05 * ctx["fuel_factor"]
            + 0.08 * profile.business_dependency * profile.digital_dependency
        )
        daily_wage_risk = clamp01(
            0.42 * transport["commute_risk"]
            + 0.20 * ctx["duration_factor"]
            + 0.18 * profile.daily_wage_dependency
            + 0.10 * (1.0 - ctx["support_factor"])
            + 0.10 * ctx["road_factor"]
        )
        business_continuity_risk = clamp01(
            0.30 * economic_disruption
            + 0.24 * internet["economy_risk"]
            + 0.18 * ctx["road_factor"]
            + 0.15 * profile.business_dependency
            + 0.13 * ctx["duration_factor"]
        )
        return {
            "economic_disruption": economic_disruption,
            "daily_wage_risk": daily_wage_risk,
            "business_continuity_risk": business_continuity_risk,
            "remote_fallback_need": remote_fallback_need,
            "economic_continuity": clamp01(1.0 - economic_disruption),
        }

    def _run_education_agent(
        self,
        profile: CityProfile,
        ctx: Dict[str, float],
        transport: Dict[str, float],
        internet: Dict[str, float],
    ) -> Dict[str, float]:
        online_dependency_need = clamp01(
            0.35 * transport["commute_risk"]
            + 0.20 * ctx["road_factor"]
            + 0.15 * ctx["bus_factor"]
            + 0.20 * profile.student_ratio
            + 0.10 * ctx["exam_factor"]
        )
        student_disruption = clamp01(
            0.40 * transport["commute_risk"]
            + 0.20 * ctx["bus_factor"]
            + 0.15 * ctx["duration_factor"]
            + 0.15 * profile.student_ratio
            + 0.10 * ctx["exam_factor"]
        )
        online_feasibility = clamp01(
            0.55 * (1.0 - ctx["internet_factor"])
            + 0.15 * profile.digital_dependency
            + 0.15 * (1.0 - transport["commute_risk"])
            + 0.15 * ctx["announcement_factor"]
        )
        if online_dependency_need > 0.55 and ctx["internet_factor"] > 0.40:
            online_feasibility = clamp01(online_feasibility - 0.18)
            student_disruption = clamp01(student_disruption + 0.10)
        exam_risk = clamp01(
            0.45 * student_disruption
            + 0.30 * (1.0 - online_feasibility)
            + 0.25 * ctx["exam_factor"]
        )
        return {
            "student_disruption": student_disruption,
            "online_feasibility": online_feasibility,
            "exam_risk": exam_risk,
            "online_dependency_need": online_dependency_need,
            "education_continuity": clamp01(
                0.55 * (1.0 - student_disruption) + 0.45 * online_feasibility
            ),
        }

    def _run_internet_final_agent(
        self,
        profile: CityProfile,
        ctx: Dict[str, float],
        transport: Dict[str, float],
        internet: Dict[str, float],
        economy: Dict[str, float],
        education: Dict[str, float],
    ) -> Dict[str, float]:
        dependency_pressure = clamp01(
            (
                economy["remote_fallback_need"]
                + education["online_dependency_need"]
                + transport["online_shift_pressure"]
            )
            / 3.0
        )
        freelancer_risk = clamp01(
            internet["freelancer_risk"] + 0.15 * economy["remote_fallback_need"]
        )
        education_risk = clamp01(
            internet["education_risk"] + 0.18 * education["online_dependency_need"]
        )
        economy_risk = clamp01(
            internet["economy_risk"] + 0.15 * economy["remote_fallback_need"]
        )
        internet_dependency_risk = clamp01(
            0.32 * internet["digital_dependency"]
            + 0.23 * freelancer_risk
            + 0.22 * education_risk
            + 0.23 * economy_risk
            + 0.15 * dependency_pressure
        )
        return {
            "digital_dependency": internet["digital_dependency"],
            "freelancer_risk": freelancer_risk,
            "education_risk": education_risk,
            "economy_risk": economy_risk,
            "dependency_pressure": dependency_pressure,
            "internet_dependency_risk": internet_dependency_risk,
        }

    def _refine_economy_agent(
        self,
        economy: Dict[str, float],
        internet: Dict[str, float],
    ) -> Dict[str, float]:
        refined = deepcopy(economy)
        refined["economic_disruption"] = clamp01(
            refined["economic_disruption"] + 0.18 * internet["economy_risk"]
        )
        refined["business_continuity_risk"] = clamp01(
            refined["business_continuity_risk"]
            + 0.08 * internet["internet_dependency_risk"]
        )
        refined["economic_continuity"] = clamp01(1.0 - refined["economic_disruption"])
        return refined

    def _refine_education_agent(
        self,
        education: Dict[str, float],
        ctx: Dict[str, float],
        internet: Dict[str, float],
    ) -> Dict[str, float]:
        refined = deepcopy(education)
        refined["student_disruption"] = clamp01(
            refined["student_disruption"]
            + 0.10 * internet["education_risk"]
            + 0.08 * ctx["internet_factor"] * refined["online_dependency_need"]
        )
        refined["online_feasibility"] = clamp01(
            refined["online_feasibility"] - 0.08 * internet["dependency_pressure"]
        )
        refined["education_continuity"] = clamp01(
            0.55 * (1.0 - refined["student_disruption"])
            + 0.45 * refined["online_feasibility"]
        )
        refined["exam_risk"] = clamp01(
            0.45 * refined["student_disruption"]
            + 0.30 * (1.0 - refined["online_feasibility"])
            + 0.25 * ctx["exam_factor"]
        )
        return refined

    def _run_sentiment_agent(
        self,
        profile: CityProfile,
        ctx: Dict[str, float],
        transport: Dict[str, float],
        economy: Dict[str, float],
        education: Dict[str, float],
        internet: Dict[str, float],
    ) -> Dict[str, float]:
        frustration = clamp01(
            0.25 * transport["commute_risk"]
            + 0.20 * economy["economic_disruption"]
            + 0.15 * education["student_disruption"]
            + 0.15 * internet["internet_dependency_risk"]
            + 0.10 * ctx["road_factor"]
            + 0.10 * (1.0 - ctx["announcement_factor"])
            + 0.05 * profile.protest_sensitivity
        )
        tension = clamp01(
            0.35 * frustration
            + 0.20 * ctx["police_factor"]
            + 0.18 * (1.0 - ctx["announcement_factor"])
            + 0.12 * profile.political_sensitivity
            + 0.15 * ctx["internet_factor"]
        )
        trust_loss = clamp01(
            0.40 * (1.0 - ctx["announcement_factor"])
            + 0.20 * ctx["internet_factor"]
            + 0.15 * transport["commute_risk"]
            + 0.15 * economy["economic_disruption"]
            + 0.10 * ctx["police_factor"]
        )
        protest_probability = clamp01(
            0.38 * frustration
            + 0.20 * tension
            + 0.16 * profile.protest_sensitivity
            + 0.10 * ctx["event_factor"]
            + 0.08 * (1.0 - ctx["announcement_factor"])
            + 0.08 * ctx["internet_factor"]
            - 0.12 * ctx["police_factor"]
        )
        public_sentiment = clamp01(1.0 - (0.60 * frustration + 0.40 * trust_loss))
        return {
            "frustration": frustration,
            "tension": tension,
            "trust_loss": trust_loss,
            "protest_probability": protest_probability,
            "public_sentiment": public_sentiment,
        }

    def _detect_conflicts(
        self,
        scenario: ScenarioRequest,
        transport: Dict[str, float],
        economy: Dict[str, float],
        education: Dict[str, float],
        internet: Dict[str, float],
        sentiment: Dict[str, float],
    ) -> List[str]:
        conflicts: List[str] = []
        if (
            scenario.road_closure_level in {RoadClosureLevel.PARTIAL, RoadClosureLevel.MAJOR}
            and scenario.internet_shutdown.value in {"partial", "full"}
            and transport["online_shift_pressure"] > 0.45
        ):
            conflicts.append(
                "Road closures increase online dependency, but internet restrictions remove the digital fallback."
            )
        if scenario.bus_routes_closed >= 4 and scenario.public_transport_support != SupportLevel.HIGH:
            conflicts.append(
                "Bus closures are high while transport support is limited, increasing worker disruption and market inaccessibility."
            )
        if scenario.police_presence == PolicePresence.HIGH and scenario.announcement_quality == AnnouncementQuality.POOR:
            conflicts.append(
                "High police visibility with poor communication raises tension faster than it reduces frustration."
            )
        if scenario.exam_day and scenario.internet_shutdown.value in {"partial", "full"}:
            conflicts.append(
                "Exam-day continuity depends on digital access, but internet restrictions weaken the education fallback plan."
            )
        if scenario.fuel_price_increase_pct >= 12 and scenario.bus_routes_closed >= 3:
            conflicts.append(
                "Fuel price pressure and bus closures stack transport costs on top of mobility restrictions."
            )
        if economy["economic_disruption"] > 0.70 and sentiment["protest_probability"] > 0.60:
            conflicts.append(
                "Economic disruption is large enough to amplify protest risk through public frustration."
            )
        if education["student_disruption"] > 0.60 and sentiment["public_sentiment"] < 0.45:
            conflicts.append(
                "Education continuity is strained enough to materially drag down public sentiment."
            )
        return conflicts

    def _build_scores(
        self,
        transport: Dict[str, float],
        economy: Dict[str, float],
        education: Dict[str, float],
        internet: Dict[str, float],
        sentiment: Dict[str, float],
        conflicts: List[str],
    ) -> ScoreBundle:
        conflict_penalty = min(len(conflicts) * 2, 10)
        city_stability = max(
            0,
            min(
                100,
                int(
                    round(
                        0.24 * to_score(transport["mobility_score"])
                        + 0.20 * to_score(economy["economic_continuity"])
                        + 0.18 * to_score(education["education_continuity"])
                        + 0.14 * invert_score(internet["internet_dependency_risk"])
                        + 0.14 * to_score(sentiment["public_sentiment"])
                        + 0.10 * invert_score(sentiment["protest_probability"])
                    )
                    - conflict_penalty
                ),
            ),
        )
        return ScoreBundle(
            city_stability=city_stability,
            mobility=to_score(transport["mobility_score"]),
            commute_disruption=to_score(transport["commute_risk"]),
            congestion=to_score(transport["congestion_risk"]),
            economic_impact=to_score(economy["economic_disruption"]),
            economic_continuity=to_score(economy["economic_continuity"]),
            education_disruption=to_score(education["student_disruption"]),
            education_continuity=to_score(education["education_continuity"]),
            internet_dependency_risk=to_score(internet["internet_dependency_risk"]),
            public_sentiment=to_score(sentiment["public_sentiment"]),
            protest_probability=to_score(sentiment["protest_probability"]),
        )

    def _build_agent_cards(
        self,
        scenario: ScenarioRequest,
        profile: CityProfile,
        transport: Dict[str, float],
        economy: Dict[str, float],
        education: Dict[str, float],
        internet: Dict[str, float],
        sentiment: Dict[str, float],
        scores: ScoreBundle,
        conflicts: List[str],
    ) -> Dict[str, AgentResult]:
        advisor_score = 100 - scores.city_stability
        advisor_risk = risk_label(advisor_score)
        cards = {
            "transport": AgentResult(
                score=scores.commute_disruption,
                risk=risk_label(scores.commute_disruption),
                key_reason="Mobility pressure is driven by road restrictions, bus cuts, and limited relief capacity.",
                summary=(
                    f"Commute disruption is {scores.commute_disruption}/100 and congestion is "
                    f"{scores.congestion}/100, with the heaviest impact on transport hubs and "
                    f"{'government zones' if profile.name.value == 'Islamabad' else 'dense public corridors'}."
                ),
                recommendation=self._transport_recommendation(scenario, scores),
                drivers=self._collect_drivers(
                    ("Road closures", transport["commute_risk"]),
                    ("Bus route cuts", scenario.bus_routes_closed / 8.0),
                    ("Fuel pressure", scenario.fuel_price_increase_pct / 25.0),
                    ("Support gap", 1.0 - SUPPORT_FACTORS[scenario.public_transport_support]),
                ),
            ),
            "economy": AgentResult(
                score=scores.economic_impact,
                risk=risk_label(scores.economic_impact),
                key_reason="Business continuity drops when transport friction and digital limits stack together.",
                summary=(
                    f"Economic disruption is {scores.economic_impact}/100. Daily wage exposure and "
                    f"market access are especially sensitive in {profile.name.value}."
                ),
                recommendation=self._economy_recommendation(scenario, scores),
                drivers=self._collect_drivers(
                    ("Commute disruption", transport["commute_risk"]),
                    ("Digital work risk", internet["economy_risk"]),
                    ("Daily wage exposure", economy["daily_wage_risk"]),
                    ("Duration pressure", scenario.duration_days / 3.0),
                ),
            ),
            "education": AgentResult(
                score=scores.education_disruption,
                risk=risk_label(scores.education_disruption),
                key_reason="Education continuity depends on both physical access and digital fallback.",
                summary=(
                    f"Education disruption is {scores.education_disruption}/100 while continuity is "
                    f"{scores.education_continuity}/100. Student-heavy zones are more exposed when mobility and internet both tighten."
                ),
                recommendation=self._education_recommendation(scenario, scores),
                drivers=self._collect_drivers(
                    ("Transport access", transport["commute_risk"]),
                    ("Online feasibility gap", 1.0 - education["online_feasibility"]),
                    ("Internet restriction", INTERNET_FACTORS[scenario.internet_shutdown.value]),
                    ("Exam-day pressure", 1.0 if scenario.exam_day else 0.0),
                ),
            ),
            "internet": AgentResult(
                score=scores.internet_dependency_risk,
                risk=risk_label(scores.internet_dependency_risk),
                key_reason="The city's digital dependency determines how costly internet restrictions become.",
                summary=(
                    f"Internet dependency risk is {scores.internet_dependency_risk}/100. "
                    f"{profile.name.value} has a digital dependency baseline of {int(profile.digital_dependency * 100)}/100."
                ),
                recommendation=self._internet_recommendation(scenario, scores),
                drivers=self._collect_drivers(
                    ("Shutdown severity", INTERNET_FACTORS[scenario.internet_shutdown.value]),
                    ("Freelancer exposure", profile.freelancer_ratio),
                    ("Online shift pressure", transport["online_shift_pressure"]),
                    ("Education fallback need", education["online_dependency_need"]),
                ),
            ),
            "sentiment": AgentResult(
                score=scores.protest_probability,
                risk=risk_label(scores.protest_probability),
                key_reason="Frustration compounds when daily life is disrupted and communication quality stays weak.",
                summary=(
                    f"Public sentiment is {scores.public_sentiment}/100 and protest probability is "
                    f"{scores.protest_probability}/100, with communication quality acting as a major lever."
                ),
                recommendation=self._sentiment_recommendation(scenario, scores),
                drivers=self._collect_drivers(
                    ("Commute frustration", transport["commute_risk"]),
                    ("Economic pain", economy["economic_disruption"]),
                    ("Communication gap", 1.0 - ANNOUNCEMENT_FACTORS[scenario.announcement_quality]),
                    ("Police tension effect", POLICE_FACTORS[scenario.police_presence]),
                ),
            ),
            "advisor": AgentResult(
                score=advisor_score,
                risk=advisor_risk,
                key_reason="The overall stability score reflects the combined system response across transport, economy, education, internet, and sentiment.",
                summary=(
                    f"City stability is {scores.city_stability}/100. "
                    f"{'Multiple policy conflicts need mitigation.' if conflicts else 'Risk is manageable with targeted adjustments.'}"
                ),
                recommendation=self._advisor_recommendation(scenario, scores, conflicts),
                drivers=self._collect_drivers(
                    ("Conflict load", min(len(conflicts) / 5.0, 1.0)),
                    ("Mobility loss", 1.0 - transport["mobility_score"]),
                    ("Economic disruption", economy["economic_disruption"]),
                    ("Protest risk", sentiment["protest_probability"]),
                ),
            ),
        }
        return cards

    def _build_zone_impacts(
        self,
        profile: CityProfile,
        transport: Dict[str, float],
        economy: Dict[str, float],
        education: Dict[str, float],
        internet: Dict[str, float],
        sentiment: Dict[str, float],
    ) -> List[ZoneImpact]:
        zones: List[ZoneImpact] = []
        for template in BASE_ZONES:
            base = (
                transport["commute_risk"] * template.transport_weight
                + economy["economic_disruption"] * template.economy_weight
                + education["student_disruption"] * template.education_weight
                + internet["internet_dependency_risk"] * template.digital_weight
                + sentiment["tension"] * template.sentiment_weight
                + sentiment["protest_probability"] * template.security_weight * 0.25
            ) / (
                template.transport_weight
                + template.economy_weight
                + template.education_weight
                + template.digital_weight
                + template.sentiment_weight
                + template.security_weight * 0.25
            )
            boost = profile.zone_bias.get(template.zone_type.value, 0.0)
            risk_score = to_score(clamp01(base + boost))
            indicators = []
            if transport["commute_risk"] * template.transport_weight > 0.32:
                indicators.append("road_closure")
            if economy["economic_disruption"] * template.economy_weight > 0.32:
                indicators.append("economic_risk")
            if education["student_disruption"] * template.education_weight > 0.30:
                indicators.append("student_disruption")
            if internet["internet_dependency_risk"] * template.digital_weight > 0.30:
                indicators.append("internet_dependency")
            if sentiment["protest_probability"] * template.sentiment_weight > 0.26:
                indicators.append("protest_risk")
            summary = (
                f"{template.label} is {zone_status(risk_score).value} because "
                f"{self._top_zone_driver(template, transport, economy, education, internet, sentiment)} "
                f"is propagating most strongly here."
            )
            zones.append(
                ZoneImpact(
                    zone_id=template.zone_id,
                    label=template.label,
                    zone_type=template.zone_type,
                    x=template.x,
                    y=template.y,
                    status=zone_status(risk_score),
                    risk_score=risk_score,
                    indicators=indicators,
                    summary=summary,
                )
            )
        return zones

    def _top_zone_driver(
        self,
        template,
        transport: Dict[str, float],
        economy: Dict[str, float],
        education: Dict[str, float],
        internet: Dict[str, float],
        sentiment: Dict[str, float],
    ) -> str:
        weighted = {
            "transport disruption": transport["commute_risk"] * template.transport_weight,
            "economic pressure": economy["economic_disruption"] * template.economy_weight,
            "education strain": education["student_disruption"] * template.education_weight,
            "digital dependency": internet["internet_dependency_risk"] * template.digital_weight,
            "public tension": sentiment["tension"] * template.sentiment_weight,
        }
        return max(weighted, key=weighted.get)

    def _build_network(
        self,
        transport: Dict[str, float],
        economy: Dict[str, float],
        education: Dict[str, float],
        internet: Dict[str, float],
        sentiment: Dict[str, float],
    ) -> AgentNetwork:
        nodes = [
            NetworkNode(
                id="transport",
                label="Transport Agent",
                kind="agent",
                activity=to_score(transport["commute_risk"]),
                risk=risk_label(to_score(transport["commute_risk"])),
            ),
            NetworkNode(
                id="economy",
                label="Economy Agent",
                kind="agent",
                activity=to_score(economy["economic_disruption"]),
                risk=risk_label(to_score(economy["economic_disruption"])),
            ),
            NetworkNode(
                id="education",
                label="Education Agent",
                kind="agent",
                activity=to_score(education["student_disruption"]),
                risk=risk_label(to_score(education["student_disruption"])),
            ),
            NetworkNode(
                id="internet",
                label="Internet Agent",
                kind="agent",
                activity=to_score(internet["internet_dependency_risk"]),
                risk=risk_label(to_score(internet["internet_dependency_risk"])),
            ),
            NetworkNode(
                id="sentiment",
                label="Sentiment Agent",
                kind="agent",
                activity=to_score(sentiment["tension"]),
                risk=risk_label(to_score(sentiment["tension"])),
            ),
            NetworkNode(
                id="protest",
                label="Protest Risk",
                kind="metric",
                activity=to_score(sentiment["protest_probability"]),
                risk=risk_label(to_score(sentiment["protest_probability"])),
            ),
            NetworkNode(
                id="advisor",
                label="Policy Advisor",
                kind="agent",
                activity=to_score(
                    clamp01(
                        (
                            economy["economic_disruption"]
                            + education["student_disruption"]
                            + internet["internet_dependency_risk"]
                            + sentiment["protest_probability"]
                        )
                        / 4.0
                    )
                ),
                risk=risk_label(
                    to_score(
                        clamp01(
                            (
                                economy["economic_disruption"]
                                + education["student_disruption"]
                                + internet["internet_dependency_risk"]
                                + sentiment["protest_probability"]
                            )
                            / 4.0
                        )
                    )
                ),
            ),
        ]
        edge_specs: List[Tuple[str, str, float, str]] = [
            ("transport", "economy", 0.65 * transport["commute_risk"], "Commute -> income"),
            ("transport", "education", 0.62 * transport["commute_risk"], "Commute -> classes"),
            ("transport", "internet", 0.55 * transport["online_shift_pressure"], "Mobility -> online shift"),
            ("internet", "economy", 0.72 * internet["economy_risk"], "Internet -> business continuity"),
            ("internet", "education", 0.72 * internet["education_risk"], "Internet -> online learning"),
            ("economy", "sentiment", 0.75 * economy["economic_disruption"], "Income -> frustration"),
            ("education", "sentiment", 0.68 * education["student_disruption"], "Education -> frustration"),
            ("internet", "sentiment", 0.62 * internet["internet_dependency_risk"], "Digital limits -> frustration"),
            ("sentiment", "protest", 0.82 * sentiment["protest_probability"], "Tension -> protest"),
            ("protest", "advisor", 0.70 * sentiment["protest_probability"], "Risk -> final advice"),
            ("economy", "advisor", 0.68 * economy["economic_disruption"], "Economy -> final advice"),
            ("education", "advisor", 0.58 * education["student_disruption"], "Education -> final advice"),
        ]
        edges = [
            NetworkEdge(
                source=source,
                target=target,
                influence=to_score(clamp01(weight)),
                highlighted=weight >= 0.35,
                label=label,
            )
            for source, target, weight, label in edge_specs
        ]
        return AgentNetwork(nodes=nodes, edges=edges)

    def _build_main_risks(
        self,
        scores: ScoreBundle,
        conflicts: List[str],
        agents: Dict[str, AgentResult],
    ) -> List[str]:
        risk_pool = [
            (scores.commute_disruption, "Mobility disruption is constraining cross-city movement."),
            (scores.economic_impact, "Economic continuity is under pressure for workers and markets."),
            (scores.education_disruption, "Education continuity is vulnerable if fallback channels stay weak."),
            (scores.internet_dependency_risk, "Digital dependency makes internet restrictions disproportionately costly."),
            (scores.protest_probability, "Public frustration is strong enough to elevate protest risk."),
        ]
        ordered = sorted(risk_pool, key=lambda item: item[0], reverse=True)
        items = [item[1] for item in ordered[:3]]
        if conflicts:
            items.insert(0, conflicts[0])
        if agents["advisor"].risk == "Critical" and len(items) < 4:
            items.append("The combined system response is unstable enough to require a phased alternative.")
        return items[:4]

    def _build_executive_summary(
        self,
        scenario: ScenarioRequest,
        profile: CityProfile,
        scores: ScoreBundle,
        conflicts: List[str],
        main_risks: List[str],
    ) -> str:
        lead = (
            f"{scenario.city.value} is at {scores.city_stability}/100 stability under the current "
            f"{scenario.scenario_type.value.replace('_', ' ')} scenario."
        )
        middle = (
            f"Mobility is {scores.mobility}/100, economic continuity is {scores.economic_continuity}/100, "
            f"and protest probability is {scores.protest_probability}/100."
        )
        city_note = (
            f"{profile.name.value}'s local profile amplifies "
            f"{'administrative sensitivity' if profile.name.value == 'Islamabad' else 'event and traffic pressure' if profile.name.value == 'Lahore' else 'economic continuity risk'}."
        )
        if conflicts:
            end = f"Primary conflict: {conflicts[0]}"
        else:
            end = main_risks[0]
        return " ".join([lead, middle, city_note, end])

    def _maybe_enhance_summary(self, response: SimulationResponse) -> str:
        payload = {
            "scores": model_dump(response.scores),
            "conflicts": response.conflicts,
            "main_risks": response.main_risks,
            "alternative_policy": model_dump(response.alternative_policy)
            if response.alternative_policy
            else {},
        }
        llm_summary = self.llm_service.summarize(response.scenario, payload)
        return llm_summary or response.executive_summary

    def _build_alternative_policy(
        self,
        scenario: ScenarioRequest,
        result: SimulationResponse,
    ) -> ScenarioRequest:
        improved = model_copy(scenario)
        if result.scores.commute_disruption >= 65:
            improved.road_closure_level = self._step_down_road_closure(improved.road_closure_level)
        if improved.bus_routes_closed > 2 and result.scores.mobility < 60:
            improved.bus_routes_closed = max(2, improved.bus_routes_closed - 3)
        if (
            improved.internet_shutdown.value in {"partial", "full"}
            and result.scores.internet_dependency_risk >= 60
        ):
            improved.internet_shutdown = improved.internet_shutdown.__class__("off")
        if improved.public_transport_support != SupportLevel.HIGH and result.scores.mobility < 65:
            improved.public_transport_support = SupportLevel.HIGH
        if improved.announcement_quality != AnnouncementQuality.CLEAR and result.scores.public_sentiment < 60:
            improved.announcement_quality = AnnouncementQuality.CLEAR
        if improved.police_presence == PolicePresence.HIGH and result.scores.protest_probability < 70:
            improved.police_presence = PolicePresence.MEDIUM
        if improved.duration_days > 2 and result.scores.city_stability < 60:
            improved.duration_days = max(1, improved.duration_days - 1)
        if improved.fuel_price_increase_pct > 10 and result.scores.economic_impact >= 65:
            improved.fuel_price_increase_pct = round(improved.fuel_price_increase_pct * 0.6, 2)
        return improved

    def _step_down_road_closure(self, current: RoadClosureLevel) -> RoadClosureLevel:
        index = ROAD_SEQUENCE.index(current)
        return ROAD_SEQUENCE[max(0, index - 1)]

    def _build_comparison_headline(
        self,
        current: ScoreBundle,
        recommended: ScoreBundle,
    ) -> str:
        stability_delta = recommended.city_stability - current.city_stability
        protest_delta = current.protest_probability - recommended.protest_probability
        if stability_delta >= 15 and protest_delta >= 10:
            return "Recommended policy materially improves stability while reducing protest risk."
        if stability_delta > 0:
            return "Recommended policy improves overall stability with moderate risk reduction."
        return "Recommended policy does not outperform the baseline across the key metrics."

    def _transport_recommendation(self, scenario: ScenarioRequest, scores: ScoreBundle) -> str:
        parts = []
        if scenario.bus_routes_closed > 0:
            parts.append("restore some bus routes or add temporary shuttle loops")
        if scenario.road_closure_level != RoadClosureLevel.NONE:
            parts.append("phase road closures around the most sensitive corridors")
        if scenario.public_transport_support != SupportLevel.HIGH:
            parts.append("increase public transport support")
        return self._join_recommendations(parts, fallback="Maintain active traffic diversion and monitor congestion hourly.")

    def _economy_recommendation(self, scenario: ScenarioRequest, scores: ScoreBundle) -> str:
        parts = []
        if scenario.internet_shutdown.value != "off":
            parts.append("keep digital work and payment channels active")
        if scores.economic_impact >= 60:
            parts.append("preserve market access windows for workers and deliveries")
        if scenario.fuel_price_increase_pct > 8:
            parts.append("phase price changes instead of applying the full jump at once")
        return self._join_recommendations(parts, fallback="Protect logistics continuity and keep high-footfall markets accessible.")

    def _education_recommendation(self, scenario: ScenarioRequest, scores: ScoreBundle) -> str:
        parts = []
        if scenario.internet_shutdown.value != "off":
            parts.append("keep internet available for online classes and notices")
        if scenario.bus_routes_closed > 2 or scenario.road_closure_level in {RoadClosureLevel.PARTIAL, RoadClosureLevel.MAJOR}:
            parts.append("schedule staggered access for schools and universities")
        if scenario.exam_day:
            parts.append("avoid disruptive restrictions during exams")
        return self._join_recommendations(parts, fallback="Use staggered schedules and rapid communication with institutions.")

    def _internet_recommendation(self, scenario: ScenarioRequest, scores: ScoreBundle) -> str:
        if scenario.internet_shutdown.value == "full":
            return "Avoid a full shutdown; targeted monitoring is safer than removing the city's digital fallback."
        if scenario.internet_shutdown.value == "partial":
            return "Limit partial shutdowns to narrow zones only if essential, and preserve remote work and education corridors."
        return "Keep critical digital services resilient and ready to absorb any shift from physical to online activity."

    def _sentiment_recommendation(self, scenario: ScenarioRequest, scores: ScoreBundle) -> str:
        parts = []
        if scenario.announcement_quality != AnnouncementQuality.CLEAR:
            parts.append("issue a clear public announcement with routes, timings, and purpose")
        if scenario.police_presence == PolicePresence.HIGH:
            parts.append("pair visible security with service information to reduce tension")
        if scores.protest_probability >= 60:
            parts.append("phase restrictions instead of applying them all at once")
        return self._join_recommendations(parts, fallback="Keep communication frequent and specific to local impact.")

    def _advisor_recommendation(
        self,
        scenario: ScenarioRequest,
        scores: ScoreBundle,
        conflicts: List[str],
    ) -> str:
        parts = []
        if conflicts:
            parts.append("remove the strongest policy conflict before scaling the restriction")
        if scores.mobility < 60:
            parts.append("reduce closures and add temporary transport relief")
        if scores.internet_dependency_risk >= 60:
            parts.append("keep internet active unless the restriction is narrowly targeted")
        if scores.public_sentiment < 55:
            parts.append("upgrade communication quality immediately")
        return self._join_recommendations(
            parts,
            fallback="Proceed with a phased rollout and monitor score deltas in real time.",
        )

    def _collect_drivers(self, *pairs: Tuple[str, float]) -> List[str]:
        ordered = sorted(pairs, key=lambda item: item[1], reverse=True)
        return [name for name, value in ordered if value > 0.15][:3]

    def _join_recommendations(self, parts: List[str], fallback: str) -> str:
        filtered = [part for part in parts if part]
        if not filtered:
            return fallback
        return ", ".join(filtered[:3]).capitalize() + "."


engine = PolicySimulationEngine()
