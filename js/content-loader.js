document.addEventListener('DOMContentLoaded', async function() {
    // Escapar texto y sanitizar HTML (delegar en FeedUtils si está disponible)
    function escapeHTML(str) {
        if (window.FeedUtils && typeof FeedUtils.escapeHTML === 'function') {
            return FeedUtils.escapeHTML(str);
        }
        try {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        } catch (_) {
            return '';
        }
    }
    function sanitizeHTML(html) {
        if (window.FeedUtils && typeof FeedUtils.sanitize === 'function') {
            return FeedUtils.sanitize(html);
        }
        try {
            if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
                return DOMPurify.sanitize(html);
            }
        } catch (_) {}
        try {
            return String(html)
                .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
                .replace(/on[a-z]+\s*=\s*"[^"]*"/gi, '')
                .replace(/on[a-z]+\s*=\s*'[^']*'/gi, '')
                .replace(/javascript:\s*/gi, '');
        } catch (_) {
            return '';
        }
    }
    // Helper para enrutar imágenes externas a través del proxy cuando esté disponible
    function toImageSrc(url) {
        try {
            if (!url || typeof url !== 'string') return url;
            // Evitar proxificar imágenes locales
            const u = new URL(url, location.href);
            const isExternal = u.origin !== location.origin;
            if (!isExternal) return u.toString();

            // Detectar si estamos usando Netlify Functions (cadena vacía)
            if (window.__RSS_PROXY_URL === '') {
                return `/.netlify/functions/image?url=${encodeURIComponent(u.toString())}`;
            }
            // Si hay un proxy local descubierto
            if (typeof window.__RSS_PROXY_URL === 'string' && window.__RSS_PROXY_URL) {
                return `${window.__RSS_PROXY_URL}/api/image?url=${encodeURIComponent(u.toString())}`;
            }
            // Fallback: dejar URL directa
            return u.toString();
        } catch (_) {
            return url;
        }
    }
    const FALLBACK_NEWS_SOURCES = [
        'https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml',
        'https://rss.app/feeds/8SmCQL7GDZyu2xB4.xml',
        'https://rss.app/feeds/IchTPp234IVDaH7V.xml',
        'https://rss.app/feeds/cNktFJXkoIBwqQSS.xml',
        'https://rss.app/feeds/pGaOMTfcwV2mzdy7.xml'
    ];
    const activeNewsSources = (Array.isArray(window.FeedUtils?.DEFAULT_NEWS_SOURCES) && window.FeedUtils.DEFAULT_NEWS_SOURCES.length > 0)
        ? window.FeedUtils.DEFAULT_NEWS_SOURCES
        : FALLBACK_NEWS_SOURCES;
    let featuredSnapshotRendered = false;
    // Detectar proxy antes de cargar noticias
    if (typeof window.discoverRSSProxy === 'function') {
        try {
            await window.discoverRSSProxy();
        } catch (e) {
            console.warn('Error detectando proxy:', e);
        }
    }
    
    // Función para cargar noticias destacadas
    function loadFeaturedNews() {
        const featuredNewsContainer = document.getElementById('featured-news');
        
        if (!featuredNewsContainer) return;

        // Helper: convertir HTML a texto plano para truncar sin romper etiquetas
        function toPlainText(html) {
            if (!html) return '';
            try {
                return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            } catch (_) {
                return String(html);
            }
        }
        
        // Mostrar mensaje de carga solo si no hay contenido SSR/SSG previo
        if (!featuredNewsContainer.querySelector('.content-card')) {
            featuredNewsContainer.innerHTML = `
                <div class="loading-skeleton">
                    ${Array(6).fill(0).map(() => `
                        <div class="skeleton-card">
                            <div class="skeleton-image"></div>
                            <div class="skeleton-content">
                                <div class="skeleton-date"></div>
                                <div class="skeleton-title"></div>
                                <div class="skeleton-text"></div>
                                <div class="skeleton-text short"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Función para obtener y parsear feeds RSS (delegada a FeedUtils)
        async function fetchLatestFeeds() {
            try {
                if (window.FeedUtils && typeof FeedUtils.fetchRSSFeeds === 'function') {
                    // Bypass caché para portada para maximizar frescura
                    return await FeedUtils.fetchRSSFeeds(activeNewsSources, { noCache: true });
                }
            } catch (e) {
                console.warn('[CONTENT-LOADER] FeedUtils.fetchRSSFeeds failed:', e);
            }
            // Fallback: sin utilidades cargadas, devolver vacío
            return [];
        }
        
        // Utilidad: normalizar fecha para ordenación descendente
        const normalizeTime = (item) => {
            if (item && item.publishedAt) {
                const dt = new Date(item.publishedAt);
                if (!Number.isNaN(dt.getTime())) return dt.getTime();
            }
            if (item && item.raw) {
                const rawDate = item.raw?.pubDate || item.raw?.published || item.raw?.updated || null;
                if (rawDate) {
                    const dt = new Date(rawDate);
                    if (!Number.isNaN(dt.getTime())) return dt.getTime();
                }
            }
            try {
                const parts = (item?.date || '').split(' de ').reverse().join(' ');
                const fallback = new Date(parts);
                if (!Number.isNaN(fallback.getTime())) return fallback.getTime();
            } catch (_) {}
            return 0;
        };

        // Intentar snapshot estático para primer render rápido
        (async () => {
            try {
                if (featuredSnapshotRendered) return;
                const snapRes = await fetch('/data/feeds.json', { cache: 'no-store' });
                if (snapRes.ok) {
                    const snap = await snapRes.json();
                    const items = Array.isArray(snap.items) ? snap.items : [];
                    if (items.length > 0) {
                        // Normalizar y renderizar hasta 12 items de snapshot (optimizado)
                        const normalized = await Promise.all(items.slice(0, 12).map(async (it) => {
                            const title = it.title || 'Sin título';
                            const descriptionRaw = it.description || '';
                            const description = typeof descriptionRaw === 'object' ? (descriptionRaw._ || '') : descriptionRaw;
                            const link = it.link || '';
                            const pub = it.pubDate || '';
                            let source = '';
                            try { source = link ? (new URL(link)).hostname.replace('www.', '') : 'fuente'; } catch (e) { source = 'fuente'; }
                            const image = await (async () => {
                                if (!it.image) return 'images/logo.jpg?v=2025110501';
                                if (/^http:/.test(it.image)) return 'images/logo.jpg?v=2025110501';
                                return it.image;
                            })();
                            const cleaned = (window.DOMPurify && DOMPurify.sanitize) ? DOMPurify.sanitize(description) : description.replace(/<[^>]*>/g, ' ');
                            return {
                                title,
                                image,
                                description: cleaned,
                                summary: cleaned,
                                fullHtml: cleaned,
                                date: pub ? formatDate(new Date(pub)) : formatDate(new Date()),
                                publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
                                category: 'General',
                                source,
                                link,
                                raw: {}
                            };
                        }));

                        // Ordenar por fecha desc y mostrar hasta 12
                        featuredNewsContainer.innerHTML = '';
                        const featured = normalized.sort((a,b) => normalizeTime(b) - normalizeTime(a)).slice(0, 12);
                        featured.forEach((item) => {
                            const card = document.createElement('div');
                            card.className = 'content-card';
                            const fullText = (item.description || item.summary || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                            const shortDescription = fullText.length > 150 ? fullText.slice(0, 150) + '...' : fullText;
                            const idBase = `${item.title || ''}|${item.publishedAt || item.date || ''}`;
                            const articleId = (function(){ try { return btoa(encodeURIComponent(idBase)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32); } catch(_) { return Math.random().toString(36).slice(2, 34); } })();
                            try { localStorage.setItem(`article_${articleId}`, JSON.stringify(item)); } catch (_) {}
                            card.innerHTML = `
                                <img src="${toImageSrc(item.image)}" alt="${escapeHTML(item.title)}" loading="lazy" referrerpolicy="no-referrer">
                                <div class="card-content">
                                    <span class="date">${escapeHTML(item.date)}</span>
                                    <h3>${escapeHTML(item.title)}</h3>
                                    <p>${shortDescription}</p>
                                </div>
                            `;
                            const imgEl = card.querySelector('img');
                            if (imgEl) {
                                imgEl.addEventListener('error', () => { imgEl.src = 'images/logo.jpg?v=2025110501'; });
                            }
                            const readMoreBtn = document.createElement('a');
                            readMoreBtn.href = `noticia.html?id=${articleId}`;
                            readMoreBtn.className = 'btn';
                            readMoreBtn.textContent = 'Leer más';
                            card.querySelector('.card-content').appendChild(readMoreBtn);
                            featuredNewsContainer.appendChild(card);
                        });
                        featuredSnapshotRendered = true;
                    }
                }
            } catch (_) {
                // snapshot no disponible; seguimos flujo normal
            }
        })();

        // Obtener noticias y (re)mostrarlas con datos frescos
        fetchLatestFeeds().then(newsItems => {
            console.log('[CONTENT-LOADER] Noticias recibidas:', newsItems.length);
            
            // Si no hay noticias frescas: conservar snapshot/SSR si existe
            if (newsItems.length === 0) {
                console.error('[CONTENT-LOADER] No hay noticias para mostrar');
                if (featuredNewsContainer.querySelector('.content-card')) {
                    // Ya hay tarjetas (snapshot o SSR). No borrar contenido.
                    return;
                }
                featuredNewsContainer.innerHTML = '<div class="no-news">No se pudieron cargar las noticias. Inténtalo más tarde.</div>';
                return;
            }

            // Limpiar contenedor y ordenar por fecha desc, tomar hasta 12
            featuredNewsContainer.innerHTML = '';
            const featured = [...newsItems].sort((a,b) => normalizeTime(b) - normalizeTime(a)).slice(0, 12);
            console.log('[CONTENT-LOADER] Mostrando', featured.length, 'artículos destacados');
            
            // Mostrar las noticias (resumen compacto en portada)
            featured.forEach((item, index) => {
                console.log(`[CONTENT-LOADER] Renderizando artículo ${index + 1}:`, item.title, 'Image:', item.image);
                const card = document.createElement('div');
                card.className = 'content-card';

                // Descripción en texto plano truncada (150 caracteres)
                const fullText = toPlainText(item.description || item.summary || '');
                const shortDescription = fullText.length > 150 
                    ? fullText.slice(0, 150) + '...' 
                    : fullText;

                // Crear ID único para el artículo basado en título y publishedAt/fecha
                const idBase = `${item.title || ''}|${item.publishedAt || item.date || ''}`;
                const articleId = (function(){ try { return btoa(encodeURIComponent(idBase)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32); } catch(_) { return Math.random().toString(36).slice(2, 34); } })();
                
                // Guardar artículo completo en localStorage para acceso en noticia.html
                try {
                    localStorage.setItem(`article_${articleId}`, JSON.stringify(item));
                } catch (e) {
                    console.warn('Error guardando artículo en localStorage:', e);
                }

                card.innerHTML = `
                    <img src="${toImageSrc(item.image)}" alt="${escapeHTML(item.title)}" loading="lazy" referrerpolicy="no-referrer">
                    <div class="card-content">
                        <span class="date">${escapeHTML(item.date)}</span>
                        <h3>${escapeHTML(item.title)}</h3>
                        <p>${shortDescription}</p>
                    </div>
                `;
                const imgEl = card.querySelector('img');
                if (imgEl) {
                    imgEl.addEventListener('error', () => { imgEl.src = 'images/logo.jpg?v=2025110501'; });
                }
                
                const readMoreBtn = document.createElement('a');
                readMoreBtn.href = `noticia.html?id=${articleId}`;
                readMoreBtn.className = 'btn';
                readMoreBtn.textContent = 'Leer más';
                card.querySelector('.card-content').appendChild(readMoreBtn);
                
                featuredNewsContainer.appendChild(card);
            });
            if (newsItems.length > 0) {
                featuredSnapshotRendered = true;
            }
        });
    }
    
    // Función para formatear fechas
    function formatDate(date) {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }
    
    // Cargar noticias destacadas
    loadFeaturedNews();
    
    // Configurar actualización automática de noticias
    function setupAutoRefresh() {
        // Actualizar noticias cada 30 minutos (en milisegundos)
        const refreshInterval = 30 * 60 * 1000;
        
        setInterval(() => {
            console.log('Actualizando noticias automáticamente...');
            
            // Recargar noticias según la página actual
            if (document.getElementById('featured-news')) {
                loadFeaturedNews();
            }
            document.dispatchEvent(new CustomEvent('feed:refresh'));
        }, refreshInterval);
    }
    
    // Iniciar actualización automática
    setupAutoRefresh();

    // Forzar re-render si volvemos desde BFCache del navegador (para asegurar vista compacta y enlaces internos)
    window.addEventListener('pageshow', (evt) => {
        if (evt.persisted) {
            try {
                if (document.getElementById('featured-news')) {
                    loadFeaturedNews();
                }
            } catch (e) {
                console.warn('BFCache re-render failed:', e);
            }
        }
    });
});

