-- 기존 질문/추첨 이력은 유지합니다. 먼저 DB → 백엔드 → 프론트엔드 순으로 적용하세요.
BEGIN;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS decoration JSONB;
COMMENT ON COLUMN public.questions.decoration IS 'v1 lined paper, up to 3 allowlisted sticker IDs with normalized center x/y and rotation; null for legacy questions';
COMMIT;
