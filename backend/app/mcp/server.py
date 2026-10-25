"""
SoundPulse AI - Model Context Protocol (MCP) Server
보너스 과제 1: 외부 클라이언트(Claude Desktop, Cursor, AI 에이전트 등)에서
Spotify 스트리밍 차트 데이터 및 요약 통계를 도구(Tool)로 직접 호출할 수 있도록 제공하는 MCP 표준 서버
"""
import sys
import json
import os
from pathlib import Path

# 프로젝트 루트 경로 추가
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

from backend.app.services.data_service import DataService

def handle_json_rpc(request_line: str) -> str:
    try:
        req = json.loads(request_line)
    except Exception:
        return ""

    req_id = req.get("id")
    method = req.get("method")
    params = req.get("params", {})

    if method == "tools/list":
        tools = [
            {
                "name": "get_streaming_summary",
                "description": "Spotify Global 1위 곡들의 기간, 개수, 평균/최대/최소 스트리밍, 추세를 조회합니다.",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "get_extended_statistics",
                "description": "차트 변동성(표준편차), 1위 허들 기준선, 최장 1위 유지 곡 등 고급 A&R 지표를 조회합니다.",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "search_chart_records",
                "description": "아티스트, 곡명, 날짜 키워드로 스트리밍 차트 기록을 검색합니다.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "keyword": {"type": "string", "description": "검색 키워드"}
                    },
                    "required": ["keyword"]
                }
            }
        ]
        return json.dumps({"jsonrpc": "2.0", "id": req_id, "result": {"tools": tools}}, ensure_ascii=False)

    elif method == "tools/call":
        tool_name = params.get("name")
        args = params.get("arguments", {})

        if tool_name == "get_streaming_summary":
            result = DataService.get_summary()
        elif tool_name == "get_extended_statistics":
            result = DataService.get_extended_statistics()
        elif tool_name == "search_chart_records":
            kw = args.get("keyword", "").lower()
            all_items = DataService.get_all_data()
            result = [i for i in all_items if kw in i.get("memo", "").lower() or kw in i.get("date", "")][:10]
        else:
            return json.dumps({
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32601, "message": f"Method not found: {tool_name}"}
            }, ensure_ascii=False)

        return json.dumps({
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "content": [
                    {"type": "text", "text": json.dumps(result, ensure_ascii=False, indent=2)}
                ]
            }
        }, ensure_ascii=False)

    elif method == "initialize":
        return json.dumps({
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "soundpulse-mcp-server", "version": "1.0.0"}
            }
        }, ensure_ascii=False)

    return json.dumps({"jsonrpc": "2.0", "id": req_id, "result": {}}, ensure_ascii=False)


def main():
    """표준 입출력(stdio) 기반 MCP 서버 루프"""
    print("SoundPulse MCP Server started.", file=sys.stderr)
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        response = handle_json_rpc(line.strip())
        if response:
            sys.stdout.write(response + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    main()

