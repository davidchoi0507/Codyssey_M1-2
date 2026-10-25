import json
import sys
from pathlib import Path

# Windows utf-8 콘솔 출력
sys.stdout.reconfigure(encoding='utf-8')

# 프로젝트 루트 추가
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.core.database import db_manager
from backend.app.services.data_service import DataService

def seed():
    raw_path = Path(__file__).resolve().parent / "spotify_raw_data.json"
    if not raw_path.exists():
        print(f"데이터 파일이 없습니다: {raw_path}")
        return

    with open(raw_path, "r", encoding="utf-8") as f:
        items = json.load(f)

    # 기존 데이터 초기화 (신규 650+일치 데이터로 교체)
    local_data_file = Path(__file__).resolve().parent.parent / "data_local" / "data.json"
    if local_data_file.exists():
        with open(local_data_file, "w", encoding="utf-8") as f:
            json.dump({}, f)

    print(f"총 {len(items)}개의 2개년치 고도화 데이터를 시딩합니다...")
    for idx, it in enumerate(items, 1):
        db_manager.create_data(it)
        if idx % 100 == 0 or idx == len(items):
            print(f"진행: {idx}/{len(items)}")

    summary = DataService.get_summary()
    print("\n--- 시딩 완료 후 요약 지표 ---")
    print(json.dumps(summary, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    seed()

