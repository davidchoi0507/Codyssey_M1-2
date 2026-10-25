from typing import Optional
from pathlib import Path
from fastapi import APIRouter, HTTPException, status, Query
from backend.app.core.config import settings
from backend.app.models.conversation_schema import ChatRequest, ChatResponse, SetApiKeyRequest
from backend.app.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["AI Agent Chat"])

@router.post("", response_model=ChatResponse, summary="AI 비서 대화 (데이터 요약 컨텍스트 주입)")
def chat_with_agent(req: ChatRequest):
    """
    1. /api/data/summary 조회
    2. 요약을 시스템 프롬프트에 동적 삽입
    3. GPT API (또는 Gemini / 분석 엔진) 호출
    4. 유효한 응답인 경우에만 conversations 컬렉션에 자동 저장
    """
    try:
        result = ChatService.process_chat(
            user_message=req.message,
            conversation_id=req.conversation_id
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"채팅 처리 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/set-api-key", summary="[신규] Gemini/OpenAI API Key 등록 및 즉시 반영")
def set_api_key(req: SetApiKeyRequest):
    """프론트엔드 팝업에서 전달받은 Gemini 또는 OpenAI API Key를 즉시 서버와 .env에 저장합니다."""
    import os
    import re
    from pathlib import Path

    backend_dir = Path(__file__).resolve().parent.parent.parent
    target_files = [
        backend_dir / ".env",
        backend_dir.parent / ".env"
    ]

    keys_to_set = {}
    if req.gemini_key is not None and len(req.gemini_key.strip()) > 0:
        keys_to_set["GEMINI_API_KEY"] = req.gemini_key.strip()
    if req.anthropic_key is not None and len(req.anthropic_key.strip()) > 0:
        keys_to_set["ANTHROPIC_API_KEY"] = req.anthropic_key.strip()
    if req.openai_key is not None and len(req.openai_key.strip()) > 0:
        keys_to_set["OPENAI_API_KEY"] = req.openai_key.strip()

    # 하위 호환성 (단일 키 전달 시)
    if not keys_to_set and req.api_key and len(req.api_key.strip()) > 0:
        k = req.api_key.strip()
        p = (req.provider or "gemini").lower()
        if p == "anthropic" or k.startswith("sk-ant-"):
            keys_to_set["ANTHROPIC_API_KEY"] = k
        elif k.startswith("sk-") or p == "openai":
            keys_to_set["OPENAI_API_KEY"] = k
        else:
            keys_to_set["GEMINI_API_KEY"] = k

    for var_name, var_val in keys_to_set.items():
        if var_name == "GEMINI_API_KEY":
            settings.GEMINI_API_KEY = var_val
            os.environ["GEMINI_API_KEY"] = var_val
        elif var_name == "ANTHROPIC_API_KEY":
            settings.ANTHROPIC_API_KEY = var_val
            os.environ["ANTHROPIC_API_KEY"] = var_val
        elif var_name == "OPENAI_API_KEY":
            settings.OPENAI_API_KEY = var_val
            os.environ["OPENAI_API_KEY"] = var_val

        for env_file in target_files:
            try:
                content = env_file.read_text(encoding="utf-8") if env_file.exists() else ""
                if re.search(rf"^{var_name}=.*$", content, flags=re.MULTILINE):
                    content = re.sub(rf"^{var_name}=.*$", f"{var_name}={var_val}", content, flags=re.MULTILINE)
                else:
                    content += f"\n{var_name}={var_val}\n"
                env_file.write_text(content, encoding="utf-8")
            except Exception as e:
                print(f"[Warning] .env 쓰기 실패 ({env_file}): {e}")

    updated_providers = []
    if settings.GEMINI_API_KEY:
        updated_providers.append("Gemini")
    if settings.ANTHROPIC_API_KEY:
        updated_providers.append("Anthropic(Claude)")
    if settings.OPENAI_API_KEY:
        updated_providers.append("OpenAI")

    return {
        "status": "ok",
        "message": f"{' & '.join(updated_providers) if updated_providers else 'AI'} API 키가 성공적으로 동기화되었습니다! 이제 실시간 생성형 대화가 가능합니다."
    }

