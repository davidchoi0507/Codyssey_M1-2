/**
 * SoundPulse AI - Data Management Module (CRUD & Export)
 */

class DataManager {
  constructor() {
    this.deleteTargetId = null;
    this.currentPage = 1;
    this.pageSize = 10;
    this.selectedYear = 'all';

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.tableBody = document.getElementById('dataTableBody');
    this.searchInput = document.getElementById('dataSearchInput');
    this.totalCountSpan = document.getElementById('tableTotalCount');
    this.filteredCountSpan = document.getElementById('tableFilteredCount');

    // 연도 필터 칩 & 페이지 크기
    this.yearChips = document.querySelectorAll('.year-chip');
    this.pageSizeSelect = document.getElementById('pageSizeSelect');

    // 페이지네이션 엘리먼트
    this.paginationContainer = document.getElementById('paginationContainer');
    this.prevPageBtn = document.getElementById('prevPageBtn');
    this.nextPageBtn = document.getElementById('nextPageBtn');
    this.pageNumbersContainer = document.getElementById('pageNumbers');

    // 모달 엘리먼트
    this.dataModal = document.getElementById('dataModal');
    this.modalTitle = document.getElementById('modalTitle');
    this.dataForm = document.getElementById('dataForm');
    this.editItemId = document.getElementById('editItemId');
    this.inputDate = document.getElementById('inputDate');
    this.inputValue = document.getElementById('inputValue');
    this.inputMemo = document.getElementById('inputMemo');

    this.deleteModal = document.getElementById('deleteConfirmModal');
    this.deleteDesc = document.getElementById('deleteTargetDesc');
  }

  init() {
    window.appState.subscribe((state, prevState) => {
      if (state.dataItems !== prevState.dataItems) {
        this.applyFilters();
      }
    });
  }

