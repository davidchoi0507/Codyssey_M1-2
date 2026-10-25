/**
 * SoundPulse AI - State Management Module
 * (questions.md 항목 2: 단방향 상태 흐름 아키텍처)
 */

class AppState {
  constructor() {
    this.state = {
      theme: localStorage.getItem('soundpulse_theme') || 'dark',
      currentTab: 'dashboard',
      summary: null,
      stats: null,
      dataItems: [],
      filteredItems: [],
      conversations: [],
      currentConversationId: null,
      currentMessages: [],
      isChatLoading: false,
      isServerReady: false,
    };
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  setState(updates) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...updates };
    this.notify(prevState);
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify(prevState) {
    for (const listener of this.listeners) {
      try {
        listener(this.state, prevState);
      } catch (err) {
        console.error('[AppState] Listener error:', err);
      }
    }
  }
}

window.appState = new AppState();

