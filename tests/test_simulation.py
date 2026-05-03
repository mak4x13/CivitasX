from fastapi.testclient import TestClient

from app.main import app
from app.models import ScenarioRequest
from app.simulation import engine


client = TestClient(app)


def test_islamabad_demo_scenario_flags_policy_conflict():
    scenario = ScenarioRequest(
        city="Islamabad",
        bus_routes_closed=5,
        road_closure_level="major",
        police_presence="medium",
        internet_shutdown="partial",
        public_transport_support="normal",
        announcement_quality="poor",
        duration_days=2,
    )
    result = engine.simulate(scenario, include_alternative=True, use_llm=False)

    assert result.scores.city_stability < 60
    assert result.scores.mobility < 50
    assert result.scores.internet_dependency_risk >= 60
    assert any("digital fallback" in conflict for conflict in result.conflicts)
    assert result.alternative_policy is not None
    assert result.alternative_policy.internet_shutdown.value == "off"
    assert result.comparison is not None
    assert result.comparison.recommended_scores.city_stability > result.scores.city_stability


def test_karachi_full_shutdown_has_high_economic_and_digital_risk():
    scenario = ScenarioRequest(
        city="Karachi",
        scenario_type="security_restriction",
        road_closure_level="partial",
        bus_routes_closed=3,
        internet_shutdown="full",
        police_presence="high",
        announcement_quality="neutral",
        duration_days=2,
    )
    result = engine.simulate(scenario, include_alternative=False, use_llm=False)

    assert result.scores.internet_dependency_risk >= 80
    assert result.scores.economic_impact >= 70
    assert result.scores.public_sentiment <= 55


def test_api_simulate_returns_visual_outputs():
    payload = {
        "city": "Lahore",
        "scenario_type": "public_event",
        "road_closure_level": "partial",
        "bus_routes_closed": 2,
        "internet_shutdown": "off",
        "police_presence": "medium",
        "public_transport_support": "high",
        "announcement_quality": "clear",
        "event_day": True,
        "duration_days": 1,
    }
    response = client.post("/simulate", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["city"] == "Lahore"
    assert len(data["zone_impacts"]) == 8
    assert "agent_network" in data
    assert data["generated_by"] == "rule_based"


def test_live_context_endpoint_returns_backend_context():
    response = client.get("/context/live", params={"city": "Islamabad"})

    assert response.status_code == 200
    data = response.json()
    assert data["city"] == "Islamabad"
    assert data["mode"] in {"fallback", "rss"}
    assert data["trigger_type"]
    assert data["severity"]
    assert data["confidence"]
    assert isinstance(data["affected_systems"], list)
    assert isinstance(data["suggested_scenario"], dict)
    assert data["summary"]
    assert isinstance(data["items"], list)


def test_compare_endpoint_prefers_lower_risk_option():
    request = {
        "current": {
            "city": "Islamabad",
            "road_closure_level": "major",
            "bus_routes_closed": 5,
            "internet_shutdown": "partial",
            "announcement_quality": "poor",
            "police_presence": "medium",
            "duration_days": 2,
        },
        "proposed": {
            "city": "Islamabad",
            "road_closure_level": "partial",
            "bus_routes_closed": 2,
            "internet_shutdown": "off",
            "announcement_quality": "clear",
            "police_presence": "medium",
            "public_transport_support": "high",
            "duration_days": 1,
        },
    }
    response = client.post("/compare", json=request)

    assert response.status_code == 200
    data = response.json()
    assert data["deltas"]["city_stability"] > 0
    assert data["deltas"]["protest_probability"] > 0
