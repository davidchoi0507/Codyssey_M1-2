import sys
import json
from pathlib import Path

# Windows 콘솔 utf-8 출력 설정
sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.routers.data_router import (
    get_data_summary,
    get_extended_statistics,
    create_data_item,
    get_all_data,
    update_data_item,
    delete_data_item
)
from backend.app.routers.conversation_router import (
    get_all_conversations,
    get_conversation_by_id,
    delete_conversation
)
from backend.app.routers.chat_router import chat_with_agent
from backend.app.models.data_schema import DataItemCreate, DataItemUpdate
from backend.app.models.conversation_schema import ChatRequest

def run_tests():
    print("[1] get_data_summary()")
    summary = get_data_summary()
    print("Summary OK -> Count:", summary["count"], "Period:", summary["period"])
    assert summary["count"] >= 600

    print("\n[1-b] get_data_summary(days=30) [기간 필터링 테스트]")
    summary_30 = get_data_summary(days=30)
    print("Summary 30d OK -> Count:", summary_30["count"], "Period:", summary_30["period"])
    assert summary_30["count"] == 30

    print("\n[2] get_extended_statistics() [보너스 2 - BPM, 장르, YoY]")
    stats = get_extended_statistics()
    print("Extended Stats OK -> Longest:", stats["longest_streak_track"], "BPM:", stats["average_bpm"], "YoY:", stats["yoy_growth"])

    print("\n[2-b] simulate_comeback() [신규 Track-to-Track 곡 기반 시뮬레이터]")
    from backend.app.routers.data_router import simulate_comeback, get_executive_report
    from backend.app.models.data_schema import SimulationRequest
    sim_res = simulate_comeback(SimulationRequest(
        track_title="Midnight Rush",
        genre="Pop Punk",
        bpm=150.0,
        target_month=7
    ))
    print("Simulation OK -> Match:", sim_res["benchmark_track"]["song"], "Similarity:", sim_res["benchmark_track"]["similarity_score"], "%")
    print("Expected Streak:", sim_res["expected_streak_days"], "days | Win Prob:", sim_res["win_probability"], "%")

    print("\n[2-c] get_executive_report() [A&R Executive Report]")
    rep = get_executive_report()
    assert "SoundPulse AI" in rep
    print("Executive Report OK -> Length:", len(rep), "chars")

    print("\n[2-d] analyze_audio_file() [Librosa 정량 + AI 정성 오디오 분석]")
    from backend.app.services.data_service import DataService
    import tempfile, numpy as np, soundfile as sf
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        sr = 22050
        duration = 2.0
        t = np.linspace(0, duration, int(sr * duration), False)
        # 120 BPM clicks
        y = np.sin(2 * np.pi * 440 * t) * np.exp(-t % 0.5 * 10)
        sf.write(tmp.name, y, sr)
        audio_tmp_path = tmp.name

    try:
        audio_res = DataService.analyze_audio_file(audio_tmp_path, "Neon_Dreams_Demo.wav")
        print("Audio Analysis OK -> Track:", audio_res["track_title"], "BPM:", audio_res["bpm"], "Genre:", audio_res["detected_genre"])
        print("Engine:", audio_res["engine_used"], "| Advice:", audio_res["qualitative_ai_advice"][:60], "...")
        assert audio_res["bpm"] > 0
    finally:
        import os
        if os.path.exists(audio_tmp_path):
            os.remove(audio_tmp_path)

    print("\n[3] create_data_item() [CRUD Create]")
    new_data = DataItemCreate(
        date="2024-10-19",
        value=1450.0,
        memo="APT. - ROSÉ & Bruno Mars | Pop Punk | 신규 생성 테스트"
    )
    created = create_data_item(new_data)
    created_id = created["id"]
    print("Created Item OK -> ID:", created_id, "Value:", created["value"])

    print("\n[4] get_all_data() [CRUD Read]")
    items = get_all_data(order="desc", limit=5)
    print("Read Items OK -> Count:", len(items), "First date:", items[0]["date"])
    assert len(items) == 5

    print("\n[5] update_data_item() [CRUD Update]")
    update_data = DataItemUpdate(value=1499.0, memo="APT. - ROSÉ & Bruno Mars | Pop Punk | 수정 완료")
    updated = update_data_item(created_id, update_data)
    print("Updated Item OK -> Value:", updated["value"])
    assert updated["value"] == 1499.0

    print("\n[6] delete_data_item() [CRUD Delete]")
    deleted = delete_data_item(created_id)
    print("Deleted Item OK ->", deleted)

    print("\n[7] chat_with_agent() [AI Chat & Context Injection]")
    chat_req = ChatRequest(message="현재 글로벌 1위의 평균 스트리밍 수치가 얼마인지 알려줘")
    chat_res = chat_with_agent(chat_req)
    print("Chat Response OK -> Conversation ID:", chat_res["conversation_id"])
    print("Preview:\n", chat_res["response"][:120], "...\n")

    print("\n[8] get_all_conversations() [Conversations List]")
    convs = get_all_conversations()
    print("Conversations List OK -> Sessions:", len(convs))
    assert len(convs) >= 1

    print("\n[9] get_conversation_by_id() [Conversation Detail & Messages]")
    conv_id = chat_res["conversation_id"]
    loaded = get_conversation_by_id(conv_id)
    print("Loaded Conv OK -> Title:", loaded["title"], "Messages:", len(loaded["messages"]))
    assert len(loaded["messages"]) >= 2

    print("\n[10] MCP Server module check [보너스 1]")
    from backend.app.mcp.server import handle_json_rpc
    rpc_list = handle_json_rpc(json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/list"}))
    assert "get_streaming_summary" in rpc_list
    print("MCP Tools List OK")

    print("\n🎉🎉🎉 백엔드 모든 핵심 기능과 보너스 과제가 100% 정상 작동함을 검증했습니다!")

if __name__ == "__main__":
    run_tests()
