# NET — OB총회 캡슐 질문함

> 현재 구현 안내: 상단 `+`에서 참가자 누구나 그룹 테이블을 만들고 현재 그룹 이름을 바꿀 수 있습니다. 초기 테이블은 3개이며 이름 변경은 ID·질문함·추첨 이력을 유지합니다. 테이블 선택 즉시 참가자 세션을 연결하고 상단에 해당 테이블의 닉네임을 표시합니다. 목록은 입장/테이블 이동/닉네임 변경/화면 복귀/수동 새로고침 때 갱신하며 실시간 접속 상태를 뜻하지 않습니다.
>
> `VITE_API_MODE=mock`은 동일 브라우저 안에서만 저장·공유됩니다. 여러 휴대폰이 그룹·참가자·꾸민 질문을 공유하려면 FastAPI와 PostgreSQL을 연결한 HTTP 모드를 사용하세요. DB 변경은 [마이그레이션 안내](supabase/migrations/README.md)를 따릅니다. 이전 Phase별 계획보다 이 현재 안내와 실제 코드가 우선합니다.


경희대학교 컴퓨터공학과 NET 동아리 OB총회용 모바일 웹. 선배와 후배가 테이블별 익명 질문함을 통해 자연스럽게 이야기를 나누는 서비스입니다.

**현재 구현 범위: Phase 1 프론트엔드 목업.** 서버·DB·실제 랜덤 추첨·행사 운영용 공개 배포는 아직 없습니다. 이 문서의 Render/Supabase 설정은 Phase 2 이후를 위한 배포 계획이며, 현재 코드로 백엔드를 배포할 수는 없습니다.

### 최신 화면 변경

- 질문 결과는 보라색 클립보드 PNG 위에 HTML 질문과 대상별 PNG 뱃지를 배치합니다. 선배에게/후배에게/모두에게 뱃지는 오른쪽 위에 메모지 폭의 27%, 시계 방향 10도로 붙이며 기존 HTML 대상 라벨은 제거했습니다. `asset/`의 원본 PNG를 수정 없이 `frontend/src/assets/`로 복사합니다. 이미지 기준 x=22–71%, y=38–77% 영역에서 긴 질문을 스크롤하며, 축소 화면에서도 이미지와 뱃지의 비율·투명도·상대 위치를 유지합니다.

- 머신 대기 화면에 루프 MP4를 사용합니다. 자동 재생 차단·영상 오류·reduced-motion·데이터 절약 설정에서는 첫 프레임 포스터를 표시합니다. 추첨/결과/질문 입력 중에는 대기 영상을 정지합니다. 리소스 경로와 검증 결과는 [대기 영상 문서](docs/idle-video.md)를 참고하세요.

- 상단 NET 로고는 입력창·결과 화면을 닫고 `/` 머신 대기 화면으로 돌아갑니다. 닉네임·테이블·등록 질문·추첨 기록은 유지합니다. 진행 중인 추첨의 재시도 키도 유지합니다.
- 상단 **질문함**(`/questions/list`)에서 현재 테이블의 기본 질문과 등록 질문을 최신순으로 확인합니다. 질문 대상과 추첨 여부만 표시하며 작성자는 공개하지 않습니다. 테이블 변경·화면 재진입·수동 새로고침 시 다시 조회합니다.
- HTTP 모드에는 인증된 `GET /api/tables/{table_id}/questions`가 필요합니다. 응답은 `Question[]`(`id`, `table_id`, `content`, `target`, `is_drawn`, `created_at`)이며, 서버에서 세션과 테이블 소속을 검증하고 작성자 정보를 제외해야 합니다. 현재 목업은 같은 브라우저 안에서만 질문을 공유합니다.

아래 Phase 1 초기 문서의 화면·라우팅 표는 초기 설계 기록입니다. 현재 테이블은 기본 3개이며 `/admin`에서 추가할 수 있고, 메인은 이미지 기반 머신과 MP4 추첨 연출을 사용합니다.

## 확정 정책과 현재 동작

