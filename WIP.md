# Jagalchi 배포 WIP

기준 시각: 2026-09-01 14:04 KST

## 현재 판정

전체 기능 활성화용 코드와 개인 서버 배포 프로필은 준비됐다. API, AI의 CI parity, Web의 독립 검증, example env 기반 API·AI production image build, Compose/Caddy 정적 계약, disposable MinIO 경계 검증은 통과했지만 실제 secret을 사용한 전체 Compose 기동은 아직 검증하지 않았다. 따라서 현재 상태는 **deployment candidate**이며 최종 **deployment-ready** 승인은 보류한다.

실제 Cloudtype, Vercel, DNS, Supabase allowlist에는 이번 작업에서 변경을 가하지 않았다.

## 완료

### 전체 기능 활성화 계약

API:

- `AI_FEATURES_ENABLED=true`
- `UPLOADS_ENABLED=true`
- `EVIDENCE_EXECUTION_ENABLED=true`
- `PUBLIC_PROOF_PROFILE_ENABLED=true`
- `OAUTH_ENABLED=true`

Web:

- `NEXT_PUBLIC_API_MOCKING=false`
- `NEXT_PUBLIC_AI_FEATURES_ENABLED=true`
- `NEXT_PUBLIC_REALTIME_ENABLED=true`
- `NEXT_PUBLIC_EVIDENCE_EXECUTION_ENABLED=true`
- `NEXT_PUBLIC_PROOF_PROFILE_ENABLED=true`
- `NEXT_PUBLIC_OAUTH_ENABLED=true`

AI:

- `AI_DISABLE_EXTERNAL=false`
- `AI_DISABLE_LLM=false`
- `AI_AUTH_ENABLED=true`

### 배포 프로필

- `compose.production.yml`
  - Nest API production 이미지
  - Django AI production/Gunicorn 이미지
  - 영속 AI PostgreSQL
  - 영속 MinIO
  - Caddy HTTPS ingress
  - API 컨테이너 직접 외부 노출 없음
  - API는 외부 Supabase TLS PostgreSQL 사용
- `deploy/Caddyfile`
  - API와 uploads 호스트 분리
- `deploy/personal-server.env.example`
  - 필수 변수와 안전한 placeholder 목록
  - 실제 secret 미포함

### Fail-closed 보호

- production API feature flag는 모두 명시적 boolean이어야 한다.
- OAuth가 꺼져 있거나 누락·오타 상태면 API가 OAuth 진입점에서 즉시 `OAUTH_DISABLED`를 반환한다.
- OAuth 활성화 시 Google, GitHub, Apple credential 전체가 필요하다.
- AI, uploads, Evidence 활성화 시 각 provider credential 누락으로 startup이 실패한다.
- Web production build는 다섯 개 공개 feature flag의 누락·오타를 거부한다.
- MinIO anonymous download는 `public/profiles` prefix에만 부여한다. `private/roadmaps`는 비공개다.

### 검증 결과

- API lint: 통과
- API build: 통과
- API tests: **191 passed** (migration runner lock tests 4개 포함)
- AI CI parity, Python 3.11 (`python manage.py check` + `python manage.py test jagalchi_ai.ai_core.tests`): **37 passed**
- Web lint: 통과
- Web TypeScript (`tsc --noEmit`): 통과
- Web full-feature production build: 통과
- Web unit tests: **153 files, 1007 passed**
- Web MSW production-server Playwright: **75 passed / 1 existing `test.fixme` skip** (76 tests collected)
- Web production environment verifier: 통과
- `docker compose --env-file deploy/personal-server.env.example -f compose.production.yml config --quiet`: 통과
- Compose assertions: API direct port 미노출, migration 완료 의존성, pinned MinIO 이미지와 `public/profiles/` trailing slash 확인
- Caddy `2.10.0-alpine caddy validate`: 통과
- API·AI production image, example env 기반 Compose build: 통과
- API image: `jagalchi-personal-api:production`, `sha256:4a743e8c24cf56b4aa9b8d9955aa5a759e9ed2265917ee176cb05ce60b977288`, 80,282,662 bytes, `arm64/linux`, non-root `node`
- AI image: `jagalchi-personal-ai:latest`, `sha256:971dbe2b071e24ce9575bc2406e69d843a05c6739954e4dd8e9dbb1f0de5ca78`, 229,348,669 bytes, `arm64/linux`, non-root `appuser`
- AI production `pip check`, Python/Gunicorn binary checks, `sentence_transformers` 부재 확인: 통과
- AI production source smoke: 115개 애플리케이션 모듈 import 통과
- AI development target build, `pip check`, Django check, `jagalchi_ai.ai_core.tests`: **37 passed**
- 새 volume 없는 pinned MinIO disposable test: init 2회 idempotent, `public/profiles` HTTP 200, `public/profiles-private` HTTP 403, `private/roadmaps` HTTP 403
- `git diff --check`: 통과

