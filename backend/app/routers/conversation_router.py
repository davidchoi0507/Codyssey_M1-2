from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.app.models.conversation_schema import (
    ConversationCreate,
    ConversationResponse,
    ConversationListItem
)
from backend.app.services.conversation_service import ConversationService

router = APIRouter(prefix="/conversations", tags=["Conversation Management"])

@router.get("", response_model=List[ConversationListItem], summary="대화 기록 목록 조회")
def get_all_conversations():
    """저장된 대화 세션 목록과 메시지 수 반환"""
    return ConversationService.get_all_conversations()

@router.get("/{conv_id}", response_model=ConversationResponse, summary="특정 대화 전체 메시지 불러오기")
def get_conversation_by_id(conv_id: str):
    """선택한 대화의 전체 메시지 재표시용"""
    conv = ConversationService.get_conversation_by_id(conv_id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="대화 기록을 찾을 수 없습니다.")
    return conv

@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED, summary="새 대화 저장")
def create_conversation(data: ConversationCreate):
    messages_dict = [m.model_dump() for m in data.messages]
    saved = ConversationService.save_or_update_conversation(
        conv_id=None,
        title=data.title,
        messages=messages_dict
    )
    return saved

@router.delete("/{conv_id}", summary="대화 삭제")
def delete_conversation(conv_id: str):
    success = ConversationService.delete_conversation(conv_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="삭제할 대화를 찾을 수 없습니다.")
    return {"message": "대화가 성공적으로 삭제되었습니다.", "id": conv_id}

