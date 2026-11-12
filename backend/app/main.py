from contextlib import asynccontextmanager
from datetime import timedelta, timezone
import hashlib
import json
import os
import secrets
from typing import Annotated
from uuid import UUID

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import create_engine, func, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from .models import Base, DrawHistory, EventTable, Participant, Question, now
from .schemas import EntryInput, QuestionInput, TableChange, VisitorInput

bearer = HTTPBearer(auto_error=False)


def fail(code, message, status=400):
    raise HTTPException(status, detail={'code': code, 'message': message})


def timestamp(value):
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def question_public(q):
    return {'id': q.id, 'table_id': q.table_id, 'content': q.content, 'target': q.target,
            'decoration': q.decoration, 'is_drawn': q.is_drawn, 'created_at': timestamp(q.created_at)}


def participant_public(p, token):
    return {'participant': {'id': p.id, 'table_id': p.table_id, 'nickname': p.nickname,
                            'visitor_id': p.visitor_id}, 'token': token}


def database(request: Request):
    with Session(request.app.state.engine, expire_on_commit=False) as db:
        yield db  # 쓰기는 응답 전에 각 핸들러에서 명시적으로 commit합니다.


DB = Annotated[Session, Depends(database)]
Credentials = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]


def participant_for(db, credentials, lock=False):
    if credentials is None or credentials.scheme.lower() != 'bearer':
        fail('UNAUTHORIZED', '참가자 세션이 필요해요.', 401)
    digest = hashlib.sha256(credentials.credentials.encode()).hexdigest()
    query = select(Participant).where(Participant.session_token_hash == digest,
                                      Participant.token_expires_at > now())
    if lock:
        query = query.with_for_update()
    p = db.scalar(query)
    if p is None:
        fail('UNAUTHORIZED', '입장 정보가 만료됐어요. 다시 입장해 주세요.', 401)
    return p


def table_for(db, table_id):
    t = db.get(EventTable, table_id)
    if t is None:
        fail('TABLE_NOT_FOUND', '존재하지 않는 테이블이에요.', 404)
    return t


def access(db, credentials, table_id, lock=False):
    p = participant_for(db, credentials, lock=lock)
    table_for(db, table_id)
    if p.table_id != table_id:
        fail('TABLE_ACCESS_DENIED', '입장한 테이블에서만 이용할 수 있어요.', 403)
    return p


def draw_public(db, draw):
    return {'id': draw.id, 'table_id': draw.table_id, 'drawn_at': timestamp(draw.drawn_at),
            'question': question_public(db.get(Question, draw.question_id))}