위 Playwright 결과는 build-time `NEXT_PUBLIC_*` mocking flag를 사용한 MSW production-server 검증이다. 실제 secret 기반 Compose, 외부 provider, 실제 uploads/DB 경계, full-feature production E2E의 증거로 사용하지 않는다. `1 skip`은 기존 `apps/web/e2e/editor.spec.ts`의 `test.fixme`이며 이번 작업에서 완료 처리하지 않았다.

## 남은 작업

### 1. 실제 secret 파일 준비

`deploy/personal-server.env.example`을 기준으로 서버 전용 env 파일을 만든다. 파일은 Git에 추가하지 않는다.

필수 범주:

- 개인 서버 API/uploads 도메인과 Caddy 이메일
- Supabase `DATABASE_URL`, TLS CA, 승인된 서버 outbound CIDR
- JWT, verification, rate-limit, AI auth, Django secret
- GitHub App ID, private key, webhook secret, slug, setup URL
- MinIO access key, secret, bucket
- Google Play service account와 IAP binding secret
- Google, GitHub, Apple OAuth credential
- Resend API key와 sender
- Gemini, Tavily, Exa API key
- Vercel Web full-feature environment variables

비밀값을 이 문서, Git, CI 출력, 채팅에 기록하지 않는다.

### 2. 전체 Compose 기동

개인 서버 secret 파일을 사용한다.

```bash
docker compose \
  --env-file /secure/path/jagalchi-production.env \
  -f compose.production.yml \
  up -d --build
```

확인 항목:

- `api`, `ai`, `ai-db`, `minio`, `caddy` healthy
- `minio-init` 성공 종료
- API migration 단일 실행
- `GET /api/health` 200
- `GET /api/health/ready` 200
- AI `/ai/health/` 200
- uploads hostname에서 public profile GET 성공
- private roadmap object의 익명 GET 거부
- presigned PUT, HEAD, GET, DELETE 성공

### 3. Full-feature E2E

실제 Compose 환경에서 다음 흐름을 확인한다.

- 이메일 가입, 인증, 로그인, refresh, 계정 삭제
- Google, GitHub, Apple OAuth
- roadmap create/edit/view/fork
- Socket.IO 재연결과 동기화
- AI roadmap 생성과 learning coach
- ticket/IAP 검증
- profile upload와 private attachment download
- GitHub App 설치, repository claim, webhook, 별도 reviewer 승인
- public Proof profile
- analytics 이벤트 중복·민감정보 확인

### 4. 재시작·복구 검증

- 컨테이너 재시작 후 5분 이내 무인 readiness 복구
- 서버 재부팅 후 5분 이내 무인 readiness 복구
- 10초 간격 readiness 3회 연속 200
- DB-backed roadmap 응답 hash 재부팅 전후 동일
- 로그에서 token, DB URL, private key, provider key 패턴 0건
- Supabase allowlist에는 개인 서버와 기존 Cloudtype fallback CIDR만 유지

### 5. Cutover

모든 검증 후에만 수행한다.

1. 최신 reviewed SHA와 image digest 고정
2. 개인 서버 API readiness 확인
3. Vercel `API_ORIGIN`과 realtime origin 변경
4. 실제 계정 smoke 수행
5. Cloudtype는 rollback fallback으로 유지
6. 실패 시 즉시 기존 Cloudtype origin으로 복구

## 최종 승인 조건

아래가 모두 충족되면 **deployment-ready**로 판정한다.

- API·AI production 이미지 빌드 성공
- 실제 secret 기반 전체 Compose healthy
- full-feature E2E 통과
- 재부팅 무인 복구 통과
- Supabase TLS/allowlist 검증
- uploads public/private 경계 검증
- 실제 계정과 Evidence smoke 통과
- Cloudtype rollback 실증
- 변경사항 review 후 커밋
