# NET — OB총회 캡슐 가챠

경희대학교 컴퓨터공학과 NET 동아리 행사에서 사용하는 모바일 웹입니다. 닉네임으로 입장하고, 그룹별 질문함에 익명 질문을 넣고, 캡슐 영상과 함께 질문을 뽑습니다.

현재 기능:

- 사원증 형태의 첫 방문 화면, 닉네임·visitorId 저장, 재방문 자동 입장.
- 초기 TABLE 01–03. 누구나 그룹 추가·이름 변경, 테이블 참가자 닉네임 표시.
- 1–200자 익명 질문과 선배/후배/모두 대상 선택.
- PNG 스티커 드래그 꾸미기, 대상 뱃지 기본 표시·이동, 꾸민 편지 그대로 추첨 결과 복원.
- 대기/추첨 MP4, 결과 카드, 영상 오류 대체 UI, reduced-motion 지원.
- FastAPI 참가자 세션, 테이블 접근 검증, PostgreSQL 원자적 추첨, 멱등 키와 최근 결과 복구.

## 하루 행사 배포: Railway + Supabase

Vercel은 필수가 아닙니다. 루트 `Dockerfile`은 React를 HTTP 모드로 빌드하고 FastAPI가 정적 파일을 함께 제공합니다.

```text
모바일 HTTPS 주소 → Railway 하나 (React + FastAPI) → Supabase PostgreSQL
```

같은 도메인의 `/api`를 사용하므로 프론트 API 주소 설정이나 외부 CORS 허용이 필요하지 않습니다. 영상·이미지·폰트도 이 서버가 제공합니다. DB 접속 정보는 서버 환경변수에만 저장합니다.

### 1. Supabase 준비

1. 행사 전용 Free 프로젝트를 사용합니다. 다른 앱의 기존 DB를 재사용하지 마세요.
2. [마이그레이션 안내](supabase/migrations/README.md)의 SQL 3개를 파일명 순서대로 적용합니다. 기존 질문/추첨 이력은 삭제하지 않습니다.
3. Connect → **Session pooler**의 PostgreSQL URL을 사용합니다. 포트는 `5432`, `sslmode=require`를 지정합니다. 비밀번호의 특수 문자는 URL 인코딩합니다.
4. 이 URL을 Railway의 `DATABASE_URL`에 넣습니다. 프론트 `VITE_` 변수나 GitHub에는 넣지 않습니다. Supabase service role key는 현재 서버 구현에 필요하지 않습니다.

로컬의 보호된 `backend/.env`에 DB URL을 넣었다면 다음 명령으로도 SQL을 적용할 수 있습니다.

```bash
cd backend
python -m app.migrate
```

이 명령은 지정된 DB에만 명시적으로 적용합니다. 서버 시작 때 자동으로 마이그레이션하거나 DB를 초기화하지 않습니다.

### 2. Railway 준비

1. 남은 무료 크레딧과 체험 상태를 먼저 확인합니다. 유료 플랜 가입은 필요하지 않습니다. `Limited Trial`이면 외부 DB 연결이 제한될 수 있습니다.
2. GitHub의 `harrysky23/NETDOMGATCHA`를 서비스로 연결합니다.
3. Root Directory는 **저장소 루트(`/`)**로 둡니다. `frontend`나 `backend`로 바꾸지 않습니다. Railway가 루트 `Dockerfile`을 감지합니다.
4. Variables에 `DATABASE_URL`을 설정합니다. 통합 배포는 `CORS_ORIGINS=[]` 또는 미설정으로 둡니다.
5. Start Command는 비워 Dockerfile의 기본 명령을 사용합니다. 플랫폼의 `PORT`를 자동으로 따릅니다.
6. Healthcheck Path를 `/api/health`로 지정합니다.
7. Networking에서 공개 도메인을 생성합니다. 이 HTTPS 주소가 참가자용 주소입니다.
8. 남은 크레딧 안에서 행사 중에는 Serverless/절전 설정을 끄고 사용합니다. 행사 후에는 필요 없는 서비스를 중지합니다. 과금되는 플랜/옵션을 새로 켜지 않습니다.

무료 크레딧으로 운영이 어려우면 같은 Dockerfile을 Render Free Web Service에 배포할 수 있습니다. Render에서는 Runtime을 Docker, Root Directory를 루트, 환경변수를 동일하게 지정합니다. 무료 서비스는 유휴 후 절전하므로 행사 시작 전에 주소를 열고 API 동작을 확인합니다.

