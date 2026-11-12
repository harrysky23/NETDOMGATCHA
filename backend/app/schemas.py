from typing import Annotated, Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, StringConstraints, UUID4, field_validator

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


class QuestionInput(VisitorInput):
    content: Content
    target: Literal['senior', 'junior', 'all']
