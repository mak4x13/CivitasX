# CivitasX

City-aware policy simulation platform for hackathons and rapid prototyping.

Tagline: `See the impact before the decision.`

## What This Project Is

CivitasX simulates how a city reacts to government or public-policy decisions such as:

- road closures
- bus route shutdowns
- fuel price increases
- police deployment changes
- internet restrictions
- public event controls

The goal is to show ripple effects across:

- transport
- economy
- education
- digital work
- public sentiment
- protest risk

This repository currently contains the **backend only**. The frontend is not built yet.

## Current Status

Implemented:

- FastAPI backend
- city-aware simulation for `Islamabad`, `Lahore`, and `Karachi`
- interconnected agent logic
- conflict detection
- recommended alternative policy generation
- compare mode support
- optional Groq-based executive summary
- tests for the main simulation flow

Not implemented yet:

- frontend app
- visual city grid
- live charts
- agent network UI
- comparison UI

## Repo Structure

```text
CivitasX/
├── app/
│   ├── api.py               # API routes
│   ├── city_profiles.py     # City definitions and zone templates
│   ├── llm.py               # Optional Groq integration
│   ├── main.py              # FastAPI app entrypoint
│   ├── models.py            # Request/response schemas
│   └── simulation.py        # Core multi-agent simulation engine
├── tests/
│   └── test_simulation.py   # Backend tests
├── policypulse_ai_project_brief.md
├── requirements.txt
└── README.md
```

## Backend vs Frontend

### Backend Responsibility

The backend already handles:

- scenario input validation
- city profile loading
- agent-by-agent impact simulation
- score calculation
- conflict detection
- recommended safer alternative generation
- compare-mode response generation

### Frontend Responsibility

The future frontend should handle:

- policy controls and form inputs
- live visualization of zone impacts
- metrics dashboard
- agent cards
- agent network graph
- comparison mode UI
- animations and visual transitions

## Backend Quick Start

### 1. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 2. Run the API

```bash
python -m uvicorn app.main:app --reload
```

API base URL:

```text
http://127.0.0.1:8000
```

Interactive docs:

```text
http://127.0.0.1:8000/docs
```

### 3. Run checks

```bash
python -m compileall app tests
python -m pytest
```

## Backend API

### `GET /`

Basic service info.

### `GET /health`

Health check.

Response:

```json
{
  "status": "ok"
}
```

### `GET /cities`

Returns the supported cities with summaries and highlights.

Frontend use:

- fill city selector
- show city intro cards

### `GET /metadata`

Returns:

- default scenario values
- enum options for all controls

Frontend use:

- initialize the control panel
- avoid hardcoding dropdown values

### `POST /simulate`

Runs one policy scenario and returns the full dashboard payload.

Query param:

- `use_llm=true|false`

### `POST /compare`

Compares two scenarios:

- `current`
- `proposed`

Frontend use:

- before vs after mode
- AI recommendation comparison

## Main Request Body

The frontend should send this shape to `/simulate`:

```json
{
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
  "exam_day": false,
  "event_day": false
}
```

## Supported Input Values

### Cities

- `Islamabad`
- `Lahore`
- `Karachi`

### Scenario Types

- `transport_restriction`
- `fuel_policy`
- `public_event`
- `emergency`
- `security_restriction`

### Road Closure Levels

- `none`
- `minor`
- `partial`
- `major`

### Police Presence

- `low`
- `medium`
- `high`

### Internet Shutdown

- `off`
- `partial`
- `full`

### Public Transport Support

- `low`
- `normal`
- `high`

### Announcement Quality

- `poor`
- `neutral`
- `clear`

## Simulation Response Shape

The `/simulate` response is designed for the frontend dashboard.

Top-level fields:

- `city`
- `scenario`
- `city_profile`
- `scores`
- `agents`
- `conflicts`
- `main_risks`
- `zone_impacts`
- `agent_network`
- `executive_summary`
- `alternative_policy`
- `comparison`
- `generated_by`

## Frontend Mapping Guide

This section is the handoff for frontend development.

### 1. Left Panel: Policy Controls

Use:

- `GET /metadata`
- `default_scenario`
- `options`

Render controls for:

- city
- scenario type
- fuel price increase
- bus routes closed
- road closure level
- police presence
- internet shutdown
- public transport support
- announcement quality
- duration
- exam day
- event day

### 2. Top Metrics Bar

Use `scores`.

Render:

- `city_stability`
- `mobility`
- `economic_impact`
- `education_continuity`
- `internet_dependency_risk`
- `public_sentiment`
- `protest_probability`

Suggested UI rule:

- high positive metrics like `city_stability` and `mobility`: bigger is better
- disruption/risk metrics like `economic_impact` and `protest_probability`: bigger is worse

### 3. Center Panel: City Grid / Zone Map

Use `zone_impacts`.

