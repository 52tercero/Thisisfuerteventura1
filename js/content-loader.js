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
        'https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml'
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

        // Nueva lógica: mostrar sólo artículos más clicados (personalizados).
        // Recolectar clicks de localStorage.
        function getTopClickedArticles(limit = 12) {
            const articles = [];
            try {
                for (let i = 0; i < localStorage.length; i += 1) {
                    const k = localStorage.key(i);
                    if (!k || !k.startsWith('article_clicks_')) continue;
                    const id = k.replace('article_clicks_', '');
                    const clicks = parseInt(localStorage.getItem(k) || '0', 10);
                    if (!id || !Number.isFinite(clicks) || clicks <= 0) continue;
                    try {
                        const raw = localStorage.getItem(`article_${id}`);
                        if (!raw) continue;
                        const data = JSON.parse(raw);
                        if (!data || !data.title) continue;
                        articles.push({ ...data, articleId: id, clicks });
                    } catch (_) { /* ignore */ }
                }
            } catch (_) { /* ignore top-level */ }
            // Ordenar por clicks desc, luego por fecha (publishedAt) desc
            articles.sort((a, b) => {
                if (b.clicks !== a.clicks) return b.clicks - a.clicks;
                const ta = Date.parse(a.publishedAt || a.raw?.pubDate || a.date || '') || 0;
                const tb = Date.parse(b.publishedAt || b.raw?.pubDate || b.date || '') || 0;
                return tb - ta;
            });
            return articles.slice(0, limit);
        }

        // Obtener contenido interno más visto (turismo u otros tipos)
        function getTopSiteContent(limit = 12) {
            const content = [];
            try {
                for (let i = 0; i < localStorage.length; i += 1) {
                    const k = localStorage.key(i);
                    if (!k || !k.startsWith('site_content_views_')) continue;
                    const views = parseInt(localStorage.getItem(k) || '0', 10) || 0;
                    if (views <= 0) continue;
                    const base = k.replace('site_content_views_', ''); // e.g. turismo_parque-natural
                    const metaRaw = localStorage.getItem(`site_content_meta_${base}`);
                    if (!metaRaw) continue;
                    try {
                        const meta = JSON.parse(metaRaw);
                        if (!meta || !meta.title) continue;
                        content.push({ ...meta, views });
                    } catch(_) { /* ignore */ }
                }
            } catch(_) {}
            content.sort((a, b) => {
                if (b.views !== a.views) return b.views - a.views;
                return (Date.parse(b.date || '')||0) - (Date.parse(a.date || '')||0);
            });
            return content.slice(0, limit);
        }

        const topClicked = getTopClickedArticles();
        const topContent = getTopSiteContent();
        const combined = [...topContent, ...topClicked];
        if (combined.length === 0) {
            featuredNewsContainer.innerHTML = '<div class="no-news">Aún no hay destacados personales. Navega y lee contenido para generar tus favoritos.</div>';
            return;
        }
        // Ordenar combinado por métrica principal (views o clicks)
        combined.sort((a, b) => {
            const va = (b.views || 0) - (a.views || 0);
            if (va !== 0) return va; // ensure highest views first
            return (b.clicks || 0) - (a.clicks || 0);
        });
        const finalList = combined.slice(0, 12);
        featuredNewsContainer.innerHTML = '';
        finalList.forEach(item => {
            const card = document.createElement('div');
            card.className = 'content-card';
            const rawDesc = (item.description || item.summary || item.fullHtml || '')
                .replace(/<[^>]*>/g, ' ') // strip tags
                .replace(/\s+/g, ' ')
                .trim();
            const shortDescription = rawDesc.length > 150 ? rawDesc.slice(0, 150) + '...' : rawDesc;
            const imgSrc = toImageSrc(item.image);
            const metric = item.views ? `${item.views} visita${item.views === 1 ? '' : 's'}` : (item.clicks ? `${item.clicks} clic${item.clicks === 1 ? '' : 's'}` : '');
            const dateStr = escapeHTML(item.date || '');
            card.innerHTML = `
                <img src="${imgSrc}" alt="${escapeHTML(item.title)}" loading="lazy" referrerpolicy="no-referrer">
                <div class="card-content">
                    <span class="date">${dateStr}</span>
                    <h3>${escapeHTML(item.title)}</h3>
                    <p>${escapeHTML(shortDescription)}</p>
                    ${metric ? `<div class="meta-clicks">${metric}</div>` : ''}
                </div>
            `;
            const imgEl = card.querySelector('img');
            if (imgEl) { imgEl.addEventListener('error', () => { imgEl.src = 'images/logo.jpg?v=2025110501'; }); }
            // Determine link: internal content or article
            let linkHref = '#';
            if (item.articleId) {
                linkHref = `noticia.html?id=${item.articleId}`;
            } else if (item.url) {
                linkHref = item.url;
            }
            if (linkHref && linkHref !== '#') {
                const readMoreBtn = document.createElement('a');
                readMoreBtn.href = linkHref;
                readMoreBtn.className = 'btn';
                readMoreBtn.textContent = 'Ver más';
                card.querySelector('.card-content').appendChild(readMoreBtn);
            }
            featuredNewsContainer.appendChild(card);
        });
        return; // end personalized logic
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
                                if (!it.image || typeof it.image !== 'string' || !it.image.trim()) {
                                    return 'images/logo.jpg?v=2025110501';
                                }
                                return it.image; // proxificado en render con toImageSrc()
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
    
    // Cargar noticias destacadas (ahora sólo artículos más clicados)
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

    // Listener global para registrar clics en "Leer más"
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a.btn');
        if (!a) return;
        if (!a.href.includes('noticia.html')) return;
        try {
            const url = new URL(a.href, location.href);
            const id = url.searchParams.get('id');
            if (!id) return;
            const key = `article_clicks_${id}`;
            const prev = parseInt(localStorage.getItem(key) || '0', 10) || 0;
            localStorage.setItem(key, String(prev + 1));
        } catch (_) { /* ignore */ }
    });
});

