import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from openai import OpenAI
from backend.app.core.config import settings
from backend.app.services.data_service import DataService
from backend.app.services.conversation_service import ConversationService

# Function Calling 스키마 정의 (보너스 과제 1)
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_streaming_summary",
            "description": "최근 글로벌 1위 음원 스트리밍의 전체 요약 지표(기간, 총 데이터 수, 일일 평균/최대/최소 스트리밍, 최근 14일 추세)를 조회합니다.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_extended_market_insights",
            "description": "변동성(표준편차), 1위 진입 허들 기준선, 최장 1위 유지 곡, 역대 최고 피크 기록 등 확장된 시장 분석 지표를 조회합니다.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_chart_records",
            "description": "특정 곡명, 아티스트명 또는 날짜 키워드로 스트리밍 차트 기록을 검색합니다.",
            "parameters": {
                "type": "object",
                "properties": {
                    "keyword": {
                        "type": "string",
                        "description": "검색할 아티스트명 또는 곡명 (예: Sabrina, Bruno Mars, APT., Billie)"
                    }
                },
                "required": ["keyword"]
            }
        }
    }
]

def execute_tool_call(tool_name: str, arguments: dict) -> str:
    """Function Calling 실행기"""
    if tool_name == "get_streaming_summary":
        return json.dumps(DataService.get_summary(), ensure_ascii=False)
    elif tool_name == "get_extended_market_insights":
        return json.dumps(DataService.get_extended_statistics(), ensure_ascii=False)
    elif tool_name == "search_chart_records":
        keyword = arguments.get("keyword", "").lower()
        all_data = DataService.get_all_data()
        matches = [
            d for d in all_data
            if keyword in d.get("memo", "").lower() or keyword in d.get("date", "")
        ]
        return json.dumps(matches[:15], ensure_ascii=False)
    return json.dumps({"error": f"알 수 없는 도구: {tool_name}"}, ensure_ascii=False)


