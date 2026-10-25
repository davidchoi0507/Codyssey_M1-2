import os
import json
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.core.config import settings
from backend.app.core.database import db_manager
from backend.app.routers import data_router, conversation_router, chat_router
from backend.app.services.data_service import DataService

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
    ## SoundPulse AI: 글로벌 음원 스트리밍 차트 인텔리전스 API
    
    * **시계열 데이터 관리**: Spotify Global 1위 스트리밍 일별 데이터 CRUD 및 통계 요약
    * **AI 비서 (컨텍스트 주입)**: 실시간 요약 정보를 바탕으로 한 엔터테인먼트 A&R 전략 질의응답
    * **대화 세션 관리**: 멀티 세션 대화 저장, 불러오기 및 삭제
    * **고급 도구 호출**: OpenAI Tools (Function Calling) 지원
    """
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 및 배포 환경(Vercel 등)과의 원활한 통신을 위해 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(data_router.router, prefix=settings.API_PREFIX)
app.include_router(conversation_router.router, prefix=settings.API_PREFIX)
app.include_router(chat_router.router, prefix=settings.API_PREFIX)

# 프론트엔드 정적 파일 서빙 (로컬 개발 편의 및 단일 실행 지원)
from fastapi.staticfiles import StaticFiles
frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/css", StaticFiles(directory=str(frontend_dir / "css")), name="css")
    app.mount("/js", StaticFiles(directory=str(frontend_dir / "js")), name="js")
    app.mount("/assets", StaticFiles(directory=str(frontend_dir / "assets")), name="assets")

@app.on_event("startup")
def startup_event():
    """서버 시작 시 데이터가 비어 있으면 초기 140개 데이터를 자동 시딩합니다."""
    existing_items = DataService.get_all_data()
    if len(existing_items) < 100:
        raw_data_file = Path(__file__).resolve().parent.parent / "scripts" / "spotify_raw_data.json"
        if raw_data_file.exists():
            try:
                with open(raw_data_file, "r", encoding="utf-8") as f:
                    raw_items = json.load(f)
                count = 0
                for item in raw_items:
                    db_manager.create_data(item)
                    count += 1
                print(f"[Startup] 초기 Spotify 스트리밍 데이터 {count}개가 성공적으로 시딩되었습니다!")
            except Exception as e:
                print(f"[Startup] 초기 데이터 시딩 중 오류 발생: {e}")


from fastapi.responses import JSONResponse, FileResponse

@app.get("/", summary="메인 대시보드 웹 페이지")
def root():
    index_file = frontend_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "mode": "Firebase Firestore" if db_manager.is_firebase else "High-Performance Local Mode"
    }

@app.get("/api", summary="루트 API 상태 안내")
def api_root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "mode": "Firebase Firestore" if db_manager.is_firebase else "High-Performance Local Mode"
    }


@app.get("/health", summary="헬스체크 엔드포인트")
@app.get("/api/status", summary="콜드스타트 감지용 핑 엔드포인트")
def health_check():
    summary = DataService.get_summary()
    return {
        "status": "ok",
        "database": "firebase" if db_manager.is_firebase else "local_json",
        "records_count": summary["count"],
        "openai_configured": bool(settings.OPENAI_API_KEY)
    }
