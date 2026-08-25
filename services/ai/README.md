# Jagalchi Server AI

Jagalchi 학습 플랫폼의 AI 기능을 위한 Python/Django 기반 모듈입니다.

## 구성
- `jagalchi_ai/ai_core/`: Spring Boot 스타일 레이어드 구조(controller/service/repository/domain/common)
- `docs/ai/ai-spec.md`: 기능 스펙 및 파이프라인 문서
- `jagalchi_ai/ai_core/controller/verify_gemini.py`: Gemini 연결 확인 스크립트
- `jagalchi_ai/ai_core/controller/verify_tavily.py`: Tavily 검색 확인 스크립트
- `jagalchi_ai/ai_core/controller/verify_exa.py`: Exa 검색 확인 스크립트

## 환경 변수
- `GEMINI_API_KEY`: Google AI Studio 키 (로컬은 `.env` 사용)
- `TAVILY_API_KEY`: Tavily 검색 키 (로컬은 `.env` 사용)
- `EXA_API_KEY`: Exa 검색 키 (로컬은 `.env` 사용)
- `AI_DISABLE_EXTERNAL`: 외부 API 호출 비활성화(`true`일 때)
- `AI_DISABLE_LLM`: LLM 호출 비활성화(`true`일 때)
- `AI_AUTH_ENABLED`: AI API 인증 활성화 여부 (`true/false`, 기본 `true`)
- `AI_AUTH_JWT_SECRET`: AI API JWT(HS256) 서명/검증 시크릿 (필수로 강한 랜덤 값 권장)

## 토큰 발급(로컬)
```bash
# .env에 AI_AUTH_JWT_SECRET 먼저 설정한 뒤 실행
python manage.py issue_ai_token \
  --sub user-1 \
  --roadmap-id rm_frontend \
  --permissions EDIT \
  --export AI_AUTH_DEV_TOKEN_EDIT \
  --write-env-file .env
```

## 로컬 실행(선택)
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py test
```

## Docker 실행
```bash
docker compose up --build
```

## 데모 엔드포인트
```bash
curl -H "Authorization: Bearer $AI_AUTH_DEV_TOKEN_EDIT" \
  "http://localhost:8000/api/ai/demo?roadmap_id=rm_frontend&tech_slug=react&user_id=user-1"
```

## 개별 엔드포인트
- `GET /api/ai/record-coach`
- `GET /api/ai/related-roadmaps`
- `GET /api/ai/tech-cards`
- `GET /api/ai/tech-fingerprint`
- `GET /api/ai/comment-digest`
- `GET /api/ai/comment-duplicates`
- `GET /api/ai/resource-recommendation`
- `GET /api/ai/learning-pattern`
- `GET /api/ai/graph-rag`
- `GET /api/ai/roadmap-generated`
- `GET /api/ai/learning-coach`
- `GET /api/ai/roadmap-recommendation`

## Swagger 문서
- OpenAPI JSON: `http://localhost:8000/api/schema/`
- Swagger UI: `http://localhost:8000/api/docs/`
- Redoc: `http://localhost:8000/api/redoc/`

## Gemini 연결 확인(선택)
```bash
export GEMINI_API_KEY=your-key
python -m jagalchi_ai.ai_core.controller.verify_gemini
```

## Tavily 검색 확인(선택)
```bash
export TAVILY_API_KEY=your-key
python -m jagalchi_ai.ai_core.controller.verify_tavily
```

## Exa 검색 확인(선택)
```bash
export EXA_API_KEY=your-key
python -m jagalchi_ai.ai_core.controller.verify_exa
```
