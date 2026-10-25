from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.app.core.database import db_manager
from backend.app.models.conversation_schema import ChatMessage

class ConversationService:
    @staticmethod
    def get_all_conversations() -> List[Dict[str, Any]]:
        convs = db_manager.get_all_conversations()
        result = []
        for c in convs:
            messages = c.get("messages", [])
            result.append({
                "id": c.get("id"),
                "title": c.get("title", "대화"),
                "created_at": c.get("created_at", ""),
                "updated_at": c.get("updated_at", ""),
                "message_count": len(messages)
            })
        return result

    @staticmethod
    def get_conversation_by_id(conv_id: str) -> Optional[Dict[str, Any]]:
        return db_manager.get_conversation_by_id(conv_id)

    @staticmethod
    def save_or_update_conversation(
        conv_id: Optional[str],
        title: Optional[str],
        messages: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        # 첫 번째 유저 메시지로부터 제목 자동 생성
        if not title:
            user_msgs = [m for m in messages if m.get("role") == "user"]
            if user_msgs:
                first_text = user_msgs[0].get("content", "")
                title = first_text[:25] + ("..." if len(first_text) > 25 else "")
            else:
                title = "글로벌 스트리밍 대화"

        return db_manager.save_conversation(conv_id, title, messages)

    @staticmethod
    def delete_conversation(conv_id: str) -> bool:
        return db_manager.delete_conversation(conv_id)