@router.get("/status", summary="AI API Key 연결 상태 및 모델 정보 조회")
def get_api_status():
    """현재 서버에 등록된 API Key 상태 및 활성화된 제공자(Gemini/Anthropic/OpenAI) 정보를 반환합니다."""
    has_gemini = bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 5)
    has_anthropic = bool(settings.ANTHROPIC_API_KEY and len(settings.ANTHROPIC_API_KEY.strip()) > 5)
    has_openai = bool(settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY.strip()) > 5)
    has_key = has_gemini or has_anthropic or has_openai

    gemini_masked = f"{settings.GEMINI_API_KEY[:4]}...{settings.GEMINI_API_KEY[-4:]}" if has_gemini and len(settings.GEMINI_API_KEY) > 8 else ("***" if has_gemini else "")
    anthropic_masked = f"{settings.ANTHROPIC_API_KEY[:4]}...{settings.ANTHROPIC_API_KEY[-4:]}" if has_anthropic and len(settings.ANTHROPIC_API_KEY) > 8 else ("***" if has_anthropic else "")
    openai_masked = f"{settings.OPENAI_API_KEY[:4]}...{settings.OPENAI_API_KEY[-4:]}" if has_openai and len(settings.OPENAI_API_KEY) > 8 else ("***" if has_openai else "")

    active_engines = []
    if has_gemini:
        active_engines.append("Gemini 3.8 Flash")
    if has_anthropic:
        active_engines.append("Claude Sonnet 4")
    if has_openai:
        active_engines.append(f"OpenAI {settings.OPENAI_MODEL}")

    provider = "multi" if len(active_engines) > 1 else (active_engines[0].split()[0].lower() if active_engines else "none")
    model_name = " + ".join(active_engines) + " (스마트 교차 가동)" if active_engines else "rule-based-fallback"

    return {
        "has_api_key": has_key,
        "has_gemini": has_gemini,
        "has_anthropic": has_anthropic,
        "has_openai": has_openai,
        "gemini_masked": gemini_masked,
        "anthropic_masked": anthropic_masked,
        "openai_masked": openai_masked,
        "provider": provider,
        "masked_key": gemini_masked or anthropic_masked or openai_masked,
        "model_name": model_name,
        "features_unlocked": [
            "실시간 자연어 심층 A&R 질의응답 (무제한)",
            "음원 업로드 시 생성형 AI 정성 평가",
            "신곡 컴백 시뮬레이터 맞춤형 전략 제언"
        ] if has_key else []
    }

@router.post("/clear-api-key", summary="등록된 API Key 연결 해제")
def clear_api_key(provider: Optional[str] = Query(None, description="특정 제공자만 해제 ('gemini', 'anthropic', 'openai') 또는 None(전체 해제)")):
    """서버와 .env 파일에서 등록된 API Key를 제거하고 초기화합니다."""
    import os
    import re
    backend_dir = Path(__file__).resolve().parent.parent.parent
    target_files = [
        backend_dir / ".env",
        backend_dir.parent / ".env"
    ]

    p = (provider or "all").lower()
    clear_gemini = p in ("gemini", "all")
    clear_anthropic = p in ("anthropic", "all")
    clear_openai = p in ("openai", "all")

    if clear_gemini:
        settings.GEMINI_API_KEY = ""
        os.environ["GEMINI_API_KEY"] = ""
    if clear_anthropic:
        settings.ANTHROPIC_API_KEY = ""
        os.environ["ANTHROPIC_API_KEY"] = ""
    if clear_openai:
        settings.OPENAI_API_KEY = ""
        os.environ["OPENAI_API_KEY"] = ""

    for env_file in target_files:
        try:
            if env_file.exists():
                content = env_file.read_text(encoding="utf-8")
                if clear_gemini:
                    content = re.sub(r"^GEMINI_API_KEY=.*$", "GEMINI_API_KEY=", content, flags=re.MULTILINE)
                if clear_anthropic:
                    content = re.sub(r"^ANTHROPIC_API_KEY=.*$", "ANTHROPIC_API_KEY=", content, flags=re.MULTILINE)
                if clear_openai:
                    content = re.sub(r"^OPENAI_API_KEY=.*$", "OPENAI_API_KEY=", content, flags=re.MULTILINE)
                env_file.write_text(content, encoding="utf-8")
        except Exception as e:
            print(f"[Warning] .env 초기화 실패 ({env_file}): {e}")

    target_label = "Gemini" if p == "gemini" else ("Anthropic" if p == "anthropic" else ("OpenAI" if p == "openai" else "모든"))
    return {
        "status": "ok",
        "message": f"{target_label} API 키가 안전하게 연결 해제되었습니다."
    }

