from datetime import datetime, timezone
from uuid import UUID, uuid4
from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def now():
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class EventTable(Base):
    __tablename__ = 'tables'
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    number: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(30))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Participant(Base):
    __tablename__ = 'participants'
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    table_id: Mapped[UUID] = mapped_column(ForeignKey('tables.id'), index=True)
    nickname: Mapped[str] = mapped_column(String(12))
    visitor_id: Mapped[UUID | None] = mapped_column(Uuid, index=True)
    session_token_hash: Mapped[str | None] = mapped_column(String(64), unique=True)
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Question(Base):
    __tablename__ = 'questions'
    __table_args__ = (CheckConstraint("target IN ('senior','junior','all')", name='question_target_valid'),)
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    table_id: Mapped[UUID] = mapped_column(ForeignKey('tables.id'), index=True)
    author_id: Mapped[UUID | None] = mapped_column(ForeignKey('participants.id'))
    author_visitor_id: Mapped[UUID | None] = mapped_column(Uuid, index=True)
    author_nickname: Mapped[str | None] = mapped_column(String(12))
    content: Mapped[str] = mapped_column(Text)
    target: Mapped[str] = mapped_column(String(6))
    is_drawn: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class DrawHistory(Base):
    __tablename__ = 'draw_history'
    __table_args__ = (
        UniqueConstraint('table_id', 'question_id', name='draw_question_once'),
        UniqueConstraint('table_id', 'drawn_by', 'idempotency_key', name='draw_idempotency_once'),
    )
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    table_id: Mapped[UUID] = mapped_column(ForeignKey('tables.id'), index=True)
    question_id: Mapped[UUID] = mapped_column(ForeignKey('questions.id'))
    drawn_by: Mapped[UUID] = mapped_column(ForeignKey('participants.id'))
    idempotency_key: Mapped[str] = mapped_column(String(128))
    drawn_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
