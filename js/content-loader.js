document.addEventListener('DOMContentLoaded', async function() {
    // Escapar texto plano para insertarlo en innerHTML/atributos
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
        
        // Fuentes de noticias (RSS feeds de sitios de noticias sobre Fuerteventura/Canarias)
        // Fuentes RSS agregadas desde rss.app
        const newsSources = [
            'https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml',
            'https://rss.app/feeds/8SmCQL7GDZyu2xB4.xml',
            'https://rss.app/feeds/IchTPp234IVDaH7V.xml',
            'https://rss.app/feeds/cNktFJXkoIBwqQSS.xml',
            'https://rss.app/feeds/pGaOMTfcwV2mzdy7.xml'
        ];
        
    // Función para obtener y parsear feeds RSS (delegada a FeedUtils)
        async function fetchRSSFeeds() {
            try {
                if (window.FeedUtils && typeof FeedUtils.fetchRSSFeeds === 'function') {
                    return await FeedUtils.fetchRSSFeeds(newsSources);
                }
            } catch (e) {
                console.warn('[CONTENT-LOADER] FeedUtils.fetchRSSFeeds failed:', e);
            }
            // Fallback: sin utilidades cargadas, devolver vacío
            return [];
        }
        
        // Intentar snapshot estático para primer render rápido
        (async () => {
            try {
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
                                category: 'General',
                                source,
                                link,
                                raw: {}
                            };
                        }));

                        // Render rápido desde snapshot (hasta 12)
                        featuredNewsContainer.innerHTML = '';
                        const bySource = {};
                        normalized.forEach(item => {
                            const src = item.source || 'desconocido';
                            if (!bySource[src]) bySource[src] = [];
                            bySource[src].push(item);
                        });
                        let featured = [];
                        const sources = Object.keys(bySource);
                        let round = 0;
                        while (featured.length < 12 && round < 10) {
                            for (const src of sources) {
                                if (bySource[src].length > 0 && featured.length < 12) {
                                    featured.push(bySource[src].shift());
                                }
                            }
                            round++;
                        }
                        featured.forEach((item) => {
                            const card = document.createElement('div');
                            card.className = 'content-card';
                            const fullText = (item.description || item.summary || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                            const shortDescription = fullText.length > 150 ? fullText.slice(0, 150) + '...' : fullText;
                            const articleId = btoa(encodeURIComponent(item.title + item.date)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
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
                    }
                }
            } catch (_) {
                // snapshot no disponible; seguimos flujo normal
            }
        })();

        // Obtener noticias y (re)mostrarlas con datos frescos
        fetchRSSFeeds().then(newsItems => {
            console.log('[CONTENT-LOADER] Noticias recibidas:', newsItems.length);
            
            // Eliminar mensaje de carga
            featuredNewsContainer.innerHTML = '';
            
            // Si no hay noticias
            if (newsItems.length === 0) {
                console.error('[CONTENT-LOADER] No hay noticias para mostrar');
                featuredNewsContainer.innerHTML = '<div class="no-news">No se pudieron cargar las noticias. Inténtalo más tarde.</div>';
                return;
            }
            
            // Agrupar por fuente y tomar artículos de forma balanceada
            const bySource = {};
            newsItems.forEach(item => {
                const src = item.source || 'desconocido';
                if (!bySource[src]) bySource[src] = [];
                bySource[src].push(item);
            });
            
            // Mezclar: distribuir artículos de todas las fuentes hasta completar 12 (reducido de 18)
            let featured = [];
            const sources = Object.keys(bySource);
            let round = 0;
            while (featured.length < 12 && round < 10) {
                for (const src of sources) {
                    if (bySource[src].length > 0 && featured.length < 12) {
                        featured.push(bySource[src].shift());
                    }
                }
                round++;
            }
            
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

                // Crear ID único para el artículo basado en título y fecha
                const articleId = btoa(encodeURIComponent(item.title + item.date)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
                
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
        });
    }
    
    // Función para formatear fechas
    function formatDate(date) {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }
    
    // Cargar noticias destacadas
    loadFeaturedNews();
    
    // Función para cargar noticias completas
    function loadFullNewsPage() {
        const newsContainer = document.getElementById('news-container');
        
        if (!newsContainer) return;
        
        // Variables para paginación y filtrado
        let currentPage = 1;
        const itemsPerPage = 9;
        let currentCategory = 'all';
        let currentSort = 'newest';
        let currentSearch = '';
        
        // Elementos de control
    const prevPageBtns = [document.getElementById('prev-page'), document.getElementById('prev-page-top')].filter(Boolean);
    const nextPageBtns = [document.getElementById('next-page'), document.getElementById('next-page-top')].filter(Boolean);
    const pageInfos = [document.getElementById('page-info'), document.getElementById('page-info-top')].filter(Boolean);
        const categoryFilter = document.getElementById('category-filter');
        const dateFilter = document.getElementById('date-filter');
        const applyFiltersBtn = document.getElementById('apply-filters');
        const searchInput = document.getElementById('news-search');
        const searchBtn = document.getElementById('search-btn');
        
        // Función para obtener noticias: use the shared RSS fetcher which queries the proxy
        async function fetchNews() {
            try {
                const items = await fetchRSSFeeds();
                // Map normalized items to the structure expected by the list UI
                return items.map((it, idx) => ({
                    id: idx + 1,
                    title: it.title,
                    image: it.image,
                    summary: it.summary || it.description || '',
                    content: it.description || '',
                    date: it.date,
                    category: it.category,
                    source: it.source,
                    tags: it.tags || []
                }));
            } catch (e) {
                console.warn('Error fetching news for full page', e);
                return [];
            }
        }
        
        // Función para filtrar noticias
        function filterNews(news) {
            return news.filter(item => {
                // Filtrar por categoría
                if (currentCategory !== 'all' && item.category.toLowerCase() !== currentCategory.toLowerCase()) {
                    return false;
                }
                
                // Filtrar por búsqueda
                if (currentSearch && !item.title.toLowerCase().includes(currentSearch.toLowerCase()) && 
                    !item.summary.toLowerCase().includes(currentSearch.toLowerCase())) {
                    return false;
                }
                
                return true;
            });
        }
        
        // Función para ordenar noticias
        function sortNews(news) {
            return news.sort((a, b) => {
                const dateA = new Date(a.date.split(' de ').reverse().join(' '));
                const dateB = new Date(b.date.split(' de ').reverse().join(' '));
                
                if (currentSort === 'newest') {
                    return dateB - dateA;
                } else {
                    return dateA - dateB;
                }
            });
        }
        
        // Función para paginar noticias
        function paginateNews(news) {
            const startIndex = (currentPage - 1) * itemsPerPage;
            return news.slice(startIndex, startIndex + itemsPerPage);
        }
        
        // Función para actualizar la información de paginación
        function updatePaginationInfo(totalItems) {
            const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
            pageInfos.forEach(el => { el.textContent = `Página ${currentPage} de ${totalPages}`; });
            prevPageBtns.forEach(btn => { btn.disabled = currentPage === 1; });
            nextPageBtns.forEach(btn => { btn.disabled = currentPage === totalPages; });
        }
        
        // Función para cargar y mostrar noticias
        async function loadAndDisplayNews() {
            // Mostrar skeleton loader en lugar de mensaje simple
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
            
            try {
                // Obtener todas las noticias
                const allNews = await fetchNews();
                
                // Filtrar noticias
                const filteredNews = filterNews(allNews);
                
                // Ordenar noticias
                const sortedNews = sortNews(filteredNews);
                
                // Paginar noticias
                const paginatedNews = paginateNews(sortedNews);
                
                // Actualizar información de paginación
                updatePaginationInfo(filteredNews.length);
                
                // Limpiar contenedor
                newsContainer.innerHTML = '';
                
                // Si no hay resultados
                if (paginatedNews.length === 0) {
                    newsContainer.innerHTML = '<div class="no-results">No se encontraron noticias que coincidan con tu búsqueda.</div>';
                    return;
                }
                
                // Mostrar noticias
                paginatedNews.forEach(item => {
                    const newsCard = document.createElement('div');
                    newsCard.className = 'news-card';
                    
                    newsCard.innerHTML = `
                        <div class="news-image">
                            <img src="${toImageSrc(item.image)}" alt="${escapeHTML(item.title)}" loading="lazy" referrerpolicy="no-referrer">
                        </div>
                        <div class="news-content">
                            <span class="news-date">${escapeHTML(item.date)}</span>
                            <h3>${escapeHTML(item.title)}</h3>
                            <p>${item.summary}</p>
                        </div>
                    `;
                    const imgNews = newsCard.querySelector('img');
                    if (imgNews) {
                        imgNews.addEventListener('error', () => { imgNews.src = 'images/logo.jpg?v=2025110501'; });
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
                
            } catch (error) {
                console.error('Error al cargar noticias:', error);
                newsContainer.innerHTML = '<div class="error">Error al cargar las noticias. Por favor, inténtalo de nuevo más tarde.</div>';
            }
        }
        
        // Configurar eventos para controles de paginación y filtrado
        prevPageBtns.forEach(btn => btn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadAndDisplayNews();
            }
        }));
        
        nextPageBtns.forEach(btn => btn.addEventListener('click', () => {
            currentPage++;
            loadAndDisplayNews();
        }));
        
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                currentPage = 1;
                
                if (categoryFilter) {
                    currentCategory = categoryFilter.value;
                }
                
                if (dateFilter) {
                    currentSort = dateFilter.value;
                }
                
                loadAndDisplayNews();
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                currentPage = 1;
                currentSearch = searchInput ? searchInput.value.trim() : '';
                loadAndDisplayNews();
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    currentPage = 1;
                    currentSearch = searchInput.value.trim();
                    loadAndDisplayNews();
                }
            });
        }
        
        // Cargar noticias inicialmente
        loadAndDisplayNews();
    }
    
    // Cargar página completa de noticias si estamos en esa página
    if (window.location.pathname.includes('noticias.html')) {
        loadFullNewsPage();
    }
    
    // Función para cargar una noticia individual
    function loadSingleNews() {
        const articleContainer = document.getElementById('article-container');
        
        if (!articleContainer) return;
        
        // Obtener ID de la noticia de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const newsId = urlParams.get('id');
        const newsTitle = urlParams.get('title');
        
        if (!newsId && !newsTitle) {
            articleContainer.innerHTML = '<div class="error">Noticia no encontrada</div>';
            return;
        }
        
        // Mostrar indicador de carga
        articleContainer.innerHTML = '<div class="loading">Cargando noticia...</div>';
        
        // Try to fetch article data from the feeds (requires the proxy to be running)
        (async () => {
            try {
                const items = await fetchRSSFeeds();
                let article = null;
                if (newsTitle) {
                    article = items.find(it => it.title === newsTitle);
                }
                if (!article && newsId) {
                    const idx = parseInt(newsId, 10) - 1;
                    if (!Number.isNaN(idx) && items[idx]) article = items[idx];
                }

                if (!article) {
                    articleContainer.innerHTML = '<div class="no-news">Noticia no disponible. Asegúrate de que el proxy esté en funcionamiento y que la fuente esté permitida.</div>';
                    return;
                }

                // Render the found article
                // Si la imagen extraída es el logo (fallback de feeds) o está vacía, usar la imagen escénica local
                if (!article.image || /images\/logo\.jpg(\?v=.*)?$/i.test(article.image)) {
                    article.image = 'images/Fuerteventura.jpeg?v=2025110501';
                }
                const content = article.description || article.summary || '';
                articleContainer.innerHTML = `
                    <article class="news-article">
                        <header class="article-header">
                            <h1>${escapeHTML(article.title)}</h1>
                            <div class="article-meta">
                                <span class="article-date">${escapeHTML(article.date)}</span>
                            </div>
                        </header>

                        <div class="article-featured-image">
                            <img src="${toImageSrc(article.image)}" alt="${escapeHTML(article.title)}" referrerpolicy="no-referrer">
                        </div>

                        <div class="article-content">
                            ${content}
                        </div>
                `;
                const artImg = articleContainer.querySelector('.article-featured-image img');
                if (artImg) {
                    artImg.addEventListener('error', () => { artImg.src = 'images/Fuerteventura.jpeg?v=2025110501'; });
                }
            } catch (e) {
                console.error('Error loading article:', e);
                articleContainer.innerHTML = '<div class="error">Error al cargar la noticia.</div>';
            }
        })();
    }
    
    // Cargar noticia individual si estamos en esa página
    if (window.location.pathname.includes('noticia.html')) {
        loadSingleNews();
    }

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
            
            if (document.getElementById('news-container') && window.location.pathname.includes('noticias.html')) {
                // Mantener los filtros y página actuales al actualizar
                loadFullNewsPage();
            }
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
                if (document.getElementById('news-container') && window.location.pathname.includes('noticias.html')) {
                    // Rehidratar listado con filtros actuales
                    if (typeof loadFullNewsPage === 'function') {
                        loadFullNewsPage();
                    }
                }
            } catch (e) {
                console.warn('BFCache re-render failed:', e);
            }
        }
    });
});

