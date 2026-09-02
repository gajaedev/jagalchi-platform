from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass
class DeepSeekResponse:
    """Structured DeepSeek response with safe access helpers."""

    data: Optional[Dict[str, Any]]
    raw_text: str
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    model: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def is_valid(self) -> bool:
        return self.data is not None and len(self.data) > 0

    @property
    def is_empty(self) -> bool:
        return self.data is None or not self.raw_text.strip()

    @property
    def text_length(self) -> int:
        return len(self.raw_text)

    def get(self, key: str, default: Any = None) -> Any:
        return default if self.data is None else self.data.get(key, default)

    def get_nested(self, *keys: str, default: Any = None) -> Any:
        current: Any = self.data
        for key in keys:
            if not isinstance(current, dict) or key not in current:
                return default
            current = current[key]
        return current

    def get_list(self, key: str, default: Optional[List[Any]] = None) -> List[Any]:
        fallback = [] if default is None else default
        value = self.get(key, fallback)
        return value if isinstance(value, list) else fallback

    def get_string(self, key: str, default: str = "") -> str:
        value = self.get(key, default)
        return default if value is None else str(value)

    def get_int(self, key: str, default: int = 0) -> int:
        try:
            return int(self.get(key, default))
        except (TypeError, ValueError):
            return default

    def get_float(self, key: str, default: float = 0.0) -> float:
        try:
            return float(self.get(key, default))
        except (TypeError, ValueError):
            return default

    def get_bool(self, key: str, default: bool = False) -> bool:
        value = self.get(key, default)
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ("true", "yes", "1", "on")
        return bool(value) if value is not None else default

    def keys(self) -> List[str]:
        return [] if self.data is None else list(self.data.keys())

    def has_key(self, key: str) -> bool:
        return self.data is not None and key in self.data

    def to_dict(self) -> Dict[str, Any]:
        return {
            "data": self.data,
            "raw_text": self.raw_text,
            "created_at": self.created_at.isoformat(),
            "model": self.model,
            "is_valid": self.is_valid,
            "text_length": self.text_length,
            "metadata": self.metadata,
        }


def create_empty_response(model: Optional[str] = None) -> DeepSeekResponse:
    return DeepSeekResponse(
        data=None,
        raw_text="",
        model=model,
        metadata={"error": "empty_response"},
    )


def create_error_response(error_message: str, model: Optional[str] = None) -> DeepSeekResponse:
    return DeepSeekResponse(
        data={"error": error_message},
        raw_text="",
        model=model,
        metadata={"error": True, "error_message": error_message},
    )
