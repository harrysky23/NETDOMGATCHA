from typing import Annotated, Literal
import json
from pathlib import Path
from uuid import UUID
from pydantic import BaseModel, ConfigDict, StringConstraints, UUID4, Field, field_validator

Nickname = Annotated[str, StringConstraints(strict=True, strip_whitespace=True, min_length=1, max_length=12)]
Content = Annotated[str, StringConstraints(strict=True, strip_whitespace=True, min_length=1, max_length=200)]


class VisitorInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    visitorId: UUID4
    nickname: Nickname

    @field_validator('nickname')
    @classmethod
    def no_control_chars(cls, value):
        if any(ord(c) < 32 or ord(c) == 127 for c in value):
            raise ValueError('닉네임에는 제어 문자를 사용할 수 없습니다.')
        return value


class EntryInput(VisitorInput):
    table_id: UUID


class TableChange(BaseModel):
    model_config = ConfigDict(extra='forbid')
    table_id: UUID


STICKER_IDS = frozenset(json.loads(Path(__file__).with_name('sticker_manifest.json').read_text(encoding='utf-8')))
StickerId = Annotated[str, StringConstraints(strict=True, min_length=1, max_length=64)]


class StickerPosition(BaseModel):
    model_config = ConfigDict(extra='forbid')
    x: Annotated[float, Field(strict=True, ge=0.12, le=0.88, allow_inf_nan=False)]
    y: Annotated[float, Field(strict=True, ge=0.15, le=0.85, allow_inf_nan=False)]
    rotation: Annotated[float, Field(strict=True, ge=-20, le=20, allow_inf_nan=False)]


class PlacedSticker(StickerPosition):
    id: StickerId

    @field_validator('id')
    @classmethod
    def registered_sticker(cls, value):
        if value not in STICKER_IDS:
            raise ValueError('등록된 스티커만 사용할 수 있습니다.')
        return value


class QuestionDecoration(BaseModel):
    model_config = ConfigDict(extra='forbid')
    version: Literal[1]
    paper: Literal['lined']
    target_badge: StickerPosition | None = None
    stickers: Annotated[list[PlacedSticker], Field(max_length=3)]

    @field_validator('stickers')
    @classmethod
    def unique_stickers(cls, value):
        if len({s.id for s in value}) != len(value):
            raise ValueError('같은 스티커는 한 번만 붙일 수 있습니다.')
        return value


class QuestionInput(VisitorInput):
    content: Content
    target: Literal['senior', 'junior', 'all']

    decoration: QuestionDecoration | None = None


class TableNameInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: Annotated[str, StringConstraints(strict=True, strip_whitespace=True, min_length=1, max_length=30)]

    @field_validator('name')
    @classmethod
    def clean_table_name(cls, value):
        if any(ord(c) < 32 or ord(c) == 127 for c in value):
            raise ValueError('그룹 이름에는 제어 문자를 사용할 수 없습니다.')
        return value


class TableCreateInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: Annotated[str, StringConstraints(strict=True, strip_whitespace=True, min_length=1, max_length=30)] | None = None

    @field_validator('name')
    @classmethod
    def clean_table_name(cls, value):
        return TableNameInput.clean_table_name(value) if value is not None else value
