document.addEventListener('DOMContentLoaded', function() {
    // Escapar texto usando FeedUtils si está disponible
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
    // Helper para proxificar imágenes externas mediante Netlify Functions o proxy local
    function toImageSrc(url) {
        try {
            if (!url || typeof url !== 'string') return url;
            const u = new URL(url, location.href);
            if (u.origin === location.origin) return u.toString();
            if (window.__RSS_PROXY_URL === '') {
                return `/.netlify/functions/image?url=${encodeURIComponent(u.toString())}`;
            }
            if (typeof window.__RSS_PROXY_URL === 'string' && window.__RSS_PROXY_URL) {
                return `${window.__RSS_PROXY_URL}/api/image?url=${encodeURIComponent(u.toString())}`;
            }
            return u.toString();
        } catch (_) {
            return url;
        }
    }
    // Listado simple de noticias, paginación y filtrado para noticias.html
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;

    const REFRESH_INTERVAL = 30 * 60 * 1000;
    const FEED_REFRESH_EVENT = 'feed:refresh';
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

    let hasRenderedSnapshot = false;
    let isLoading = false;
    let pendingOptions = null;
    let cachedNewsItems = [];
    let isSnapshotCache = false;

    // Variables para la paginación y filtrado
    let currentPage = 1;
    const itemsPerPage = 9;
    // Eliminado filtrado por categoría y orden: sólo búsqueda + paginación
    let currentSearch = '';

    // Controles del DOM (si existen)
    const prevPageBtns = [document.getElementById('prev-page'), document.getElementById('prev-page-top')].filter(Boolean);
    const nextPageBtns = [document.getElementById('next-page'), document.getElementById('next-page-top')].filter(Boolean);
    const pageInfos = [document.getElementById('page-info'), document.getElementById('page-info-top')].filter(Boolean);
    // Los elementos de filtro ya no existen (categoría / fecha)
    const searchInput = document.getElementById('news-search');
    const searchBtn = document.getElementById('search-btn');

    // Obtener noticias delegando a FeedUtils para evitar duplicación
    async function fetchNews(forceRefresh = false) {
        if (!forceRefresh && cachedNewsItems.length > 0 && !isSnapshotCache) {
            return cachedNewsItems;
        }
        try {
            if (window.FeedUtils && typeof FeedUtils.fetchRSSFeeds === 'function') {
                const items = await FeedUtils.fetchRSSFeeds(activeNewsSources, { noCache: !!forceRefresh });
                cachedNewsItems = items.map((it, idx) => ({
                    id: idx + 1,
                    title: it.title,
                    image: it.image,
                    summary: it.summary || it.description || '',
                    content: it.fullHtml || it.description || '',
                    date: it.date,
                    publishedAt: it.publishedAt || null,
                    category: it.category,
                    tags: Array.isArray(it.tags) ? it.tags : [],
                    source: it.source,
                    link: it.link,
                    raw: it.raw || null
                }));
                isSnapshotCache = false;
                return cachedNewsItems;
            }
            console.warn('[NEWS] FeedUtils.fetchRSSFeeds no está disponible');
        } catch (e) {
            console.warn('[NEWS] FeedUtils.fetchRSSFeeds failed:', e);
        }
        if (cachedNewsItems.length === 0) {
            cachedNewsItems = [];
        }
        return cachedNewsItems;
    }

    function filterNews(news) {
        const searchTerm = currentSearch.trim().toLowerCase();
        if (!searchTerm) return news;
        return news.filter(item => {
            const title = (item.title || '').toLowerCase();
            const summary = (item.summary || item.content || '').toLowerCase();
            const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : '';
            return title.includes(searchTerm) || summary.includes(searchTerm) || tags.includes(searchTerm);
        });
    }

    function sortNews(news) {
        const normalizeDate = (item) => {
            if (item.publishedAt) {
                const dt = new Date(item.publishedAt);
                if (!Number.isNaN(dt.getTime())) return dt.getTime();
            }
            if (item.raw) {
                const rawDate = item.raw?.pubDate || item.raw?.published || item.raw?.updated || null;
                if (rawDate) {
                    const dt = new Date(rawDate);
                    if (!Number.isNaN(dt.getTime())) return dt.getTime();
                }
            }
            try {
                const parts = (item.date || '').split(' de ').reverse().join(' ');
                const fallback = new Date(parts);
                if (!Number.isNaN(fallback.getTime())) return fallback.getTime();
            } catch (_) {}
            return 0;
        };
        // Por defecto siempre más recientes primero
        return [...news].sort((a, b) => normalizeDate(b) - normalizeDate(a));
    }

    function paginateNews(news) {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return news.slice(startIndex, startIndex + itemsPerPage);
    }

    function updatePaginationInfo(totalItems) {
        const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
        pageInfos.forEach(el => { el.textContent = `Página ${currentPage} de ${totalPages}`; });
        prevPageBtns.forEach(btn => { btn.disabled = currentPage === 1; });
        nextPageBtns.forEach(btn => { btn.disabled = currentPage === totalPages; });
    }

    function buildArticleId(item) {
        const base = `${item.title || ''}|${item.publishedAt || item.date || ''}`;
        try {
            const encoded = btoa(encodeURIComponent(base));
            const sanitized = encoded.replace(/[^a-zA-Z0-9]/g, '');
            return sanitized.substring(0, 32) || 'Articulo';
        } catch (_) {
            return Math.random().toString(36).slice(2, 34);
        }
    }

    function summarizeItem(item) {
        return String(item.summary || item.description || item.content || '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function normalizeDisplayDate(item) {
        if (item.date) return item.date;
        if (item.publishedAt) {
            try {
                const dt = new Date(item.publishedAt);
                if (!Number.isNaN(dt.getTime())) {
                    return dt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                }
            } catch (_) {}
        }
        return '';
    }

    function renderNewsCards(items) {
        newsContainer.innerHTML = '';
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'content-card';

            const categoryTag = (item.category && String(item.category).toLowerCase() !== 'general')
                ? `<span class="category-tag">${escapeHTML(item.category)}</span>`
                : '';
            const tagChips = (Array.isArray(item.tags) && item.tags.length > 0)
                ? `<div class="tag-chips">${item.tags.slice(0, 3).map(t => {
                        const safe = escapeHTML(t);
                        return `<button class="tag-chip" data-tag="${safe}">${safe}</button>`;
                    }).join(' ')}</div>`
                : '';

            const fullText = summarizeItem(item);
            const shortSummary = fullText.length > 150 ? `${fullText.slice(0, 150)}...` : fullText;
            const displayDate = normalizeDisplayDate(item);
            const articleId = buildArticleId(item);

            try {
                const stored = { ...item, articleId };
                localStorage.setItem(`article_${articleId}`, JSON.stringify(stored));
            } catch (e) {
                console.warn('Error guardando artículo en localStorage:', e);
            }

            card.innerHTML = `
                <img src="${toImageSrc(item.image)}" alt="${escapeHTML(item.title)}" loading="lazy" referrerpolicy="no-referrer">
                <div class="card-content">
                    <span class="date">${escapeHTML(displayDate)}</span>
                    <h3>${escapeHTML(item.title)}</h3>
                    <p>${escapeHTML(shortSummary)}</p>
                    ${categoryTag}
                    ${tagChips}
                </div>
            `;
            const imgEl = card.querySelector('img');
            if (imgEl) {
                imgEl.addEventListener('error', () => { imgEl.src = 'images/logo.jpg'; });
            }

            const readMoreBtn = document.createElement('a');
            readMoreBtn.href = `noticia.html?id=${articleId}`;
            readMoreBtn.className = 'btn';
            readMoreBtn.textContent = 'Leer más';
            card.querySelector('.card-content').appendChild(readMoreBtn);

            newsContainer.appendChild(card);
        });
    }

    function applyNewsData(newsItems, { keepPage = true } = {}) {
        const filtered = filterNews(newsItems);
        const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
        if (!keepPage) currentPage = 1;
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;
        updatePaginationInfo(filtered.length);

        const sorted = sortNews(filtered);
        const pageItems = paginateNews(sorted);

        if (pageItems.length === 0) {
            newsContainer.innerHTML = '<div class="no-results">No se encontraron noticias que coincidan con tu búsqueda.</div>';
            return;
        }

        renderNewsCards(pageItems);
    }

    async function renderSnapshotIfNeeded() {
        if (hasRenderedSnapshot) return;
        try {
            const snapRes = await fetch('/data/feeds.json', { cache: 'no-store' });
            if (!snapRes.ok) return;
            const snap = await snapRes.json();
            const items = Array.isArray(snap.items) ? snap.items : [];
            if (items.length === 0) return;

            const normalized = items.slice(0, 60).map(it => {
                const title = it.title || 'Sin título';
                const description = typeof it.description === 'string' ? it.description : '';
                const summary = description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                const link = it.link || '';
                const pub = it.pubDate || it.published || '';
                let source = '';
                try { source = link ? (new URL(link)).hostname.replace('www.', '') : 'fuente'; } catch (_) { source = 'fuente'; }
                let image = it.image;
                if (!image || /^http:/.test(image)) {
                    image = 'images/logo.jpg?v=2025110501';
                }
                const tags = [];
                const push = (v) => {
                    if (!v) return;
                    if (Array.isArray(v)) {
                        v.forEach(push);
                        return;
                    }
                    if (typeof v !== 'string') return;
                    v.split(/[,;|]/).forEach(seg => {
                        const s = seg.trim();
                        if (!s) return;
                        const display = s.charAt(0).toUpperCase() + s.slice(1);
                        if (!tags.some(t => t.toLowerCase() === display.toLowerCase())) {
                            tags.push(display);
                        }
                    });
                };
                push(it.tags);
                push(it.categories);
                push(it.category);
                const publishedAt = (() => {
                    if (!pub) return null;
                    const dt = new Date(pub);
                    return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
                })();
                const displayDate = publishedAt
                    ? new Date(publishedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                    : new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                return {
                    title,
                    image,
                    summary,
                    content: summary,
                    date: displayDate,
                    publishedAt,
                    category: tags.find(t => t.toLowerCase() !== 'general') || tags[0] || 'General',
                    source,
                    link,
                    tags
                };
            });

            if (normalized.length === 0) return;
            cachedNewsItems = normalized;
            isSnapshotCache = true;
            hasRenderedSnapshot = true;
            applyNewsData(cachedNewsItems, { keepPage: true });
        } catch (err) {
            console.warn('[NEWS] Snapshot render failed:', err);
        }
    }

    async function loadAndDisplayNews(options = {}) {
        const {
            forceRefresh = false,
            keepPage = true,
            skipSnapshot = false,
            showSkeleton = true
        } = options;

        if (isLoading) {
            pendingOptions = {
                forceRefresh: (pendingOptions?.forceRefresh || false) || forceRefresh,
                keepPage: pendingOptions?.keepPage ?? keepPage,
                skipSnapshot: (pendingOptions?.skipSnapshot || false) || skipSnapshot,
                showSkeleton: pendingOptions?.showSkeleton ?? showSkeleton
            };
            return;
        }

        isLoading = true;
        try {
            if (showSkeleton && newsContainer.childElementCount === 0) {
                newsContainer.innerHTML = `
                    <div class="loading-skeleton">
                        ${Array(9).fill(0).map(() => `
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

            if (!skipSnapshot && !hasRenderedSnapshot) {
                await renderSnapshotIfNeeded();
            }

            const fetched = await fetchNews(forceRefresh || isSnapshotCache);
            if (fetched.length === 0) {
                if (newsContainer.childElementCount === 0) {
                    newsContainer.innerHTML = '<div class="no-results">No se pudieron cargar las noticias. Inténtalo más tarde.</div>';
                }
                return;
            }

            cachedNewsItems = fetched;
            isSnapshotCache = false;
            hasRenderedSnapshot = true;
            applyNewsData(cachedNewsItems, { keepPage });
        } catch (err) {
            console.error('Error loading news:', err);
            newsContainer.innerHTML = '<div class="error">Error al cargar las noticias. Por favor, inténtalo de nuevo más tarde.</div>';
        } finally {
            isLoading = false;
            if (pendingOptions) {
                const nextOpts = pendingOptions;
                pendingOptions = null;
                loadAndDisplayNews(nextOpts);
            }
        }
    }

    // Listeners de eventos
    prevPageBtns.forEach(btn => btn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadAndDisplayNews({ keepPage: true, skipSnapshot: true, showSkeleton: false });
        }
    }));
    nextPageBtns.forEach(btn => btn.addEventListener('click', () => {
        currentPage++;
        loadAndDisplayNews({ keepPage: true, skipSnapshot: true, showSkeleton: false });
    }));
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            currentPage = 1;
            currentSearch = searchInput ? searchInput.value.trim() : '';
            loadAndDisplayNews({ keepPage: false, skipSnapshot: true });
        });
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentPage = 1;
                currentSearch = searchInput.value.trim();
                loadAndDisplayNews({ keepPage: false, skipSnapshot: true });
            }
        });
    }

    // Carga inicial (forzar red para evitar caché local desactualizada)
    loadAndDisplayNews({ forceRefresh: true });

    // Eliminada interacción con chips de etiqueta (ya no se usan para filtrar)

    // Suscribirse a eventos de refresco global
    document.addEventListener(FEED_REFRESH_EVENT, () => {
        loadAndDisplayNews({ forceRefresh: true, keepPage: true, skipSnapshot: true, showSkeleton: false });
    });

    // Refresco periódico independiente por si el evento global no se dispara
    setInterval(() => {
        loadAndDisplayNews({ forceRefresh: true, keepPage: true, skipSnapshot: true, showSkeleton: false });
    }, REFRESH_INTERVAL);

    // Re-render si volvemos desde el historial con BFCache
    window.addEventListener('pageshow', (evt) => {
        if (evt.persisted) {
            loadAndDisplayNews({ keepPage: true, skipSnapshot: true, showSkeleton: false });
        }
    });
});
