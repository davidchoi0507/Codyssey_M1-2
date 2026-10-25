/**
 * SoundPulse AI - Chat & Conversation History Module
 */

class ChatManager {
  constructor() {
    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.chatMessagesContainer = document.getElementById('chatMessages');
    this.chatStarterContainer = document.getElementById('chatStarterContainer');
    this.chatForm = document.getElementById('chatForm');
    this.chatInput = document.getElementById('chatInput');
    this.chatLoading = document.getElementById('chatLoading');
    this.conversationsList = document.getElementById('conversationsList');
    this.newChatBtn = document.getElementById('newChatBtn');

    // [신규] 듀얼 API Key 상태 인디케이터 & 모달 엘리먼트
    this.apiKeyStatusBtn = document.getElementById('apiKeyStatusBtn');
    this.apiStatusLight = document.getElementById('apiStatusLight');
    this.apiStatusText = document.getElementById('apiStatusText');
    this.apiKeyModal = document.getElementById('apiKeyModal');
    this.closeApiKeyModalBtn = document.getElementById('closeApiKeyModalBtn');
    this.clearApiKeyBtn = document.getElementById('clearApiKeyBtn');
    this.modalApiBadge = document.getElementById('modalApiBadge');
    this.modalStatusBanner = document.getElementById('modalStatusBanner');
    this.modalStatusLight = document.getElementById('modalStatusLight');
    this.modalStatusHeading = document.getElementById('modalStatusHeading');
    this.modalStatusDesc = document.getElementById('modalStatusDesc');

    // 개별 제공자 (Gemini & Anthropic & OpenAI) 엘리먼트
    this.modalGeminiKeyInput = document.getElementById('modalGeminiKeyInput');
    this.saveGeminiKeyBtn = document.getElementById('saveGeminiKeyBtn');
    this.clearGeminiKeyBtn = document.getElementById('clearGeminiKeyBtn');
    this.geminiStatusBadge = document.getElementById('geminiStatusBadge');

    this.modalAnthropicKeyInput = document.getElementById('modalAnthropicKeyInput');
    this.saveAnthropicKeyBtn = document.getElementById('saveAnthropicKeyBtn');
    this.clearAnthropicKeyBtn = document.getElementById('clearAnthropicKeyBtn');
    this.anthropicStatusBadge = document.getElementById('anthropicStatusBadge');

    this.modalOpenaiKeyInput = document.getElementById('modalOpenaiKeyInput');
    this.saveOpenaiKeyBtn = document.getElementById('saveOpenaiKeyBtn');
    this.clearOpenaiKeyBtn = document.getElementById('clearOpenaiKeyBtn');
    this.openaiStatusBadge = document.getElementById('openaiStatusBadge');

    // [신규] 백엔드 서버 URL 설정 엘리먼트
    this.modalBackendUrlInput = document.getElementById('modalBackendUrlInput');
    this.saveBackendUrlBtn = document.getElementById('saveBackendUrlBtn');
    this.backendUrlStatusBadge = document.getElementById('backendUrlStatusBadge');
    this.backendUrlBadgeText = document.getElementById('backendUrlBadgeText');

    this.pendingUserQuery = null;
    this._toastTimer = null;
  }

  init() {
    this.refreshApiStatus();

    window.appState.subscribe((state, prevState) => {
      // 대화 목록 갱신
      if (
        state.conversations !== prevState.conversations ||
        state.currentConversationId !== prevState.currentConversationId
      ) {
        this.renderConversationsList(state.conversations, state.currentConversationId);
      }

      // 메시지 목록 갱신
      if (state.currentMessages !== prevState.currentMessages) {
        this.renderMessages(state.currentMessages);
      }

      // 로딩 상태 제어
      if (state.isChatLoading !== prevState.isChatLoading) {
        if (state.isChatLoading) {
          this.chatLoading.classList.remove('hidden');
        } else {
          this.chatLoading.classList.add('hidden');
        }
        this.scrollToBottom();
      }
    });
  }

