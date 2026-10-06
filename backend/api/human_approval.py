from fastapi import APIRouter
from typing import Optional
from pydantic import BaseModel
from services.approval_service import init_db, get_review, get_pending_reviews, save_review, get_audit_history

router = APIRouter()
init_db()

class ApprovalRequest(BaseModel):
    document_id: str
    reviewer: str = "legal_reviewer"
    comment: str = ""

class EditRequest(BaseModel):
    document_id: str
    reviewer: str = "legal_reviewer"
    edited_text: str
    comment: str = ""

@router.get("/approvals/pending")
async def pending_approvals():
    return {"approvals": get_pending_reviews()}

@router.get("/approvals/{document_id}/{clause_id}")
async def get_approval(document_id: str, clause_id: str):
    return get_review(document_id, clause_id)

@router.post("/approvals/{clause_id}/accept")
async def accept_approval(clause_id: str, request: ApprovalRequest):
    return save_review(request.document_id, clause_id, "approved", request.reviewer, request.comment)

@router.post("/approvals/{clause_id}/reject")
async def reject_approval(clause_id: str, request: ApprovalRequest):
    return save_review(request.document_id, clause_id, "rejected", request.reviewer, request.comment)

@router.put("/approvals/{clause_id}/edit")
async def edit_approval(clause_id: str, request: EditRequest):
    return save_review(request.document_id, clause_id, "pending", request.reviewer, request.comment, request.edited_text)

@router.post("/approvals/{clause_id}/escalate")
async def escalate_approval(clause_id: str, request: ApprovalRequest):
    return save_review(request.document_id, clause_id, "escalated", request.reviewer, request.comment)

@router.get("/audit")
async def audit(document_id: Optional[str] = None):
    return {"events": get_audit_history(document_id)}
