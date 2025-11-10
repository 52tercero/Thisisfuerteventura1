/**
 * Sistema de gestión de cookies conforme a GDPR/LOPD
 * This is Fuerteventura
 */

const CookieConsent = {
    // Configuración
    cookieName: 'thisisfuerteventura_cookie_consent',
    cookieExpireDays: 365,
    
    // Estado de las cookies
    preferences: {
        necessary: true,    // Siempre activas (no se pueden desactivar)
        analytics: false,   // Google Analytics, etc.
        marketing: false,   // Publicidad, redes sociales
        functional: false   // Preferencias de usuario, idioma, etc.
    },

    /**
     * Inicializar el sistema de cookies
     */
    init() {
        // Verificar si ya existe consentimiento
        const consent = this.getConsent();
        
        if (!consent) {
            // Mostrar banner si no hay consentimiento previo
            this.showBanner();
        } else {
            // Aplicar preferencias guardadas
            this.preferences = consent;
            this.applyPreferences();
        }

        // Event listeners
        this.attachEventListeners();
    },

    /**
     * Mostrar el banner de cookies
     */
    showBanner() {
        const banner = document.getElementById('cookie-consent');
        if (banner) {
            setTimeout(() => {
                banner.classList.add('show');
            }, 1000); // Mostrar después de 1 segundo
        }
    },

    /**
     * Ocultar el banner
     */
    hideBanner() {
        const banner = document.getElementById('cookie-consent');
        if (banner) {
            banner.classList.remove('show');
        }
    },

    /**
     * Aceptar todas las cookies
     */
    acceptAll() {
        this.preferences = {
            necessary: true,
            analytics: true,
            marketing: true,
            functional: true
        };
        this.saveConsent();
        this.applyPreferences();
        this.hideBanner();
    },

    /**
     * Rechazar cookies opcionales
     */
    rejectAll() {
        this.preferences = {
            necessary: true,
            analytics: false,
            marketing: false,
            functional: false
        };
        this.saveConsent();
        this.applyPreferences();
        this.hideBanner();
    },

    /**
     * Mostrar modal de configuración
     */
    showSettings() {
        const modal = document.getElementById('cookie-modal');
        if (modal) {
            modal.classList.add('show');
            
            // Cargar preferencias actuales en los toggles
            const consent = this.getConsent();
            if (consent) {
                document.getElementById('analytics-toggle').checked = consent.analytics;
                document.getElementById('marketing-toggle').checked = consent.marketing;
                document.getElementById('functional-toggle').checked = consent.functional;
            }
        }
    },

    /**
     * Cerrar modal de configuración
     */
    closeSettings() {
        const modal = document.getElementById('cookie-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    },

    /**
     * Guardar preferencias personalizadas
     */
    saveCustomPreferences() {
        this.preferences = {
            necessary: true, // Siempre true
            analytics: document.getElementById('analytics-toggle').checked,
            marketing: document.getElementById('marketing-toggle').checked,
            functional: document.getElementById('functional-toggle').checked
        };
        this.saveConsent();
        this.applyPreferences();
        this.closeSettings();
        this.hideBanner();
    },

    /**
     * Guardar consentimiento en cookie
     */
    saveConsent() {
        const consent = JSON.stringify(this.preferences);
        const expires = new Date();
        expires.setDate(expires.getDate() + this.cookieExpireDays);
        
        document.cookie = `${this.cookieName}=${consent}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    },

    /**
     * Obtener consentimiento guardado
     */
    getConsent() {
        const name = this.cookieName + '=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookies = decodedCookie.split(';');
        
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.indexOf(name) === 0) {
                try {
                    return JSON.parse(cookie.substring(name.length));
                } catch (e) {
                    return null;
                }
            }
        }
        return null;
    },

    /**
     * Aplicar preferencias de cookies
     */
    applyPreferences() {
        // Analytics
        if (this.preferences.analytics) {
            this.enableAnalytics();
        } else {
            this.disableAnalytics();
        }

        // Marketing
        if (this.preferences.marketing) {
            this.enableMarketing();
        } else {
            this.disableMarketing();
        }

        // Functional
        if (this.preferences.functional) {
            this.enableFunctional();
        } else {
            this.disableFunctional();
        }
    },

    /**
     * Activar Google Analytics
     */
    enableAnalytics() {
        // Aquí se activaría Google Analytics si lo usas
        // Ejemplo:
        /*
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-XXXXXXXXXX');
        */
        console.log('Analytics enabled');
    },

    /**
     * Desactivar Analytics
     */
    disableAnalytics() {
        // Desactivar analytics
        console.log('Analytics disabled');
    },

    /**
     * Activar cookies de marketing
     */
    enableMarketing() {
        console.log('Marketing cookies enabled');
    },

    /**
     * Desactivar cookies de marketing
     */
    disableMarketing() {
        console.log('Marketing cookies disabled');
    },

    /**
     * Activar cookies funcionales
     */
    enableFunctional() {
        console.log('Functional cookies enabled');
    },

    /**
     * Desactivar cookies funcionales
     */
    disableFunctional() {
        console.log('Functional cookies disabled');
    },

    /**
     * Adjuntar event listeners
     */
    attachEventListeners() {
        // Botones del banner
        const acceptBtn = document.getElementById('cookie-accept');
        const rejectBtn = document.getElementById('cookie-reject');
        const settingsBtn = document.getElementById('cookie-settings');

        if (acceptBtn) acceptBtn.addEventListener('click', () => this.acceptAll());
        if (rejectBtn) rejectBtn.addEventListener('click', () => this.rejectAll());
        if (settingsBtn) settingsBtn.addEventListener('click', () => this.showSettings());

        // Modal
        const closeModalBtn = document.getElementById('cookie-modal-close');
        const savePrefsBtn = document.getElementById('save-cookie-preferences');
        const modal = document.getElementById('cookie-modal');

        if (closeModalBtn) closeModalBtn.addEventListener('click', () => this.closeSettings());
        if (savePrefsBtn) savePrefsBtn.addEventListener('click', () => this.saveCustomPreferences());
        
        // Cerrar modal al hacer click fuera
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeSettings();
                }
            });
        }
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CookieConsent.init());
} else {
    CookieConsent.init();
}