| 항목 | 확정 정책 | Phase 1 구현 |
| --- | --- | --- |
| 테이블 | TABLE 01–05, 정확히 5개 | 5개 고정 목업, 생성·삭제 UI 없음 |
| 입장 | 닉네임, 참가자 ID 및 서버 세션 토큰 | 닉네임 1–12자, 목업 ID/토큰, localStorage 복원 |
| 테이블 변경 | 서버에서 기존 참가자 소속 변경 | 서비스 `changeTable`로 분리, ID 유지 |
| 질문함 | 테이블별 완전 독립, 같은 테이블 참가자가 공유 | 브라우저 안에서 테이블별 저장. 다른 기기와 공유되지 않음 |
| 질문 | 익명, trim 후 1–200자, senior/junior/all | 입력 검증·대상 선택·성공 안내·연속 등록 |
| 중복 닉네임 | 테이블 내 허용 | 닉네임 중복 검사 없음 |
| 추첨 | 서버 무작위, 테이블 단위 중복 방지, 멱등 키 필수 | 미구현. 정적 머신과 고정 예시 결과만 표시 |
| 기록 | 테이블별 조회, 최근 결과 복구 | 기록 조회 화면과 빈 상태, 복구 서비스 계약 준비 |
| 상태 갱신 | 홈 진입·등록/추첨 후·새로고침·화면 복귀 | 홈 진입/복귀/수동 새로고침 시 재조회. 등록 후 홈 복귀 시 반영 |
| 동기화 | WebSocket/Supabase Realtime 사용 안 함 | 사용 안 함 |

목업은 각 테이블에 **12개 예시 질문**을 제공합니다. 실제 기본 질문 수나 행사 질문 목록이 확정된 것은 아닙니다. 목업 초기화는 저장된 사용자 질문에 기본 질문을 반복 추가하지 않습니다. 목업 토큰은 인증 수단이 아니며, 실제 권한 검증은 서버에서 구현해야 합니다.

## 로컬 실행

Node.js 22.12 이상과 npm을 사용합니다.

```bash
cd frontend
npm ci
npm run dev
```

터미널에 출력되는 로컬 URL(기본 `http://127.0.0.1:5173`)을 엽니다. 현재는 환경변수나 Supabase 계정 없이 실행됩니다.

```bash
# 엄격한 TypeScript 검사 + 프로덕션 빌드
npm run build

# 목업 서비스의 입력 검증·테이블 분리·저장소 오류 테스트
npm run test:mock

# 빌드 결과 로컬 확인
npm run preview
```

같은 Wi-Fi의 휴대폰에서 확인하려면 `npm run dev -- --host 0.0.0.0` 실행 후 개발 PC의 LAN IP와 출력된 포트를 사용합니다. 이것은 개발용이며, PC가 꺼져도 동작하는 운영 배포와는 별개입니다. LAN의 HTTP에서는 브라우저 보안 컨텍스트 제약이 있을 수 있으므로 최종 기기 검증은 HTTPS 배포에서 수행합니다.

저장 키: `net:nickname:v1`, `net:session:v1`, `net:mock:questions:v1:<table_id>`. 개발 중 초기화하려면 브라우저 개발자 도구에서 이 `net:` 키들만 삭제하세요. 다른 서비스 저장소까지 지우는 `localStorage.clear()`는 필요 없습니다.

## 화면과 라우팅

| 경로 | 화면 | 구현 내용 |
| --- | --- | --- |
| `/` | LandingPage | NET 로고, 자체 제작 SVG 머신, 행사 소개, 닉네임 입력·복원, 이용 안내 |
| `/tables` | TableSelectPage | 5개 테이블, 라디오 선택, 현재 참여 테이블 표시·변경 |
| `/table` | TableHomePage | 테이블명, 남은/전체 질문 수, 새로고침, 등록/가챠/기록 이동 |
| `/questions` | QuestionSubmitPage | 대상 선택, 글자 수, 익명 질문 목업 저장, 성공·연속 등록 |
| `/gacha` | GachaPage | 정적 머신, 질문 카드 예시 전환, 실제 추첨은 실행하지 않음 |
| `/history` | HistoryPage | 테이블별 기록 서비스 연결, 현재 목업은 빈 목록 |
| 그 외 | NotFoundPage | 404와 홈 복귀 |

닉네임 없이 내부 경로를 열면 랜딩으로 이동하며, 테이블 미선택 상태는 선택 화면으로 이동합니다. 닉네임과 테이블은 새로고침 뒤 복원됩니다. 모바일 하단 내비게이션, 키보드 포커스, 라디오 그룹, 상태 안내, 본문 바로가기, reduced-motion 대응을 포함합니다. Motion은 화면 진입 페이드에만 사용하며 가챠 연출은 Phase 3입니다.

## 구조와 변경 파일

