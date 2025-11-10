/**
 * Extractor robusto de imágenes de feeds RSS/Atom
 * Soporta múltiples fuentes: enclosure, media:*, Open Graph, Twitter Cards, JSON-LD
 * @module ImageExtractor
 */

// Caché de validación de URLs (evita peticiones HEAD repetidas)
const validatedImageCache = new Map(); // url -> { valid: boolean, ts: number }
const IMAGE_CACHE_TTL = 1000 * 60 * 30; // 30 minutos

// Fallbacks específicos por dominio
const DOMAIN_FALLBACKS = {
    'canarias7.es': 'images/logo.jpg',
    'laprovincia.es': 'images/logo.jpg',
    'cabildofuer.es': 'images/logo.jpg',
    'radioinsular.es': 'images/logo.jpg',
    'fuerteventuradigital.com': 'images/logo.jpg',
    'ondafuerteventura.es': 'images/logo.jpg'
};

// Estadísticas de errores (para análisis)
const imageStats = {
    totalAttempts: 0,
    successfulExtractions: 0,
    failedExtractions: 0,
    errorsByDomain: {},
    errorsByType: {}
};

/**
 * Obtiene el fallback de imagen específico para un dominio
 * @param {string} url - URL para identificar el dominio
 * @returns {string} Ruta de la imagen de fallback
 */
function getDomainFallback(url) {
    try {
        const hostname = new URL(url).hostname.replace('www.', '');
        for (const [domain, fallback] of Object.entries(DOMAIN_FALLBACKS)) {
            if (hostname.includes(domain)) {
                return fallback;
            }
        }
    } catch (e) {
        // URL inválida, usar fallback genérico
    }
    return 'images/logo.jpg';
}

/**
 * Registra un error de extracción de imagen para análisis
 * @param {string} url - URL de origen donde ocurrió el error
 * @param {string} type - Tipo de error
 * @param {string|Error} error - Descripción del error
 */
function logImageError(url, type, error) {
    imageStats.failedExtractions++;
    
    try {
        const hostname = new URL(url).hostname;
        imageStats.errorsByDomain[hostname] = (imageStats.errorsByDomain[hostname] || 0) + 1;
    } catch (e) {
        imageStats.errorsByDomain['invalid-url'] = (imageStats.errorsByDomain['invalid-url'] || 0) + 1;
    }
    
    imageStats.errorsByType[type] = (imageStats.errorsByType[type] || 0) + 1;
    
    console.warn(`[IMAGE] Error extracting from ${url}: ${type}`, error);
}

/**
 * Extrae URLs de imágenes de HTML usando expresiones regulares robustas
 * Busca: Open Graph, Twitter Cards, tags <img>, JSON-LD, link rel="image_src"
 * @param {string} html - Código HTML a analizar
 * @returns {string[]} Array de URLs de imágenes encontradas
 */
