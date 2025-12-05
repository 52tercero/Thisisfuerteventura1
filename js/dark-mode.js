/* dark-mode.js - Toggle de modo oscuro/claro
   Unificación de lógica (se eliminó implementación duplicada) para evitar
   inconsistencias entre claves de almacenamiento y eventos múltiples. */

const THEME_KEY = 'fuerteventura-theme';
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';

// Obtener tema guardado o preferencia del sistema
function getPreferredTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    return savedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_THEME : LIGHT_THEME;
}

// Aplicar tema (remueve atributo en modo claro para respetar estilos base)
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === DARK_THEME) {
    root.setAttribute('data-theme', DARK_THEME);
  } else {
    root.removeAttribute('data-theme');
  }
  localStorage.setItem(THEME_KEY, theme);

  const toggleBtn = document.getElementById('theme-toggle') || document.querySelector('.theme-toggle');
  if (toggleBtn) {
    const icon = toggleBtn.querySelector('i');
    if (icon) {icon.className = theme === DARK_THEME ? 'fas fa-sun' : 'fas fa-moon';}
    toggleBtn.setAttribute('aria-label', theme === DARK_THEME ? 'Activar modo claro' : 'Activar modo oscuro');
    toggleBtn.setAttribute('aria-pressed', theme === DARK_THEME ? 'true' : 'false');
  }
}

// Toggle entre temas
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
  applyTheme(newTheme);
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  const theme = getPreferredTheme();
  applyTheme(theme);

  // Remove any existing dark mode toggle and prevent creation
  const existingToggle = document.getElementById('theme-toggle') || document.querySelector('.theme-toggle');
  if (existingToggle && existingToggle.parentElement) {
    try { existingToggle.remove(); } catch (_) { existingToggle.style.display = 'none'; }
  }
  // Do not create or bind a new toggle button
});

// Detectar cambios en preferencia del sistema
// Disable auto reacting to system theme changes since toggle is removed
try {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq && typeof mq.removeEventListener === 'function') {
    // no-op: ensure no listener is attached
  }
} catch (_) {}