```text
.
├── .gitignore
├── README.md
├── frontend/
│   ├── .env.example
│   ├── package.json / package-lock.json
│   ├── index.html / tsconfig.json / vite.config.ts / vercel.json
│   ├── public/favicon.svg
│   ├── tests/mock-api.test.mjs
│   └── src/
│       ├── main.tsx / App.tsx / styles.css
│       ├── components/  # Layout, Icon, GachaMachine, PageHeading, Feedback, ErrorBoundary
│       ├── pages/       # 위 화면들
│       ├── hooks/       # useSession, useResource
│       ├── services/    # contracts, api, mockApi, storage
│       └── types/       # 테이블, 참가자, 질문, 추첨, 오류 타입
├── backend/
│   ├── .env.example / README.md
│   ├── app/            # Phase 2에서 구성할 준비용 디렉터리
│   └── tests/          # Phase 2 예정
└── supabase/migrations/README.md
```

처음에는 비어 있던 폴더이므로 기존 코드를 덮어쓰지 않았습니다. React, TypeScript, Vite, Tailwind CSS, Motion for React, React Router를 사용합니다. 머신과 아이콘은 자체 SVG이며 유료·외부 이미지 의존성이 없습니다.

`src/services/contracts.ts`의 `NetApi`가 UI와 서버 사이의 계약입니다. 현재 `services/api.ts`에서 목업을 주입합니다. Phase 2에서는 동일한 인터페이스의 HTTP 어댑터로 교체하고, `useSession.tsx`의 목업 토큰 형식 검사도 실제 세션 복구·검증 흐름으로 바꿉니다. 질문 응답 타입에 `author_id`를 넣지 않아 참가자 UI로 작성자 정보가 전달되지 않도록 했습니다.

## API 연결 계획 — Phase 2

| API | 역할 |
| --- | --- |
| `GET /api/health` | API·DB 상태 검사, 실패 시 503, 시크릿 노출 금지 |
| `GET /api/tables` | 고정 5개 테이블 |
| `POST /api/participants` | 닉네임·table_id로 입장, ID·세션 토큰 발급 |
| `PATCH /api/participants/me/table` | 인증된 참가자의 table_id 갱신, ID 유지 |
| `GET /api/tables/{table_id}/status` | 남은/전체/추첨 질문 수 |
| `POST /api/tables/{table_id}/questions` | 테이블 소속 검증, 익명 질문 저장 |
| `POST /api/tables/{table_id}/draw` | 서버 추첨, `Idempotency-Key` 헤더 필수 |
| `GET /api/tables/{table_id}/history` | 현재 테이블 추첨 기록 |
| `GET /api/tables/{table_id}/draws/latest` | 인증 참가자의 최근 추첨 결과 복구용 제안 |

토큰은 `Authorization: Bearer <token>`으로 전달합니다. 회원가입은 없습니다. 서버는 쓰기·추첨·질문/기록 조회마다 세션과 테이블 소속을 확인해야 합니다. 테이블 이동 후 이전 테이블에는 접근할 수 없어야 합니다. 요청 빈도 제한도 서버에서 적용합니다.

추첨은 PostgreSQL 트랜잭션으로 질문 선택·행 잠금·상태 변경·기록 저장·멱등 결과 저장을 원자적으로 처리합니다. 동일 키 재요청에는 기존 결과를 반환해야 합니다. HTTP 타임아웃이나 화면 이동 후에도 멱등 키를 보존하고, 새 키로 다시 뽑기 전에 이전 결과를 확인해야 합니다. 질문이 없으면 `NO_QUESTIONS_AVAILABLE`를 반환합니다. 프론트엔드에서 무작위 질문을 선택하지 않습니다.

## 클라우드 배포 구조

```text
참가자 모바일 브라우저 / QR코드
          │ HTTPS
          ▼
React + Vite (Vercel)
          │ HTTPS REST / VITE_API_BASE_URL
          ▼
FastAPI (Render Python Web Service)
          │ PostgreSQL / 서버 전용 DATABASE_URL
          ▼
Supabase PostgreSQL

소스 저장소: GitHub → 각 서비스에서 연결하여 배포
```

운영 시 이 구조는 개발자의 PC와 독립적으로 동작합니다. 프론트엔드만 배포한 Phase 1은 기기별 목업이며 실제 공동 질문함으로 사용할 수 없습니다.

### 1. Supabase 환경변수 설정

