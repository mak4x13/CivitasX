import json
import os
from typing import Any, Dict, Optional

from groq import APIError, Groq

from app.models import ScenarioRequest


class GroqExplanationService:
    """Optional Groq-backed executive summary generator."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        self.base_url = self._normalize_base_url(
            os.getenv("GROQ_BASE_URL", "https://api.groq.com")
        )
        self.client = (
            Groq(api_key=self.api_key, base_url=self.base_url, timeout=15)
            if self.api_key
            else None
        )

    def is_configured(self) -> bool:
        return self.client is not None

    def _normalize_base_url(self, value: str) -> str:
        legacy_suffix = "/openai/v1/chat/completions"
        if value.endswith(legacy_suffix):
            return value[: -len(legacy_suffix)]
        return value.rstrip("/")

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
        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                temperature=0.2,
                max_completion_tokens=220,
                messages=[
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
            )
        except APIError:
            return None

        choices = completion.choices or []
        if not choices:
            return None
        content = choices[0].message.content
        if not isinstance(content, str):
            return None
        return content.strip()
