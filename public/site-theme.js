(() => {
  const themes = new Set(['river', 'monsoon', 'sky', 'earth', 'harvest', 'paddy', 'coast', 'indigo', 'paper', 'slate']);
  function syncTheme() {
    let theme = 'river';
    try { theme = localStorage.getItem('alusathi-home-theme') || theme; } catch { /* Default palette works without storage. */ }
    document.documentElement.dataset.homeTheme = themes.has(theme) ? theme : 'river';
  }
  syncTheme();
  window.addEventListener('storage', event => { if (!event.key || event.key === 'alusathi-home-theme') syncTheme(); });
  for (const event of ['focus', 'pageshow', 'alusathi-theme-change']) window.addEventListener(event, syncTheme);
})();
