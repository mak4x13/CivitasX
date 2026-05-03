from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router


app = FastAPI(
    title="CivitasX Backend",
    version="0.1.0",
    description=(
        "Backend simulation API for the CivitasX policy simulation project. "
        "It provides city-aware multi-agent scoring, conflict detection, "
        "comparison mode, optional Groq-powered summaries, and live-context ingestion."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
