-- 새 데이터베이스용 기본 스키마. 기존 테이블/데이터는 삭제하지 않습니다.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INTEGER UNIQUE NOT NULL,
  name VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES public.tables(id),
  nickname VARCHAR(12) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES public.tables(id),
  author_id UUID REFERENCES public.participants(id),
  content TEXT NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 200),
  target VARCHAR(6) NOT NULL CHECK (target IN ('senior','junior','all')),
  is_drawn BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.draw_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES public.tables(id),
  question_id UUID NOT NULL REFERENCES public.questions(id),
  drawn_by UUID NOT NULL REFERENCES public.participants(id),
  drawn_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 초기 3개 테이블. 기존의 추가 테이블·질문·기록은 그대로 유지합니다.
INSERT INTO public.tables (number,name) VALUES (1,'TABLE 01'),(2,'TABLE 02'),(3,'TABLE 03')
  ON CONFLICT (number) DO NOTHING;
CREATE INDEX IF NOT EXISTS participants_table_idx ON public.participants(table_id);
CREATE INDEX IF NOT EXISTS questions_available_idx ON public.questions(table_id,created_at) WHERE NOT is_drawn;
CREATE INDEX IF NOT EXISTS history_table_time_idx ON public.draw_history(table_id,drawn_at DESC);
-- 공개 클라이언트는 DB에 직접 접근하지 않고 백엔드에서 검증한 API를 이용합니다.
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_history ENABLE ROW LEVEL SECURITY;
COMMIT;