  bindEvents() {
    // 검색 필터링
    this.searchInput?.addEventListener('input', () => {
      this.currentPage = 1;
      this.applyFilters();
    });

    // 연도별 퀵 필터 칩
    this.yearChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        this.yearChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.selectedYear = chip.dataset.year;
        this.currentPage = 1;
        this.applyFilters();
      });
    });

    // 페이지 크기 변경
    this.pageSizeSelect?.addEventListener('change', (e) => {
      this.pageSize = parseInt(e.target.value, 10);
      this.currentPage = 1;
      this.applyFilters();
    });

    // 페이지네이션 이전 / 다음 버튼
    this.prevPageBtn?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderCurrentPage();
      }
    });

    this.nextPageBtn?.addEventListener('click', () => {
      const filtered = window.appState.getState().filteredItems;
      const totalPages = Math.ceil(filtered.length / this.pageSize);
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.renderCurrentPage();
      }
    });

    // 신규 추가 모달 열기
    document.getElementById('openAddModalBtn')?.addEventListener('click', () => {
      this.openCreateModal();
    });

    // 모달 닫기
    document.getElementById('closeModalBtn')?.addEventListener('click', () => this.closeDataModal());
    document.getElementById('cancelModalBtn')?.addEventListener('click', () => this.closeDataModal());

    // 폼 제출 (저장)
    this.dataForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleFormSubmit();
    });

    // 삭제 취소 및 확인
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => this.closeDeleteModal());
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
      await this.handleDeleteConfirm();
    });

    // 보너스 과제 2: CSV 및 JSON 내보내기
    document.getElementById('exportCsvBtn')?.addEventListener('click', () => this.exportCsv());
    document.getElementById('exportJsonBtn')?.addEventListener('click', () => this.exportJson());
  }

  applyFilters() {
    const q = this.searchInput ? this.searchInput.value.trim().toLowerCase() : '';
    const allItems = window.appState.getState().dataItems;

    let filtered = allItems;

    // 연도 필터링
    if (this.selectedYear !== 'all') {
      filtered = filtered.filter((it) => it.date.startsWith(this.selectedYear));
    }

    // 검색어 필터링
    if (q) {
      filtered = filtered.filter(
        (it) =>
          it.date.toLowerCase().includes(q) ||
          it.memo.toLowerCase().includes(q) ||
          String(it.value).includes(q)
      );
    }

    window.appState.setState({ filteredItems: filtered });
    this.renderCurrentPage();
  }

  renderTable(items, totalCount) {
    if (this.totalCountSpan) this.totalCountSpan.textContent = totalCount.toLocaleString();
    if (this.filteredCountSpan) this.filteredCountSpan.textContent = items.length.toLocaleString();
    this.renderCurrentPage();
  }

  renderCurrentPage() {
    const filtered = window.appState.getState().filteredItems || [];
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / this.pageSize));

    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    // 이전/다음 버튼 상태
    if (this.prevPageBtn) this.prevPageBtn.disabled = this.currentPage === 1;
    if (this.nextPageBtn) this.nextPageBtn.disabled = this.currentPage === totalPages;

    // 페이지 번호 렌더링
    this.renderPaginationButtons(totalPages);

    // 슬라이스
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const pageItems = filtered.slice(startIndex, startIndex + this.pageSize);

    if (pageItems.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4" style="color: var(--text-muted);">
            일치하는 차트 데이터가 없습니다.
          </td>
        </tr>
      `;
      return;
    }

    this.tableBody.innerHTML = pageItems
      .map((item) => {
        const parts = item.memo.split('|').map((p) => p.trim());
        const songTitle = parts[0] || item.memo;
        const genreBadge = parts.length > 1 ? `<span class="tag-badge">${parts[1]}</span>` : '';
        const notes = parts.slice(2).join(' | ');

        return `
          <tr>
            <td style="font-family: var(--font-mono); font-weight: 600;">${item.date}</td>
            <td style="font-family: var(--font-mono); color: var(--accent-green); font-weight: 700;">
              ${Number(item.value).toLocaleString()}만
            </td>
            <td>
              <div style="font-weight: 500;">${songTitle}</div>
              <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">
                ${genreBadge} ${notes}
              </div>
            </td>
            <td style="text-align: center;">
              <button class="btn btn-sm btn-ghost edit-btn" data-id="${item.id}" title="수정">수정</button>
              <button class="btn btn-sm btn-ghost text-red delete-btn" data-id="${item.id}" data-desc="${item.date} (${songTitle})" title="삭제" style="color: var(--accent-red);">삭제</button>
            </td>
          </tr>
        `;
      })
      .join('');

    // 수정 및 삭제 버튼 이벤트 바인딩
    this.tableBody.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.openEditModal(btn.dataset.id));
    });

    this.tableBody.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.openDeleteModal(btn.dataset.id, btn.dataset.desc));
    });
  }

  renderPaginationButtons(totalPages) {
    if (!this.pageNumbersContainer) return;

    let buttonsHtml = '';
    const maxButtons = 5;
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
      buttonsHtml += `<button class="page-num-btn" data-page="1">1</button>`;
      if (startPage > 2) buttonsHtml += `<span style="color: var(--text-muted); padding: 0 4px;">...</span>`;
    }

    for (let p = startPage; p <= endPage; p++) {
      const activeClass = p === this.currentPage ? 'active' : '';
      buttonsHtml += `<button class="page-num-btn ${activeClass}" data-page="${p}">${p}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) buttonsHtml += `<span style="color: var(--text-muted); padding: 0 4px;">...</span>`;
      buttonsHtml += `<button class="page-num-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    this.pageNumbersContainer.innerHTML = buttonsHtml;

    this.pageNumbersContainer.querySelectorAll('.page-num-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.currentPage = parseInt(btn.dataset.page, 10);
        this.renderCurrentPage();
      });
    });
  }

  openCreateModal() {
    this.editItemId.value = '';
    this.modalTitle.textContent = '새 스트리밍 데이터 추가';
    this.inputDate.value = new Date().toISOString().split('T')[0];
    this.inputValue.value = '';
    this.inputMemo.value = '';
    this.dataModal.classList.remove('hidden');
  }

  openEditModal(id) {
    const item = window.appState.getState().dataItems.find((d) => d.id === id);
    if (!item) return;

    this.editItemId.value = item.id;
    this.modalTitle.textContent = '스트리밍 데이터 수정';
    this.inputDate.value = item.date;
    this.inputValue.value = item.value;
    this.inputMemo.value = item.memo;
    this.dataModal.classList.remove('hidden');
  }

  closeDataModal() {
    this.dataModal.classList.add('hidden');
  }

  async handleFormSubmit() {
    const id = this.editItemId.value;
    const date = this.inputDate.value;
    const value = parseFloat(this.inputValue.value);
    const memo = this.inputMemo.value.trim();

    if (!date || isNaN(value) || !memo) {
      alert('모든 필드를 올바르게 입력해주세요.');
      return;
    }

    try {
      if (id) {
        // 수정
        await window.ApiClient.updateData(id, { date, value, memo });
      } else {
        // 생성
        await window.ApiClient.createData({ date, value, memo });
      }
      this.closeDataModal();
      await window.appManager.refreshAllData();
    } catch (err) {
      alert(`데이터 저장 실패: ${err.message}`);
    }
  }

  openDeleteModal(id, desc) {
    this.deleteTargetId = id;
    this.deleteDesc.textContent = `${desc} 데이터를 삭제하시겠습니까?`;
    this.deleteModal.classList.remove('hidden');
  }

  closeDeleteModal() {
    this.deleteTargetId = null;
    this.deleteModal.classList.add('hidden');
  }

  async handleDeleteConfirm() {
    if (!this.deleteTargetId) return;
    try {
      await window.ApiClient.deleteData(this.deleteTargetId);
      this.closeDeleteModal();
      await window.appManager.refreshAllData();
    } catch (err) {
      alert(`삭제 실패: ${err.message}`);
    }
  }

  // 보너스 과제 2: CSV 내보내기
  exportCsv() {
    const items = window.appState.getState().dataItems;
    if (!items || items.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    const headers = ['id', 'date', 'value(만 회)', 'memo'];
    const rows = items.map((it) => [
      `"${it.id}"`,
      `"${it.date}"`,
      it.value,
      `"${it.memo.replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SoundPulse_Spotify_Top1_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 보너스 과제 2: JSON 내보내기
  exportJson() {
    const items = window.appState.getState().dataItems;
    if (!items || items.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    const jsonString = JSON.stringify(items, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SoundPulse_Data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

window.dataManager = new DataManager();

