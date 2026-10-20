"""Request validation and API response schemas."""

from datetime import datetime
from typing import Literal

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field, field_validator

CaseStatus = Literal["open", "paused", "closed"]
SourceType = Literal["manual", "url", "public_record", "api", "file", "other"]


class CaseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str | None = None
    status: CaseStatus = "open"

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Title must contain non-whitespace characters")
        return value


class CaseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = None
    status: CaseStatus | None = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Title must contain non-whitespace characters")
        return value


class CaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    status: CaseStatus
    created_at: datetime
    updated_at: datetime


class EvidenceCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    source_type: SourceType
    source_url: AnyHttpUrl | None = None
    collector: str | None = Field(default=None, max_length=120)
    summary: str | None = Field(default=None, max_length=10000)
    content_sha256: str | None = Field(
        default=None, pattern=r"^[a-fA-F0-9]{64}$"
    )
    collected_at: datetime | None = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Title must contain non-whitespace characters")
        return value


class EvidenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: int
    title: str
    source_type: SourceType
    source_url: str | None
    collector: str | None
    summary: str | None
    content_sha256: str | None
    collected_at: datetime | None
    created_at: datetime
