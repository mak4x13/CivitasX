---
title: CivitasX Backend
emoji: 🏙️
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
fullWidth: true
header: default
short_description: City-aware policy simulation backend for CivitasX
---

# CivitasX Backend

Docker-based FastAPI backend for the CivitasX policy simulation platform.

## Required files in the Space repo

- `app/`
- `Dockerfile`
- `.dockerignore`
- `requirements-prod.txt`
- `README.md` using this template

## Recommended Space variables

- `BACKEND_CORS_ORIGINS=*`
- `LIVE_CONTEXT_PROVIDER=fallback`
- `LIVE_CONTEXT_TIMEOUT_SECONDS=3.5`
- `LIVE_CONTEXT_MAX_ITEMS=5`

Optional:

- `GROQ_API_KEY=...`
- `GROQ_MODEL=llama-3.1-8b-instant`

## Health check

- `GET /health`

## Main endpoints

- `GET /metadata`
- `GET /cities`
- `GET /context/live?city=Islamabad`
- `POST /simulate`
- `POST /compare`
