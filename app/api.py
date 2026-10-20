"""Versioned API for investigation cases and evidence."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Case, Evidence
from app.schemas import (
    CaseCreate,
    CaseRead,
    CaseUpdate,
    EvidenceCreate,
    EvidenceRead,
)

router = APIRouter(prefix="/api/v1", tags=["Investigations"])


@router.post(
    "/cases",
    response_model=CaseRead,
    status_code=status.HTTP_201_CREATED,
)
def create_case(payload: CaseCreate, db: Session = Depends(get_db)):
    case = Case(**payload.model_dump())
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


@router.get("/cases", response_model=list[CaseRead])
def list_cases(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    statement = (
        select(Case)
        .order_by(Case.created_at.desc(), Case.id.desc())
        .offset(offset)
        .limit(limit)
    )
    return db.scalars(statement).all()


@router.get("/cases/{case_id}", response_model=CaseRead)
def get_case(case_id: int, db: Session = Depends(get_db)):
    case = db.get(Case, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.patch("/cases/{case_id}", response_model=CaseRead)
def update_case(
    case_id: int,
    payload: CaseUpdate,
    db: Session = Depends(get_db),
):
    case = db.get(Case, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")

    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="No update fields provided")

    if "title" in changes and changes["title"] is None:
        raise HTTPException(status_code=422, detail="Title cannot be null")
    if "status" in changes and changes["status"] is None:
        raise HTTPException(status_code=422, detail="Status cannot be null")

    for field, value in changes.items():
        setattr(case, field, value)

    db.commit()
    db.refresh(case)
    return case


@router.post(
    "/cases/{case_id}/evidence",
    response_model=EvidenceRead,
    status_code=status.HTTP_201_CREATED,
)
def create_evidence(
    case_id: int,
    payload: EvidenceCreate,
    db: Session = Depends(get_db),
):
    case = db.get(Case, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")

    values = payload.model_dump()
    if values["source_url"] is not None:
        values["source_url"] = str(values["source_url"])

    evidence = Evidence(case_id=case_id, **values)
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return evidence


@router.get(
    "/cases/{case_id}/evidence",
    response_model=list[EvidenceRead],
)
def list_case_evidence(
    case_id: int,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    if db.get(Case, case_id) is None:
        raise HTTPException(status_code=404, detail="Case not found")

    statement = (
        select(Evidence)
        .where(Evidence.case_id == case_id)
        .order_by(Evidence.created_at.desc(), Evidence.id.desc())
        .offset(offset)
        .limit(limit)
    )
    return db.scalars(statement).all()


@router.get("/evidence/{evidence_id}", response_model=EvidenceRead)
def get_evidence(evidence_id: int, db: Session = Depends(get_db)):
    evidence = db.get(Evidence, evidence_id)
    if evidence is None:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return evidence
