# PolicyPulse AI Backend

FastAPI backend for the PolicyPulse AI hackathon project. It implements a city-aware, rule-based multi-agent simulation engine for Islamabad, Lahore, and Karachi and exposes API responses designed for a visual dashboard.

## Run

```bash
python -m uvicorn app.main:app --reload
```

## Endpoints

- `GET /health`
- `GET /cities`
- `GET /metadata`
- `POST /simulate`
- `POST /compare`

## Checks

```bash
python -m pytest
python -m compileall app tests
```

## Optional Groq Integration

If `GROQ_API_KEY` is set, call `/simulate?use_llm=true` or `/compare?use_llm=true` to let Groq generate the executive summary. Without it, the backend falls back to deterministic summaries.
