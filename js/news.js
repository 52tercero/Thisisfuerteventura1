document.addEventListener('DOMContentLoaded', function() {
    // Listado simple de noticias, paginación y filtrado para noticias.html
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;

    // Variables para la paginación y filtrado
    let currentPage = 1;
    const itemsPerPage = 9;
    let currentCategory = 'all';
    let currentSort = 'newest';
    let currentSearch = '';

    // Controles del DOM (si existen)
    const prevPageBtns = [document.getElementById('prev-page'), document.getElementById('prev-page-top')].filter(Boolean);
    const nextPageBtns = [document.getElementById('next-page'), document.getElementById('next-page-top')].filter(Boolean);
    const pageInfos = [document.getElementById('page-info'), document.getElementById('page-info-top')].filter(Boolean);
    const categoryFilter = document.getElementById('category-filter');
    const dateFilter = document.getElementById('date-filter');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const searchInput = document.getElementById('news-search');
    const searchBtn = document.getElementById('search-btn');

    // Formatea fecha (igual que en content-loader.js)
    function formatDate(date) {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }

    // Intentar obtener noticias vía proxy local (si está disponible)
    async function fetchNews() {
        const newsSources = [
            'https://www.canarias7.es/canarias/fuerteventura/',
            'https://www.laprovincia.es/fuerteventura/',
            'https://www.cabildofuer.es/cabildo/noticias/',
            'https://www.radioinsular.es',
            'https://www.fuerteventuradigital.com',
            'https://ondafuerteventura.es',

        ];

        // Intentar descubrimiento automático de un proxy local en ejecución (cacheado). Recurre a window.__RSS_PROXY_URL o puertos 3000/3001/3002.
        async function discoverLocalProxy() {
            if (window.__RSS_PROXY_URL) return window.__RSS_PROXY_URL;
            try {
                if (window.discoverRSSProxy) {
                    const u = await window.discoverRSSProxy();
                    if (u) return u;
                }
            } catch (_) {}
            const candidates = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
            for (const base of candidates) {
                try {
                    const r = await fetch(`${base}/health`, { method: 'GET', cache: 'no-store' });
                    if (r.ok) return base;
                } catch (_) { /* siguiente candidato */ }
            }
            return 'http://localhost:3000';
        }

        const proxyBase = await discoverLocalProxy();

        // Auxiliar: sanitizador básico y extracción de medios
        function sanitizeHTML(str) {
            if (!str) return '';
            str = str.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
            str = str.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
            str = str.replace(/\son\w+=\"[^\"]*\"/gi, '');
            str = str.replace(/\son\w+='[^']*'/gi, '');
            str = str.replace(/href=\"\s*javascript:[^\"]*\"/gi, 'href="#"');
            return str;
        }

        // Preferir DOMPurify si está disponible para sanitización más fuerte
        function sanitize(str) {
            try {
                if (window.DOMPurify && typeof DOMPurify.sanitize === 'function') {
                    return DOMPurify.sanitize(str);
                }
            } catch (e) {
                // fallback
            }
            return sanitizeHTML(str);
        }

        // Usar el extractor robusto si está disponible (image-extractor.js)
        async function extractImageFromRaw(it, sourceUrl = '') {
            if (window.ImageExtractor && typeof window.ImageExtractor.extractImageFromItem === 'function') {
                return await window.ImageExtractor.extractImageFromItem(it, { validate: false, sourceUrl });
            }
            
            // Fallback simple si el módulo no está cargado
            if (!it) return 'images/logo.jpg';
            if (it.image && typeof it.image === 'string') return it.image;
            if (it.raw?.image_url) return it.raw.image_url;
            
            const raw = it.raw || {};
            if (raw.enclosure) {
                if (typeof raw.enclosure === 'string') return raw.enclosure;
                if (raw.enclosure.url) return raw.enclosure.url;
            }
            
            const desc = it.description || it.summary || '';
            const descStr = typeof desc === 'object' ? (desc._ || '') : String(desc);
            if (descStr) {
                const match = descStr.match(/<img[^>]+src=["']([^"']+)["']/i);
                if (match && match[1]) return match[1];
            }
            
            return 'images/logo.jpg';
        }

        function cacheGet(key, ttl = 1000 * 60 * 15) {
            try {
                const raw = localStorage.getItem(key);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                if (!parsed || !parsed.ts) return null;
                if (Date.now() - parsed.ts > ttl) { localStorage.removeItem(key); return null; }
                return parsed.items || null;
            } catch (e) { return null; }
        }

        function cacheSet(key, items) {
            try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), items })); } catch (e) { /* ignore */ }
        }

        // Sin fallback simulado: si el proxy no devuelve elementos, retornaremos un array vacío

        // Intentar obtener feeds del proxy en paralelo y normalizar resultados
        try {
            // Preferir endpoint aggregate (una sola llamada)
            const aggKey = 'rss_cache_v2_media_AGG';
            let items = cacheGet(aggKey);
            if (!items) {
                const aggUrl = `${proxyBase}/api/aggregate?sources=${encodeURIComponent(newsSources.join(','))}&dedupe=0`;
                try {
                    const r = await fetch(aggUrl);
                    if (!r.ok) throw new Error('bad response');
                    const json = await r.json();
                    items = Array.isArray(json.items) ? json.items : [];
                    cacheSet(aggKey, items);
                } catch (e) {
                    console.warn('Falló obtención agregada, fallback por fuente:', e && e.message);
                    const fetches = newsSources.map(async (src) => {
                        const cacheKey = 'rss_cache_v2_media_' + btoa(src);
                        const cached = cacheGet(cacheKey);
                        if (cached) return cached;
                        try {
                            const rr = await fetch(`${proxyBase}/api/rss?url=${encodeURIComponent(src)}`);
                            if (!rr.ok) throw new Error('bad response');
                            const jj = await rr.json();
                            const its = Array.isArray(jj.items) ? jj.items : [];
                            cacheSet(cacheKey, its);
                            return its;
                        } catch (err) {
                            console.warn('Falló obtención del proxy para', src, err && err.message);
                            return [];
                        }
                    });
                    const results = await Promise.all(fetches);
                    items = results.flat();
                }
            }

            // Mezclar con newsdata.io si está disponible
            try {
                const newsdataKey = 'newsdata_cache_v1';
                let newsdataItems = cacheGet(newsdataKey);
                if (!newsdataItems) {
                    const newsdataUrl = `${proxyBase}/api/newsdata?q=fuerteventura&country=es&language=es`;
                    const nr = await fetch(newsdataUrl);
                    if (nr.ok) {
                        const nj = await nr.json();
                        newsdataItems = Array.isArray(nj.items) ? nj.items : [];
                        cacheSet(newsdataKey, newsdataItems);
                        items = items.concat(newsdataItems);
                    }
                } else {
                    items = items.concat(newsdataItems);
                }
            } catch (e) {
                console.warn('newsdata.io no disponible:', e && e.message);
            }

            // SIN FILTROS: se muestran todas las noticias tal como llegan del feed

            if (items.length > 0) {
                // Normalizar a la forma usada por la UI
                const normalized = await Promise.all(items.map(async (it, idx) => {
                    const title = (it.title && (typeof it.title === 'string' ? it.title : (it.title._ || ''))) || 'Sin título';
                    const descriptionRaw = it.description || it.summary || '';
                    const description = typeof descriptionRaw === 'object' ? (descriptionRaw._ || '') : descriptionRaw;
                    const link = it.link || '';
                    const pub = it.pubDate || it.published || it.updated || '';
                    let source = '';
                    try { source = link ? (new URL(link)).hostname.replace('www.', '') : (it.source || 'fuente'); } catch (e) { source = it.source || 'fuente'; }

                    const image = await extractImageFromRaw(it, link);

                    const cleaned = sanitize(description);
                    return {
                        title: title,
                        image: image,
                        description: cleaned,
                        summary: cleaned,
                        date: pub ? formatDate(new Date(pub)) : formatDate(new Date()),
                        category: it.category || 'General',
                        source,
                        link,
                        raw: it.raw
                    };
                }));
                return normalized;
            }
        } catch (err) {
            console.warn('Error al obtener vía proxy', err);
        }

        // Si el proxy no devolvió elementos o ocurrió un error, retornar un array vacío
        return [];
    }

    function filterNews(news) {
        return news.filter(item => {
            if (currentCategory !== 'all' && item.category.toLowerCase() !== currentCategory.toLowerCase()) {
                return false;
            }

            if (currentSearch && !item.title.toLowerCase().includes(currentSearch.toLowerCase()) && !item.summary.toLowerCase().includes(currentSearch.toLowerCase())) {
                return false;
            }

            return true;
        });
    }

    function sortNews(news) {
        return news.sort((a, b) => {
            const dateA = new Date(a.date.split(' de ').reverse().join(' '));
            const dateB = new Date(b.date.split(' de ').reverse().join(' '));
            if (currentSort === 'newest') return dateB - dateA;
            return dateA - dateB;
        });
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

    async function loadAndDisplayNews() {
        newsContainer.innerHTML = '<div class="loading">Cargando noticias...</div>';
        try {
            const allNews = await fetchNews();
            const filtered = filterNews(allNews);
            const sorted = sortNews(filtered);
            const pageItems = paginateNews(sorted);
            updatePaginationInfo(filtered.length);

            newsContainer.innerHTML = '';
            if (pageItems.length === 0) {
                newsContainer.innerHTML = '<div class="no-results">No se encontraron noticias que coincidan con tu búsqueda.</div>';
                return;
            }

            pageItems.forEach(item => {
                const card = document.createElement('div');
                card.className = 'content-card';
                const categoryTag = (item.category && String(item.category).toLowerCase() !== 'general')
                    ? `<span class="category-tag">${item.category}</span>`
                    : '';

                // Resumen compacto en texto plano (150 caracteres)
                const fullText = (item.summary || item.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                const shortSummary = fullText.length > 150 
                    ? fullText.slice(0, 150) + '...' 
                    : fullText;

                // Crear ID único para el artículo
                const articleId = btoa(encodeURIComponent(item.title + item.date)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);

                // Guardar artículo completo en localStorage
                try {
                    localStorage.setItem(`article_${articleId}`, JSON.stringify(item));
                } catch (e) {
                    console.warn('Error guardando artículo en localStorage:', e);
                }

                card.innerHTML = `
                    <img src="${item.image}" alt="${item.title}" onerror="this.onerror=null;this.src='images/logo.jpg';">
                    <div class="card-content">
                        <span class="date">${item.date}</span>
                        <h3>${item.title}</h3>
                        <p>${shortSummary}</p>
                        ${categoryTag}
                    </div>
                `;

                const readMoreBtn = document.createElement('a');
                readMoreBtn.href = `noticia.html?id=${articleId}`;
                readMoreBtn.className = 'btn';
                readMoreBtn.textContent = 'Leer más';
                card.querySelector('.card-content').appendChild(readMoreBtn);

                newsContainer.appendChild(card);
            });
        } catch (err) {
            console.error('Error loading news:', err);
            newsContainer.innerHTML = '<div class="error">Error al cargar las noticias. Por favor, inténtalo de nuevo más tarde.</div>';
        }
    }

    // Listeners de eventos
    prevPageBtns.forEach(btn => btn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadAndDisplayNews(); } }));
    nextPageBtns.forEach(btn => btn.addEventListener('click', () => { currentPage++; loadAndDisplayNews(); }));
    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', () => { currentPage = 1; if (categoryFilter) currentCategory = categoryFilter.value; if (dateFilter) currentSort = dateFilter.value; loadAndDisplayNews(); });
    if (searchBtn) searchBtn.addEventListener('click', () => { currentPage = 1; currentSearch = searchInput ? searchInput.value.trim() : ''; loadAndDisplayNews(); });
    if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { currentPage = 1; currentSearch = searchInput.value.trim(); loadAndDisplayNews(); } });

    // Carga inicial
    loadAndDisplayNews();

    // Re-render si volvemos desde el historial con BFCache
    window.addEventListener('pageshow', (evt) => {
        if (evt.persisted) {
            loadAndDisplayNews();
        }
    });
});
