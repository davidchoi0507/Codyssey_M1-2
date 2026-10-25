from typing import List, Optional
import os
import tempfile
from fastapi import APIRouter, HTTPException, status, Query, File, UploadFile
from backend.app.models.data_schema import (
    DataItemCreate,
    DataItemUpdate,
    DataItemResponse,
    SummaryResponse,
    ExtendedStatisticsResponse,
    SimulationRequest,
    SimulationResponse,
    AudioAnalysisResponse
)
from backend.app.services.data_service import DataService

router = APIRouter(prefix="/data", tags=["Data Management"])

@router.get("/summary", response_model=SummaryResponse, summary="시계열 데이터 요약 정보 조회 (기간 필터 지원)")
def get_data_summary(days: Optional[int] = Query(None, description="최근 N일 필터링 (예: 30, 90, 365, None=전체)")):
    """AI 시스템 프롬프트 주입 및 메인 대시보드 요약용 API (questions.md 항목 4-4 완벽 대응)"""
    return DataService.get_summary(days=days)

@router.get("/statistics", response_model=ExtendedStatisticsResponse, summary="[보너스] 고급 시장 통계 지표 조회")
def get_extended_statistics(days: Optional[int] = Query(None, description="최근 N일 필터링")):
    """변동성, 1위 허들, BPM/장르 점유율, YoY 성장률, 캐럴 시즌 폭증률 등 고도화 분석 지표"""
    return DataService.get_extended_statistics(days=days)

from fastapi.responses import PlainTextResponse

@router.post("/simulate", response_model=SimulationResponse, summary="[신규] Track-to-Track 곡 기반 벤치마크 시뮬레이터")
def simulate_comeback(req: SimulationRequest):
    """신곡의 장르와 BPM을 과거 4개년 1위 곡들과 유사도 매칭하여 성과와 1위 유지력(Streak) 예측"""
    return DataService.simulate_comeback(
        genre=req.genre,
        bpm=req.bpm,
        target_month=req.target_month,
        track_title=req.track_title,
        target_streams=req.target_streams
    )

@router.get("/report", response_class=PlainTextResponse, summary="[신규] A&R 경영진용 전략 분석 보고서 원클릭 생성")
def get_executive_report():
    """Spotify Global 4개년 시계열 분석 Executive Report (Markdown 포맷)"""
    return DataService.generate_executive_report()

@router.post("/analyze-audio", response_model=AudioAnalysisResponse, summary="[신규] Librosa 정량 분석 + AI 정성 평가 음원 분석")
async def analyze_audio_track(file: UploadFile = File(...)):
    """사용자가 직접 업로드한 음원 파일에서 Librosa로 정밀 BPM 및 오디오 특성을 추출하고 AI A&R 정성 평가를 수행합니다."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    allowed_exts = [".mp3", ".wav", ".m4a", ".flac", ".ogg", ".aac", ".webm", ".wma"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"지원하지 않는 오디오 포맷입니다. 지원 형식: {', '.join(allowed_exts)}"
        )

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        result = DataService.analyze_audio_file(tmp_path, file.filename or "track.mp3")
        return result
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass

@router.post("", response_model=DataItemResponse, status_code=status.HTTP_201_CREATED, summary="새 스트리밍 데이터 추가")
def create_data_item(item: DataItemCreate):
    return DataService.create_data(item)

@router.get("", response_model=List[DataItemResponse], summary="스트리밍 데이터 목록 조회")
def get_all_data(
    order: Optional[str] = Query("desc", description="정렬 순서: asc 또는 desc"),
    limit: Optional[int] = Query(None, description="조회할 최대 데이터 개수")
):
    items = DataService.get_all_data()
    if order == "desc":
        items = sorted(items, key=lambda x: x.get("date", ""), reverse=True)
    elif order == "asc":
        items = sorted(items, key=lambda x: x.get("date", ""), reverse=False)

    if limit is not None and limit > 0:
        items = items[:limit]
    return items

@router.get("/{item_id}", response_model=DataItemResponse, summary="특정 데이터 상세 조회")
def get_data_item(item_id: str):
    item = DataService.get_data_by_id(item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="데이터를 찾을 수 없습니다.")
    return item

@router.put("/{item_id}", response_model=DataItemResponse, summary="데이터 수정")
def update_data_item(item_id: str, item: DataItemUpdate):
    updated = DataService.update_data(item_id, item)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="수정할 데이터를 찾을 수 없습니다.")
    return updated

@router.delete("/{item_id}", summary="데이터 삭제")
def delete_data_item(item_id: str):
    success = DataService.delete_data(item_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="삭제할 데이터를 찾을 수 없습니다.")
    return {"message": "성공적으로 삭제되었습니다.", "id": item_id}

