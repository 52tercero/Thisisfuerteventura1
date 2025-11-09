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

        const categoryTag = (article.category && String(article.category).toLowerCase() !== 'general')
            ? `<span class="category-tag" style="display: inline-block; margin: 10px 0;">${escapeHTML(article.category)}</span>`
            : '';

        const sourceInfo = article.source 
            ? `<p class="article-source"><strong>Fuente:</strong> ${escapeHTML(article.source)}</p>` 
            : '';

        const externalLink = article.link 
            ? `<a href="${article.link}" target="_blank" rel="noopener noreferrer" class="btn" style="margin-top: 20px;">
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
                    <h1>${escapeHTML(article.title)}</h1>
                    <div class="article-meta">
                        <span class="article-date"><i class="fas fa-calendar"></i> ${article.date}</span>
                    </div>
                </header>
                
                ${article.image ? `
                    <div class="article-image">
                        <img src="${article.image}" 
                             alt="${escapeHTML(article.title)}" 
                             onerror="this.onerror=null;this.src='images/logo.jpg';">
                    </div>
                ` : ''}
                
                <div class="article-content">
                    ${sanitize(richHtml)}
                </div>
                
                <footer class="article-footer">
                    ${sourceInfo}
                    ${externalLink}
                </footer>
            </article>
        `;

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
