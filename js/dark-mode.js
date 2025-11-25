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
    if (icon) icon.className = theme === DARK_THEME ? 'fas fa-sun' : 'fas fa-moon';
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

  let toggleBtn = document.getElementById('theme-toggle') || document.querySelector('.theme-toggle');
  if (!toggleBtn) {
    const header = document.querySelector('header');
    if (header) {
      toggleBtn = document.createElement('button');
      toggleBtn.id = 'theme-toggle';
      toggleBtn.className = 'theme-toggle';
      toggleBtn.type = 'button';
      toggleBtn.setAttribute('aria-label', theme === DARK_THEME ? 'Activar modo claro' : 'Activar modo oscuro');
      toggleBtn.setAttribute('aria-pressed', theme === DARK_THEME ? 'true' : 'false');
      toggleBtn.innerHTML = `<i class="${theme === DARK_THEME ? 'fas fa-sun' : 'fas fa-moon'}"></i>`;
      header.appendChild(toggleBtn);
    }
  }
  if (toggleBtn && !toggleBtn.__themeBound) {
    toggleBtn.addEventListener('click', toggleTheme);
    toggleBtn.__themeBound = true; // marca para evitar doble binding en páginas con scripts múltiples
  }
});

// Detectar cambios en preferencia del sistema
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
        applyTheme(e.matches ? DARK_THEME : LIGHT_THEME);
    }
});
