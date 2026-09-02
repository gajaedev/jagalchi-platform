from __future__ import annotations

import json
import logging
import os
import re
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Generator, List, Optional, Union

import httpx

from jagalchi_ai.ai_core.client.deepseek_response import (
    DeepSeekResponse,
    create_empty_response,
)

logger = logging.getLogger(__name__)

_JSON_OBJECT_RE = re.compile(r"\{.*\}", re.DOTALL)
_JSON_ARRAY_RE = re.compile(r"\[.*\]", re.DOTALL)
_RETRYABLE_STATUS_CODES = frozenset({429, 500, 503})
_ALLOWED_MODELS = frozenset({"deepseek-v4-flash", "deepseek-v4-pro"})


class DeepSeekError(RuntimeError):
    """Base error for a failed DeepSeek request."""


class DeepSeekConfigurationError(DeepSeekError):
    """Raised when local DeepSeek configuration is invalid."""


class DeepSeekAPIError(DeepSeekError):
    def __init__(self, message: str, *, status_code: Optional[int] = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class DeepSeekModel(str, Enum):
    V4_FLASH = "deepseek-v4-flash"
    V4_PRO = "deepseek-v4-pro"


@dataclass
class GenerationConfig:
    temperature: float = 0.7
    top_p: float = 0.95
    top_k: int = 0
    max_output_tokens: int = 8192
    stop_sequences: List[str] = field(default_factory=list)

    def to_payload(self) -> Dict[str, Any]:
        if not 0 <= self.temperature <= 2:
            raise DeepSeekConfigurationError("temperature must be between 0 and 2")
        if not 0 < self.top_p <= 1:
            raise DeepSeekConfigurationError("top_p must be greater than 0 and at most 1")
        if self.max_output_tokens < 1:
            raise DeepSeekConfigurationError("max_output_tokens must be positive")
        payload: Dict[str, Any] = {
            "temperature": self.temperature,
            "top_p": self.top_p,
            "max_tokens": self.max_output_tokens,
        }
        if self.stop_sequences:
            payload["stop"] = self.stop_sequences
        return payload


class DeepSeekClient:
    """Synchronous OpenAI-compatible client for DeepSeek Chat Completions."""

    DEFAULT_MODEL = DeepSeekModel.V4_FLASH
    DEFAULT_BASE_URL = "https://api.deepseek.com"
    DEFAULT_TIMEOUT = 45
    DEFAULT_MAX_RETRIES = 3

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[Union[str, DeepSeekModel]] = None,
        timeout: Optional[int] = None,
        max_retries: Optional[int] = None,
        base_url: Optional[str] = None,
        thinking_enabled: Optional[bool] = None,
        transport: Optional[httpx.BaseTransport] = None,
    ) -> None:
        self._api_key = (api_key or os.getenv("DEEPSEEK_API_KEY", "")).strip()
        configured_model = model or os.getenv("DEEPSEEK_MODEL") or self.DEFAULT_MODEL
        self._model = (
            configured_model.value
            if isinstance(configured_model, DeepSeekModel)
            else str(configured_model).strip()
        )
        self._base_url = (base_url or os.getenv("DEEPSEEK_BASE_URL") or self.DEFAULT_BASE_URL).rstrip("/")
        self._timeout = timeout or _positive_int_env("DEEPSEEK_TIMEOUT_SECONDS", self.DEFAULT_TIMEOUT)
        self._max_retries = (
            max_retries
            if max_retries is not None
            else _non_negative_int_env("DEEPSEEK_MAX_RETRIES", self.DEFAULT_MAX_RETRIES)
        )
        self._thinking_enabled = (
            thinking_enabled
            if thinking_enabled is not None
            else os.getenv("DEEPSEEK_THINKING_ENABLED", "false").lower() == "true"
        )
        self._disabled = (
            os.getenv("AI_DISABLE_LLM", "").lower() == "true"
            or os.getenv("AI_DISABLE_EXTERNAL", "").lower() == "true"
        )
        self._last_error: Optional[str] = None
        self._validate_configuration()
        self._client = httpx.Client(
            base_url=self._base_url,
            timeout=httpx.Timeout(self._timeout),
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            transport=transport,
        ) if self._api_key and not self._disabled else None

    def _validate_configuration(self) -> None:
        if self._model not in _ALLOWED_MODELS:
            raise DeepSeekConfigurationError(
                f"DEEPSEEK_MODEL must be one of {', '.join(sorted(_ALLOWED_MODELS))}"
            )
        parsed = httpx.URL(self._base_url)
        if parsed.scheme != "https" or not parsed.host or parsed.path not in ("", "/"):
            raise DeepSeekConfigurationError(
                "DEEPSEEK_BASE_URL must be an HTTPS origin without a path"
            )
        if not 1 <= self._timeout <= 300:
            raise DeepSeekConfigurationError("DEEPSEEK_TIMEOUT_SECONDS must be between 1 and 300")
        if not 0 <= self._max_retries <= 5:
            raise DeepSeekConfigurationError("DEEPSEEK_MAX_RETRIES must be between 0 and 5")

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def is_available(self) -> bool:
        return self._client is not None and not self._disabled

    def available(self) -> bool:
        return self.is_available

    def generate_text(
        self,
        contents: str,
        config: Optional[GenerationConfig] = None,
        system_instruction: Optional[str] = None,
    ) -> str:
        if not self.is_available:
            self._last_error = "disabled" if self._disabled else "missing_api_key"
            return ""
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": contents})
        try:
            payload = self._completion_payload(messages, config)
            return self._request_completion(payload)
        except (DeepSeekError, httpx.HTTPError) as exc:
            self._last_error = type(exc).__name__
            logger.error(
                "DeepSeek text generation failed",
                extra={"model": self._model, "error_type": type(exc).__name__},
            )
            return ""

    def generate_json(
        self,
        contents: str,
        config: Optional[GenerationConfig] = None,
        system_instruction: Optional[str] = None,
    ) -> DeepSeekResponse:
        instruction = (
            "Return one valid JSON object and no Markdown. "
            + (system_instruction or "")
        ).strip()
        if not self.is_available:
            self._last_error = "disabled" if self._disabled else "missing_api_key"
            return create_empty_response(model=self._model)
        messages = [
            {"role": "system", "content": instruction},
            {"role": "user", "content": contents},
        ]
        try:
            payload = self._completion_payload(messages, config)
            payload["response_format"] = {"type": "json_object"}
            raw_text = self._request_completion(payload)
        except (DeepSeekError, httpx.HTTPError) as exc:
            self._last_error = type(exc).__name__
            logger.error(
                "DeepSeek JSON generation failed",
                extra={"model": self._model, "error_type": type(exc).__name__},
            )
            return create_empty_response(model=self._model)
        data = _safe_json_parse(raw_text)
        return DeepSeekResponse(
            data=data,
            raw_text=raw_text,
            model=self._model,
            metadata={"parse_success": data is not None, "raw_length": len(raw_text)},
        )

    def generate_structured(
        self,
        contents: str,
        schema: Dict[str, Any],
        config: Optional[GenerationConfig] = None,
        system_instruction: Optional[str] = None,
    ) -> DeepSeekResponse:
        schema_prompt = (
            "Return JSON matching this schema:\n"
            f"{json.dumps(schema, ensure_ascii=False)}\nRequest:\n{contents}"
        )
        return self.generate_json(schema_prompt, config, system_instruction)

    def generate_stream(
        self,
        contents: str,
        config: Optional[GenerationConfig] = None,
        system_instruction: Optional[str] = None,
    ) -> Generator[str, None, None]:
        if not self.is_available or self._client is None:
            return
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": contents})
        payload = self._completion_payload(messages, config)
        payload["stream"] = True
        try:
            with self._client.stream("POST", "/chat/completions", json=payload) as response:
                self._raise_for_status(response)
                for line in response.iter_lines():
                    if not line.startswith("data: ") or line == "data: [DONE]":
                        continue
                    chunk = json.loads(line[6:])
                    text = chunk.get("choices", [{}])[0].get("delta", {}).get("content")
                    if text:
                        yield text
        except (DeepSeekError, httpx.HTTPError, json.JSONDecodeError) as exc:
            self._last_error = type(exc).__name__
            logger.error(
                "DeepSeek streaming generation failed",
                extra={"model": self._model, "error_type": type(exc).__name__},
            )

    def chat(
        self,
        messages: List[Dict[str, str]],
        config: Optional[GenerationConfig] = None,
        system_instruction: Optional[str] = None,
    ) -> str:
        normalized = []
        if system_instruction:
            normalized.append({"role": "system", "content": system_instruction})
        normalized.extend(
            {"role": message.get("role", "user"), "content": message.get("content", "")}
            for message in messages
        )
        if not self.is_available:
            return ""
        try:
            return self._request_completion(self._completion_payload(normalized, config))
        except (DeepSeekError, httpx.HTTPError) as exc:
            self._last_error = type(exc).__name__
            return ""

    def _completion_payload(
        self,
        messages: List[Dict[str, str]],
        config: Optional[GenerationConfig],
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "model": self._model,
            "messages": messages,
            "stream": False,
            "thinking": {"type": "enabled" if self._thinking_enabled else "disabled"},
        }
        payload.update((config or GenerationConfig()).to_payload())
        return payload

    def _request_completion(self, payload: Dict[str, Any]) -> str:
        if self._client is None:
            raise DeepSeekConfigurationError("DEEPSEEK_API_KEY is required")
        for attempt in range(self._max_retries + 1):
            try:
                response = self._client.post("/chat/completions", json=payload)
                self._raise_for_status(response)
                body = response.json()
                content = body.get("choices", [{}])[0].get("message", {}).get("content")
                if not isinstance(content, str) or not content.strip():
                    raise DeepSeekAPIError("DeepSeek returned an empty completion")
                self._last_error = None
                return content
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                if attempt >= self._max_retries:
                    raise DeepSeekAPIError("DeepSeek transport failed after retries") from exc
            except DeepSeekAPIError as exc:
                if exc.status_code not in _RETRYABLE_STATUS_CODES or attempt >= self._max_retries:
                    raise
            time.sleep(min(2 ** attempt, 8))
        raise DeepSeekAPIError("DeepSeek request failed")

    @staticmethod
    def _raise_for_status(response: httpx.Response) -> None:
        if response.is_success:
            return
        status = response.status_code
        messages = {
            400: "invalid request",
            401: "authentication failed",
            402: "insufficient balance",
            422: "invalid parameters",
            429: "rate limit reached",
            500: "server error",
            503: "service overloaded",
        }
        raise DeepSeekAPIError(messages.get(status, "unexpected API error"), status_code=status)

    def count_tokens(self, text: str) -> int:
        korean_chars = sum(1 for char in text if "가" <= char <= "힣")
        return (korean_chars // 2) + ((len(text) - korean_chars) // 4)

    def health_check(self) -> Dict[str, Any]:
        return {
            "available": self.is_available,
            "model": self._model,
            "api_key_set": bool(self._api_key),
            "disabled": self._disabled,
            "timeout": self._timeout,
            "max_retries": self._max_retries,
            "thinking_enabled": self._thinking_enabled,
            "last_error": self._last_error,
        }


def _positive_int_env(key: str, default: int) -> int:
    try:
        value = int(os.getenv(key, str(default)))
    except ValueError as exc:
        raise DeepSeekConfigurationError(f"{key} must be an integer") from exc
    if value < 1:
        raise DeepSeekConfigurationError(f"{key} must be positive")
    return value


def _non_negative_int_env(key: str, default: int) -> int:
    try:
        value = int(os.getenv(key, str(default)))
    except ValueError as exc:
        raise DeepSeekConfigurationError(f"{key} must be an integer") from exc
    if value < 0:
        raise DeepSeekConfigurationError(f"{key} must not be negative")
    return value


def _safe_json_parse(text: str) -> Optional[Dict[str, Any]]:
    if not text or not text.strip():
        return None
    candidates = [text.strip()]
    code_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if code_match:
        candidates.append(code_match.group(1).strip())
    for pattern in (_JSON_OBJECT_RE, _JSON_ARRAY_RE):
        match = pattern.search(text)
        if match:
            candidates.append(match.group(0))
    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict):
                return parsed
            if isinstance(parsed, list):
                return {"items": parsed}
        except json.JSONDecodeError:
            continue
    return None


def get_default_client() -> DeepSeekClient:
    return DeepSeekClient()


def quick_generate(prompt: str) -> str:
    return DeepSeekClient().generate_text(prompt)