Each item already contains:

- `zone_id`
- `label`
- `zone_type`
- `x`
- `y`
- `status`
- `risk_score`
- `indicators`
- `summary`

Suggested rendering:

- use `x` and `y` as grid coordinates
- color by `status`
- show small icons based on `indicators`
- show tooltip on hover using `summary`

Status colors:

- `stable` -> green
- `stressed` -> yellow
- `disrupted` -> orange
- `critical` -> red

Indicator values currently used by backend:

- `road_closure`
- `economic_risk`
- `student_disruption`
- `internet_dependency`
- `protest_risk`

### 4. Right Panel: Agent Cards

Use `agents`.

Available keys:

- `transport`
- `economy`
- `education`
- `internet`
- `sentiment`
- `advisor`

Each agent card includes:

- `score`
- `risk`
- `key_reason`
- `summary`
- `recommendation`
- `drivers`

Recommended card layout:

1. agent name
2. score badge
3. risk label
4. one-line reason
5. short summary
6. recommendation
7. top drivers list

### 5. Agent Network Visualization

Use `agent_network`.

It contains:

- `nodes`
- `edges`

Each node includes:

- `id`
- `label`
- `kind`
- `activity`
- `risk`

Each edge includes:

- `source`
- `target`
- `influence`
- `highlighted`
- `label`

Suggested frontend library:

- React Flow

Suggested rendering:

- larger or brighter nodes for high `activity`
- thicker edges for higher `influence`
- glow or pulse edges where `highlighted = true`

### 6. Conflict Detection Panel

Use:

- `conflicts`
- `main_risks`

Render:

- a conflict list
- a short “why this is risky” section

This should be visually separate from generic agent text because judges will look for cross-agent reasoning.

### 7. AI Insight / Summary Panel

Use:

- `executive_summary`
- `generated_by`

If `generated_by = "groq"`, label it as AI-generated summary.

If `generated_by = "rule_based"`, label it as system summary.

### 8. Comparison Mode

There are two ways to support this:

- use `/simulate` and read its `alternative_policy` + `comparison`
- or call `/compare` with custom `current` and `proposed` scenarios

For quick hackathon delivery, the easiest path is:

1. call `/simulate`
2. show the current scenario
3. show `alternative_policy`
4. show `comparison.score_deltas`
5. let the user apply the recommended scenario

## Example Frontend Flow

Recommended simple UI flow:

1. Load `/metadata` and `/cities` on app start
2. Initialize form from `default_scenario`
3. User changes policy controls
4. Frontend sends `POST /simulate`
5. Update:
   - top metrics
   - zone map
   - agent cards
   - network graph
   - conflict list
   - executive summary
6. If `alternative_policy` exists, show “Recommended Safer Policy”
7. If user clicks compare, show `comparison`

## Recommended Frontend Stack

For the fastest handoff:

- Next.js or React
- Tailwind CSS
- Recharts for metrics
- React Flow for agent dependency graph
- Framer Motion for transitions

Suggested frontend folder when it is created:

```text
frontend/
├── components/
├── lib/
├── pages/ or app/
├── styles/
└── types/
```

## Suggested Frontend Types

The friend building the frontend should mirror backend response models in TypeScript.

Suggested first types to create:

- `ScenarioRequest`
- `ScoreBundle`
- `AgentResult`
- `ZoneImpact`
- `AgentNetwork`
- `SimulationResponse`
- `ComparisonResponse`

## Optional Groq Setup

Create a local `.env` using `.env.example` and add:

```env
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.1-8b-instant
GROQ_BASE_URL=https://api.groq.com/openai/v1/chat/completions
```

If no Groq key is present, the backend still works. Only the executive summary stays deterministic.

## Important Notes For Frontend Development

- Do not hardcode option values; use `/metadata`
- Treat the backend as the source of truth for score calculations
- The city grid should be visual-first and text-second
- `zone_impacts` and `agent_network` are the strongest judge-facing visual features
- The quickest demo path is to build `/simulate` first and add `/compare` second

## Best Next Step

For the frontend developer, the best order is:

1. build the control panel
2. connect `/simulate`
3. render the top metrics
4. render the zone grid
5. render the agent cards
6. render the agent network
7. add comparison mode

## Reference Files

- Backend entry: [app/main.py](C:/Users/Lenovo/Desktop/CivitasX/app/main.py)
- API routes: [app/api.py](C:/Users/Lenovo/Desktop/CivitasX/app/api.py)
- Schemas: [app/models.py](C:/Users/Lenovo/Desktop/CivitasX/app/models.py)
- Simulation engine: [app/simulation.py](C:/Users/Lenovo/Desktop/CivitasX/app/simulation.py)
- Tests: [tests/test_simulation.py](C:/Users/Lenovo/Desktop/CivitasX/tests/test_simulation.py)