공식 안내: [Railway 체험](https://docs.railway.com/pricing/free-trial), [Railway Docker 배포](https://docs.railway.com/builds/dockerfiles), [Render 무료 제한](https://render.com/docs/free), [Supabase DB 연결](https://supabase.com/docs/guides/database/connecting-to-postgres).

## 로컬 실행

### 목업 UI

```bash
cd frontend
npm ci
npm run dev
```

기본 주소는 `http://127.0.0.1:5173`입니다. 목업 질문·그룹·참가자는 이 브라우저에만 저장됩니다. 서로 다른 휴대폰의 공유 테스트는 HTTP 모드에서 수행해야 합니다.

### 실제 API와 연결

`backend/.env.example`을 참고해 무시된 `backend/.env`에 실제 DB URL을 설정하고 SQL을 적용합니다.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app.migrate
uvicorn app.main:app --reload --env-file .env --host 127.0.0.1 --port 8000
```

개발 시 백엔드의 `CORS_ORIGINS`는 `["http://127.0.0.1:5173"]`로 설정합니다.

프론트의 무시된 `frontend/.env`:

```dotenv
VITE_API_MODE=http
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

프론트 환경변수 변경 후 개발 서버를 다시 시작합니다.

### 통합 Docker 빌드

```bash
docker build -t net-event .
docker run --rm --env-file backend/.env -p 8000:8000 net-event
```

`http://127.0.0.1:8000`에서 웹과 API를 함께 확인합니다. 이 구성의 DB는 컨테이너가 접근할 수 있는 Supabase URL을 사용합니다.

## Vercel을 별도로 쓰는 경우

- Root Directory: `frontend`
- Framework: Vite, Build Command: `npm run build`, Output Directory: `dist`
- `VITE_API_MODE=http`
- `VITE_API_BASE_URL=https://실제-백엔드-도메인/api`
- 백엔드 `CORS_ORIGINS`에는 실제 Vercel HTTPS origin만 허용합니다. `*`는 사용하지 않습니다.
- `frontend/vercel.json`에 SPA rewrite가 있습니다. `/assets/`, `/fonts/`는 실제 정적 파일로 제공합니다.
- 프론트 환경변수는 빌드 시 반영되므로 변경 후 다시 배포합니다.

## 행사 전 확인

- `/api/health`가 DB 연결 정상 응답을 반환하는지 확인.
- 참가자용 HTTPS 주소를 QR에 연결. 배포 주소를 변경하면 QR도 갱신.
- 10–20개의 서로 다른 세션/휴대폰으로 동시 접속·질문 등록·추첨 확인.
- 같은 테이블에서 질문·참가자 이름이 공유되고 다른 테이블은 분리되는지 확인.
- 그룹 이름 변경 후 질문/기록이 유지되는지 확인.
- 스티커 위치·질문 대상이 다른 기기의 추첨 결과에서도 복원되는지 확인.
- iPhone Safari/Android Chrome에서 대기·추첨 영상과 실패 시 질문 공개, 결과 닫기 확인.
- 영상 중 새로고침한 후 최근 추첨 결과를 복구하고 같은 멱등 키가 재사용되는지 확인.
- 폰트 URL이 HTML 대신 실제 TTF를 반환하는지 확인.
- 서버의 무료 크레딧·외부 DB 연결·공개 주소·환경변수를 확인. 민감정보를 로그나 화면에 공개하지 않기.

## 검증 명령

```bash
cd frontend
npm run build
npm run test:mock
```

```bash
cd backend
pip install -r requirements-test.txt
python -m pytest -q
```

PostgreSQL 동시성 테스트는 임시 로컬 `net_test` DB를 `NET_TEST_DATABASE_URL`로 지정해야 실행됩니다. 운영 Supabase DB에는 실행하지 않습니다.

## 구성

- `frontend/src/components/identity`: 사원증 화면.
- `frontend/src/components/gacha`: 머신·영상·결과 카드·스티커 편집.
- `frontend/src/components/tables`: 공개 그룹 관리·참가자 명단.
- `frontend/src/services`: HTTP/목업 API, 저장소, 복구.
- `backend/app`: FastAPI, Pydantic 검증, 모델, 정적 웹 제공, 마이그레이션 실행기.
- `supabase/migrations`: 스키마와 기존 데이터 보존 SQL.

원본 PNG/MP4는 `asset/`에 보존합니다. 앱에서는 `frontend/src/assets`의 에셋을 사용합니다. 글자·닉네임 입력·버튼은 HTML이며 PNG에 합성하지 않습니다. 폰트는 `frontend/public/fonts/OngleipParkDahyun.ttf`입니다.

현재 HTTP 관리자 인증/질문 삭제/추첨 초기화 API는 구현되지 않았습니다. 일반 참가자의 그룹 추가·이름 변경·질문/추첨은 공개 UI에서 동작합니다. 요청 빈도 제한은 아직 추가되지 않았습니다.
