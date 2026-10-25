/**
 * SoundPulse AI - API Client Module
 * 백엔드 REST API 통신 및 Render 콜드스타트 감지
 */

// 로컬 개발 및 클라우드 배포(Render/Vercel) 완전 대응 동적 Base URL 해석기
function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    // 1. window.API_BASE_URL (전역 주입 우선)
    if (window.API_BASE_URL && String(window.API_BASE_URL).trim()) {
      return String(window.API_BASE_URL).trim().replace(/\/+$/, '');
    }
    // 2. localStorage에 저장된 사용자 백엔드 URL
    const saved = localStorage.getItem('SOUNDPULSE_API_URL');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
    // 3. 로컬 호스트 환경 감지
    const h = window.location.hostname;
    if (!h || h === 'localhost' || h === '127.0.0.1' || window.location.protocol === 'file:') {
      return 'http://localhost:8000';
    }
  }
  return '';
}

class ApiClient {
  static getBaseUrl() {
    return getApiBaseUrl();
  }

  static setBaseUrl(url) {
    if (!url) return;
    const clean = String(url).trim().replace(/\/+$/, '');
    if (typeof window !== 'undefined') {
      localStorage.setItem('SOUNDPULSE_API_URL', clean);
      window.API_BASE_URL = clean;
    }
  }

  static async request(endpoint, options = {}, timeoutMs = 60000) {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    // 타임아웃 감지용 (LLM 대화 답변 생성 및 네트워크 대기 시간으로 60초 확보)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
    );

    try {
      const response = await Promise.race([fetch(url, config), timeoutPromise]);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP Error ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.warn(`[ApiClient] Request to ${url} failed:`, err.message);
      throw err;
    }
  }

  // 1. 상태 및 헬스체크 (콜드스타트 감지용)
  static async checkHealth() {
    return this.request('/health');
  }

  // 2. 시계열 데이터 요약 및 고급 통계 (기간 필터링 지원)
  static async getSummary(days = null) {
    const query = days ? `?days=${days}` : '';
    return this.request(`/api/data/summary${query}`);
  }

  static async getStatistics(days = null) {
    const query = days ? `?days=${days}` : '';
    return this.request(`/api/data/statistics${query}`);
  }

  // 2-b. 신규 Track-to-Track 곡 기반 벤치마크 시뮬레이터
  static async simulateComeback(trackTitle, genre, bpm, targetMonth) {
    return this.request('/api/data/simulate', {
      method: 'POST',
      body: JSON.stringify({
        track_title: trackTitle || '신곡 프로젝트',
        genre: genre,
        bpm: parseFloat(bpm),
        target_month: parseInt(targetMonth, 10),
      }),
    });
  }

  // 2-c. A&R 전략 보고서 원클릭 다운로드
  static async getExecutiveReport() {
    const url = `${API_BASE_URL}/api/data/report`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('보고서 생성 실패');
    return await res.text();
  }

  // 2-d. [신규] Librosa 정량 분석 + AI 정성 평가 음원 분석
  static async analyzeAudio(file) {
    const url = `${API_BASE_URL}/api/data/analyze-audio`;
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `음원 분석 실패 (HTTP ${response.status})`);
    }
    return await response.json();
  }

  // 3. 데이터 CRUD
  static async getAllData(order = 'desc', limit = null) {
    let query = `?order=${order}`;
    if (limit) query += `&limit=${limit}`;
    return this.request(`/api/data${query}`);
  }

  static async createData(item) {
    return this.request('/api/data', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  static async updateData(id, item) {
    return this.request(`/api/data/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  static async deleteData(id) {
    return this.request(`/api/data/${id}`, {
      method: 'DELETE',
    });
  }

  // 4. 대화 기록
  static async getAllConversations() {
    return this.request('/api/conversations');
  }

  static async getConversationById(id) {
    return this.request(`/api/conversations/${id}`);
  }

  static async deleteConversation(id) {
    return this.request(`/api/conversations/${id}`, {
      method: 'DELETE',
    });
  }

  // 5. AI 채팅 (심층 추론 및 컨텍스트 주입 생성을 위해 90초 넉넉한 타임아웃 제공)
  static async sendChatMessage(message, conversationId = null) {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
      }),
    }, 90000);
  }

  // 5-b. [신규] Gemini/OpenAI API Key 즉시 등록 (단일 또는 듀얼 지원)
  static async setApiKey(params, provider = 'gemini') {
    let payload = {};
    if (typeof params === 'object') {
      payload = params;
    } else {
      payload = { api_key: params, provider: provider };
    }
    return this.request('/api/chat/set-api-key', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // 5-c. [신규] API Key 연결 상태 조회
  static async getApiStatus() {
    return this.request('/api/chat/status');
  }

  // 5-d. [신규] API Key 연결 해제 (개별 또는 전체)
  static async clearApiKey(provider = null) {
    const query = provider ? `?provider=${provider}` : '';
    return this.request(`/api/chat/clear-api-key${query}`, {
      method: 'POST',
    });
  }
}

window.ApiClient = ApiClient;

