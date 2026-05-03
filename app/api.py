from fastapi import APIRouter, Query

from app.models import (
    ComparisonRequest,
    ComparisonResponse,
    CityName,
    LiveContextResponse,
    MetadataResponse,
    ScenarioRequest,
    SimulationResponse,
)
from app.live_context import service as live_context_service
from app.simulation import engine


router = APIRouter()


@router.get("/", tags=["system"])
def root() -> dict:
    return {
        "name": "CivitasX Backend",
        "message": "City-aware multi-agent policy simulation API",
        "docs": "/docs",
    }


@router.get("/health", tags=["system"])
def health() -> dict:
    return {"status": "ok"}


@router.get("/cities", tags=["metadata"])
def cities():
    return engine.get_city_catalog()


@router.get("/metadata", response_model=MetadataResponse, tags=["metadata"])
def metadata() -> MetadataResponse:
    return engine.get_metadata()


@router.get("/context/live", response_model=LiveContextResponse, tags=["metadata"])
def live_context(city: CityName) -> LiveContextResponse:
    return live_context_service.get_context(city)


@router.post("/simulate", response_model=SimulationResponse, tags=["simulation"])
def simulate(
    scenario: ScenarioRequest,
    use_llm: bool = Query(False, description="Use Groq summaries when configured"),
) -> SimulationResponse:
    return engine.simulate(scenario, include_alternative=True, use_llm=use_llm)


@router.post("/compare", response_model=ComparisonResponse, tags=["simulation"])
def compare(
    request: ComparisonRequest,
    use_llm: bool = Query(False, description="Use Groq summaries when configured"),
) -> ComparisonResponse:
    return engine.compare(request.current, request.proposed, use_llm=use_llm)
