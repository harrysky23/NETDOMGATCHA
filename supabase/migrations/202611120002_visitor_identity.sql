-- 기존 질문에 확인할 수 없는 visitor_id를 추측해서 부여하지 않습니다.
BEGIN;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS visitor_id UUID;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS session_token_hash VARCHAR(64);
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS author_visitor_id UUID;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS author_nickname VARCHAR(12);
ALTER TABLE public.draw_history ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);
CREATE UNIQUE INDEX IF NOT EXISTS participants_session_hash_unique ON public.participants(session_token_hash) WHERE session_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS participants_visitor_idx ON public.participants(visitor_id);
CREATE INDEX IF NOT EXISTS questions_author_visitor_idx ON public.questions(author_visitor_id);
CREATE UNIQUE INDEX IF NOT EXISTS draw_idempotency_once ON public.draw_history(table_id,drawn_by,idempotency_key) WHERE idempotency_key IS NOT NULL;
-- 새 질문은 작성 시점의 visitor_id / nickname을 스냅샷으로 저장합니다.
-- 닉네임을 변경해도 과거 질문의 작성자 스냅샷을 바꾸지 않습니다.
-- visitor_id는 UNIQUE나 인증 키로 사용하지 않으며 같은 ID만으로 다른 참가자를 조회·변경할 수 없습니다.
COMMIT;