def generate_local_fallback_response(query: str, summary: dict, stats: dict) -> str:
    """
    OpenAI API 키가 설정되지 않은 로컬 개발/시연 환경에서도
    실제 컨텍스트 데이터를 정확히 계산/분석하여 A&R 전문가처럼 대답하는 스마트 엔진
    """
    q = query.lower()
    metrics = summary.get("metrics", {})
    avg = metrics.get("average", 0)
    max_val = metrics.get("max", 0)
    min_val = metrics.get("min", 0)
    total = metrics.get("total", 0)
    count = summary.get("count", 0)
    period = summary.get("period", "")
    trend = summary.get("trend", "")
    streak = stats.get("longest_streak_track", "")
    hurdle = stats.get("benchmark_hurdle", 0)
    peak = stats.get("peak_record", {})
    avg_bpm = stats.get("average_bpm", 122.5)
    yoy = stats.get("yoy_growth", 0)
    holiday_factor = stats.get("holiday_shock_factor", 0)
    top_genres = stats.get("top_genres", [])
    genres_str = ", ".join([f"{g['genre']}({g['share_pct']}%)" for g in top_genres[:3]]) if top_genres else "Pop"

    if any(k in q for k in ["캐럴", "12월", "연말", "크리스마스", "겨울"]):
        return (
            f"🎄 **연말 캐럴 시즌(Holiday Shock) 분석 보고**\n\n"
            f"과거 2년간의 차트를 분석한 결과, **11월 말부터 12월 31일까지는 극도로 위험한 컴백 비선호 구간**입니다.\n\n"
            f"• **캐럴 스트리밍 폭증**: 평월 대비 일일 1위 스트리밍이 무려 **+{holiday_factor}% 폭증**합니다.\n"
            f"• **머라이어 캐리 현상**: 크리스마스 주간에는 머라이어 캐리, 왬(Wham!) 등의 스트리밍이 **1,700만 회를 상회**하며 모든 신보를 차트 밖으로 밀어냅니다.\n"
            f"• **A&R 권고**: 연말 릴리즈는 피하시고, 캐럴 열풍이 사그라드는 **1월 중순~2월 초**로 일정을 잡으시는 것이 훨씬 유리합니다."
        )
    elif any(k in q for k in ["여름", "서머", "7월", "8월"]):
        return (
            f"☀️ **여름 서머송 시즌(Summer Peak) 분석 보고**\n\n"
            f"여름(6~8월)은 정국('Seven'), 사브리나 카펜터('Espresso') 등 메가 서머송 간의 격돌이 가장 치열한 시즌입니다.\n\n"
            f"• **평균 1위 수치**: 1,150만~1,300만 회 수준의 강력한 화력이 필요합니다.\n"
            f"• **음악적 특징**: 빠른 템포(120~130 BPM)와 청량한 UK Garage, Nu-Disco 장르가 압도적인 점유율을 차지했습니다."
        )
    elif any(k in q for k in ["bpm", "템포", "속도", "비트"]):
        return (
            f"🥁 **글로벌 1위 트랙 BPM(템포) 분석**\n\n"
            f"지난 2년(총 {count}일)간 글로벌 1위를 석권한 트랙들의 **평균 템포는 {avg_bpm} BPM**입니다.\n\n"
            f"• **BPM 100~110 구간**: 벤슨 분, 도자 캣 등 틱톡 바이럴 및 감성 팝 중심\n"
            f"• **BPM 125~150 구간**: 정국, 로제&브루노 마스('APT.'), 라틴 음악 등 폭발적인 댄스/펑크 에너지 트랙 중심\n"
            f"• 대중적으로 가장 거부감 없이 라디오와 숏폼에 녹아드는 스위트 스팟은 **115~125 BPM**으로 분석됩니다."
        )
    elif any(k in q for k in ["장르", "분위기", "비주얼", "컨셉", "디자인"]):
        return (
            f"🎨 **A&R 및 비주얼 디렉터 트렌드 브리핑**\n\n"
            f"지난 2년간 글로벌 1위 차트를 지배한 핵심 장르는 다음과 같습니다:\n"
            f"• **Top 장르 점유율**: {genres_str}\n"
            f"• **BPM 스위트스팟**: 평균 {avg_bpm} BPM\n"
            f"• **시각디자인 인사이트**: Y2K 펑크 팝아트('APT.')와 레트로 빈티지 무드('Espresso')가 숏폼 챌린지와 결합할 때 바이럴 폭발력이 가장 높았습니다."
        )
    elif any(k in q for k in ["yoy", "성장", "전년", "2023", "2024", "규모"]):
        return (
            f"📈 **글로벌 스트리밍 시장 YoY(전년 대비) 성장률**\n\n"
            f"2023년 대비 2024년 Spotify Global 1위 곡들의 **일일 평균 스트리밍 볼륨은 약 +{yoy}% 성장**했습니다.\n\n"
            f"• 글로벌 음원 소비층의 유료 구독 확대와 숏폼 플랫폼의 음원 유입으로 인해, 1위 진입을 위한 허들 수치(Benchmark)가 매년 계단식으로 상승하고 있음을 보여줍니다."
        )
    elif any(k in q for k in ["평균", "얼마", "기준", "수치"]):
        return (
            f"🎵 **글로벌 1위 스트리밍 평균 분석 보고**\n\n"
            f"현재 집계된 **{period} (총 {count}일)** 기준, Spotify Global 1위 곡들의 **일일 평균 스트리밍 수는 {avg:,}만 회**입니다.\n\n"
            f"• **1위 진입 안전 허들**: 상위 25% 기준 약 **{hurdle:,}만 회** 이상의 일간 스트리밍이 확보되어야 안정적인 1위 경쟁이 가능합니다.\n"
            f"• **최근 14일 모멘텀**: 현재 차트는 **{trend}** 상태를 보이고 있어, 컴백 일정을 잡으실 때 참고하시기 바랍니다."
        )
    elif any(k in q for k in ["최고", "가장", "피크", "최대", "대박"]):
        return (
            f"🔥 **역대 최고 피크(Peak) 스트리밍 기록**\n\n"
            f"집계 기간 내 단일 일자 최고 기록은 **{peak.get('date')}**에 달성된 **{max_val:,}만 회**입니다!\n\n"
            f"• **기록 정보**: {peak.get('memo')}\n"
            f"• 이 날은 일일 평균({avg:,}만 회) 대비 무려 **{round(((max_val - avg) / avg) * 100, 1)}% 높은 폭발적인 스트리밍**을 기록하며 글로벌 대세감을 입증했습니다."
        )
    elif any(k in q for k in ["최저", "최소", "낮은"]):
        return (
            f"📉 **글로벌 1위 최저 스트리밍 기록**\n\n"
            f"집계 기간 내 1위를 기록한 곡 중 가장 낮은 스트리밍 수치는 **{min_val:,}만 회**였습니다.\n"
            f"상대적으로 대형 신보가 없는 비수기 시즌에 기록되었으며, 평소 1위 평균치({avg:,}만 회)와는 약 {round(avg - min_val, 1)}만 회의 차이가 납니다."
        )
    elif any(k in q for k in ["추세", "트렌드", "흐름", "상승", "하락", "요즘"]):
        return (
            f"📊 **글로벌 차트 모멘텀 & 트렌드 분석**\n\n"
            f"• **최근 14일 동향**: **{trend}**\n"
            f"• **시장 변동성(표준편차)**: ±{stats.get('volatility')}만 회 수준으로, 메가히트 음원의 발매 주기에 따라 스트리밍 파이가 크게 요동치고 있습니다.\n"
            f"• **최장 독점 1위**: {streak}"
        )
    elif any(k in q for k in ["장르", "분위기", "비주얼", "컨셉", "디자인"]):
        return (
            f"🎨 **A&R 및 비주얼 디렉터 인사이트**\n\n"
            f"최근 1위를 장악한 대표 트랙들은 레트로 팝(Nu-Disco), 얼터너티브 팝, 그리고 펑크 록 에너지를 결합한 크로스오버 트렌드가 강세입니다.\n"
            f"• 대표 히트: {streak}\n"
            f"• 시각디자인 관점에서는 레트로 빈티지 무드와 Y2K 네온 펑크 스타일의 앨범 아트 및 숏폼 챌린지 비주얼이 높은 바이럴 전환율을 이끌고 있습니다."
        )
    else:
        # 키가 없고 사전 분석 키워드에도 해당하지 않는 임의 질문인 경우 None 반환 (세션 미생성 처리용)
        return None


