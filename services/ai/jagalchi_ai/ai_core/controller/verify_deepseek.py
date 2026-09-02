"""Low-cost live DeepSeek connectivity check."""

import os

from jagalchi_ai.ai_core.client import DeepSeekClient


def main() -> None:
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise SystemExit("DEEPSEEK_API_KEY 환경 변수가 필요합니다.")
    client = DeepSeekClient(api_key=api_key)
    response = client.generate_json(
        'Return exactly this JSON object: {"ok": true}',
    )
    if not response.is_valid or response.get("ok") is not True:
        raise SystemExit("DeepSeek 응답 검증에 실패했습니다.")
    print(f"DeepSeek 연결 확인 완료: model={client.model_name}")


if __name__ == "__main__":
    main()
