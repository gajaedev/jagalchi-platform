import json
import os
import unittest
from unittest.mock import patch

import httpx

from jagalchi_ai.ai_core.client import (
    DeepSeekClient,
    DeepSeekConfigurationError,
    GenerationConfig,
)


class DeepSeekClientTests(unittest.TestCase):
    def setUp(self) -> None:
        self.environment = patch.dict(
            os.environ,
            {"AI_DISABLE_EXTERNAL": "false", "AI_DISABLE_LLM": "false"},
            clear=False,
        )
        self.environment.start()

    def tearDown(self) -> None:
        self.environment.stop()

    def test_generate_json_uses_official_chat_contract(self) -> None:
        captured = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured.update(json.loads(request.content))
            return httpx.Response(
                200,
                json={
                    "choices": [{"message": {"content": '{"ok": true}'}}],
                    "model": "deepseek-v4-flash",
                },
            )

        client = DeepSeekClient(
            api_key="test-key",
            transport=httpx.MockTransport(handler),
            max_retries=0,
        )
        response = client.generate_json("Return JSON")

        self.assertTrue(response.is_valid)
        self.assertTrue(response.get("ok"))
        self.assertEqual(captured["model"], "deepseek-v4-flash")
        self.assertEqual(captured["response_format"], {"type": "json_object"})
        self.assertEqual(captured["thinking"], {"type": "disabled"})

    def test_retryable_timeout_is_retried_without_leaking_error_body(self) -> None:
        attempts = 0

        def handler(request: httpx.Request) -> httpx.Response:
            nonlocal attempts
            attempts += 1
            if attempts == 1:
                raise httpx.ReadTimeout("temporary", request=request)
            return httpx.Response(
                200,
                json={"choices": [{"message": {"content": "ok"}}]},
            )

        client = DeepSeekClient(
            api_key="test-key",
            transport=httpx.MockTransport(handler),
            max_retries=1,
        )
        with patch("jagalchi_ai.ai_core.client.deepseek_client.time.sleep"):
            self.assertEqual(client.generate_text("hello"), "ok")
        self.assertEqual(attempts, 2)

    def test_authentication_error_is_not_retried(self) -> None:
        attempts = 0

        def handler(request: httpx.Request) -> httpx.Response:
            nonlocal attempts
            attempts += 1
            return httpx.Response(401, json={"error": {"message": "secret provider text"}})

        client = DeepSeekClient(
            api_key="test-key",
            transport=httpx.MockTransport(handler),
            max_retries=3,
        )
        self.assertEqual(client.generate_text("hello"), "")
        self.assertEqual(attempts, 1)
        self.assertEqual(client.health_check()["last_error"], "DeepSeekAPIError")

    def test_invalid_model_fails_closed(self) -> None:
        with self.assertRaises(DeepSeekConfigurationError):
            DeepSeekClient(api_key="test-key", model="deepseek-chat")

    def test_invalid_generation_config_fails_closed(self) -> None:
        client = DeepSeekClient(api_key="test-key", max_retries=0)
        self.assertEqual(
            client.generate_text("hello", config=GenerationConfig(temperature=3)),
            "",
        )


if __name__ == "__main__":
    unittest.main()
