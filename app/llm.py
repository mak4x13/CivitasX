import json
import os
from typing import Any, Dict, Optional
from urllib import error, request

from app.models import ScenarioRequest


class GroqExplanationService:
    """Optional Groq-backed executive summary generator."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        self.base_url = os.getenv(
            "GROQ_BASE_URL",
            "https://api.groq.com/openai/v1/chat/completions",
        )

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def summarize(
        self,
        scenario: ScenarioRequest,
        structured_payload: Dict[str, Any],
    ) -> Optional[str]:
        if not self.is_configured():
            return None

        prompt = {
            "city": scenario.city.value,
            "scenario_type": scenario.scenario_type.value,
            "scores": structured_payload.get("scores", {}),
            "conflicts": structured_payload.get("conflicts", []),
            "main_risks": structured_payload.get("main_risks", []),
            "alternative_policy": structured_payload.get("alternative_policy", {}),
        }
        body = {
            "model": self.model,
            "temperature": 0.2,
            "max_tokens": 220,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are generating a concise executive brief for a city policy "
                        "simulation dashboard. Focus on cause-effect reasoning, major risks, "
                        "and safer alternatives in 3 to 4 sentences."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(prompt),
                },
            ],
        }
        payload = json.dumps(body).encode("utf-8")
        groq_request = request.Request(
            self.base_url,
            data=payload,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with request.urlopen(groq_request, timeout=15) as response:
                decoded = json.loads(response.read().decode("utf-8"))
        except (error.URLError, error.HTTPError, TimeoutError, ValueError):
            return None

        choices = decoded.get("choices") or []
        if not choices:
            return None
        message = choices[0].get("message") or {}
        content = message.get("content")
        if not isinstance(content, str):
            return None
        return content.strip()

