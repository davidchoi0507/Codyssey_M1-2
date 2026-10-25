/**
 * SoundPulse AI - Main Application Controller
 */

class AppManager {
  constructor() {
    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.coldStartModal = document.getElementById('coldStartModal');
    this.coldStartProgress = document.getElementById('coldStartProgress');
    this.systemStatusDot = document.querySelector('.status-dot');
    this.systemStatusText = document.querySelector('.status-text');

    // 상단 탭 버튼들
    this.tabButtons = document.querySelectorAll('.nav-tab');
    this.tabPanes = document.querySelectorAll('.tab-pane');

    // 테마 토글
    this.themeToggleBtn = document.getElementById('themeToggleBtn');

    // 모바일 햄버거 메뉴
    this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
    this.sidebar = document.getElementById('sidebar');

    // 요약 카드 엘리먼트들
    this.metricCount = document.getElementById('metricCount');
    this.metricPeriod = document.getElementById('metricPeriod');
    this.metricAverage = document.getElementById('metricAverage');
    this.metricHurdle = document.getElementById('metricHurdle');
    this.metricBpm = document.getElementById('metricBpm');
    this.metricGenreTop = document.getElementById('metricGenreTop');
    this.metricTrend = document.getElementById('metricTrend');
    this.metricYoy = document.getElementById('metricYoy');
    this.longestStreakPill = document.getElementById('longestStreakPill');

    // 기간 필터 버튼들 (questions.md 항목 4-4 완벽 대응)
    this.periodButtons = document.querySelectorAll('.period-btn');
    this.selectedDays = null;

    // [신규] 정밀 타임프레임 슬라이더 & 직접 입력
    this.timeframeSlider = document.getElementById('timeframeSlider');
    this.timeframeSliderBadge = document.getElementById('timeframeSliderBadge');
    this.customDaysInput = document.getElementById('customDaysInput');
    this.applyCustomDaysBtn = document.getElementById('applyCustomDaysBtn');

    // [신규] 음원 업로드 & Librosa 오디오 분석 엘리먼트
    this.audioDropzone = document.getElementById('audioDropzone');
    this.audioFileInput = document.getElementById('audioFileInput');
    this.selectAudioFileBtn = document.getElementById('selectAudioFileBtn');
    this.dropzonePrompt = document.getElementById('dropzonePrompt');
    this.dropzoneResult = document.getElementById('dropzoneResult');
    this.audioLoadingIndicator = document.getElementById('audioLoadingIndicator');
    this.analyzedTrackName = document.getElementById('analyzedTrackName');
    this.analyzedMeta = document.getElementById('analyzedMeta');
    this.audioWaveformCanvas = document.getElementById('audioWaveformCanvas');
    this.miniPlayAudioBtn = document.getElementById('miniPlayAudioBtn');
    this.resetAudioBtn = document.getElementById('resetAudioBtn');
    this.aiQualitativePill = document.getElementById('aiQualitativePill');
    this.aiQualitativeText = document.getElementById('aiQualitativeText');
    this.currentAudioUrl = null;
    this.currentAudioElement = null;

    // 시뮬레이터 엘리먼트들
    this.simulatorForm = document.getElementById('simulatorForm');
    this.simTitleInput = document.getElementById('simTitle');
    this.simGenreSelect = document.getElementById('simGenre');
    this.simBpmRange = document.getElementById('simBpm');
    this.bpmDisplay = document.getElementById('bpmDisplay');
    this.bpmAudioBtn = document.getElementById('bpmAudioBtn');
    this.simMonthSelect = document.getElementById('simMonth');

    this.simMatchScore = document.getElementById('simMatchScore');
    this.simMatchSong = document.getElementById('simMatchSong');
    this.simMatchMeta = document.getElementById('simMatchMeta');
    this.simExpectedStreak = document.getElementById('simExpectedStreak');
    this.simWinProb = document.getElementById('simWinProb');
    this.simProbBar = document.getElementById('simProbBar');
    this.simRiskBadge = document.getElementById('simRiskBadge');
    this.simHistAvg = document.getElementById('simHistAvg');
    this.simDay = document.getElementById('simDay');
    this.simAdviceText = document.getElementById('simAdviceText');
    this.simEmptyState = document.getElementById('simEmptyState');
    this.simResults = document.getElementById('simResults');
    this.simSampleDemoBtn = document.getElementById('simSampleDemoBtn');

    // 보고서 다운로드 버튼
    this.downloadReportBtn = document.getElementById('downloadReportBtn');

    // 서비스 가이드 모달 엘리먼트들
    this.guideModal = document.getElementById('guideModal');
    this.openGuideBtn = document.getElementById('openGuideBtn');
    this.closeGuideModalBtn = document.getElementById('closeGuideModalBtn');
    this.startTourBtn = document.getElementById('startTourBtn');

    // 컬러 팔레트 엘리먼트
    this.paletteSwatches = document.getElementById('paletteSwatches');
    this.paletteMoodLabel = document.getElementById('paletteMoodLabel');

    // 1:1 배틀 엘리먼트
    this.trackSelectA = document.getElementById('trackSelectA');
    this.trackSelectB = document.getElementById('trackSelectB');
    this.compareBattleBtn = document.getElementById('compareBattleBtn');

    this.battleEmptyState = document.getElementById('battleEmptyState');
    this.battleResults = document.getElementById('battleResults');
    this.battleVerdict = document.getElementById('battleVerdict');
    this.battleTitleA = document.getElementById('battleTitleA');
    this.battleGenreA = document.getElementById('battleGenreA');
    this.battleDaysA = document.getElementById('battleDaysA');
    this.battleAvgA = document.getElementById('battleAvgA');
    this.battlePeakA = document.getElementById('battlePeakA');
    this.battleLabelA = document.getElementById('battleLabelA');

    this.battleTitleB = document.getElementById('battleTitleB');
    this.battleGenreB = document.getElementById('battleGenreB');
    this.battleDaysB = document.getElementById('battleDaysB');
    this.battleAvgB = document.getElementById('battleAvgB');
    this.battlePeakB = document.getElementById('battlePeakB');
    this.battleLabelB = document.getElementById('battleLabelB');

    this.battleVerdictText = document.getElementById('battleVerdictText');
  }

