// Dark/Light mode toggle with persistence and prefers-color-scheme
(() => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const STORAGE_KEY = 'theme';

  const getPreferred = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    const mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    return mql && mql.matches ? 'dark' : 'light';
  };

  const applyTheme = (theme) => {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  };

  // Initialize
  const initial = getPreferred();
  applyTheme(initial);

  // Do NOT auto-create toggle here to avoid duplicates; use existing if present
  const ensureToggle = () => document.getElementById('theme-toggle') || document.querySelector('.theme-toggle');

  const toggle = ensureToggle();
  if (!toggle) return;

  const updateIcon = (theme) => {
    const i = toggle.querySelector('i');
    if (!i) return;
    i.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  };

  updateIcon(initial);

  toggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    toggle.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
    updateIcon(next);
  });
})();
/* dark-mode.js - Toggle de modo oscuro/claro */

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

// Aplicar tema
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    
    // Actualizar botón toggle
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        const icon = toggleBtn.querySelector('i');
        if (icon) {
            icon.className = theme === DARK_THEME ? 'fas fa-sun' : 'fas fa-moon';
        }
        toggleBtn.setAttribute('aria-label', theme === DARK_THEME ? 'Activar modo claro' : 'Activar modo oscuro');
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
    
    // Añadir botón toggle si no existe
    const existingToggle = document.getElementById('theme-toggle');
    if (!existingToggle) {
        const nav = document.querySelector('nav');
        if (nav) {
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'theme-toggle';
            toggleBtn.className = 'theme-toggle';
            toggleBtn.setAttribute('aria-label', theme === DARK_THEME ? 'Activar modo claro' : 'Activar modo oscuro');
            toggleBtn.innerHTML = `<i class="${theme === DARK_THEME ? 'fas fa-sun' : 'fas fa-moon'}"></i>`;
            toggleBtn.addEventListener('click', toggleTheme);
            nav.parentElement.insertBefore(toggleBtn, nav.nextSibling);
        }
    } else {
        existingToggle.addEventListener('click', toggleTheme);
    }
});

// Detectar cambios en preferencia del sistema
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
        applyTheme(e.matches ? DARK_THEME : LIGHT_THEME);
    }
});
