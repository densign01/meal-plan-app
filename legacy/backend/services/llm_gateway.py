import os
from typing import List, Dict, Any

import httpx

AI_GATEWAY_URL = os.getenv("AI_GATEWAY_URL", "http://localhost:8787")


async def chat_completion(
    messages: List[Dict[str, str]],
    *,
    model: str = "gpt-5-mini",
    provider: str = "openai",
    max_tokens: int | None = None,
    temperature: float | None = None
) -> Dict[str, Any]:
    """Call the external AI gateway for a chat completion."""

    payload: Dict[str, Any] = {
        "model": model,
        "provider": provider,
        "messages": messages,
    }

    if max_tokens is not None:
        payload["maxTokens"] = max_tokens

    if temperature is not None:
        payload["temperature"] = temperature

    url = f"{AI_GATEWAY_URL.rstrip('/')}/v1/chat/completions"

    async with httpx.AsyncClient(timeout=httpx.Timeout(60.0)) as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            error_payload: Dict[str, Any] = {}
            try:
                error_payload = exc.response.json()
            except Exception:
                error_payload = {"raw": exc.response.text}
            raise RuntimeError(
                f"AI gateway request failed with status {exc.response.status_code}: {error_payload}"
            ) from exc

        return response.json()