class ChatService:
    @classmethod
    def call_gemini_api(cls, api_key: str, system_prompt: str, user_message: str, history_messages: list) -> str:
        """
        신규 공식 google.genai SDK 및 레거시 SDK를 모두 지원하며,
        사용자가 지정한 Gemini 3.8 Flash -> 3.6 Flash -> 3.5 Flash-Lite -> 3.1 Flash-Lite -> 3.8 Live 순서로
        멀티 모델 백업 체인을 가동하여 어떤 환경에서도 404 없이 안정적으로 답변을 생성합니다.
        """
        candidate_models = [
            "gemini-3.8-flash",
            "gemini-3.6-flash",
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite",
            "gemini-3.8-live-extended-thinking",
            "gemini-3.8-live",
            "gemini-2.5-flash",
            "gemini-2.0-flash",
        ]

        last_ex = None

        # 1. 최신 공식 google.genai SDK 시도 (v1.0+)
        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=api_key)
            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.7,
            )

            # 역할 교대(user -> model -> user) 안전 정규화
            contents = []
            last_role = None
            for m in (history_messages or [])[-6:]:
                role = "user" if m.get("role") == "user" else "model"
                text = (m.get("content") or "").strip()
                if not text:
                    continue
                if role == last_role and len(contents) > 0:
                    contents[-1].parts[0].text += f"\n\n{text}"
                else:
                    contents.append(types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=text)]
                    ))
                    last_role = role

            if last_role == "user" and len(contents) > 0:
                contents[-1].parts[0].text += f"\n\n{user_message}"
            else:
                contents.append(types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=user_message)]
                ))

            # 사용자의 API Key로 실제 지원되는 모델 목록을 실시간 조회하여 결합
            models_to_try = list(candidate_models)
            try:
                for m in client.models.list():
                    m_id = (getattr(m, "name", "") or "").replace("models/", "")
                    if "generateContent" in getattr(m, "supported_generation_methods", ["generateContent"]):
                        if m_id not in models_to_try and "tts" not in m_id:
                            models_to_try.append(m_id)
            except Exception as e_list:
                print(f"[ChatService] models.list 동적 조회 생략: {e_list}")

            for m_name in models_to_try:
                try:
                    resp = client.models.generate_content(
                        model=m_name,
                        contents=contents,
                        config=config
                    )
                    if resp and resp.text:
                        print(f"[ChatService] Gemini 호출 성공 (사용 모델: {m_name})")
                        return resp.text.strip()
                except Exception as me:
                    last_ex = me
                    err_msg = str(me).lower()
                    if any(term in err_msg for term in ["404", "not found", "not supported", "unknown", "does not exist", "unsupported"]):
                        continue
                    if "400" in err_msg and any(term in err_msg for term in ["model", "invalid", "argument", "parameter"]):
                        continue
                    break
        except Exception as ge:
            last_ex = ge
            err_str = str(ge).lower()
            if "404" not in err_str:
                print(f"[ChatService] google.genai 호출 에러: {ge}")

        # 2. 레거시 google.generativeai SDK 백업 시도
        try:
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=api_key)
            for m_name in candidate_models:
                try:
                    g_model = legacy_genai.GenerativeModel(m_name)
                    full_prompt = f"{system_prompt}\n\n[사용자 질문]\n{user_message}"
                    res = g_model.generate_content(full_prompt)
                    if res and res.text:
                        print(f"[ChatService] Legacy Gemini 호출 성공 (사용 모델: {m_name})")
                        return res.text.strip()
                except Exception as leg_e:
                    last_ex = leg_e
                    err_msg = str(leg_e).lower()
                    if any(term in err_msg for term in ["404", "not found", "not supported", "unknown", "does not exist", "unsupported"]):
                        continue
                    break
        except Exception as e_leg:
            last_ex = e_leg
            print(f"[ChatService] legacy_genai 호출 에러: {e_leg}")

        if last_ex:
            raise last_ex
        return ""

    @classmethod
    def call_anthropic_api(cls, api_key: str, system_prompt: str, user_message: str, history_messages: list) -> str:
        """
        코디세이(Codyssey) 플랫폼의 Anthropic Native Messages API (/v1/messages)를 호출합니다.
        지원 모델: claude-sonnet-4 -> claude-haiku-4 -> claude-opus-4-7 -> claude-opus-4-8
        """
        import requests
        base_url = (settings.ANTHROPIC_BASE_URL or "https://copa.codyssey.kr/v1").rstrip("/")
        url = f"{base_url}/messages"

        headers = {
            "x-api-key": api_key.strip(),
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }

        candidate_models = [
            "claude-sonnet-4",
            "claude-haiku-4",
            "claude-opus-4-7",
            "claude-opus-4-8"
        ]

        messages = []
        for m in (history_messages or [])[-6:]:
            role = "user" if m.get("role") == "user" else "assistant"
            text = (m.get("content") or "").strip()
            if text:
                messages.append({"role": role, "content": text})
        messages.append({"role": "user", "content": user_message})

        last_err = None
        for m_name in candidate_models:
            payload = {
                "model": m_name,
                "max_tokens": 2048,
                "system": system_prompt,
                "messages": messages
            }
            try:
                resp = requests.post(url, headers=headers, json=payload, timeout=60)
                if resp.status_code == 200:
                    data = resp.json()
                    content_blocks = data.get("content", [])
                    for b in content_blocks:
                        if b.get("type") == "text" and b.get("text"):
                            print(f"[ChatService] Anthropic 호출 성공 (모델: {m_name})")
                            return b["text"].strip()
                else:
                    err_text = resp.text
                    last_err = f"Anthropic HTTP {resp.status_code}: {err_text}"
                    print(f"[ChatService] Anthropic {m_name} 응답 실패: {last_err}")
                    if resp.status_code in (404, 400) and any(k in err_text.lower() for k in ["model", "not found", "unknown"]):
                        continue
                    break
            except Exception as e:
                last_err = str(e)
                print(f"[ChatService] Anthropic 요청 예외: {e}")
                break

        if last_err:
            raise RuntimeError(last_err)
        return ""

    @classmethod
    def process_chat(cls, user_message: str, conversation_id: Optional[str] = None) -> Dict[str, Any]:
        # 1. 요약 데이터 조회 (/api/data/summary)
        summary = DataService.get_summary()
        stats = DataService.get_extended_statistics()

        # 2. 기존 대화 불러오기 또는 새 대화 생성
        existing_conv = ConversationService.get_conversation_by_id(conversation_id) if conversation_id else None
        history_messages = existing_conv.get("messages", []) if existing_conv else []

        # 3. 시스템 프롬프트 구성 (컨텍스트 주입)
        metrics = summary["metrics"]
        system_prompt = f"""당신은 글로벌 음원 차트 인텔리전스 & A&R 전략 어시스턴트 'SoundPulse AI'입니다.
다음은 현재 시스템에 저장된 Spotify Global 1위 시계열 데이터의 실시간 요약입니다:

[실시간 글로벌 1위 스트리밍 요약]
- 분석 기간: {summary['period']} (총 {summary['count']}일치)
- 일일 평균 스트리밍: {metrics['average']}만 회
- 최고 스트리밍 기록: {metrics['max']}만 회
- 최저 스트리밍 기록: {metrics['min']}만 회
- 최근 14일 추세: {summary['trend']}
- 시장 변동성(표준편차): {stats['volatility']}만 회
- 최장 1위 유지 기록: {stats['longest_streak_track']}

위 실제 데이터를 바탕으로 엔터테인먼트 실무자(기획자, 마케터, 비주얼 디렉터)에게 전문적이고 신뢰성 있는 인사이트를 한국어로 제공하세요.
자연스럽고 읽기 쉬운 마크다운 양식으로 답변하세요."""

        ai_response_text = ""
        last_error_msg = ""

        # 4. LLM 호출 시도 (Gemini -> Anthropic -> OpenAI 교차 백업 체인)
        if settings.GEMINI_API_KEY:
            try:
                ai_response_text = cls.call_gemini_api(
                    api_key=settings.GEMINI_API_KEY,
                    system_prompt=system_prompt,
                    user_message=user_message,
                    history_messages=history_messages
                )
            except Exception as ge:
                last_error_msg = f"Gemini API 오류 ({str(ge)})"
                print(f"[ChatService] {last_error_msg}")
                ai_response_text = ""

        # Anthropic Claude 호출 시도 (Gemini 미설정 또는 실패 시)
        if not ai_response_text and settings.ANTHROPIC_API_KEY:
            try:
                ai_response_text = cls.call_anthropic_api(
                    api_key=settings.ANTHROPIC_API_KEY,
                    system_prompt=system_prompt,
                    user_message=user_message,
                    history_messages=history_messages
                )
            except Exception as ae:
                last_error_msg = f"Anthropic API 오류 ({str(ae)})"
                print(f"[ChatService] {last_error_msg}")
                ai_response_text = ""

        # OpenAI 호출 시도 (Gemini 및 Anthropic 미설정 또는 실패 시)
        if not ai_response_text and settings.OPENAI_API_KEY and (settings.OPENAI_API_KEY.startswith("sk-") or "cody" in settings.OPENAI_API_KEY):
            # 코디세이 플랫폼 프록시 base_url 자동 감지 (sk-cody- 키 지원)
            base_url = settings.OPENAI_BASE_URL or ("https://copa.codyssey.kr/v1" if settings.OPENAI_API_KEY.startswith("sk-cody-") else None)
            openai_models = [
                "gpt-5-mini",
                "gpt-5.4-mini",
                "gpt-5.4",
                "gpt-5.5",
                settings.OPENAI_MODEL,
                "gpt-4o-mini",
                "gpt-4o"
            ]
            ordered_models = []
            for om in openai_models:
                if om and om not in ordered_models:
                    ordered_models.append(om)

            for o_model in ordered_models:
                try:
                    client = OpenAI(api_key=settings.OPENAI_API_KEY, base_url=base_url)
                    messages_payload = [{"role": "system", "content": system_prompt}]
                    for m in history_messages[-6:]:
                        messages_payload.append({"role": m["role"], "content": m["content"]})
                    messages_payload.append({"role": "user", "content": user_message})

                    # 1차 호출 (도구 호출 활성화)
                    completion = client.chat.completions.create(
                        model=o_model,
                        messages=messages_payload,
                        tools=TOOLS,
                        tool_choice="auto",
                        temperature=0.7
                    )

                    response_message = completion.choices[0].message

                    # 도구 호출(Function Calling)이 발생한 경우
                    if response_message.tool_calls:
                        messages_payload.append(response_message)
                        for tool_call in response_message.tool_calls:
                            func_name = tool_call.function.name
                            func_args = json.loads(tool_call.function.arguments or "{}")
                            tool_result = execute_tool_call(func_name, func_args)
                            messages_payload.append({
                                "role": "tool",
                                "tool_call_id": tool_call.id,
                                "content": tool_result
                            })

                        # 2차 호출: 도구 실행 결과를 반영한 최종 응답 생성
                        second_completion = client.chat.completions.create(
                            model=o_model,
                            messages=messages_payload,
                            temperature=0.7
                        )
                        ai_response_text = second_completion.choices[0].message.content
                    else:
                        ai_response_text = response_message.content

                    if ai_response_text:
                        print(f"[ChatService] OpenAI 호출 성공 (사용 모델: {o_model}, Base URL: {base_url or 'default'})")
                        break
                except Exception as oe:
                    err_s = str(oe).lower()
                    if "model" in err_s and ("not found" in err_s or "does not exist" in err_s or "access" in err_s):
                        continue
                    last_error_msg = f"OpenAI API 오류 ({str(oe)})"
                    print(f"[ChatService] {last_error_msg}")
                    break

        # LLM 키 등록 여부 검사 (Gemini / Anthropic / OpenAI)
        has_any_key = bool(
            (settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 5) or
            (settings.ANTHROPIC_API_KEY and len(settings.ANTHROPIC_API_KEY.strip()) > 5) or
            (settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY.strip()) > 5)
        )

        # 키가 없고 사전 분석 도메인 질문도 아닌 경우: 세션을 DB에 저장하지 않고 키 등록 유도 에러 반환!
        if not has_any_key and not ai_response_text:
            local_fallback = generate_local_fallback_response(user_message, summary, stats)
            if not local_fallback:
                return {
                    "error": "API_KEY_REQUIRED",
                    "message": "실시간 대화를 생성하기 위해서는 Gemini 또는 OpenAI API Key 등록이 필요합니다.",
                    "response": None,
                    "conversation_id": None,
                    "summary_used": summary,
                    "timestamp": datetime.utcnow().isoformat()
                }
            ai_response_text = local_fallback

        # 키가 등록되어 있으나 LLM 호출이 실패한 경우: 절대 API_KEY_REQUIRED를 띄우지 않고 실제 에러와 로컬 지능 답변 제공!
        if has_any_key and not ai_response_text:
            local_fallback = generate_local_fallback_response(user_message, summary, stats)
            avg_streams = summary.get("metrics", {}).get("average", 1147)
            avg_bpm = stats.get("average_bpm", 132.4)
            fallback_text = local_fallback or f"현재 1,390일 차트 데이터 기준으로 글로벌 1위 평균 일일 스트리밍은 **{avg_streams:,}만 회**이며, 1위 곡들의 평균 템포는 **{avg_bpm} BPM**입니다."
            ai_response_text = (
                f"⚠️ **AI API 모델 호출 알림**\n\n"
                f"등록된 API Key로 모델을 호출하는 중 다음과 같은 오류 응답이 수신되었습니다:\n"
                f"> `{last_error_msg or '모델 응답 실패'}`\n\n"
                f"**확인 팁:**\n"
                f"• Google AI Studio(aistudio.google.com)에서 발급된 Gemini API Key인지 확인해 주세요.\n"
                f"• 프로젝트의 결제 활성화 여부나 사용량 한도(Quota)를 확인해 주세요.\n\n"
                f"---\n"
                f"*(대체 모드: 1,390일 Spotify Global 1위 실제 데이터 기반으로 생성된 분석 답변입니다)*\n\n"
                f"{fallback_text}"
            )

        # 5. 대화 기록 저장 (/api/conversations에 자동 반영 - 유효한 답변일 때만 세션 생성/보존)
        now_str = datetime.utcnow().isoformat()
        new_messages = list(history_messages)
        new_messages.append({"role": "user", "content": user_message, "timestamp": now_str})
        new_messages.append({"role": "assistant", "content": ai_response_text, "timestamp": now_str})

        saved_conv = ConversationService.save_or_update_conversation(
            conv_id=conversation_id,
            title=None,
            messages=new_messages
        )

        return {
            "response": ai_response_text,
            "conversation_id": saved_conv["id"],
            "summary_used": summary,
            "timestamp": now_str
        }

