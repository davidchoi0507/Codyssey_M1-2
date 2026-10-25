import os
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from backend.app.core.config import settings

# Firestore 초기화 시도
_db = None
_is_firebase_active = False

try:
    import firebase_admin
    from firebase_admin import credentials, firestore

    cred = None
    if settings.FIREBASE_SERVICE_ACCOUNT_JSON:
        cred_dict = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
        cred = credentials.Certificate(cred_dict)
    elif settings.FIREBASE_SERVICE_ACCOUNT_PATH and os.path.exists(settings.FIREBASE_SERVICE_ACCOUNT_PATH):
        cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)

    if cred:
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        _db = firestore.client()
        _is_firebase_active = True
        print("[Database] Firebase Firestore에 성공적으로 연결되었습니다.")
except Exception as e:
    print(f"[Database] Firebase 초기화 건너뜀 (원인: {e}). 로컬 고성능 JSON DB 모드로 실행됩니다.")
    _is_firebase_active = False


class LocalCollection:
    """Firestore와 동일한 메서드 규격을 지원하는 로컬 파일 기반 컬렉션 어댑터"""
    def __init__(self, collection_name: str, base_dir: Path):
        self.collection_name = collection_name
        self.file_path = base_dir / f"{collection_name}.json"
        self._ensure_file()

    def _ensure_file(self):
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump({}, f, ensure_ascii=False, indent=2)

    def _read(self) -> Dict[str, Any]:
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def _write(self, data: Dict[str, Any]):
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def get_all(self) -> List[Dict[str, Any]]:
        data = self._read()
        items = list(data.values())
        # 날짜 내림차순 또는 오름차순 정렬
        items.sort(key=lambda x: x.get("date", x.get("created_at", "")), reverse=True)
        return items

    def get_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        return self._read().get(doc_id)

    def set(self, doc_id: str, doc_data: Dict[str, Any]) -> Dict[str, Any]:
        data = self._read()
        doc_data["id"] = doc_id
        data[doc_id] = doc_data
        self._write(data)
        return doc_data

    def update(self, doc_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        data = self._read()
        if doc_id not in data:
            return None
        data[doc_id].update(update_data)
        data[doc_id]["id"] = doc_id
        self._write(data)
        return data[doc_id]

    def delete(self, doc_id: str) -> bool:
        data = self._read()
        if doc_id in data:
            del data[doc_id]
            self._write(data)
            return True
        return False


class DatabaseManager:
    """
    Firebase Firestore 및 로컬 DB를 투명하게 제어하는 매니저
    - Firestore가 설정되면 Firestore API 사용
    - 키가 없으면 로컬 파일 DB 자동 사용 (동일한 서비스 인터페이스)
    """
    def __init__(self):
        self.is_firebase = _is_firebase_active
        self.firestore_client = _db
        self.local_storage_path = Path(__file__).resolve().parent.parent.parent / "data_local"
        self._local_collections = {
            "data": LocalCollection("data", self.local_storage_path),
            "conversations": LocalCollection("conversations", self.local_storage_path),
        }

    # --- Data Collection CRUD ---
    def get_all_data(self) -> List[Dict[str, Any]]:
        if self.is_firebase:
            docs = self.firestore_client.collection("data").order_by("date").stream()
            return [{"id": d.id, **d.to_dict()} for d in docs]
        return self._local_collections["data"].get_all()

    def get_data_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        if self.is_firebase:
            doc = self.firestore_client.collection("data").document(item_id).get()
            return {"id": doc.id, **doc.to_dict()} if doc.exists else None
        return self._local_collections["data"].get_by_id(item_id)

    def create_data(self, item: Dict[str, Any], custom_id: Optional[str] = None) -> Dict[str, Any]:
        doc_id = custom_id or str(uuid.uuid4())
        item_data = {
            **item,
            "id": doc_id,
            "created_at": datetime.utcnow().isoformat()
        }
        if self.is_firebase:
            self.firestore_client.collection("data").document(doc_id).set(item_data)
            return item_data
        return self._local_collections["data"].set(doc_id, item_data)

    def update_data(self, item_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        update_data["updated_at"] = datetime.utcnow().isoformat()
        if self.is_firebase:
            ref = self.firestore_client.collection("data").document(item_id)
            if not ref.get().exists:
                return None
            ref.update(update_data)
            doc = ref.get()
            return {"id": doc.id, **doc.to_dict()}
        return self._local_collections["data"].update(item_id, update_data)

    def delete_data(self, item_id: str) -> bool:
        if self.is_firebase:
            ref = self.firestore_client.collection("data").document(item_id)
            if not ref.get().exists:
                return False
            ref.delete()
            return True
        return self._local_collections["data"].delete(item_id)

    # --- Conversations Collection CRUD ---
    def get_all_conversations(self) -> List[Dict[str, Any]]:
        if self.is_firebase:
            docs = self.firestore_client.collection("conversations").order_by("created_at", direction="DESCENDING").stream()
            return [{"id": d.id, **d.to_dict()} for d in docs]
        return self._local_collections["conversations"].get_all()

    def get_conversation_by_id(self, conv_id: str) -> Optional[Dict[str, Any]]:
        if self.is_firebase:
            doc = self.firestore_client.collection("conversations").document(conv_id).get()
            return {"id": doc.id, **doc.to_dict()} if doc.exists else None
        return self._local_collections["conversations"].get_by_id(conv_id)

    def save_conversation(self, conv_id: Optional[str], title: str, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        c_id = conv_id or str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        conv_data = {
            "id": c_id,
            "title": title or "새로운 대화",
            "messages": messages,
            "updated_at": now
        }
        if self.is_firebase:
            ref = self.firestore_client.collection("conversations").document(c_id)
            existing = ref.get()
            if not existing.exists:
                conv_data["created_at"] = now
            else:
                conv_data["created_at"] = existing.to_dict().get("created_at", now)
            ref.set(conv_data)
            return conv_data
        
        # Local DB
        existing = self._local_collections["conversations"].get_by_id(c_id)
        conv_data["created_at"] = existing.get("created_at", now) if existing else now
        return self._local_collections["conversations"].set(c_id, conv_data)

    def delete_conversation(self, conv_id: str) -> bool:
        if self.is_firebase:
            ref = self.firestore_client.collection("conversations").document(conv_id)
            if not ref.get().exists:
                return False
            ref.delete()
            return True
        return self._local_collections["conversations"].delete(conv_id)


db_manager = DatabaseManager()