def create_app(database_url=None, *, initialize=False):
    url = database_url or os.getenv('DATABASE_URL')
    if url and url.startswith('postgresql://'):
        url = url.replace('postgresql://', 'postgresql+psycopg://', 1)

    @asynccontextmanager
    async def lifespan(app):
        if not url:
            raise RuntimeError('DATABASE_URL을 설정하고 Supabase 마이그레이션을 먼저 적용하세요.')
        options = {'pool_pre_ping': True}
        if url.startswith('sqlite'):
            options.update(connect_args={'check_same_thread': False}, poolclass=StaticPool)
        engine = create_engine(url, **options)
        app.state.engine = engine
        if initialize:  # 자동 생성은 테스트/명시적 로컬 초기화에서만 사용합니다.
            Base.metadata.create_all(engine)
            with Session(engine) as db:
                for number in range(1, 4):
                    if db.scalar(select(EventTable).where(EventTable.number == number)) is None:
                        db.add(EventTable(number=number, name=f'TABLE {number:02d}'))
                db.commit()
        try:
            yield
        finally:
            engine.dispose()

    app = FastAPI(title='NET', lifespan=lifespan)
    origins = json.loads(os.getenv('CORS_ORIGINS', '[]'))
    if not isinstance(origins, list) or any(not isinstance(v, str) or v == '*' for v in origins):
        raise RuntimeError('CORS_ORIGINS에는 실제 origin의 JSON 배열을 지정하세요. *는 허용하지 않습니다.')
    app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False,
                       allow_methods=['GET', 'POST', 'PATCH'],
                       allow_headers=['Authorization', 'Content-Type', 'Idempotency-Key'])

    @app.get('/api/health')
    def health(request: Request):
        try:
            with request.app.state.engine.connect() as connection:
                connection.execute(text('SELECT 1'))
        except SQLAlchemyError:
            raise HTTPException(503, detail={'code': 'DB_UNAVAILABLE'})
        return {'status': 'ok', 'database': 'ok'}

    @app.get('/api/tables')
    def tables(db: DB):
        return [{'id': t.id, 'number': t.number, 'name': t.name}
                for t in db.scalars(select(EventTable).order_by(EventTable.number))]

    @app.post('/api/participants', status_code=201)
    def enter(body: EntryInput, db: DB):
        table_for(db, body.table_id)
        token = secrets.token_urlsafe(32)
        p = Participant(table_id=body.table_id, nickname=body.nickname, visitor_id=body.visitorId,
                        session_token_hash=hashlib.sha256(token.encode()).hexdigest(),
                        token_expires_at=now()+timedelta(hours=168))
        db.add(p)
        db.commit()
        return participant_public(p, token)

    @app.get('/api/participants/me')
    def me(db: DB, credentials: Credentials):
        p = participant_for(db, credentials)
        return participant_public(p, credentials.credentials)

    @app.patch('/api/participants/me/profile')
    def rename(body: VisitorInput, db: DB, credentials: Credentials):
        p = participant_for(db, credentials, lock=True)
        if p.visitor_id is not None and p.visitor_id != body.visitorId:
            fail('UNAUTHORIZED', '다른 방문자 정보로 변경할 수 없어요.', 403)
        p.visitor_id, p.nickname = body.visitorId, body.nickname
        db.commit()
        return participant_public(p, credentials.credentials)

    @app.patch('/api/participants/me/table')
    def change_table(body: TableChange, db: DB, credentials: Credentials):
        p = participant_for(db, credentials, lock=True)
        table_for(db, body.table_id)
        p.table_id = body.table_id
        db.commit()
        return participant_public(p, credentials.credentials)

    @app.get('/api/tables/{table_id}/status')
    def status(table_id: UUID, db: DB, credentials: Credentials):
        access(db, credentials, table_id)
        t = table_for(db, table_id)
        total = db.scalar(select(func.count()).select_from(Question).where(Question.table_id == table_id))
        drawn = db.scalar(select(func.count()).select_from(Question).where(Question.table_id == table_id, Question.is_drawn.is_(True)))
        return {'table': {'id': t.id, 'number': t.number, 'name': t.name}, 'total_count': total,
                'drawn_count': drawn, 'remaining_count': total-drawn}

    @app.post('/api/tables/{table_id}/questions', status_code=201)
    def submit(table_id: UUID, body: QuestionInput, db: DB, credentials: Credentials):
        p = access(db, credentials, table_id, lock=True)
        if p.visitor_id != body.visitorId or p.nickname != body.nickname:
            fail('UNAUTHORIZED', '질문 작성자와 인증된 참가자 정보가 일치하지 않아요.', 403)
        q = Question(table_id=table_id, author_id=p.id, author_visitor_id=p.visitor_id,
                     author_nickname=p.nickname, content=body.content, target=body.target,
                     decoration=body.decoration.model_dump(exclude_none=True) if body.decoration else None)
        db.add(q)
        db.commit()  # 클라이언트 입력 대신 인증 세션의 값을 스냅샷으로 저장합니다.
        return question_public(q)

    @app.get('/api/tables/{table_id}/questions')
    def list_questions(table_id: UUID, db: DB, credentials: Credentials):
        access(db, credentials, table_id)
        return [question_public(q) for q in db.scalars(select(Question).where(Question.table_id == table_id).order_by(Question.created_at.desc(), Question.id))]

    @app.post('/api/tables/{table_id}/draw')
    def draw(table_id: UUID, db: DB, credentials: Credentials,
             key: Annotated[str, Header(alias='Idempotency-Key', min_length=1, max_length=128)]):
        p = access(db, credentials, table_id, lock=True)
        # 같은 참가자의 동시 요청은 참가자 행 잠금으로 직렬화합니다.
        previous = db.scalar(select(DrawHistory).where(DrawHistory.table_id == table_id,
                             DrawHistory.drawn_by == p.id, DrawHistory.idempotency_key == key))
        if previous:
            return draw_public(db, previous)
        q = db.scalar(select(Question).where(Question.table_id == table_id, Question.is_drawn.is_(False))
                      .order_by(func.random()).limit(1).with_for_update(skip_locked=True))
        if q is None:
            fail('NO_QUESTIONS_AVAILABLE', '우리 테이블의 질문을 모두 뽑았어요.', 409)
        q.is_drawn = True
        receipt = DrawHistory(table_id=table_id, question_id=q.id, drawn_by=p.id, idempotency_key=key)
        db.add(receipt)
        db.flush()
        result = draw_public(db, receipt)
        db.commit()  # 질문 표시와 이력을 하나의 트랜잭션으로 확정한 뒤 응답합니다.
        return result

    @app.get('/api/tables/{table_id}/history')
    def history(table_id: UUID, db: DB, credentials: Credentials):
        access(db, credentials, table_id)
        return [draw_public(db, d) for d in db.scalars(select(DrawHistory).where(
            DrawHistory.table_id == table_id).order_by(DrawHistory.drawn_at.desc()))]

    @app.get('/api/tables/{table_id}/draws/latest')
    def latest(table_id: UUID, db: DB, credentials: Credentials):
        p = access(db, credentials, table_id)
        d = db.scalar(select(DrawHistory).where(DrawHistory.table_id == table_id,
                      DrawHistory.drawn_by == p.id).order_by(DrawHistory.drawn_at.desc()).limit(1))
        return draw_public(db, d) if d else None

    return app


app = create_app()
