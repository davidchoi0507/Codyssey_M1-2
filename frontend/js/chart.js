/**
 * SoundPulse AI - Chart Visualization Module (보너스 과제 2)
 * Chart.js 기반 일일 스트리밍 시계열 라인 차트
 */

class StreamingChartManager {
  constructor() {
    this.chartInstance = null;
    this.canvasId = 'streamingChart';
  }

  init() {
    window.appState.subscribe((state, prevState) => {
      // 데이터가 새로 갱신되었거나 테마가 변경되었을 때 차트 리렌더링
      if (state.dataItems !== prevState.dataItems || state.theme !== prevState.theme) {
        this.render(state.dataItems, state.theme);
      }
    });
  }

  render(items, theme = 'dark') {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) return;

    if (!items || items.length === 0) {
      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
      }
      return;
    }

    // 날짜 오름차순 정렬
    const sorted = [...items].sort((a, b) => (a.date > b.date ? 1 : -1));

    const labels = sorted.map((d) => d.date);
    const dataValues = sorted.map((d) => d.value);
    const memoDetails = sorted.map((d) => d.memo);

    // 7일 이동평균선(7-Day Moving Average) 계산
    const maValues = [];
    for (let i = 0; i < dataValues.length; i++) {
      const windowStart = Math.max(0, i - 6);
      const windowSlice = dataValues.slice(windowStart, i + 1);
      const avg = windowSlice.reduce((acc, v) => acc + v, 0) / windowSlice.length;
      maValues.push(roundTo(avg, 1));
    }

    const isDark = theme === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    const textColor = isDark ? '#94A3B8' : '#475569';
    const primaryLineColor = isDark ? '#00F59B' : '#059669';
    const maLineColor = isDark ? '#A78BFA' : '#7C3AED';

    const ctx = canvas.getContext('2d');

    // 다크/라이트 테마에 맞춘 최적 그라데이션
    const gradient = ctx.createLinearGradient(0, 0, 0, 360);
    if (isDark) {
      gradient.addColorStop(0, 'rgba(0, 245, 155, 0.35)');
      gradient.addColorStop(0.7, 'rgba(0, 245, 155, 0.05)');
      gradient.addColorStop(1, 'rgba(0, 245, 155, 0.0)');
    } else {
      gradient.addColorStop(0, 'rgba(5, 150, 105, 0.22)');
      gradient.addColorStop(0.7, 'rgba(5, 150, 105, 0.04)');
      gradient.addColorStop(1, 'rgba(5, 150, 105, 0.0)');
    }

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    function roundTo(num, dec) {
      return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
    }

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: '일일 1위 스트리밍 (만 회)',
            data: dataValues,
            borderColor: primaryLineColor,
            backgroundColor: gradient,
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#FFFFFF',
            pointBorderColor: primaryLineColor,
            pointBorderWidth: 2,
          },
          {
            label: '7일 이동평균선 (7-Day MA)',
            data: maValues,
            borderColor: maLineColor,
            borderWidth: 2.2,
            borderDash: [5, 4],
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: textColor,
              boxWidth: 12,
              font: { family: "'Inter', sans-serif", size: 11 },
            },
          },
          tooltip: {
            backgroundColor: isDark ? '#121824' : '#FFFFFF',
            titleColor: isDark ? '#F8FAFC' : '#0F172A',
            bodyColor: isDark ? '#94A3B8' : '#475569',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const val = context.parsed.y;
                return ` ${label}: ${val.toLocaleString()}만 회`;
              },
              afterBody: (tooltipItems) => {
                if (!tooltipItems || tooltipItems.length === 0) return [];
                const idx = tooltipItems[0].dataIndex;
                const memo = memoDetails[idx] || '';
                return memo ? [`🎧 곡 정보: ${memo}`] : [];
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              maxTicksLimit: 14,
              font: { family: "'Inter', sans-serif", size: 11 },
            },
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              callback: (val) => `${val.toLocaleString()}만`,
              font: { family: "'JetBrains Mono', monospace", size: 11 },
            },
          },
        },
      },
    });
  }
}

window.chartManager = new StreamingChartManager();

