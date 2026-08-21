// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const Utils = {
  // Generate 6-digit game PIN
  generateGamePin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Generate 4-digit group PIN
  generateGroupPin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  },

  // Calculate speed score
  calculateSpeedScore(timeElapsed, maxPoints) {
    if (timeElapsed <= 3) return maxPoints;
    if (timeElapsed <= 7) return Math.floor(maxPoints * 0.75);
    if (timeElapsed <= 10) return Math.floor(maxPoints * 0.50);
    if (timeElapsed <= 19) return Math.floor(maxPoints * 0.25);
    return Math.floor(maxPoints * 0.10);
  },

  // Format time display
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  // Show notification toast
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span class="toast-message">${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // Confetti animation
  createConfetti(container) {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4'];
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      confetti.style.cssText = `
        left: ${Math.random() * 100}%;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        animation-delay: ${Math.random() * 3}s;
        animation-duration: ${2 + Math.random() * 3}s;
      `;
      container.appendChild(confetti);
    }
  },

  // Download CSV report
  downloadCSV(data, filename) {
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Show/hide loading spinner
  showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
  },

  hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
  },

  // Sanitize input
  sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
