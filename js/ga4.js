// GA4 integration aligned with consent + performance best practices
// - Do not inject gtag immediately to avoid early reflows in the critical path
// - Defer injection to CookieConsent when analytics is allowed
(function(){
  try {
    // Expose GA ID for CookieConsent module
    window.__GA_ID = 'G-46FPEKQGKZ';

    function scheduleEnableAnalytics(){
      if (window.CookieConsent && typeof window.CookieConsent.enableAnalytics === 'function') {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(function(){
            try { window.CookieConsent.enableAnalytics(); } catch(_) {}
          }, { timeout: 2000 });
        } else {
          setTimeout(function(){
            try { window.CookieConsent.enableAnalytics(); } catch(_) {}
          }, 1500);
        }
      }
    }

    // If user already granted analytics consent, schedule GA load lazily
    if (window.Cookies && typeof window.Cookies.hasConsent === 'function') {
      if (window.Cookies.hasConsent('analytics')) {
        scheduleEnableAnalytics();
      }
    }
    // Otherwise, CookieConsent will inject when the user accepts (see cookies.js)
  } catch (e) { /* noop */ }
})();
