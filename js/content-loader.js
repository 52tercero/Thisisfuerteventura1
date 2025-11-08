// SIN FILTROS: se muestran todas las noticias tal como llegan del feed


                if (items.length > 0) {
                    // Normalizar a la forma usada por la UI
                    const normalized = await Promise.all(items.map(async (it, idx) => {
                        const title = (it.title && (typeof it.title === 'string' ? it.title : (it.title._ || ''))) || 'Sin título';
                        const descriptionRaw = it.description || it.summary || '';
                        const description = typeof descriptionRaw === 'object' ? (descriptionRaw._ || '') : descriptionRaw;
                        const link = it.link || '';
                        const pub = it.pubDate || it.published || it.updated || '';
                        
                        // Detectar fuente desde la URL
                        let source = '';
                        try { source = link ? (new URL(link)).hostname.replace('www.', '') : (it.source || 'fuente'); } catch (e) { source = it.source || 'fuente'; }
                        }

                        const image = await extractImageFromRaw(it, link);

                        const cleaned = sanitize(description);
                        // Elegir el HTML más extenso posible: content:encoded > content > description > summary
                        const pickRichHtml = () => {
                            try {
                                const raw = it.raw || {};
                                const candidates = [
                                    raw && raw['content:encoded'],
                                    raw && raw.content,
                                    it.description,
                                    it.summary
                                ].filter(Boolean);
                                let best = '';
                                for (const c of candidates) {
                                    if (typeof c === 'string' && c.length > best.length) best = c;
                                    else if (c && typeof c === 'object' && typeof c._ === 'string' && c._.length > best.length) best = c._;
                                }
                                return best || '';
                            } catch (_) {
                                return it.description || it.summary || '';
                            }
                        };
                        const fullHtml = sanitize(pickRichHtml());
                        return {
                            title: title,
                            image: image,
                            description: cleaned,
                            summary: cleaned,
                            fullHtml,
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
                console.warn('Error fetching via proxy', err);
            }
            // If everything failed or no items found, return an empty array.
            return [];
        }
        
        // Obtener noticias y mostrarlas
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
            
            // Mezclar: distribuir artículos de todas las fuentes hasta completar 18
            let featured = [];
            const sources = Object.keys(bySource);
            let round = 0;
            while (featured.length < 18 && round < 10) {
                for (const src of sources) {
                    if (bySource[src].length > 0 && featured.length < 18) {
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
                const categoryTag = (item.category && String(item.category).toLowerCase() !== 'general')
                    ? `<span class="category-tag">${item.category}</span>`
                    : '';

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
                    <img src="${item.image}" alt="${item.title}" onerror="this.onerror=null;this.src='images/logo.jpg?v=2025110501';">
                    <div class="card-content">
                        <span class="date">${item.date}</span>
                        <h3>${item.title}</h3>
                        <p>${shortDescription}</p>
                        ${categoryTag}
                    </div>
                `;
                
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
            // Mostrar indicador de carga
            newsContainer.innerHTML = '<div class="loading">Cargando noticias...</div>';
            
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
                    const categoryTag = (item.category && String(item.category).toLowerCase() !== 'general')
                        ? `<span class="category-tag">${item.category}</span>`
                        : '';
                    
                    newsCard.innerHTML = `
                        <div class="news-image">
                            <img src="${item.image}" alt="${item.title}" onerror="this.onerror=null;this.src='images/logo.jpg?v=2025110501';">
                            ${categoryTag}
                        </div>
                        <div class="news-content">
                            <span class="news-date">${item.date}</span>
                            <h3>${item.title}</h3>
                            <p>${item.summary}</p>
                        </div>
                    `;
                    
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
                const categoryTag = (article.category && String(article.category).toLowerCase() !== 'general')
                    ? `<span class="category-tag">${article.category}</span>`
                    : '';
                articleContainer.innerHTML = `
                    <article class="news-article">
                        <header class="article-header">
                            <h1>${article.title}</h1>
                            <div class="article-meta">
                                <span class="article-date">${article.date}</span>
                            </div>
                        </header>

                        <div class="article-featured-image">
                            <img src="${article.image}" alt="${article.title}" onerror="this.onerror=null;this.src='images/Fuerteventura.jpeg?v=2025110501';">
                            ${categoryTag}
                        </div>

                        <div class="article-content">
                            ${content}
                        </div>
                    </article>
                `;
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
    
    // Función para cargar contenido específico de cada página
    function loadPageSpecificContent() {
        // Determinar la página actual basada en la URL
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        switch(currentPage) {
            case 'turismo.html':
                loadTourismContent();
                break;
            case 'alojamiento.html':
                loadAccommodationContent();
                break;
            case 'playas.html':
                loadBeachesContent();
                break;
            case 'gastronomia.html':
                loadGastronomyContent();
                break;
            // Añadir más casos según sea necesario
        }
    }
    
    // Estas funciones se implementarían para cargar contenido específico
    // En un sitio real, obtendrían datos de APIs o bases de datos
    function loadTourismContent() {
        console.log('Cargando contenido de turismo...');
        // Implementación real aquí
    }
    
    function loadAccommodationContent() {
        console.log('Cargando contenido de alojamiento...');
        // Implementación real aquí
    }
    
    function loadBeachesContent() {
        console.log('Cargando contenido de playas...');
        // Implementación real aquí
    }
    
    function loadGastronomyContent() {
        console.log('Cargando contenido de gastronomía...');
        // Implementación real aquí
    }
    
    // Cargar contenido específico de la página
    loadPageSpecificContent();
    
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
