from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, field_validator
import re

class DataItemCreate(BaseModel):
    date: str = Field(..., description="날짜 (YYYY-MM-DD)", example="2024-06-15")
    value: float = Field(..., description="글로벌 1위 스트리밍 수 (만 회 단위)", example=892.4)
    memo: str = Field(..., description="곡명, 장르 및 차트 메모", min_length=1, max_length=500, example="Espresso - Sabrina Carpenter | Nu-Disco / Pop | 1위 유지")

    @field_validator("date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("날짜 형식은 반드시 YYYY-MM-DD 여야 합니다.")
        return v

    @field_validator("value")
    @classmethod
    def validate_value_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("스트리밍 수치(value)는 0보다 커야 합니다.")
        return round(v, 2)


class DataItemUpdate(BaseModel):
    date: Optional[str] = Field(None, description="날짜 (YYYY-MM-DD)")
    value: Optional[float] = Field(None, description="글로벌 1위 스트리밍 수")
    memo: Optional[str] = Field(None, min_length=1, max_length=500)

    @field_validator("date")
    @classmethod
    def validate_date_format(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("날짜 형식은 반드시 YYYY-MM-DD 여야 합니다.")
        return v

    @field_validator("value")
    @classmethod
    def validate_value_positive(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            if v <= 0:
                raise ValueError("스트리밍 수치(value)는 0보다 커야 합니다.")
            return round(v, 2)
        return v


class DataItemResponse(BaseModel):
    id: str
    date: str
    value: float
    memo: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class Metrics(BaseModel):
    total: float
    average: float
    max: float
    min: float


class SummaryResponse(BaseModel):
    period: str
    count: int
    metrics: Metrics
    trend: str


class ExtendedStatisticsResponse(BaseModel):
    period: str
    count: int
    metrics: Metrics
    trend: str
    volatility: float = Field(..., description="변동성 (표준편차)")
    benchmark_hurdle: float = Field(..., description="1위 진입 기준선 (상위 25% 분위수)")
    longest_streak_track: str = Field(..., description="최장 1위 유지 곡 및 일수")
    peak_record: Dict[str, Any] = Field(..., description="최고 기록 날짜 및 곡 정보")
    average_bpm: float = Field(120.0, description="1위 곡들의 평균 BPM")
    top_genres: List[Dict[str, Any]] = Field(default_factory=list, description="장르별 점유율 Top")
    yoy_growth: Optional[float] = Field(None, description="2023 대비 2024년 스트리밍 성장률(YoY %)")
    holiday_shock_factor: Optional[float] = Field(None, description="12월 캐럴 시즌 스트리밍 폭증률(%)")


class SimulationRequest(BaseModel):
    track_title: Optional[str] = Field("내 신곡 프로젝트", description="신곡 제목", example="Midnight Neon")
    genre: str = Field(..., description="신곡 장르 (예: Pop, Synth-Pop, Nu-Disco, Pop Punk, R&B 등)", example="Pop Punk")
    bpm: float = Field(..., ge=60, le=220, description="신곡 템포 BPM (60~220)", example=148.0)
    target_month: int = Field(..., ge=1, le=12, description="컴백 예정 월 (1~12)", example=7)
    target_streams: Optional[float] = Field(None, description="목표 일일 스트리밍 (미입력 시 벤치마크 곡 기준 자동 계산)")


class BenchmarkTrackInfo(BaseModel):
    song: str
    genre: str
    bpm: float
    mood: str
    label: str
    actual_streak_days: int
    actual_average_streams: float
    similarity_score: float


class SimulationResponse(BaseModel):
    track_title: str
    genre: str
    bpm: float
    target_month: int
    target_streams: float
    win_probability: float = Field(..., description="1위 달성 확률 (0~100%)")
    season_risk: str = Field(..., description="시즌 리스크 레벨 (안전 / 보통 / 경계 / 극위험)")
    historical_month_average: float = Field(..., description="해당 월의 과거 1위 평균 스트리밍")
    recommended_day: str = Field("금요일 (글로벌 스포티파이 집계 시작일)", description="추천 발매 요일")
    benchmark_track: BenchmarkTrackInfo
    expected_streak_days: int
    strategic_advice: str = Field(..., description="A&R 전문 전략 조언")


class AudioAnalysisResponse(BaseModel):
    filename: str
    track_title: str
    bpm: float
    duration_sec: float
    energy: float
    brightness: float
    detected_genre: str
    mood: str
    qualitative_ai_advice: str
    engine_used: str = "librosa"