  bindEvents() {
    // 폼 제출
    this.chatForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = this.chatInput.value.trim();
      if (!text || window.appState.getState().isChatLoading) return;
      this.chatInput.value = '';
      await this.sendMessage(text);
    });

    // 새 대화 시작 버튼
    this.newChatBtn?.addEventListener('click', () => {
      this.startNewChat();
    });

    // 스타터 추천 질문 카드 클릭 (이벤트 위임 방식으로 영구 보장)
    this.chatMessagesContainer?.addEventListener('click', (e) => {
      const card = e.target.closest('.starter-card');
      if (card) {
        const prompt = card.dataset.prompt;
        if (prompt && !window.appState.getState().isChatLoading) {
          this.sendMessage(prompt);
        }
      }
    });

    // 빠른 추천 질문 칩 클릭
    document.querySelectorAll('.quick-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt;
        if (prompt && !window.appState.getState().isChatLoading) {
          this.sendMessage(prompt);
        }
      });
    });

    // [신규] 상단 헤더 AI Key 상태 버튼 클릭 시 모달 열기
    this.apiKeyStatusBtn?.addEventListener('click', () => {
      this.showApiKeyModal();
    });

    // [신규] API Key 모달 닫기
    this.closeApiKeyModalBtn?.addEventListener('click', () => {
      this.closeApiKeyModal();
    });

    // [신규] 전체 API Key 연결 해제 버튼
    this.clearApiKeyBtn?.addEventListener('click', async () => {
      await this.handleClearApiKey();
    });

    // [신규] Gemini 키 단독 저장
    this.saveGeminiKeyBtn?.addEventListener('click', async () => {
      const key = this.modalGeminiKeyInput?.value.trim();
      if (!key) {
        alert('Google Gemini API Key를 입력해 주세요.');
        return;
      }
      try {
        const res = await window.ApiClient.setApiKey({ gemini_key: key });
        this.showToast('🟢 ' + (res.message || 'Gemini 키가 적용되었습니다.'));
        if (this.modalGeminiKeyInput) this.modalGeminiKeyInput.value = '';
        await this.refreshApiStatus();
        if (this.pendingUserQuery) {
          const query = this.pendingUserQuery;
          this.pendingUserQuery = null;
          this.closeApiKeyModal();
          await this.sendMessage(query);
        }
      } catch (err) {
        alert('Gemini Key 저장 실패: ' + err.message);
      }
    });

    // [신규] Gemini 키 단독 해제
    this.clearGeminiKeyBtn?.addEventListener('click', async () => {
      if (!confirm('등록된 Google Gemini API Key를 해제하시겠습니까?')) return;
      try {
        await window.ApiClient.clearApiKey('gemini');
        this.showToast('ℹ️ Gemini API Key가 해제되었습니다.');
        await this.refreshApiStatus();
      } catch (err) {
        alert('해제 실패: ' + err.message);
      }
    });

    // [신규] Anthropic 키 단독 저장
    this.saveAnthropicKeyBtn?.addEventListener('click', async () => {
      const key = this.modalAnthropicKeyInput?.value.trim();
      if (!key) {
        alert('Anthropic(Claude) API Key를 입력해 주세요.');
        return;
      }
      try {
        const res = await window.ApiClient.setApiKey({ anthropic_key: key });
        this.showToast('🟢 ' + (res.message || 'Anthropic 키가 적용되었습니다.'));
        if (this.modalAnthropicKeyInput) this.modalAnthropicKeyInput.value = '';
        await this.refreshApiStatus();
        if (this.pendingUserQuery) {
          const query = this.pendingUserQuery;
          this.pendingUserQuery = null;
          this.closeApiKeyModal();
          await this.sendMessage(query);
        }
      } catch (err) {
        alert('Anthropic Key 저장 실패: ' + err.message);
      }
    });

    // [신규] Anthropic 키 단독 해제
    this.clearAnthropicKeyBtn?.addEventListener('click', async () => {
      if (!confirm('등록된 Anthropic API Key를 해제하시겠습니까?')) return;
      try {
        await window.ApiClient.clearApiKey('anthropic');
        this.showToast('ℹ️ Anthropic API Key가 해제되었습니다.');
        await this.refreshApiStatus();
      } catch (err) {
        alert('해제 실패: ' + err.message);
      }
    });

    // [신규] OpenAI 키 단독 저장
    this.saveOpenaiKeyBtn?.addEventListener('click', async () => {
      const key = this.modalOpenaiKeyInput?.value.trim();
      if (!key) {
        alert('OpenAI API Key를 입력해 주세요.');
        return;
      }
      try {
        const res = await window.ApiClient.setApiKey({ openai_key: key });
        this.showToast('🟢 ' + (res.message || 'OpenAI 키가 적용되었습니다.'));
        if (this.modalOpenaiKeyInput) this.modalOpenaiKeyInput.value = '';
        await this.refreshApiStatus();
        if (this.pendingUserQuery) {
          const query = this.pendingUserQuery;
          this.pendingUserQuery = null;
          this.closeApiKeyModal();
          await this.sendMessage(query);
        }
      } catch (err) {
        alert('OpenAI Key 저장 실패: ' + err.message);
      }
    });

    // [신규] OpenAI 키 단독 해제
    this.clearOpenaiKeyBtn?.addEventListener('click', async () => {
      if (!confirm('등록된 OpenAI API Key를 해제하시겠습니까?')) return;
      try {
        await window.ApiClient.clearApiKey('openai');
        this.showToast('ℹ️ OpenAI API Key가 해제되었습니다.');
        await this.refreshApiStatus();
      } catch (err) {
        alert('해제 실패: ' + err.message);
      }
    });

    // [신규] 백엔드 서버 URL 단독 저장
    this.saveBackendUrlBtn?.addEventListener('click', async () => {
      const url = this.modalBackendUrlInput?.value.trim();
      if (!url) {
        alert('백엔드 서버 URL을 입력해 주세요.');
        return;
      }
      window.ApiClient.setBaseUrl(url);
      this.showToast('🌐 백엔드 서버 URL이 업데이트되었습니다.');
      await this.refreshApiStatus();
      if (window.appManager) {
        await window.appManager.connectWithColdStartHandling();
        await window.appManager.refreshAllData();
      }
    });
  }

  async refreshApiStatus() {
    try {
      const status = await window.ApiClient.getApiStatus();
      const isConnected = !!status.has_api_key;
      const hasGemini = !!status.has_gemini;
      const hasAnthropic = !!status.has_anthropic;
      const hasOpenai = !!status.has_openai;

      // 1. 헤더 상단 버튼 UI 갱신 (초록 불 / 꺼진 불)
      if (this.apiKeyStatusBtn) {
        if (isConnected) {
          this.apiKeyStatusBtn.classList.add('connected');
          const count = (hasGemini ? 1 : 0) + (hasAnthropic ? 1 : 0) + (hasOpenai ? 1 : 0);
          const pLabel = count >= 3 ? 'Triple Core' : (count === 2 ? 'Dual Core' : (hasGemini ? 'Gemini 3.8' : (hasAnthropic ? 'Claude' : 'OpenAI')));
          if (this.apiStatusText) this.apiStatusText.textContent = `AI Active (${pLabel})`;
          this.apiKeyStatusBtn.title = `AI Core 가동 중 (${pLabel}) - 클릭하여 설정 변경`;
        } else {
          this.apiKeyStatusBtn.classList.remove('connected');
          if (this.apiStatusText) this.apiStatusText.textContent = 'AI Standby (키 등록)';
          this.apiKeyStatusBtn.title = 'AI API Key 미등록 상태 - 클릭하여 연결';
        }
      }

      // 2. 모달 내부 상태 배너 UI 갱신
      if (this.modalStatusLight) {
        this.modalStatusLight.classList.toggle('active', isConnected);
      }

      if (this.modalApiBadge) {
        this.modalApiBadge.classList.toggle('connected', isConnected);
        this.modalApiBadge.classList.toggle('standby', !isConnected);
        this.modalApiBadge.style.color = '';
        this.modalApiBadge.style.background = '';
        this.modalApiBadge.style.borderColor = '';
        const badgeText = document.getElementById('modalApiBadgeText');
        if (badgeText) {
          badgeText.textContent = isConnected ? 'AI 연결 완료' : 'AI 대기 모드';
        }
      }

      if (this.modalStatusHeading) {
        const count = (hasGemini ? 1 : 0) + (hasAnthropic ? 1 : 0) + (hasOpenai ? 1 : 0);
        if (count >= 3) {
          this.modalStatusHeading.textContent = '트리플 AI 엔진 동시 가동 중 (Gemini + Claude + OpenAI)';
        } else if (count === 2) {
          this.modalStatusHeading.textContent = '듀얼 AI 엔진 동시 가동 중';
        } else if (hasGemini) {
          this.modalStatusHeading.textContent = 'Google Gemini 3.8 Flash 엔진 가동 중';
        } else if (hasAnthropic) {
          this.modalStatusHeading.textContent = 'Anthropic Claude Sonnet 4 엔진 가동 중';
        } else if (hasOpenai) {
          this.modalStatusHeading.textContent = 'OpenAI GPT 엔진 가동 중';
        } else {
          this.modalStatusHeading.textContent = 'AI 대기 모드 (기본 통계 엔진 가동)';
        }
      }

      if (this.modalStatusDesc) {
        this.modalStatusDesc.textContent = isConnected
          ? `활성 모델: ${status.model_name} | 실시간 자연어 A&R 대화 및 음원 정성 평가가 활성화되었습니다.`
          : 'Gemini, Anthropic, OpenAI 키 중 하나만 등록하셔도 모든 AI 기능이 즉시 활성화됩니다.';
      }

      if (this.modalStatusBanner) {
        this.modalStatusBanner.classList.toggle('connected', isConnected);
        this.modalStatusBanner.style.background = '';
        this.modalStatusBanner.style.borderColor = '';
      }

      if (this.clearApiKeyBtn) {
        this.clearApiKeyBtn.classList.toggle('hidden', !isConnected);
      }

      // 3. 개별 공급자 카드 상태 뱃지 (Pill Capsule 형태 및 placeholder 동적 반영)
      const updateProviderBadge = (badgeEl, clearBtnEl, inputEl, hasKey, maskedKey, defaultPlaceholder) => {
        if (!badgeEl) return;
        badgeEl.classList.toggle('connected', hasKey);
        badgeEl.classList.toggle('disconnected', !hasKey);
        badgeEl.style.color = '';
        badgeEl.style.background = '';
        badgeEl.style.borderColor = '';

        if (hasKey) {
          badgeEl.innerHTML = `<span class="pill-indicator"></span><span class="badge-text">연결됨 (${maskedKey})</span>`;
          clearBtnEl?.classList.remove('hidden');
          if (inputEl) inputEl.placeholder = '등록 완료 (새 키 입력 시 덮어쓰기)';
        } else {
          badgeEl.innerHTML = `<span class="pill-indicator"></span><span class="badge-text">미등록</span>`;
          clearBtnEl?.classList.add('hidden');
          if (inputEl) inputEl.placeholder = defaultPlaceholder;
        }
      };

      updateProviderBadge(
        this.geminiStatusBadge,
        this.clearGeminiKeyBtn,
        this.modalGeminiKeyInput,
        hasGemini,
        status.gemini_masked,
        'AIzaSy... 또는 새 키 입력'
      );
      updateProviderBadge(
        this.anthropicStatusBadge,
        this.clearAnthropicKeyBtn,
        this.modalAnthropicKeyInput,
        hasAnthropic,
        status.anthropic_masked,
        'sk-ant-... 또는 코디세이 Virtual Key'
      );
      updateProviderBadge(
        this.openaiStatusBadge,
        this.clearOpenaiKeyBtn,
        this.modalOpenaiKeyInput,
        hasOpenai,
        status.openai_masked,
        'sk-proj-... 또는 sk-cody-...'
      );

      // 백엔드 서버 URL 설정 인풋 및 뱃지 상태 반영
      if (this.modalBackendUrlInput) {
        this.modalBackendUrlInput.value = window.ApiClient.getBaseUrl() || '';
      }
      if (this.backendUrlBadgeText) {
        const base = window.ApiClient.getBaseUrl();
        if (base) {
          this.backendUrlBadgeText.textContent = isConnected ? '연결됨' : '대기 중';
          this.backendUrlStatusBadge?.classList.toggle('connected', isConnected);
          this.backendUrlStatusBadge?.classList.toggle('disconnected', !isConnected);
        } else {
          this.backendUrlBadgeText.textContent = '미설정';
          this.backendUrlStatusBadge?.classList.remove('connected');
          this.backendUrlStatusBadge?.classList.add('disconnected');
        }
      }
    } catch (err) {
      console.warn('[refreshApiStatus Error]:', err);
    }
  }

  async handleClearApiKey() {
    if (!confirm('등록된 모든 API Key를 해제하시겠습니까? 해제 시 기본 통계 분석 모드로 전환됩니다.')) return;
    try {
      await window.ApiClient.clearApiKey();
      this.showToast('ℹ️ 모든 API Key 연결이 안전하게 해제되었습니다.');
      if (this.modalGeminiKeyInput) this.modalGeminiKeyInput.value = '';
      if (this.modalAnthropicKeyInput) this.modalAnthropicKeyInput.value = '';
      if (this.modalOpenaiKeyInput) this.modalOpenaiKeyInput.value = '';
      await this.refreshApiStatus();
      this.closeApiKeyModal();
    } catch (err) {
      alert('API Key 해제 실패: ' + err.message);
    }
  }

  showApiKeyModal() {
    if (this.apiKeyModal) this.apiKeyModal.classList.remove('hidden');
    if (this.modalGeminiKeyInput) this.modalGeminiKeyInput.focus();
  }

  closeApiKeyModal() {
    if (this.apiKeyModal) this.apiKeyModal.classList.add('hidden');
  }

  showToast(message, duration = 4000) {
    const toast = document.getElementById('toastNotification');
    const msgEl = document.getElementById('toastMessage');
    if (!toast || !msgEl) return;

    msgEl.textContent = message;
    toast.classList.remove('hidden');
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(14px)';
      setTimeout(() => toast.classList.add('hidden'), 300);
    }, duration);
  }

  startNewChat() {
    window.appState.setState({
      currentConversationId: null,
      currentMessages: [],
    });

    // 모바일인 경우 챗 탭으로 전환
    window.appManager?.switchTab('chat');
  }

  async sendMessage(userText) {
    const state = window.appState.getState();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 유저 메시지 즉시 화면에 반영
    const updatedMessages = [
      ...state.currentMessages,
      { role: 'user', content: userText, timestamp: nowTime },
    ];

    window.appState.setState({
      currentMessages: updatedMessages,
      isChatLoading: true,
    });

    try {
      const response = await window.ApiClient.sendChatMessage(
        userText,
        state.currentConversationId
      );

      // [핵심] API Key가 필요한 임의 질문인 경우: 사용자 메시지를 화면에 보존하고 안내 메시지 표시
      if (response && response.error === 'API_KEY_REQUIRED') {
        const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const apiKeyNotice = `⚠️ **실시간 생성을 위한 AI API Key 연결이 필요합니다.**\n\n현재 1,390일 차트 데이터 요약은 정상 주입되어 있으나, 자유로운 자연어 심층 분석 답변을 생성하기 위해서는 **Google Gemini API Key** (또는 OpenAI Key) 등록이 필요합니다.\n\n상단의 **[AI Key 연결]** 버튼 또는 화면의 안내창에서 키를 등록하시면 즉시 실시간 생성형 분석 답변을 받아보실 수 있습니다.`;

        window.appState.setState({
          currentMessages: [
            ...updatedMessages,
            { role: 'assistant', content: apiKeyNotice, timestamp: aiTime },
          ],
          isChatLoading: false,
        });

        this.pendingUserQuery = userText;
        this.showApiKeyModal();
        this.showToast('⚠️ 실시간 AI 대화를 위해 Gemini API Key 연결이 필요합니다.');
        return;
      }

      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // 유효한 응답일 때만 어시스턴트 메시지 반영 및 세션 저장
      window.appState.setState({
        currentConversationId: response.conversation_id,
        currentMessages: [
          ...updatedMessages,
          { role: 'assistant', content: response.response, timestamp: aiTime },
        ],
        isChatLoading: false,
      });

      // 사이드바 대화 목록 갱신
      await window.appManager.refreshConversations();
    } catch (err) {
      window.appState.setState({
        currentMessages: [
          ...updatedMessages,
          {
            role: 'assistant',
            content: `⚠️ 답변 생성 중 오류가 발생했습니다: ${err.message}`,
            timestamp: nowTime,
          },
        ],
        isChatLoading: false,
      });
    }
  }

  async loadConversation(convId) {
    try {
      const conv = await window.ApiClient.getConversationById(convId);
      window.appState.setState({
        currentConversationId: conv.id,
        currentMessages: conv.messages || [],
      });
      window.appManager?.switchTab('chat');
    } catch (err) {
      alert(`대화 불러오기 실패: ${err.message}`);
    }
  }

  async deleteConversation(convId, e) {
    e.stopPropagation();
    if (!confirm('이 대화 기록을 삭제하시겠습니까?')) return;
    try {
      await window.ApiClient.deleteConversation(convId);
      const state = window.appState.getState();
      if (state.currentConversationId === convId) {
        this.startNewChat();
      }
      await window.appManager.refreshConversations();
    } catch (err) {
      alert(`대화 삭제 실패: ${err.message}`);
    }
  }

  renderConversationsList(conversations, activeId) {
    if (!this.conversationsList) return;

    if (!conversations || conversations.length === 0) {
      this.conversationsList.innerHTML = `
        <div style="font-size: 0.78rem; color: var(--text-muted); padding: 8px 12px;">
          저장된 이전 대화가 없습니다.
        </div>
      `;
      return;
    }

    this.conversationsList.innerHTML = conversations
      .map((c) => {
        const isActive = c.id === activeId ? 'active' : '';
        return `
          <div class="conv-item ${isActive}" data-id="${c.id}">
            <span class="conv-title" title="${c.title}">${c.title}</span>
            <button class="conv-delete-btn" data-id="${c.id}" title="대화 삭제">&times;</button>
          </div>
        `;
      })
      .join('');

    // 이벤트 바인딩
    this.conversationsList.querySelectorAll('.conv-item').forEach((item) => {
      item.addEventListener('click', () => this.loadConversation(item.dataset.id));
    });

    this.conversationsList.querySelectorAll('.conv-delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => this.deleteConversation(btn.dataset.id, e));
    });
  }

  renderMessages(messages) {
    if (!this.chatMessagesContainer) return;

    if (!messages || messages.length === 0) {
      if (this.chatStarterContainer) {
        this.chatMessagesContainer.innerHTML = '';
        this.chatMessagesContainer.appendChild(this.chatStarterContainer);
        this.chatStarterContainer.style.display = 'flex';
      }
      return;
    }

    // 메시지 렌더링
    const messagesHtml = messages
      .map((m) => {
        const isUser = m.role === 'user';
        const formattedContent = this.formatMarkdown(m.content);
        return `
          <div class="message ${isUser ? 'user' : 'assistant'}">
            <div class="message-bubble">${formattedContent}</div>
            <span class="message-time">${m.timestamp || ''}</span>
          </div>
        `;
      })
      .join('');

    this.chatMessagesContainer.innerHTML = messagesHtml;
    this.scrollToBottom();
  }

  formatMarkdown(text) {
    if (!text) return '';
    let parsed = text
      // HTML escaping
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Bold **text**
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Bullet points
      .replace(/^[•\-\*]\s+(.*)$/gm, '<li>$1</li>')
      // Newlines to <br> or paragraphs
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // wrap list items in ul if any
    if (parsed.includes('<li>')) {
      parsed = parsed.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
    }

    return `<p>${parsed}</p>`;
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.chatMessagesContainer) {
        this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;
      }
    }, 50);
  }
}

window.chatManager = new ChatManager();

