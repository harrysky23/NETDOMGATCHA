# Supabase migrations — Phase 2 예정

실행 가능한 SQL은 아직 없습니다. 확정된 마이그레이션 요건:

- `tables`: UUID PK, `number INTEGER UNIQUE NOT NULL`, `name VARCHAR(30) NOT NULL`, `created_at TIMESTAMPTZ`.
- 초기 테이블은 TABLE 01–05 정확히 5개. 숫자 범위 제약 및 `INSERT ... ON CONFLICT (number)` 기반 재실행 가능한 시드.
- 참가자 세션, 질문, 추첨 기록의 FK·인덱스 및 테이블 단위 접근 검증.
- 질문 내용은 trim 후 1–200자, target은 senior/junior/all.
- 질문 선택·행 잠금·is_drawn 갱신·추첨 이력 저장·멱등 결과 저장을 하나의 트랜잭션으로 실행.
- idempotency key는 참가자/테이블 범위로 유일하게 저장하고, 동일 키 재요청에는 기존 결과 반환. 재시도 시 새 키를 생성하지 않음.
- 질문이 없으면 `NO_QUESTIONS_AVAILABLE` 반환.
- 일반 참가자의 테이블 생성·삭제 차단. 클라이언트의 Supabase 직접 접근을 허용하지 않음.
- 기본 질문 복제 및 중복 실행 방지용 template ID/유일 제약은 Phase 4에서 결정.