function extractImageURLsFromHTML(html) {
    if (!html || typeof html !== 'string') return [];
    
    const urls = [];
    
    // 1. Open Graph image (múltiples variantes)
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch && ogMatch[1]) urls.push(ogMatch[1]);
    
    // 1b. Open Graph secure image
    const ogSecureMatch = html.match(/<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image:secure_url["']/i);
    if (ogSecureMatch && ogSecureMatch[1]) urls.push(ogSecureMatch[1]);
    
    // 2. Twitter Card image (múltiples variantes)
    const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twitterMatch && twitterMatch[1]) urls.push(twitterMatch[1]);
    
    // 2b. Twitter Card image:src
    const twitterSrcMatch = html.match(/<meta[^>]+name=["']twitter:image:src["'][^>]+content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image:src["']/i);
    if (twitterSrcMatch && twitterSrcMatch[1]) urls.push(twitterSrcMatch[1]);
    
    // 3. Tags <img> con src (más flexible - acepta cualquier imagen)
    const imgTagsRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    while ((imgMatch = imgTagsRegex.exec(html)) !== null) {
        if (imgMatch[1]) urls.push(imgMatch[1]);
    }
    
    // 3b. Tags <img> con data-src (lazy loading)
    const dataSrcRegex = /<img[^>]+data-src=["']([^"']+)["'][^>]*>/gi;
    let dataSrcMatch;
    while ((dataSrcMatch = dataSrcRegex.exec(html)) !== null) {
        if (dataSrcMatch[1]) urls.push(dataSrcMatch[1]);
    }
    
    // 3c. Background images en style
    const bgImageRegex = /background-image:\s*url\(['"]*([^'"()]+)['"]*\)/gi;
    let bgMatch;
    while ((bgMatch = bgImageRegex.exec(html)) !== null) {
        if (bgMatch[1]) urls.push(bgMatch[1]);
    }
    
    // 4. JSON-LD (Schema.org)
    const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let jsonLdMatch;
    while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
        try {
            const data = JSON.parse(jsonLdMatch[1]);
            if (data.image) {
                if (typeof data.image === 'string') urls.push(data.image);
                else if (Array.isArray(data.image)) urls.push(...data.image.filter(i => typeof i === 'string'));
                else if (data.image.url) urls.push(data.image.url);
            }
            // Buscar en objetos anidados (NewsArticle, BlogPosting, etc.)
            if (data.mainEntityOfPage && data.mainEntityOfPage.image) {
                const img = data.mainEntityOfPage.image;
                if (typeof img === 'string') urls.push(img);
                else if (img.url) urls.push(img.url);
            }
        } catch (e) {
            // JSON inválido, continuar
        }
    }
    
    // 5. Link rel="image_src"
    const linkImageMatch = html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i) ||
                           html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']image_src["']/i);
    if (linkImageMatch && linkImageMatch[1]) urls.push(linkImageMatch[1]);
    
    // 6. Itemprop image (schema.org inline)
    const itempropRegex = /itemprop=["']image["'][^>]+content=["']([^"']+)["']/gi;
    let itempropMatch;
    while ((itempropMatch = itempropRegex.exec(html)) !== null) {
        if (itempropMatch[1]) urls.push(itempropMatch[1]);
    }
    
    return urls;
}

/**
 * Valida una URL de imagen mediante petición HEAD
 * @param {string} url - URL de la imagen a validar
 * @param {Object} options - Opciones de validación
 * @param {boolean} options.useCache - Si usar caché de validación
 * @param {number} options.timeout - Timeout en milisegundos
 * @returns {Promise<boolean>} true si la URL es una imagen válida
 */
async function validateImageURL(url, { useCache = true, timeout = 3000 } = {}) {
    if (!url || typeof url !== 'string') return false;
    
    // Verificar caché
    if (useCache) {
        const cached = validatedImageCache.get(url);
        if (cached && (Date.now() - cached.ts) < IMAGE_CACHE_TTL) {
            return cached.valid;
        }
    }
    
    try {
        // Petición HEAD con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        
        const contentType = response.headers.get('content-type') || '';
        const isImage = response.ok && contentType.startsWith('image/');
        
        // Cachear resultado
        validatedImageCache.set(url, { valid: isImage, ts: Date.now() });
        
        return isImage;
    } catch (e) {
        // Error de red o timeout - asumir inválida pero no cachear (podría ser temporal)
        return false;
    }
}

/**
 * Extrae imagen de un item de feed RSS/Atom
 * Busca en múltiples fuentes con prioridad:
 * 1. Campo directo image
 * 2. Enclosure
 * 3. Media RSS (media:content, media:thumbnail, media:group)
 * 4. Content:encoded con extracción HTML
 * 5. Description/summary con extracción HTML
 * 6. Open Graph y meta tags (si raw contiene HTML)
 * @param {Object} item - Item del feed RSS/Atom
 * @param {Object} options - Opciones de extracción
 * @param {boolean} options.validate - Si validar la imagen con petición HEAD
 * @param {string} options.sourceUrl - URL de origen para fallback
 * @returns {Promise<string>} URL de la imagen o fallback
 */
async function extractImageFromItem(item, { validate = false, sourceUrl = '' } = {}) {
    imageStats.totalAttempts++;
    
    if (!item) {
        logImageError(sourceUrl, 'null-item', 'Item is null or undefined');
        return getDomainFallback(sourceUrl);
    }
    
    const candidates = [];
    const debugLog = { source: sourceUrl, candidates: [] };
    
    // 1. Campo directo image
    if (item.image && typeof item.image === 'string') {
        candidates.push(item.image);
        debugLog.candidates.push({ source: 'item.image', url: item.image });
    }
    // Soporte para imagen en objeto (algunos feeds usan { url: '...' })
    if (item.image && typeof item.image === 'object' && item.image.url) {
        candidates.push(item.image.url);
        debugLog.candidates.push({ source: 'item.image.url', url: item.image.url });
    }
    
    // 2. Enclosure
    const raw = item.raw || {};
    if (raw.enclosure) {
        if (typeof raw.enclosure === 'string') {
            candidates.push(raw.enclosure);
            debugLog.candidates.push({ source: 'raw.enclosure (string)', url: raw.enclosure });
        } else if (raw.enclosure.url) {
            candidates.push(raw.enclosure.url);
            debugLog.candidates.push({ source: 'raw.enclosure.url', url: raw.enclosure.url });
        } else if (raw.enclosure._) {
            candidates.push(raw.enclosure._);
            debugLog.candidates.push({ source: 'raw.enclosure._', url: raw.enclosure._ });
        } else if (raw.enclosure.$ && raw.enclosure.$.url) {
            candidates.push(raw.enclosure.$.url);
            debugLog.candidates.push({ source: 'raw.enclosure.$.url', url: raw.enclosure.$.url });
        }
    }
    
    // 3. Media RSS (más exhaustivo con nuevos selectores)
    const mediaKeys = [
        'media:content', 
        'media:thumbnail', 
        'media', 
        'media:group',
        'mediaContent',      // Variante camelCase
        'mediaThumbnail',    // Variante camelCase
        'thumbnail',         // Campo thumbnail directo
        'image',             // Campo image en raw
        'enclosures'         // Plural de enclosure
    ];
    for (const key of mediaKeys) {
        if (raw[key]) {
            const v = raw[key];
            if (typeof v === 'string') {
                candidates.push(v);
                debugLog.candidates.push({ source: `raw.${key} (string)`, url: v });
            } else if (Array.isArray(v) && v.length > 0) {
                for (const mediaItem of v) {
                    if (typeof mediaItem === 'string') {
                        candidates.push(mediaItem);
                        debugLog.candidates.push({ source: `raw.${key}[array-string]`, url: mediaItem });
                    } else if (mediaItem.url) {
                        candidates.push(mediaItem.url);
                        debugLog.candidates.push({ source: `raw.${key}[].url`, url: mediaItem.url });
                    } else if (mediaItem.$ && mediaItem.$.url) {
                        candidates.push(mediaItem.$.url);
                        debugLog.candidates.push({ source: `raw.${key}[].$.url`, url: mediaItem.$.url });
                    } else if (mediaItem.href) {
                        candidates.push(mediaItem.href);
                        debugLog.candidates.push({ source: `raw.${key}[].href`, url: mediaItem.href });
                    }
                }
            } else if (v.url) {
                candidates.push(v.url);
                debugLog.candidates.push({ source: `raw.${key}.url`, url: v.url });
            } else if (v._) {
                candidates.push(v._);
                debugLog.candidates.push({ source: `raw.${key}._`, url: v._ });
            } else if (v.$ && v.$.url) {
                candidates.push(v.$.url);
                debugLog.candidates.push({ source: `raw.${key}.$.url`, url: v.$.url });
            } else if (v.href) {
                candidates.push(v.href);
                debugLog.candidates.push({ source: `raw.${key}.href`, url: v.href });
            }
        }
    }
    
    // 4. Content:encoded con extracción de HTML
    const contentKeys = ['content:encoded', 'encoded', 'content'];
    for (const key of contentKeys) {
        if (raw[key]) {
            const content = typeof raw[key] === 'string' ? raw[key] : (raw[key]._ || '');
            if (content) {
                const extracted = extractImageURLsFromHTML(content);
                candidates.push(...extracted);
            }
        }
    }
    
    // 5. Description/summary con extracción de HTML
    const desc = item.description || item.summary || item.content || '';
    const descStr = typeof desc === 'object' ? (desc._ || '') : String(desc);
    if (descStr) {
        const extracted = extractImageURLsFromHTML(descStr);
        candidates.push(...extracted);
    }
    
    // 6. Campos adicionales directos que podrían contener imágenes
    const directImageFields = ['imageUrl', 'thumbnailUrl', 'thumbnail', 'featured_image', 'featuredImage', 'hero'];
    for (const field of directImageFields) {
        if (item[field] && typeof item[field] === 'string') {
            candidates.push(item[field]);
            debugLog.candidates.push({ source: `item.${field}`, url: item[field] });
        }
        if (raw[field] && typeof raw[field] === 'string') {
            candidates.push(raw[field]);
            debugLog.candidates.push({ source: `raw.${field}`, url: raw[field] });
        }
    }
    
    // Filtrar URLs vacías o inválidas (criterios más flexibles)
    const validCandidates = candidates
        .filter(url => url && typeof url === 'string' && url.trim().length > 0)
        .map(url => url.trim())
        // Filtrar SOLO URLs obvias de placeholder o tracking (más permisivo)
        .filter(url => {
            const lower = url.toLowerCase();
            // Lista reducida de exclusiones - solo placeholders obvios
            return !lower.includes('placeholder.') &&
                   !lower.includes('spacer.gif') &&
                   !lower.includes('/1x1.') &&
                   !lower.includes('tracking-pixel') &&
                   !lower.includes('clearpixel') &&
                   !lower.endsWith('blank.gif') &&
                   // Permitir SVG (muchos sitios usan SVG para logos/imágenes)
                   // !lower.endsWith('.svg') && // REMOVIDO - ahora permitimos SVG
                   (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//'));
        })
        // Normalizar URLs que empiezan con // (protocol-relative)
        .map(url => url.startsWith('//') ? 'https:' + url : url);
    
    // Eliminar duplicados manteniendo el orden
    const uniqueCandidates = [...new Set(validCandidates)];
    
    // Si se solicita validación, verificar con HEAD request
    if (validate && uniqueCandidates.length > 0) {
        for (const url of uniqueCandidates) {
            const isValid = await validateImageURL(url);
            if (isValid) {
                imageStats.successfulExtractions++;
                return url;
            }
        }
        logImageError(sourceUrl, 'validation-failed', `None of ${uniqueCandidates.length} candidates passed validation`);
        return getDomainFallback(sourceUrl || item.link);
    }
    
    // Sin validación, retornar el primer candidato válido
    if (uniqueCandidates.length > 0) {
        imageStats.successfulExtractions++;
        console.debug('[IMAGE] Success:', debugLog, 'Selected:', uniqueCandidates[0]);
        return uniqueCandidates[0];
    }
    
    // No se encontró ninguna imagen
    console.warn('[IMAGE] No candidates found:', debugLog);
    logImageError(sourceUrl || item.link, 'no-candidates', 'No image candidates found in item');
    return getDomainFallback(sourceUrl || item.link);
}

/**
 * Obtiene estadísticas de extracción de imágenes
 * @returns {Object} Objeto con estadísticas detalladas y tasa de éxito
 */
function getImageStats() {
    return {
        ...imageStats,
        successRate: imageStats.totalAttempts > 0 
            ? ((imageStats.successfulExtractions / imageStats.totalAttempts) * 100).toFixed(2) + '%'
            : '0%'
    };
}

/**
 * Reinicia las estadísticas de extracción de imágenes
 */
function resetImageStats() {
    imageStats.totalAttempts = 0;
    imageStats.successfulExtractions = 0;
    imageStats.failedExtractions = 0;
    imageStats.errorsByDomain = {};
    imageStats.errorsByType = {};
}

// Exportar funciones al objeto window
if (typeof window !== 'undefined') {
    window.ImageExtractor = {
        extractImageFromItem,
        validateImageURL,
        getDomainFallback,
        getImageStats,
        resetImageStats,
        extractImageURLsFromHTML
    };
}
