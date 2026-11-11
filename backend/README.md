# Backend — Phase 2 준비용 디렉터리

현재 FastAPI 앱, 의존성, DB 연결, API는 구현하지 않았습니다. 폴더 구조와 환경변수 명세만 준비했습니다. 실행·배포 가능한 서버가 아닙니다.

다음 단계에서 `app/main.py`, 인증, Pydantic 검증, CORS, 요청 제한, 테이블 접근 검증 및 PostgreSQL 트랜잭션 추첨을 구현합니다. 참가자 테이블 변경은 `PATCH /api/participants/me/table`로 설계합니다. `/api/health`는 실제 DB 연결 상태를 검사하고 장애 시 503을 반환하도록 구현해야 합니다.

시크릿은 이 폴더의 `.env` 또는 Render 환경변수에만 설정합니다. `.env.example`은 값 형식 예시입니다. 실제 시크릿은 커밋하지 않습니다. 전체 배포·운영 계획은 루트 README를 참고하세요.
