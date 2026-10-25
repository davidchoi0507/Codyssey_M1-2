import json
import random
import sys
from datetime import datetime, timedelta

# Windows utf-8 콘솔 출력
sys.stdout.reconfigure(encoding='utf-8')

def generate_1400days_spotify_data():
    """
    2021년 1월 1일 ~ 2024년 11월 30일 (총 4개년, 약 1,400일치)
    팬데믹 팝 르네상스부터 엔데믹, K-POP 글로벌 신기록, Y2K 신드롬까지
    글로벌 팝 역사상 가장 화려한 1위 메가히트 시계열 데이터셋
    포맷: (date, value, memo)
    """
    eras = [
        # ========================================================
        # [2021년: 올리비아 로드리고, BTS, 라로이 & 저스틴 비버]
        # ========================================================
        {
            "song": "Drivers License - Olivia Rodrigo",
            "genre": "Bedroom Pop / Power Pop",
            "bpm": 144,
            "mood": "Heartbroken & Cathartic (Valence: 0.13)",
            "label": "Geffen / Interscope",
            "days": 65,
            "base_val": 980,
            "volatility": 50,
            "notes": ["신인 역사상 최단기 글로벌 1억 스트리밍", "Z세대 전 세계적 신드롬", "빌보드 및 스포티파이 8주 연속 1위"]
        },
        {
            "song": "Good 4 U - Olivia Rodrigo",
            "genre": "Pop Punk / Alt-Rock",
            "bpm": 167,
            "mood": "Furious & Cathartic (Valence: 0.69)",
            "label": "Geffen / Interscope",
            "days": 45,
            "base_val": 920,
            "volatility": 45,
            "notes": ["2000년대 팝펑크 리바이벌 열풍", "여름 시즌 록 에너제틱 트랙", "글로벌 일간 950만 돌파"]
        },
        {
            "song": "Butter - BTS",
            "genre": "Dance-Pop / Disco-Funk",
            "bpm": 110,
            "mood": "Smooth & Charismatic (Valence: 0.70)",
            "label": "BIGHIT MUSIC",
            "days": 40,
            "base_val": 1100,
            "volatility": 65,
            "notes": ["스포티파이 역사상 발매 첫날 역대 최다 스트리밍 달성", "기네스 세계 기록 등재", "글로벌 서머송 1위"]
        },
        {
            "song": "STAY - The Kid LAROI & Justin Bieber",
            "genre": "Pop / Synth-Pop",
            "bpm": 170,
            "mood": "Frantic & Addictive (Valence: 0.76)",
            "label": "Grade A / Columbia",
            "days": 75,
            "base_val": 1050,
            "volatility": 55,
            "notes": ["2021년 하반기 최장기 1위 메가히트", "글로벌 틱톡 댄스 챌린지 지배", "일간 1,000만 회 안정적 롱런"]
        },
        {
            "song": "Easy On Me - Adele",
            "genre": "Piano Pop / Soul Ballad",
            "bpm": 142,
            "mood": "Solemn & Reflective (Valence: 0.28)",
            "label": "Columbia Records",
            "days": 45,
            "base_val": 1180,
            "volatility": 75,
            "notes": ["아델 6년 만의 컴백작", "발매 첫날 스포티파이 전 세계 신기록", "가을/겨울 감성 발라드 독점"]
        },
        {
            "song": "All I Want for Christmas Is You - Mariah Carey",
            "genre": "Holiday Pop / Soul",
            "bpm": 150,
            "mood": "Festive & Joyful (Valence: 0.95)",
            "label": "Columbia Records",
            "days": 40,
            "base_val": 1350,
            "volatility": 110,
            "notes": ["2021년 연말 캐럴 쇼크", "크리스마스 이브 당일 역대 최다 스트리밍 갱신", "신보 차트 진입 완전 차단"]
        },

        # ========================================================
        # [2022년: 해리 스타일스, 배드 버니, 테일러 스위프트]
        # ========================================================
        {
            "song": "Heat Waves - Glass Animals",
            "genre": "Indie Pop / Psychedelic Pop",
            "bpm": 81,
            "mood": "Dreamy & Nostalgic (Valence: 0.53)",
            "label": "Wolf Tone / Republic",
            "days": 55,
            "base_val": 860,
            "volatility": 40,
            "notes": ["발매 59주 만의 역주행 1위 기적", "전 세계 누적 스트리밍 20억 회 돌파", "슬로우 템포 인디팝의 승리"]
        },
        {
            "song": "As It Was - Harry Styles",
            "genre": "Synth-Pop / New Wave",
            "bpm": 174,
            "mood": "Bittersweet & Upbeat (Valence: 0.66)",
            "label": "Erskine / Columbia",
            "days": 85,
            "base_val": 1120,
            "volatility": 60,
            "notes": ["2022년 전 세계 최다 스트리밍 곡", "스포티파이 글로벌 차트 15주 연속 1위 독점", "영국/미국 동시 1위"]
        },
        {
            "song": "Me Porto Bonito - Bad Bunny & Chencho Corleone",
            "genre": "Reggaeton / Latin Urban",
            "bpm": 92,
            "mood": "Sensual & Club (Valence: 0.42)",
            "label": "Rimas Entertainment",
            "days": 50,
            "base_val": 990,
            "volatility": 50,
            "notes": ["Un Verano Sin Ti 앨범의 글로벌 서머송", "스페인어 음원 역사상 최고 스트리밍", "라틴 음악의 메인스트림 완전 장악"]
        },
        {
            "song": "Unholy (feat. Kim Petras) - Sam Smith",
            "genre": "Electropop / Hyperpop",
            "bpm": 131,
            "mood": "Ominous & Dramatic (Valence: 0.23)",
            "label": "Capitol Records",
            "days": 40,
            "base_val": 910,
            "volatility": 45,
            "notes": ["발매 전 틱톡 티저 바이럴 1위 등극", "그래미 어워드 베스트 팝 듀오 수상", "독특한 사운드 텍스처 화제"]
        },
        {
            "song": "Anti-Hero - Taylor Swift",
            "genre": "Synth-Pop",
            "bpm": 97,
            "mood": "Introspective & Witty (Valence: 0.53)",
            "label": "Republic Records",
            "days": 45,
            "base_val": 1220,
            "volatility": 80,
            "notes": ["Midnights 앨범 당일 전 세계 스포티파이 서버 마비", "일간 1,200만 회 피크", "가을 시즌 1위 롱런"]
        },
        {
            "song": "All I Want for Christmas Is You - Mariah Carey",
            "genre": "Holiday Pop / Soul",
            "bpm": 150,
            "mood": "Festive & Joyful (Valence: 0.95)",
            "label": "Columbia Records",
            "days": 40,
            "base_val": 1390,
            "volatility": 120,
            "notes": ["2022년 연말 캐럴 대폭발", "2,000만 회 근접 피크", "연례 캐럴 차트 점령"]
        },

        # ========================================================
        # [2023년: 마일리, 정국, 테일러, SZA]
        # ========================================================
        {
            "song": "Flowers - Miley Cyrus",
            "genre": "Disco-Pop / Funk",
            "bpm": 118,
            "mood": "Empowering (Valence: 0.65)",
            "label": "Columbia Records",
            "days": 45,
            "base_val": 1080,
            "volatility": 50,
            "notes": ["그래미 어워드 서사 및 자존감 앤섬", "역대 최단기 1억 스트리밍 돌파", "글로벌 35개국 1위 장악"]
        },
        {
            "song": "Kill Bill - SZA",
            "genre": "Alt-R&B / Pop",
            "bpm": 89,
            "mood": "Dark & Vengeful (Valence: 0.24)",
            "label": "Top Dawg / RCA",
            "days": 35,
            "base_val": 840,
            "volatility": 40,
            "notes": ["SOS 앨범 최장기 1위 트랙", "Z세대 틱톡 챌린지 폭발", "빌보드 및 스포티파이 동시 석권"]
        },
        {
            "song": "Ella Baila Sola - Eslabon Armado & Peso Pluma",
            "genre": "Regional Mexican / Latin",
            "bpm": 148,
            "mood": "Energetic & Festive (Valence: 0.83)",
            "label": "DEL Records",
            "days": 40,
            "base_val": 920,
            "volatility": 45,
            "notes": ["라틴 음악 역사상 최초 글로벌 1위", "멕시코 뮤직 신기록", "미국 및 남미 스트리밍 대폭발"]
        },
        {
            "song": "Cruel Summer - Taylor Swift",
            "genre": "Synth-Pop",
            "bpm": 170,
            "mood": "Euphoric (Valence: 0.61)",
            "label": "Republic Records",
            "days": 40,
            "base_val": 950,
            "volatility": 45,
            "notes": ["The Eras Tour 효과로 역주행 1위", "여름 시즌 최고 인기 팝", "글로벌 일간 900만 돌파"]
        },
        {
            "song": "Seven (feat. Latto) - Jung Kook",
            "genre": "UK Garage / Pop",
            "bpm": 125,
            "mood": "Playful & Romantic (Valence: 0.87)",
            "label": "BIGHIT MUSIC",
            "days": 65,
            "base_val": 1150,
            "volatility": 70,
            "notes": ["K-POP 솔로 최초 글로벌 최장 1위(65일)", "역대 최단기 10억 스트리밍 달성", "글로벌 메가 서머송"]
        },
        {
            "song": "Paint The Town Red - Doja Cat",
            "genre": "Hip-Hop / Pop-Rap",
            "bpm": 100,
            "mood": "Bold & Rebellious (Valence: 0.70)",
            "label": "Kemosabe / RCA",
            "days": 45,
            "base_val": 880,
            "volatility": 40,
            "notes": ["디오니 워릭 샘플링 화제", "가을 시즌 글로벌 1위 롱런", "숏폼 댄스 챌린지 주도"]
        },
        {
            "song": "All I Want for Christmas Is You - Mariah Carey",
            "genre": "Holiday Pop / Soul",
            "bpm": 150,
            "mood": "Festive & Joyful (Valence: 0.95)",
            "label": "Columbia Records",
            "days": 42,
            "base_val": 1420,
            "volatility": 125,
            "notes": ["2023년 연말 캐럴 시즌 차트 전면 점령", "크리스마스 이브 당일 역대 최고 스트리밍 기록 경신"]
        },

        # ========================================================
        # [2024년: 사브리나, 빌리 아일리시, 테일러, 브루노 & 로제]
        # ========================================================
        {
            "song": "Lovin On Me - Jack Harlow",
            "genre": "Pop-Rap",
            "bpm": 105,
            "mood": "Confident & Chill (Valence: 0.81)",
            "label": "Generation Now / Atlantic",
            "days": 35,
            "base_val": 820,
            "volatility": 35,
            "notes": ["연초 비수기 시즌 1위 등극", "캐더린 앤더슨 R&B 샘플링 바이럴", "빌보드 핫 100 1위 달성"]
        },
        {
            "song": "Beautiful Things - Benson Boone",
            "genre": "Pop-Rock / Ballad",
            "bpm": 105,
            "mood": "Emotional & Raw (Valence: 0.31)",
            "label": "Night Street / Warner",
            "days": 45,
            "base_val": 910,
            "volatility": 45,
            "notes": ["폭발적인 보컬 샤우팅 클립 틱톡 바이럴", "2024년 상반기 최고 스트리밍 히트작", "글로벌 50개국 1위"]
        },
        {
            "song": "Fortnight (feat. Post Malone) - Taylor Swift",
            "genre": "Synth-Pop / Down-Tempo",
            "bpm": 96,
            "mood": "Melancholic (Valence: 0.28)",
            "label": "Republic Records",
            "days": 30,
            "base_val": 1250,
            "volatility": 85,
            "notes": ["TTPD 앨범 발매일 당일 역대 일간 최다 스트리밍 달성", "포스트 말론과의 특급 컬래버", "스포티파이 앨범 차트 올킬"]
        },
        {
            "song": "Espresso - Sabrina Carpenter",
            "genre": "Nu-Disco / Pop",
            "bpm": 104,
            "mood": "Breezy & Addictive (Valence: 0.72)",
            "label": "Island Records",
            "days": 55,
            "base_val": 960,
            "volatility": 50,
            "notes": ["2024년 여름 서머송 대표곡", "글로벌 팝 아이콘 등극", "일간 1,000만 회 안정적 롱런"]
        },
        {
            "song": "BIRDS OF A FEATHER - Billie Eilish",
            "genre": "Alt-Pop / Indie Pop",
            "bpm": 105,
            "mood": "Romantic & Nostalgic (Valence: 0.44)",
            "label": "Darkroom / Interscope",
            "days": 60,
            "base_val": 890,
            "volatility": 40,
            "notes": ["정규 3집 수록곡 역주행 1위", "안정적인 롱런 스트리밍 페이스", "MZ세대 스트리밍 집중"]
        },
        {
            "song": "Die With A Smile - Lady Gaga & Bruno Mars",
            "genre": "Soul Ballad / Pop",
            "bpm": 158,
            "mood": "Heartfelt & Grand (Valence: 0.52)",
            "label": "Interscope / Atlantic",
            "days": 95,
            "base_val": 1080,
            "volatility": 60,
            "notes": ["특급 듀엣 깜짝 발매 후 글로벌 1위 폭격", "일간 1,150만 회 돌파 메가히트", "하반기 최고 듀엣 스트리밍 기록"]
        },
        {
            "song": "APT. - ROSÉ & Bruno Mars",
            "genre": "Pop Punk / Pop Rock",
            "bpm": 149,
            "mood": "Hyped & Addictive (Valence: 0.90)",
            "label": "THEBLACKLABEL / Atlantic",
            "days": 133,
            "base_val": 1350,
            "volatility": 90,
            "notes": ["한국 술게임 '아파트' 글로벌 신드롬", "역대 최단기 글로벌 1억 스트리밍 페이스", "일간 1,480만 회 슈퍼 피크 달성"]
        }
    ]

    start_date = datetime(2021, 1, 1)
    current_date = start_date
    dataset = []

    random.seed(2025)

    for era in eras:
        song = era["song"]
        genre = era["genre"]
        bpm = era["bpm"]
        mood = era["mood"]
        label = era["label"]
        days = era["days"]
        base_val = era["base_val"]
        volatility = era["volatility"]
        notes = era["notes"]

        for i in range(days):
            date_str = current_date.strftime("%Y-%m-%d")
            weekday = current_date.weekday()
            # 금/토 스트리밍 증가 (신곡 발매일 효과)
            day_factor = 1.06 if weekday in [4, 5] else 0.97
            
            # 발매 초기~중반 피크 곡선
            peak_factor = 1.0 + (0.16 * (1 - abs(i - (days // 3)) / (days // 2)))
            
            # 12월 크리스마스 이브/당일 특별 피크
            special_factor = 1.0
            if current_date.month == 12 and current_date.day in [24, 25]:
                special_factor = 1.35  # 캐럴 이브 피크

            val = round((base_val * peak_factor * day_factor * special_factor) + random.uniform(-volatility, volatility), 1)
            val = max(val, 550.0)

            note = random.choice(notes)
            # 고도화된 memo 구조: 곡명 | Genre: 장르 | BPM: 수치 | Mood: 무드 | Label: 음반사 | Note: 비고
            memo = f"{song} | Genre: {genre} | BPM: {bpm} | Mood: {mood} | Label: {label} | Note: {i+1}일차 1위 ({note})"

            dataset.append({
                "date": date_str,
                "value": val,
                "memo": memo
            })

            current_date += timedelta(days=1)

    print(f"Total {len(dataset)} items generated successfully.")
    print(f"Period: {dataset[0]['date']} ~ {dataset[-1]['date']}")
    
    with open("backend/scripts/spotify_raw_data.json", "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    generate_1400days_spotify_data()