1. Supabase 프로젝트를 만들고 Connect 화면에서 배포 환경과 호환되는 PostgreSQL 연결 문자열을 확인합니다. 연결 방식·포트는 해당 프로젝트 안내를 따릅니다. [공식 연결 가이드](https://supabase.com/docs/guides/database/connecting-to-postgres)
2. `backend/.env.example`을 로컬의 `backend/.env`로 복사하거나 Render의 Environment에 값을 등록합니다.
3. `DATABASE_URL`에 실제 연결 문자열을 설정합니다. 암호의 특수문자는 URL 인코딩하고 SSL을 적용합니다.
4. `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`는 서버에서 Supabase SDK를 사용할 경우에만 설정합니다. 직접 PostgreSQL 드라이버를 쓰면 service role key는 필요 없습니다.
5. `SESSION_SECRET`, `ADMIN_SECRET`을 서로 다른 충분히 긴 임의 문자열로 설정합니다.
6. Phase 2 마이그레이션과 시드를 적용한 뒤 테이블이 정확히 5개인지 확인합니다. 재실행해도 5개여야 합니다.

DB 접속 정보, service role key, 관리자 비밀값은 서버에만 둡니다. `VITE_` 접두사가 붙은 변수와 프론트엔드 빌드 결과는 공개되므로 비밀값을 넣지 않습니다.

### 2. Render 배포 방법 — 백엔드 구현 후

현재 `app/main.py`와 `requirements.txt`가 없어 아래 명령은 아직 실행할 수 없습니다.

1. GitHub 저장소에 프로젝트를 올리고 Render에서 Python Web Service를 생성합니다.
2. 저장소를 연결하고 Root Directory를 `backend`로 설정합니다.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Health Check Path: `/api/health`
6. 앞의 서버 환경변수를 등록하고 배포합니다. 반환된 HTTPS API 주소를 프론트엔드에 설정합니다.
7. 실제 배포에서 DB 연결, CORS, health 실패 시 동작을 검증합니다. [Render FastAPI 공식 가이드](https://render.com/docs/deploy-fastapi)

행사 중 슬립·콜드 스타트를 피할 수 있는 인스턴스 설정을 검토하세요. 현재 UI에는 로딩/오류/재시도 상태가 있으며, Phase 2 HTTP 어댑터에서 타임아웃과 네트워크 오류를 연결해야 합니다. 쓰기 요청을 무조건 자동 재시도하지 않습니다. 추첨 재시도에는 반드시 최초 멱등 키를 재사용합니다.

### 3. Vercel 배포 방법

1. GitHub에 이 프로젝트를 올리고 Vercel에서 Import Project로 연결합니다.
2. Root Directory: `frontend`, Framework Preset: `Vite`.
3. Install Command: `npm ci`, Build Command: `npm run build`, Output Directory: `dist`.
4. **현재 Phase 1 목업 배포에는 환경변수가 필요 없습니다.** 실제 API 어댑터 구현 후 `VITE_API_BASE_URL=https://YOUR_API.onrender.com/api`를 등록합니다. 현재 목업은 이 값을 소비하지 않습니다.
5. 환경변수 변경은 새 프론트엔드 빌드에 반영되므로 다시 배포합니다.
6. `frontend/vercel.json`의 SPA rewrite가 `/tables`, `/questions`, `/gacha` 직접 접근과 새로고침을 `index.html`로 처리합니다. 정적 에셋 경로는 제외합니다.
7. 발급된 공개 HTTPS 주소에서 모바일로 확인합니다. 방문자용 배포 보호 설정을 확인해 로그인 없이 접속 가능해야 합니다. [Vercel Vite 공식 가이드](https://vercel.com/docs/frameworks/frontend/vite)
8. 최종 확정된 운영 주소로 QR코드를 생성합니다. 개발 PC의 localhost나 Render API 주소를 QR로 배포하지 않습니다.

### 4. CORS 설정 — Phase 2 구현 예정

Render의 `CORS_ORIGINS`에는 프론트엔드 origin을 JSON 배열로 넣습니다.

```dotenv
CORS_ORIGINS=["https://YOUR_PROJECT.vercel.app","https://YOUR_EVENT_DOMAIN"]
```

프로토콜·호스트·포트까지 정확히 일치해야 하며, 경로나 마지막 `/`는 넣지 않습니다. 운영에서는 실제 사용하는 도메인만 허용하고 `*`나 임의 Preview 도메인 전체를 허용하지 않습니다. 로컬 개발은 별도 `.env`에서 `http://127.0.0.1:5173`, `http://localhost:5173`만 추가합니다.

FastAPI `CORSMiddleware`의 `allow_origins`에 배열을 전달하고, 필요한 메서드 `GET`, `POST`, `PATCH`, `DELETE` 및 헤더 `Authorization`, `Content-Type`, `Idempotency-Key`를 허용합니다. Bearer 인증 방식에서는 쿠키를 사용하지 않으므로 기본적으로 `allow_credentials=False`를 사용합니다. 브라우저 OPTIONS preflight도 검증합니다. [FastAPI CORS 공식 가이드](https://fastapi.tiangolo.com/tutorial/cors/)

### 5. 행사 전 점검 절차

아래는 실제 API/DB/배포 완료 뒤 실행할 운영 점검이며 Phase 1에서 통과한 항목이 아닙니다.

- [ ] 최종 QR → 공개 HTTPS 주소 → 닉네임 입장까지, 앱 설치·계정 로그인 없이 진입.
- [ ] iOS Safari, Android Chrome, 데스크톱에서 핵심 경로 및 새로고침 확인.
- [ ] TABLE 01–05가 정확히 5개이고 시드 재실행 시 중복 없음.
- [ ] 두 기기로 같은 테이블 질문 공유, 다른 테이블과 질문·기록 분리 확인.
- [ ] 테이블 변경 후 서버 소속 갱신, 이전 테이블의 직접 API 요청 거절 확인.
- [ ] `/api/health` 200 및 실제 DB 연결 정상 확인. DB 장애 시 503·민감 정보 미노출 확인.
- [ ] 기본 질문 수와 target, 테이블별 복제 및 독립 추첨 상태 확인.
- [ ] **10–20대 실제 기기/세션 동시 접속·질문 등록·동시 추첨 테스트.** 응답 지연, 오류율, 질문 수·기록 일치 확인.
- [ ] 서로 다른 멱등 키로 동시 추첨해 질문 중복 없음. 같은 키 병렬 요청·재시도는 한 번만 차감·동일 결과 반환.
- [ ] 질문 소진 시 `NO_QUESTIONS_AVAILABLE`, 연속 클릭 방지, 네트워크 실패 시 추첨 애니메이션 미시작 확인.
- [ ] 추첨 직후 화면 이탈·새로고침·네트워크 단절 후 최근 결과 복구 확인.
- [ ] 애니메이션은 실행한 기기에서만 재생. reduced-motion 환경에서 축소 또는 생략.
- [ ] API 콜드 스타트 및 시간 초과 시 로딩/오류/재시도 확인. 재시도로 추첨 중복 없음.
- [ ] 허용 origin CORS 성공, 비허용 origin 차단, OPTIONS 정상 확인.
- [ ] 운영 프론트엔드 JS·GitHub에 DB 비밀키가 없는지 확인. 목업 모드 해제 확인.
- [ ] 행사 시작 전 운영자가 health/API 로그/DB 상태 및 백업·복원 절차 확인.

## 검증

기본 확인 명령은 `cd frontend && npm ci && npm run build`입니다. 이번 작업의 실제 수행 결과는 `QA.md`에 기록합니다. 프론트엔드 목업 검증은 PostgreSQL 동시성·서버 보안·실제 기기 10–20대 부하 테스트를 대체하지 않습니다.

## 미구현 및 Phase 2 전에 확인할 사항

- FastAPI, Pydantic, Supabase 스키마·마이그레이션·시드, 실제 세션 인증·접근 제어·요청 제한.
- 실제 서버 추첨·행 잠금·idempotency key 처리 및 최근 추첨 결과 복구.
- 3.5초 가챠 상태 머신/캡슐/파티클(Phase 3), 관리자·실제 기본 질문 관리(Phase 4).
- GitHub 연결, Render/Vercel 실배포, 공개 운영 주소 및 QR, health endpoint와 운영 부하 테스트.

진행 전 결정할 것: GitHub 저장소와 배포 계정/도메인, Supabase 프로젝트 및 연결 방식, Render 인스턴스 설정, 세션 만료·재입장 정책, 질문 등록 rate limit, 기본 질문 목록·수량, 관리자 권한과 기록 초기화 정책. 테이블 수(5개), 질문 길이(1–200자), 대상 3종, 서버 추첨·멱등 키·테이블 격리는 이미 확정 사항입니다.