  async start() {
    // 1. 테마 적용
    const savedTheme = window.appState.getState().theme;
    this.applyTheme(savedTheme);

    // 2. 모듈 초기화
    window.chartManager.init();
    window.dataManager.init();
    window.chatManager.init();

    // 3. 서버 헬스체크 및 콜드스타트 완화 로직
    await this.connectWithColdStartHandling();

    // 4. 초기 데이터 로드
    await this.refreshAllData();
    await this.refreshConversations();

    // 5. 메트로놈 비트 펄스 초기화 (시뮬레이터 & 배틀은 초기 Empty State로 대기)
    this.initMetronome();

    // 6. 첫 방문 시 가이드 모달 자동 오픈 (온보딩)
    if (!localStorage.getItem('soundpulse_visited')) {
      setTimeout(() => {
        this.openGuideModal();
        localStorage.setItem('soundpulse_visited', 'true');
      }, 800);
    }
  }

  bindEvents() {
    // 탭 전환
    this.tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // 기간 필터 버튼 클릭
    this.periodButtons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const daysVal = btn.dataset.days;
        const daysNum = daysVal === 'all' ? 1390 : parseInt(daysVal, 10);
        await this.applyTimeframe(daysNum);
      });
    });

    // [신규] 타임프레임 슬라이더 실시간 조절
    this.timeframeSlider?.addEventListener('input', (e) => {
      const days = parseInt(e.target.value, 10);
      if (this.customDaysInput) this.customDaysInput.value = days;
      if (this.timeframeSliderBadge) {
        this.timeframeSliderBadge.textContent = days >= 1390
          ? '전체 4개년 (1,390일 전수 분석)'
          : `최근 ${days}일간 정밀 분석`;
      }
    });

    this.timeframeSlider?.addEventListener('change', async (e) => {
      const days = parseInt(e.target.value, 10);
      await this.applyTimeframe(days);
    });

    // [신규] 직접 입력 적용 버튼 및 엔터키
    this.applyCustomDaysBtn?.addEventListener('click', async () => {
      const days = parseInt(this.customDaysInput?.value, 10);
      if (!isNaN(days) && days >= 7) {
        await this.applyTimeframe(Math.min(1390, Math.max(7, days)));
      }
    });

    this.customDaysInput?.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const days = parseInt(this.customDaysInput.value, 10);
        if (!isNaN(days) && days >= 7) {
          await this.applyTimeframe(Math.min(1390, Math.max(7, days)));
        }
      }
    });

    // [신규] 오디오 음원 업로드 & Librosa 분석 이벤트
    this.selectAudioFileBtn?.addEventListener('click', () => {
      this.audioFileInput?.click();
    });

    this.audioFileInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleAudioUpload(e.target.files[0]);
      }
    });

    // 음원 파일 드래그 & 드롭
    if (this.audioDropzone) {
      this.audioDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.audioDropzone.classList.add('dragover');
      });
      this.audioDropzone.addEventListener('dragleave', () => {
        this.audioDropzone.classList.remove('dragover');
      });
      this.audioDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.audioDropzone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleAudioUpload(e.dataTransfer.files[0]);
        }
      });
    }

    // 재업로드 버튼
    this.resetAudioBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.resetAudioUpload();
    });

    // 미니 음원 재생 토글
    this.miniPlayAudioBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleAudioPlayback();
    });

    // BPM 슬라이더 실시간 수치 변경
    this.simBpmRange?.addEventListener('input', (e) => {
      if (this.bpmDisplay) {
        this.bpmDisplay.textContent = `${e.target.value} BPM`;
      }
    });

    // 시뮬레이터 폼 제출
    this.simulatorForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.runSimulation();
    });

    // [신규] 시뮬레이션 샘플 데이터 원클릭 체험 버튼
    this.simSampleDemoBtn?.addEventListener('click', async () => {
      if (this.simTitleInput) this.simTitleInput.value = 'APT. - ROSÉ & Bruno Mars';
      if (this.simGenreSelect) this.simGenreSelect.value = 'Pop Punk';
      if (this.simBpmRange) {
        this.simBpmRange.value = 149;
        if (this.bpmDisplay) this.bpmDisplay.textContent = '149 BPM';
      }
      if (this.simMonthSelect) this.simMonthSelect.value = '7';
      await this.runSimulation();
    });

    // A&R 전략 보고서 원클릭 다운로드
    this.downloadReportBtn?.addEventListener('click', async () => {
      await this.downloadExecutiveReport();
    });

    // 가이드 모달 열기 및 닫기
    this.openGuideBtn?.addEventListener('click', () => this.openGuideModal());
    this.closeGuideModalBtn?.addEventListener('click', () => this.closeGuideModal());
    this.startTourBtn?.addEventListener('click', () => this.closeGuideModal());

    // 1:1 배틀 분석 버튼
    this.compareBattleBtn?.addEventListener('click', () => {
      this.runBattleComparison();
    });

    // 테마 토글
    this.themeToggleBtn?.addEventListener('click', () => {
      const current = window.appState.getState().theme;
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      this.applyTheme(nextTheme);
    });

    // 모바일 사이드바
    this.mobileMenuBtn?.addEventListener('click', () => {
      this.sidebar.classList.toggle('open');
    });

    // 화면 밖 클릭 시 모바일 사이드바 닫기
    document.addEventListener('click', (e) => {
      if (
        window.innerWidth <= 900 &&
        this.sidebar.classList.contains('open') &&
        !this.sidebar.contains(e.target) &&
        !this.mobileMenuBtn.contains(e.target)
      ) {
        this.sidebar.classList.remove('open');
      }
    });
  }

  // [신규] 정밀 타임프레임 적용
  async applyTimeframe(days) {
    const validDays = Math.min(1390, Math.max(7, days || 1390));
    this.selectedDays = validDays >= 1390 ? null : validDays;

    if (this.timeframeSlider) this.timeframeSlider.value = validDays;
    if (this.customDaysInput) this.customDaysInput.value = validDays;
    if (this.timeframeSliderBadge) {
      this.timeframeSliderBadge.textContent = validDays >= 1390
        ? '전체 4개년 (1,390일 전수 분석)'
        : `최근 ${validDays}일간 정밀 분석`;
    }

    this.periodButtons.forEach((btn) => {
      const bDays = btn.dataset.days;
      if ((bDays === 'all' && validDays >= 1390) || parseInt(bDays, 10) === validDays) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    await this.refreshAllData(this.selectedDays);
  }

  // [신규] 음원 업로드 & Librosa 오디오 분석
  async handleAudioUpload(file) {
    if (!file) return;

    if (this.dropzonePrompt) this.dropzonePrompt.classList.add('hidden');
    if (this.dropzoneResult) this.dropzoneResult.classList.add('hidden');
    if (this.audioLoadingIndicator) this.audioLoadingIndicator.classList.remove('hidden');

    // 1. 브라우저 로컬 오디오 재생 URL 준비
    if (this.currentAudioUrl) URL.revokeObjectURL(this.currentAudioUrl);
    this.currentAudioUrl = URL.createObjectURL(file);
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
    }
    this.currentAudioElement = new Audio(this.currentAudioUrl);
    this.currentAudioElement.addEventListener('ended', () => {
      if (this.miniPlayAudioBtn) this.miniPlayAudioBtn.innerHTML = '<span class="play-icon">▶</span>';
      cancelAnimationFrame(this._animFrame);
      this.renderWaveformBars(0);
    });

    // 2. Web Audio API로 로컬 웨이브폼 렌더링
    try {
      const arrayBuffer = await file.arrayBuffer();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
        this.drawWaveform(audioBuffer);
      }
    } catch (e) {
      console.warn('[Web Audio Waveform Error]:', e);
    }

    // 3. 백엔드 Librosa 정량 분석 + AI 정성 평가 호출
    try {
      const data = await window.ApiClient.analyzeAudio(file);

      // 폼 자동 채움
      if (this.simTitleInput) this.simTitleInput.value = data.track_title;
      if (this.simBpmRange) {
        this.simBpmRange.value = data.bpm;
        if (this.bpmDisplay) this.bpmDisplay.textContent = `${data.bpm} BPM`;
      }
      if (this.simGenreSelect) {
        this.simGenreSelect.value = data.detected_genre;
      }

      // 결과 패널 업데이트
      if (this.analyzedTrackName) this.analyzedTrackName.textContent = data.filename;
      if (this.analyzedMeta) {
        this.analyzedMeta.textContent = `BPM: ${data.bpm} | 에너지: ${data.energy} | 음색: ${data.brightness}Hz | 장르: ${data.detected_genre}`;
      }
      if (this.aiQualitativeText) {
        this.aiQualitativeText.textContent = data.qualitative_ai_advice;
      }

      if (this.audioLoadingIndicator) this.audioLoadingIndicator.classList.add('hidden');
      if (this.dropzoneResult) this.dropzoneResult.classList.remove('hidden');

      // [자동 연동] 음원 분석 완료 즉시 실제 오디오 스펙(BPM, 장르) 기반 시뮬레이션 자동 가동
      await this.runSimulation();
    } catch (err) {
      console.error('[Audio Analysis Failed]:', err);
      alert('음원 분석 실패: ' + (err.message || '오디오 파일을 읽을 수 없습니다.'));
      this.resetAudioUpload();
    }
  }

  // 고해상도(Retina) 스튜디오 사운드 웨이브폼 드로잉
  drawWaveform(audioBuffer) {
    if (!this.audioWaveformCanvas) return;
    const canvas = this.audioWaveformCanvas;
    const ctx = canvas.getContext('2d');

    // 1. 디바이스 픽셀 비율(DPR) 적용으로 뭉개짐(Blur) 완벽 제거
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.offsetWidth || 500;
    const cssHeight = 44;
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // DPR 스케일링

    // 2. 고밀도 막대 계산 (2.4px 폭, 1.6px 간격 -> 약 120~130개 정밀 막대)
    const barWidth = 2.4;
    const barGap = 1.6;
    const step = barWidth + barGap;
    const samples = Math.max(40, Math.floor(cssWidth / step));

    // 3. RMS 에너지 & 비선형 음향 파워 커브 적용 (다이내믹스 강조)
    const rawData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(rawData.length / samples);
    const rmsData = [];

    for (let i = 0; i < samples; i++) {
      let blockStart = blockSize * i;
      let sumSq = 0;
      for (let j = 0; j < blockSize; j++) {
        const v = rawData[blockStart + j] || 0;
        sumSq += v * v;
      }
      rmsData.push(Math.sqrt(sumSq / blockSize));
    }

    const maxRms = Math.max(...rmsData) || 0.01;
    // 비선형 청각 파워 커브(0.65)로 조용한 구간도 납작한 대시가 아닌 슬림한 세로 막대로 미려하게 유지
    this.waveformBars = rmsData.map((v) => Math.pow(v / maxRms, 0.65));

    this.renderWaveformBars(0);

    // 클릭 시 해당 지점으로 오디오 탐색(Seek) 지원
    if (!this._waveformSeekBound) {
      canvas.addEventListener('click', (e) => {
        if (!this.currentAudioElement || !this.currentAudioElement.duration) return;
        const rect = canvas.getBoundingClientRect();
        const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this.currentAudioElement.currentTime = clickRatio * this.currentAudioElement.duration;
        this.renderWaveformBars(clickRatio);
      });
      this._waveformSeekBound = true;
    }
  }

  // 재생 진행률(progress: 0.0 ~ 1.0)에 따른 실시간 파형 렌더링
  renderWaveformBars(progressRatio = 0) {
    if (!this.audioWaveformCanvas || !this.waveformBars) return;
    const canvas = this.audioWaveformCanvas;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;

    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const barWidth = 2.4;
    const barGap = 1.6;
    const step = barWidth + barGap;
    const samples = this.waveformBars.length;
    const currentSampleIndex = Math.floor(progressRatio * samples);

    // 활성(재생된) 구간 그라데이션
    const activeGrad = ctx.createLinearGradient(0, 0, 0, cssHeight);
    if (isLight) {
      activeGrad.addColorStop(0, '#0284C7');   // Sky Cyan
      activeGrad.addColorStop(0.5, '#059669'); // Spotify Emerald
      activeGrad.addColorStop(1, '#0284C7');
    } else {
      activeGrad.addColorStop(0, '#38BDF8');   // Electric Sky
      activeGrad.addColorStop(0.5, '#00F59B'); // Neon Mint
      activeGrad.addColorStop(1, '#C084FC');   // Lavender Violet
    }

    // 미재생(대기) 구간 색상
    const inactiveColor = isLight ? 'rgba(5, 150, 105, 0.22)' : 'rgba(0, 245, 155, 0.22)';

    for (let i = 0; i < samples; i++) {
      const val = this.waveformBars[i];
      // 최소 4px, 최대 38px로 세로 비례 유지 (절대 가로 막대나 점으로 뭉개지지 않음)
      const barHeight = Math.max(4, val * (cssHeight - 6));
      const x = i * step;
      const y = (cssHeight - barHeight) / 2;

      ctx.fillStyle = i <= currentSampleIndex ? activeGrad : inactiveColor;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, barWidth, barHeight, 1.5);
      } else {
        ctx.rect(x, y, barWidth, barHeight);
      }
      ctx.fill();
    }

    // 재생 헤드(Playhead 커서 라인)
    if (progressRatio > 0 && progressRatio < 1) {
      const playheadX = progressRatio * cssWidth;
      ctx.fillStyle = isLight ? '#0F172A' : '#FFFFFF';
      ctx.shadowColor = isLight ? 'rgba(0,0,0,0.3)' : '#00F59B';
      ctx.shadowBlur = 4;
      ctx.fillRect(playheadX - 1, 2, 2, cssHeight - 4);
      ctx.shadowBlur = 0;
    }
  }

  toggleAudioPlayback() {
    if (!this.currentAudioElement) return;
    if (this.currentAudioElement.paused) {
      this.currentAudioElement.play();
      if (this.miniPlayAudioBtn) this.miniPlayAudioBtn.innerHTML = '<span class="play-icon">❚❚</span>';
      this.startPlaybackLoop();
    } else {
      this.currentAudioElement.pause();
      if (this.miniPlayAudioBtn) this.miniPlayAudioBtn.innerHTML = '<span class="play-icon">▶</span>';
      cancelAnimationFrame(this._animFrame);
    }
  }

  startPlaybackLoop() {
    const update = () => {
      if (this.currentAudioElement && !this.currentAudioElement.paused && this.currentAudioElement.duration) {
        const ratio = this.currentAudioElement.currentTime / this.currentAudioElement.duration;
        this.renderWaveformBars(ratio);
        this._animFrame = requestAnimationFrame(update);
      }
    };
    this._animFrame = requestAnimationFrame(update);
  }

  resetAudioUpload() {
    cancelAnimationFrame(this._animFrame);
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }
    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }
    this.waveformBars = null;
    if (this.audioFileInput) this.audioFileInput.value = '';
    if (this.dropzoneResult) this.dropzoneResult.classList.add('hidden');
    if (this.audioLoadingIndicator) this.audioLoadingIndicator.classList.add('hidden');
    if (this.dropzonePrompt) this.dropzonePrompt.classList.remove('hidden');
    if (this.miniPlayAudioBtn) this.miniPlayAudioBtn.innerHTML = '<span class="play-icon">▶</span>';
    if (this.simEmptyState) this.simEmptyState.classList.remove('hidden');
    if (this.simResults) this.simResults.classList.add('hidden');
  }

  openGuideModal() {
    if (this.guideModal) this.guideModal.classList.remove('hidden');
  }

  closeGuideModal() {
    if (this.guideModal) this.guideModal.classList.add('hidden');
  }

  async runSimulation() {
    if (!this.simGenreSelect || !this.simBpmRange || !this.simMonthSelect) return;
    const title = this.simTitleInput ? this.simTitleInput.value : '신곡 프로젝트';
    const genre = this.simGenreSelect.value;
    const bpm = parseFloat(this.simBpmRange.value);
    const month = parseInt(this.simMonthSelect.value, 10);

    try {
      const res = await window.ApiClient.simulateComeback(title, genre, bpm, month);
      const b = res.benchmark_track;

      if (this.simMatchScore) this.simMatchScore.textContent = `${b.similarity_score}% 일치`;
      if (this.simMatchSong) this.simMatchSong.textContent = b.song;
      if (this.simMatchMeta) {
        this.simMatchMeta.textContent = `Genre: ${b.genre} | BPM: ${b.bpm} | 과거 1위 독점: ${b.actual_streak_days}일간 (평균 ${b.actual_average_streams.toLocaleString()}만 회)`;
      }
      if (this.simExpectedStreak) this.simExpectedStreak.textContent = `약 ${res.expected_streak_days}일간`;
      if (this.simWinProb) this.simWinProb.textContent = `${res.win_probability}%`;
      if (this.simProbBar) this.simProbBar.style.width = `${res.win_probability}%`;
      if (this.simRiskBadge) this.simRiskBadge.textContent = res.season_risk;
      if (this.simHistAvg) this.simHistAvg.textContent = `${res.historical_month_average.toLocaleString()}만 회`;
      if (this.simDay) this.simDay.textContent = res.recommended_day;
      if (this.simAdviceText) this.simAdviceText.textContent = res.strategic_advice;

      // 시각디자인 특화: 앨범 무드 컬러 팔레트 생성
      this.renderColorPalette(genre, b.mood);

      // [신규] 대기 상태 숨김 및 실제 시뮬레이션 결과 표시
      if (this.simEmptyState) this.simEmptyState.classList.add('hidden');
      if (this.simResults) {
        this.simResults.classList.remove('hidden');
      }
    } catch (err) {
      console.error('[Simulation Error]:', err);
    }
  }

  renderColorPalette(genre, moodText) {
    if (!this.paletteSwatches) return;

    const palettes = {
      'Pop Punk': ['#FF2E93', '#00F0FF', '#18181B', '#FACC15', '#9333EA'],
      'Nu-Disco / Pop': ['#00F59B', '#F59E0B', '#06B6D4', '#EC4899', '#F8FAFC'],
      'UK Garage / Pop': ['#6366F1', '#10B981', '#0F172A', '#C7D2FE', '#F43F5E'],
      'Synth-Pop': ['#8B5CF6', '#38BDF8', '#1E1B4B', '#F472B6', '#4ADE80'],
      'Alt-R&B / Soul': ['#64748B', '#818CF8', '#991B1B', '#1E293B', '#CBD5E1'],
      'Bedroom Pop': ['#F472B6', '#A78BFA', '#FEF08A', '#E2E8F0', '#334155'],
      'Reggaeton / Latin': ['#EA580C', '#EAB308', '#14B8A6', '#881337', '#FEF9C3'],
      'Pop-Rap': ['#F59E0B', '#3B82F6', '#18181B', '#E2E8F0', '#DC2626'],
      'Holiday Pop': ['#DC2626', '#16A34A', '#FBBF24', '#FEF3C7', '#1E293B'],
    };

    const colors = palettes[genre] || ['#00F59B', '#8B5CF6', '#38BDF8', '#F59E0B', '#F8FAFC'];

    if (this.paletteMoodLabel) {
      this.paletteMoodLabel.textContent = `Mood: ${moodText || genre}`;
    }

    this.paletteSwatches.innerHTML = colors
      .map(
        (hex) => `
        <div class="color-swatch-item" data-hex="${hex}" title="클릭하여 HEX 복사">
          <div class="swatch-box" style="background-color: ${hex};"></div>
          <span class="swatch-hex">${hex}</span>
        </div>
      `
      )
      .join('');

    // 클릭 시 클립보드 복사
    this.paletteSwatches.querySelectorAll('.color-swatch-item').forEach((item) => {
      item.addEventListener('click', () => {
        const hex = item.dataset.hex;
        navigator.clipboard?.writeText(hex);
        const originalHex = item.querySelector('.swatch-hex').textContent;
        item.querySelector('.swatch-hex').textContent = '복사됨!';
        setTimeout(() => {
          item.querySelector('.swatch-hex').textContent = originalHex;
        }, 1200);
      });
    });
  }

  runBattleComparison() {
    if (!this.trackSelectA || !this.trackSelectB) return;
    const songA = this.trackSelectA.value;
    const songB = this.trackSelectB.value;
    const allItems = window.appState.getState().dataItems || [];

    const statsA = this.calculateTrackStats(songA, allItems);
    const statsB = this.calculateTrackStats(songB, allItems);

    if (this.battleTitleA) this.battleTitleA.textContent = songA;
    if (this.battleGenreA) this.battleGenreA.textContent = `${statsA.genre} | ${statsA.bpm} BPM`;
    if (this.battleDaysA) this.battleDaysA.textContent = `${statsA.days}일`;
    if (this.battleAvgA) this.battleAvgA.textContent = `${statsA.avg.toLocaleString()}만 회`;
    if (this.battlePeakA) this.battlePeakA.textContent = `${statsA.peak.toLocaleString()}만 회`;
    if (this.battleLabelA) this.battleLabelA.textContent = statsA.label;

    if (this.battleTitleB) this.battleTitleB.textContent = songB;
    if (this.battleGenreB) this.battleGenreB.textContent = `${statsB.genre} | ${statsB.bpm} BPM`;
    if (this.battleDaysB) this.battleDaysB.textContent = `${statsB.days}일`;
    if (this.battleAvgB) this.battleAvgB.textContent = `${statsB.avg.toLocaleString()}만 회`;
    if (this.battlePeakB) this.battlePeakB.textContent = `${statsB.peak.toLocaleString()}만 회`;
    if (this.battleLabelB) this.battleLabelB.textContent = statsB.label;

    // 배틀 판정 텍스트
    let winner = statsA.days >= statsB.days ? songA : songB;
    let loser = statsA.days >= statsB.days ? songB : songA;
    let winDays = Math.max(statsA.days, statsB.days);
    let loseDays = Math.min(statsA.days, statsB.days);

    if (this.battleVerdictText) {
      this.battleVerdictText.innerHTML = `
        <strong>🏆 1위 독점력 승자: ${winner}</strong><br>
        • <strong>${winner}</strong>는 총 <strong>${winDays}일간</strong> 1위를 장기 독점하며, ${loser}(${loseDays}일) 대비 더 강력한 롱런 유지력을 입증했습니다.<br>
        • 일일 평균 화력: <strong>${songA} (${statsA.avg.toLocaleString()}만 회)</strong> vs <strong>${songB} (${statsB.avg.toLocaleString()}만 회)</strong>
      `;
    }

    // [신규] 대기 상태 숨김 및 배틀 결과 표시
    if (this.battleEmptyState) this.battleEmptyState.classList.add('hidden');
    if (this.battleResults) this.battleResults.classList.remove('hidden');
    if (this.battleVerdict) this.battleVerdict.classList.remove('hidden');
  }

  calculateTrackStats(songName, items) {
    const trackItems = items.filter((it) => it.memo.includes(songName));
    if (trackItems.length === 0) {
      return { days: 0, avg: 0, peak: 0, genre: 'Pop', bpm: 120, label: 'Universal' };
    }

    const vals = trackItems.map((it) => floatVal(it.value));
    const avg = roundNum(vals.reduce((a, b) => a + b, 0) / vals.length, 1);
    const peak = Math.max(...vals);

    // memo 메타데이터 파싱
    const sampleMemo = trackItems[0].memo;
    let genre = 'Pop';
    let bpm = 120;
    let label = 'Major';

    sampleMemo.split('|').forEach((p) => {
      const part = p.trim();
      if (part.startsWith('Genre:')) genre = part.replace('Genre:', '').trim();
      if (part.startsWith('BPM:')) bpm = part.replace('BPM:', '').trim();
      if (part.startsWith('Label:')) label = part.replace('Label:', '').trim();
    });

    return { days: trackItems.length, avg, peak, genre, bpm, label };

    function floatVal(v) { return parseFloat(v) || 0; }
    function roundNum(n, d) { return Math.round(n * Math.pow(10, d)) / Math.pow(10, d); }
  }

  async downloadExecutiveReport() {
    try {
      const reportText = await window.ApiClient.getExecutiveReport();
      const blob = new Blob([reportText], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SoundPulse_A&R_Executive_Report_${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`보고서 다운로드 실패: ${err.message}`);
    }
  }

  switchTab(tabId) {
    this.tabButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    this.tabPanes.forEach((pane) => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });
    window.appState.setState({ currentTab: tabId });

    // 차트 탭으로 돌아왔을 때 리사이즈 보정
    if (tabId === 'dashboard') {
      setTimeout(() => {
        const state = window.appState.getState();
        window.chartManager.render(state.dataItems, state.theme);
      }, 50);
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('soundpulse_theme', theme);
    window.appState.setState({ theme });

    // 테마 변경 시 차트 즉시 재렌더링 (다크/라이트 모드별 축, 그리드, 라인 대비 보정)
    const state = window.appState.getState();
    if (state.dataItems && state.dataItems.length > 0 && window.chartManager) {
      window.chartManager.render(state.dataItems, theme);
    }
  }

  // Render 무료 플랜 콜드스타트 완화 안내 로직 (questions.md 항목 4-1 대응)
  async connectWithColdStartHandling() {
    let attempts = 0;
    const maxAttempts = 15;
    let coldStartTimer = null;

    // 2.5초 이상 응답이 없으면 콜드스타트 모달 띄우기
    coldStartTimer = setTimeout(() => {
      if (this.coldStartModal) {
        this.coldStartModal.classList.remove('hidden');
        this.animateProgressBar();
      }
    }, 2500);

    while (attempts < maxAttempts) {
      try {
        const health = await window.ApiClient.checkHealth();
        clearTimeout(coldStartTimer);
        if (this.coldStartModal) this.coldStartModal.classList.add('hidden');

        // 상태 업데이트
        this.systemStatusDot?.classList.add('online');
        if (this.systemStatusText) {
          this.systemStatusText.textContent = `연결됨 (${health.records_count}개 데이터)`;
        }
        window.appState.setState({ isServerReady: true });
        return;
      } catch (err) {
        attempts++;
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    clearTimeout(coldStartTimer);
    if (this.systemStatusText) {
      this.systemStatusText.textContent = '서버 응답 지연 (오프라인 모드)';
    }
  }

  animateProgressBar() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      if (this.coldStartProgress) {
        this.coldStartProgress.style.width = `${Math.min(progress, 95)}%`;
      }
      if (progress >= 100 || !this.coldStartModal || this.coldStartModal.classList.contains('hidden')) {
        clearInterval(interval);
      }
    }, 600);
  }

  // 전체 데이터 갱신 (요약, 통계, 목록 - 기간 필터 지원)
  async refreshAllData(days = null) {
    try {
      const [summary, stats, dataList] = await Promise.all([
        window.ApiClient.getSummary(days),
        window.ApiClient.getStatistics(days),
        window.ApiClient.getAllData('desc', days ? days : null),
      ]);

      window.appState.setState({
        summary,
        stats,
        dataItems: dataList,
        filteredItems: dataList,
      });

      this.updateSummaryCards(summary, stats);
    } catch (err) {
      console.error('[AppManager] refreshAllData failed:', err);
    }
  }

  // 대화 목록 갱신
  async refreshConversations() {
    try {
      const convs = await window.ApiClient.getAllConversations();
      window.appState.setState({ conversations: convs });
    } catch (err) {
      console.error('[AppManager] refreshConversations failed:', err);
    }
  }

  updateSummaryCards(summary, stats) {
    if (!summary || !summary.metrics) return;
    const m = summary.metrics;

    if (this.metricCount) this.metricCount.textContent = Number(summary.count).toLocaleString();
    if (this.metricPeriod) this.metricPeriod.textContent = `집계 기간: ${summary.period}`;
    if (this.metricAverage) this.metricAverage.textContent = m.average.toLocaleString();
    if (this.metricTrend) this.metricTrend.textContent = summary.trend || '초강세 성장';

    if (stats) {
      if (this.metricHurdle) {
        this.metricHurdle.textContent = `상위 25% 초안전권: 일 ${stats.benchmark_hurdle.toLocaleString()}만 회 이상`;
      }
      if (this.metricBpm) {
        this.metricBpm.textContent = stats.average_bpm;
      }
      if (this.metricGenreTop && stats.top_genres && stats.top_genres.length > 0) {
        const topG = stats.top_genres[0];
        this.metricGenreTop.textContent = `주요 장르: ${topG.genre} (${topG.share_pct}% 점유)`;
      }
      if (this.metricYoy && stats.yoy_growth !== undefined) {
        this.metricYoy.textContent = `+${stats.yoy_growth}%`;
      }
      if (this.longestStreakPill) {
        this.longestStreakPill.textContent = `🔥 최장 1위: ${stats.longest_streak_track}`;
      }
    }
  }

  // Web Audio 기반 인터랙티브 메트로놈 (BPM 비트 펄스 청취 기능)
  initMetronome() {
    this.audioCtx = null;
    this.metronomeInterval = null;
    this.isPlayingMetronome = false;

    this.bpmAudioBtn?.addEventListener('click', () => {
      this.toggleMetronome();
    });

    this.simBpmRange?.addEventListener('input', () => {
      if (this.isPlayingMetronome) {
        this.restartMetronome();
      }
    });
  }

  toggleMetronome() {
    if (this.isPlayingMetronome) {
      this.stopMetronome();
    } else {
      this.startMetronome();
    }
  }

  startMetronome() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.isPlayingMetronome = true;
      if (this.bpmAudioBtn) {
        this.bpmAudioBtn.classList.add('playing');
        const lbl = this.bpmAudioBtn.querySelector('.audio-btn-label');
        if (lbl) lbl.textContent = '비트 정지';
        const icon = this.bpmAudioBtn.querySelector('.audio-play-icon');
        if (icon) icon.textContent = '■';
      }

      this.playBeatTick();
      const bpm = parseFloat(this.simBpmRange?.value || 125);
      const intervalMs = (60 / bpm) * 1000;
      this.metronomeInterval = setInterval(() => {
        this.playBeatTick();
      }, intervalMs);
    } catch (e) {
      console.warn('Web Audio error:', e);
    }
  }

  restartMetronome() {
    if (this.metronomeInterval) clearInterval(this.metronomeInterval);
    const bpm = parseFloat(this.simBpmRange?.value || 125);
    const intervalMs = (60 / bpm) * 1000;
    this.metronomeInterval = setInterval(() => {
      this.playBeatTick();
    }, intervalMs);
  }

  stopMetronome() {
    this.isPlayingMetronome = false;
    if (this.metronomeInterval) clearInterval(this.metronomeInterval);
    this.metronomeInterval = null;
    if (this.bpmAudioBtn) {
      this.bpmAudioBtn.classList.remove('playing');
      const lbl = this.bpmAudioBtn.querySelector('.audio-btn-label');
      if (lbl) lbl.textContent = '비트 청취';
      const icon = this.bpmAudioBtn.querySelector('.audio-play-icon');
      if (icon) icon.textContent = '▶';
    }
  }

  playBeatTick() {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(640, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, this.audioCtx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.28, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.05);
    } catch (e) {
      // safe fallback
    }
  }
}

window.appManager = new AppManager();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.appManager.start();
  });
} else {
  // DOM이 이미 로드되었으면(캐시 로드/비동기 로드 등) 즉시 실행하여 무한 대기 방지
  window.appManager.start();
}

