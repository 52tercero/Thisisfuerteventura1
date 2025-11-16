document.addEventListener('DOMContentLoaded', function() {
    // Escapar texto plano para uso en innerHTML/atributos
    function escapeHTML(str) {
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

    // Formatea fecha (igual que en content-loader.js)
    function formatDate(date) {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }

    // Obtener noticias delegando a FeedUtils para evitar duplicación
    async function fetchNews() {
        try {
            const sources = [
                'https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml',
                'https://rss.app/feeds/8SmCQL7GDZyu2xB4.xml',
                'https://rss.app/feeds/IchTPp234IVDaH7V.xml',
                'https://rss.app/feeds/cNktFJXkoIBwqQSS.xml',
                'https://rss.app/feeds/pGaOMTfcwV2mzdy7.xml'
            ];
            if (window.FeedUtils && typeof FeedUtils.fetchRSSFeeds === 'function') {
                const items = await FeedUtils.fetchRSSFeeds(sources);
                // Adaptar forma esperada por listado
                return items.map((it, idx) => ({
                    id: idx + 1,
                    title: it.title,
                    image: it.image,
                    summary: it.summary || it.description || '',
                    content: it.fullHtml || it.description || '',
                    date: it.date,
                    category: it.category,
                    tags: Array.isArray(it.tags) ? it.tags : [],
                    source: it.source,
                    link: it.link
                }));
            }
        } catch (e) {
            console.warn('[NEWS] FeedUtils.fetchRSSFeeds failed:', e);
        }
        return [];
    }

    function filterNews(news) {
        return news.filter(item => {
            if (currentSearch) {
                const s = currentSearch.toLowerCase();
                return item.title.toLowerCase().includes(s) || item.summary.toLowerCase().includes(s);
            }
            return true;
        });
    }

    function sortNews(news) {
        // Por defecto siempre más recientes primero
        return news.sort((a, b) => {
            const dateA = new Date(a.date.split(' de ').reverse().join(' '));
            const dateB = new Date(b.date.split(' de ').reverse().join(' '));
            return dateB - dateA;
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

    // Función eliminada: populateCategoryFilterFrom (no se necesita)

    async function loadAndDisplayNews() {
        // Mostrar loading solo si no hay SSR/SSG previo
        if (!newsContainer.querySelector('.news-card') && !newsContainer.querySelector('.content-card')) {
            newsContainer.innerHTML = '<div class="loading">Cargando noticias...</div>';
        }
        try {
            // Primer render desde snapshot si existe
            try {
                const snapRes = await fetch('/data/feeds.json', { cache: 'no-store' });
                if (snapRes.ok) {
                    const snap = await snapRes.json();
                    const items = Array.isArray(snap.items) ? snap.items : [];
                    if (items.length > 0 && !newsContainer.querySelector('.news-card')) {
                        const normalized = items.map((it, idx) => {
                            const title = it.title || 'Sin título';
                            const description = (it.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                            const link = it.link || '';
                            const pub = it.pubDate || '';
                            let source = '';
                            try { source = link ? (new URL(link)).hostname.replace('www.', '') : 'fuente'; } catch (_) { source = 'fuente'; }
                            const dateStr = pub ? new Date(pub) : new Date();
                            const img = (it.image && /^https:\/\//.test(it.image)) ? it.image : 'images/logo.jpg?v=2025110501';
                            // Extraer etiquetas simples del snapshot si existen
                            const tags = [];
                            const push = (v) => { if (!v) return; (Array.isArray(v) ? v : String(v).split(/[,;|]/)).forEach(s => { s = String(s).trim(); if (!s) return; if (!tags.some(t => t.toLowerCase() === s.toLowerCase())) tags.push(s.charAt(0).toUpperCase() + s.slice(1)); }); };
                            push(it.tags);
                            push(it.categories);
                            push(it.category);
                            return {
                                id: idx + 1,
                                title,
                                image: img,
                                summary: description,
                                content: description,
                                date: dateStr.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
                                category: tags.find(t => t.toLowerCase() !== 'general') || tags[0] || 'General',
                                source,
                                link,
                                tags
                            };
                        });
                        const filtered = filterNews(normalized);
                        const sorted = sortNews(filtered);
                        const pageItems = paginateNews(sorted);
                        updatePaginationInfo(filtered.length);
                        newsContainer.innerHTML = '';
                        pageItems.forEach(item => {
                            const newsCard = document.createElement('div');
                            newsCard.className = 'news-card';
                            const categoryTag = (item.category && String(item.category).toLowerCase() !== 'general')
                                ? `<span class="category-tag">${item.category}</span>`
                                : '';
                            const tagChips = (Array.isArray(item.tags) && item.tags.length > 0)
                                ? `<div class="tag-chips">${item.tags.slice(0,3).map(t => `<button class="tag-chip" data-tag="${t}">${t}</button>`).join(' ')}</div>`
                                : '';
                            newsCard.innerHTML = `
                                <div class="news-image">
                                    <img src="${toImageSrc(item.image)}" alt="${escapeHTML(item.title)}" loading="lazy" referrerpolicy="no-referrer">
                                    ${categoryTag}
                                </div>
                                <div class="news-content">
                                    <span class="news-date">${escapeHTML(item.date)}</span>
                                    <h3>${escapeHTML(item.title)}</h3>
                                    <p>${item.summary}</p>
                                    ${tagChips}
                                </div>
                            `;
                            const imgSnap = newsCard.querySelector('img');
                            if (imgSnap) {
                                imgSnap.addEventListener('error', () => { imgSnap.src = 'images/logo.jpg?v=2025110501'; });
                            }
                            const readMoreBtn = document.createElement('a');
                            readMoreBtn.href = item.link || '#';
                            readMoreBtn.target = '_blank';
                            readMoreBtn.rel = 'noopener noreferrer';
                            readMoreBtn.className = 'btn';
                            readMoreBtn.textContent = 'Leer más';
                            newsCard.querySelector('.news-content').appendChild(readMoreBtn);
                            newsContainer.appendChild(newsCard);
                        });
                    }
                }
            } catch (_) {}

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
                const tagChips = (Array.isArray(item.tags) && item.tags.length > 0)
                    ? `<div class="tag-chips">${item.tags.slice(0,3).map(t => `<button class="tag-chip" data-tag="${t}">${t}</button>`).join(' ')}</div>`
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
                    <img src="${toImageSrc(item.image)}" alt="${escapeHTML(item.title)}" loading="lazy" referrerpolicy="no-referrer">
                    <div class="card-content">
                        <span class="date">${escapeHTML(item.date)}</span>
                        <h3>${escapeHTML(item.title)}</h3>
                        <p>${shortSummary}</p>
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
        } catch (err) {
            console.error('Error loading news:', err);
            newsContainer.innerHTML = '<div class="error">Error al cargar las noticias. Por favor, inténtalo de nuevo más tarde.</div>';
        }
    }

    // Listeners de eventos
    prevPageBtns.forEach(btn => btn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadAndDisplayNews(); } }));
    nextPageBtns.forEach(btn => btn.addEventListener('click', () => { currentPage++; loadAndDisplayNews(); }));
    if (searchBtn) searchBtn.addEventListener('click', () => { currentPage = 1; currentSearch = searchInput ? searchInput.value.trim() : ''; loadAndDisplayNews(); });
    if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { currentPage = 1; currentSearch = searchInput.value.trim(); loadAndDisplayNews(); } });

    // Carga inicial
    loadAndDisplayNews();

    // Eliminada interacción con chips de etiqueta (ya no se usan para filtrar)

    // Re-render si volvemos desde el historial con BFCache
    window.addEventListener('pageshow', (evt) => {
        if (evt.persisted) {
            loadAndDisplayNews();
        }
    });
});
