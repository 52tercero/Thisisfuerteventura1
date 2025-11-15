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
