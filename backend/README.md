# NET FastAPI

참가자 세션, 그룹 추가/이름 변경, 테이블별 참가자·질문 조회, 질문 등록·추첨·이력·복구를 제공합니다. 세션 토큰은 서버가 발급하고 해시로 저장합니다. 방문자 ID는 인증 토큰으로 사용하지 않습니다.

로컬 실행:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# .env.example을 참고해 보호된 .env에 DATABASE_URL을 설정합니다.
python -m app.migrate
uvicorn app.main:app --reload --env-file .env --host 127.0.0.1 --port 8000
```

운영은 저장소 루트 `Dockerfile`을 사용합니다. React 빌드 결과를 같은 도메인에서 제공합니다. `DATABASE_URL`은 서버에만 설정하고 동일 출처 배포의 `CORS_ORIGINS`는 빈 배열로 둡니다. `/api/health`가 DB 연결을 검사합니다.

운영 DB는 [SQL 마이그레이션](../supabase/migrations/README.md)을 먼저 적용해야 합니다. 서버 시작 때 DB를 자동으로 초기화하지 않습니다. 상세 배포/행사 점검은 [루트 README](../README.md)를 참고하세요.
