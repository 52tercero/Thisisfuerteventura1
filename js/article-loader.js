// article-loader.js - Carga un artículo individual desde localStorage o desde el servidor
/**
 * article-loader.js
 *
 * Carga un artículo individual desde localStorage utilizando el parámetro ?id= en la URL.
 * Seguridad y UX:
 * - Valida que el id sea alfanumérico (1-64) para evitar inyecciones.
 * - Sanitiza HTML enriquecido con DOMPurify si está disponible.
 * - Escapa cadenas de texto (título, categoría, fuente) antes de insertarlas en innerHTML.
 * - Actualiza/crea meta tags OG/Twitter cuando faltan para mejorar el compartir.
 */

document.addEventListener('DOMContentLoaded', () => {
    const articleContainer = document.getElementById('article-container');
    
    if (!articleContainer) {
        console.error('Article container not found');
        return;
    }

    // Obtener ID del artículo desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    // Validar que el ID sea alfanumérico y de longitud razonable
    if (!articleId || !/^[a-zA-Z0-9]{1,64}$/.test(articleId)) {
        articleContainer.innerHTML = `
            <div class="error">
                <h2>Artículo no encontrado</h2>
                <p>No se ha especificado un artículo válido.</p>
                <a href="noticias.html" class="btn">Ver todas las noticias</a>
            </div>
        `;
        return;
    }

    // Intentar cargar desde localStorage primero
    try {
        const storedArticle = localStorage.getItem(`article_${articleId}`);
        if (storedArticle) {
            const article = JSON.parse(storedArticle);
            console.log('[ARTICLE] Loaded article from localStorage:', article);
            console.log('[ARTICLE] Article title:', article.title);
            console.log('[ARTICLE] Article raw:', article.raw);
            console.log('[ARTICLE] Article link:', article.link);
            console.log('[ARTICLE] Article description length:', (article.description || '').length);
            console.log('[ARTICLE] Article fullHtml length:', (article.fullHtml || '').length);
            displayArticle(article);
            return;
        }
    } catch (e) {
        console.warn('Error loading from localStorage:', e);
    }

    // Si no está en localStorage, mostrar error
    articleContainer.innerHTML = `
        <div class="error">
            <h2>Artículo no disponible</h2>
            <p>Este artículo ya no está disponible en caché. Por favor, vuelve a la página de noticias.</p>
            <a href="noticias.html" class="btn">Ver todas las noticias</a>
        </div>
    `;

    function displayArticle(article) {
        // Validar que el artículo tenga los campos mínimos necesarios
        if (!article || !article.title) {
            articleContainer.innerHTML = `
                <div class="error">
                    <h2>Datos del artículo incompletos</h2>
                    <p>El artículo no contiene información válida.</p>
                    <a href="noticias.html" class="btn">Ver todas las noticias</a>
                </div>
            `;
            return;
        }

        // Sanitizar contenido si DOMPurify está disponible
        const sanitize = (html) => {
            if (typeof DOMPurify !== 'undefined') {
                return DOMPurify.sanitize(html);
            }
            return html;
        };

        // Escapar texto plano para evitar inyección al usar innerHTML
        const escapeHTML = (str) => {
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
        };

        // Extraer videos del feed (YouTube, Vimeo, enclosures de video)
        const extractVideos = () => {
            const videos = [];
            const raw = article.raw || {};
            
            console.log('[VIDEO] Extracting videos from article:', article.title);
            console.log('[VIDEO] Raw data:', raw);
            
            // 1. Buscar en enclosures de tipo video
            if (raw.enclosure) {
                const enc = Array.isArray(raw.enclosure) ? raw.enclosure : [raw.enclosure];
                enc.forEach(e => {
                    if (e && e.url && e.type && e.type.startsWith('video/')) {
                        console.log('[VIDEO] Found video in enclosure:', e.url);
                        videos.push({ type: 'direct', url: e.url, mime: e.type });
                    }
                });
            }
            
            // 2. Buscar en media:content de tipo video
            if (raw['media:content']) {
                const mc = Array.isArray(raw['media:content']) ? raw['media:content'] : [raw['media:content']];
                mc.forEach(m => {
                    if (m && m.url && m.type && m.type.startsWith('video/')) {
                        console.log('[VIDEO] Found video in media:content:', m.url);
                        videos.push({ type: 'direct', url: m.url, mime: m.type });
                    } else if (m && m.url && m.medium === 'video') {
                        console.log('[VIDEO] Found video in media:content (medium):', m.url);
                        videos.push({ type: 'direct', url: m.url, mime: 'video/mp4' });
                    }
                });
            }
            
            // 3. Buscar URLs de YouTube en el contenido, link y description
            const searchContent = [
                article.fullHtml || '',
                article.description || '',
                article.summary || '',
                article.content || '',
                article.link || '',
                raw.description || '',
                raw.content || '',
                raw['content:encoded'] || ''
            ].join(' ');
            
            console.log('[VIDEO] Searching for YouTube/Vimeo in content (length:', searchContent.length, ')');
            
            const youtubePatterns = [
                /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/gi,
                /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/gi,
                /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/gi
            ];
            
            youtubePatterns.forEach(pattern => {
                let match;
                const regex = new RegExp(pattern);
                while ((match = regex.exec(searchContent)) !== null) {
                    const videoId = match[1];
                    if (!videos.some(v => v.videoId === videoId)) {
                        console.log('[VIDEO] Found YouTube video:', videoId);
                        videos.push({ type: 'youtube', videoId });
                    }
                }
            });
            
            // 4. Buscar URLs de Vimeo
            const vimeoPattern = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/gi;
            let vimeoMatch;
            while ((vimeoMatch = vimeoPattern.exec(searchContent)) !== null) {
                const videoId = vimeoMatch[1];
                if (!videos.some(v => v.videoId === videoId && v.type === 'vimeo')) {
                    console.log('[VIDEO] Found Vimeo video:', videoId);
                    videos.push({ type: 'vimeo', videoId });
                }
            }
            
            console.log('[VIDEO] Total videos found:', videos.length);
            return videos;
        };

        // Generar HTML para embeds de video
        const renderVideoEmbeds = (videos) => {
            if (!videos || videos.length === 0) return '';
            
            return videos.map(video => {
                if (video.type === 'youtube') {
                    return `
                        <div class="article-video embed">
                            <iframe 
                                src="https://www.youtube.com/embed/${video.videoId}" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen
                                loading="lazy">
                            </iframe>
                        </div>
                    `;
                } else if (video.type === 'vimeo') {
                    return `
                        <div class="article-video embed">
                            <iframe 
                                src="https://player.vimeo.com/video/${video.videoId}" 
                                frameborder="0" 
                                allow="autoplay; fullscreen; picture-in-picture" 
                                allowfullscreen
                                loading="lazy">
                            </iframe>
                        </div>
                    `;
                } else if (video.type === 'direct') {
                    return `
                        <div class="article-video">
                            <video controls>
                                <source src="${video.url}" type="${video.mime || 'video/mp4'}">
                                Tu navegador no soporta la reproducción de video.
                            </video>
                        </div>
                    `;
                }
                return '';
            }).join('');
        };

        const videos = extractVideos();
        const videoHTML = renderVideoEmbeds(videos);

        const categoryTag = (article.category && String(article.category).toLowerCase() !== 'general')
            ? `<span class="category-tag">${escapeHTML(article.category)}</span>`
            : '';

        const sourceInfo = article.source 
            ? `<p class="article-source"><strong>Fuente:</strong> ${escapeHTML(article.source)}</p>` 
            : '';

        // Validar enlace externo: solo http(s)
        const safeLink = (() => {
            try {
                const u = new URL(article.link || '');
                if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
            } catch (_) {}
            return '';
        })();
        const externalLink = safeLink
            ? `<a href="${safeLink}" target="_blank" rel="noopener noreferrer" class="btn">
                Ver artículo original <i class="fas fa-external-link-alt"></i>
               </a>`
            : '';

        // Elegir el contenido más extenso disponible: content:encoded > content > description > summary
        const pickRichHtml = () => {
            try {
                const raw = article.raw || {};
                const candidates = [
                    raw['content:encoded'],
                    raw.content,
                    article.description,
                    article.summary
                ].filter(Boolean);
                // Escoger el más largo
                let best = '';
                for (const c of candidates) {
                    if (typeof c === 'string' && c.length > best.length) best = c;
                    else if (c && typeof c === 'object' && typeof c._ === 'string' && c._.length > best.length) best = c._;
                }
                return best || '';
            } catch (_) {
                return article.description || article.summary || '';
            }
        };

        const richHtml = pickRichHtml();

        articleContainer.innerHTML = `
            <article class="article-full">
                <header class="article-header">
                    ${categoryTag}
                    <h2>${escapeHTML(article.title)}</h2>
                    <div class="article-meta">
                        <span class="article-date"><i class="fas fa-calendar"></i> ${escapeHTML(article.date)}</span>
                    </div>
                </header>
                
                ${videoHTML}
                
                <div class="article-content">
                    ${sanitize(richHtml)}
                </div>
                
                <footer class="article-footer">
                    ${sourceInfo}
                    ${externalLink}
                </footer>
            </article>
        `;

        // Asegurar fallback de imagen destacada sin usar onerror en HTML
        try {
            const img = document.querySelector('.article-featured-image img');
            if (img) {
                img.addEventListener('error', () => { img.src = 'images/Fuerteventura.jpeg?v=2025110501'; });
            }
        } catch (_) {}

        // Actualizar meta tags para compartir en redes sociales
        updateMetaTags(article);
    }

    function updateMetaTags(article) {
        // Actualizar título de la página
        document.title = `${article.title} - This is Fuerteventura`;

        // Actualizar Open Graph tags
        updateMetaTag('og:title', article.title);
        updateMetaTag('og:description', article.description || article.summary || '');
        updateMetaTag('og:image', article.image || '/images/logo.jpg');
        updateMetaTag('og:type', 'article');
        // URL canónica para OG
        updateMetaTag('og:url', article.link || window.location.href);

        // Actualizar Twitter Card tags
        updateMetaTag('twitter:title', article.title);
        updateMetaTag('twitter:description', article.description || article.summary || '');
        updateMetaTag('twitter:image', article.image || '/images/logo.jpg');

        // Actualizar meta description
        const descriptionMeta = document.querySelector('meta[name="description"]');
        if (descriptionMeta && article.description) {
            const shortDesc = article.description.substring(0, 155) + (article.description.length > 155 ? '...' : '');
            descriptionMeta.setAttribute('content', shortDesc);
        }
    }

    function updateMetaTag(property, content) {
        // Buscar por property (Open Graph) o name (Twitter)
        let meta = document.querySelector(`meta[property="${property}"]`) 
                || document.querySelector(`meta[name="${property}"]`);

        if (!meta) {
            // Crear si no existe
            const isOG = property.startsWith('og:');
            meta = document.createElement('meta');
            if (isOG) meta.setAttribute('property', property);
            else meta.setAttribute('name', property);
            document.head.appendChild(meta);
        }

        meta.setAttribute('content', content);
    }
});
