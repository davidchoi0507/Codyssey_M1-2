from typing import List, Optional
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    role: str = Field(..., description="메시지 발신자 ('user' 또는 'assistant')", example="user")
    content: str = Field(..., description="메시지 본문", min_length=1)
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    message: str = Field(..., description="사용자 질문", min_length=1, example="현재 글로벌 1위의 평균 스트리밍 수치는 얼마야?")
    conversation_id: Optional[str] = Field(None, description="기존 대화에 이어 말할 경우 대화 ID")


class ChatResponse(BaseModel):
    response: Optional[str] = None
    conversation_id: Optional[str] = None
    summary_used: Optional[dict] = None
    timestamp: Optional[str] = None
    error: Optional[str] = None
    message: Optional[str] = None


class SetApiKeyRequest(BaseModel):
    api_key: Optional[str] = Field(None, description="단일 API Key 값")
    provider: Optional[str] = Field("gemini", description="제공자 ('gemini', 'openai', 'anthropic')")
    gemini_key: Optional[str] = Field(None, description="Google Gemini API Key")
    openai_key: Optional[str] = Field(None, description="OpenAI API Key")
    anthropic_key: Optional[str] = Field(None, description="Anthropic API Key")


class ConversationCreate(BaseModel):
    title: Optional[str] = Field("새로운 대화", description="대화 세션 제목")
    messages: List[ChatMessage] = Field(default_factory=list)


class ConversationResponse(BaseModel):
    id: str
    title: str
    messages: List[ChatMessage]
    created_at: str
    updated_at: str


class ConversationListItem(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int

