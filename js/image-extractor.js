/**
 * Extractor robusto de imágenes de feeds RSS/Atom y artículos web
 * Soporta múltiples fuentes: enclosure, media:*, Open Graph, Twitter Cards, JSON-LD, regex en HTML
 */

// Caché de validación de URLs (evita peticiones HEAD repetidas)
const validatedImageCache = new Map(); // url -> { valid: boolean, ts: number }
const IMAGE_CACHE_TTL = 1000 * 60 * 30; // 30 minutos

// Fallbacks específicos por dominio
const DOMAIN_FALLBACKS = {
    'canarias7.es': 'images/logos/canarias7.png',
    'laprovincia.es': 'images/logos/laprovincia.png',
    'cabildofuer.es': 'images/logos/cabildo.png',
    'radioinsular.es': 'images/logos/radioinsular.png',
    'fuerteventuradigital.com': 'images/logos/fvdigital.png',
    'ondafuerteventura.es': 'images/logos/ondafv.png',
    'newsdata.io': 'images/logos/newsdata.png'
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
 * Registra un error de extracción de imagen
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
 * Extrae URLs de imágenes usando expresiones regulares robustas
 */
function extractImageURLsFromHTML(html) {
    if (!html || typeof html !== 'string') return [];
    
    const urls = [];
    
    // 1. Open Graph image
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch && ogMatch[1]) urls.push(ogMatch[1]);
    
    // 2. Twitter Card image
    const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twitterMatch && twitterMatch[1]) urls.push(twitterMatch[1]);
    
    // 3. Tags <img> con src
    const imgTagsRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    while ((imgMatch = imgTagsRegex.exec(html)) !== null) {
        if (imgMatch[1]) urls.push(imgMatch[1]);
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
        } catch (e) {
            // JSON inválido, continuar
        }
    }
    
    // 5. Link rel="image_src"
    const linkImageMatch = html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i) ||
                           html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']image_src["']/i);
    if (linkImageMatch && linkImageMatch[1]) urls.push(linkImageMatch[1]);
    
    return urls;
}

/**
 * Valida una URL de imagen con petición HEAD (opcional, con caché)
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
 * Extrae imagen de un item de feed (RSS/Atom o newsdata.io)
 * Busca en múltiples fuentes con prioridad:
 * 1. Campo directo image/image_url
 * 2. Enclosure
 * 3. Media RSS (media:content, media:thumbnail)
 * 4. Content:encoded con regex
 * 5. Description/summary con regex
 * 6. Open Graph y meta tags (si raw contiene HTML)
 */
async function extractImageFromItem(item, { validate = false, sourceUrl = '' } = {}) {
    imageStats.totalAttempts++;
    
    if (!item) {
        logImageError(sourceUrl, 'null-item', 'Item is null or undefined');
        return getDomainFallback(sourceUrl);
    }
    
    const candidates = [];
    const debugLog = { source: sourceUrl, candidates: [] };
    
    // 1. Campo directo image o image_url
    if (item.image && typeof item.image === 'string') {
        candidates.push(item.image);
        debugLog.candidates.push({ source: 'item.image', url: item.image });
    }
    if (item.raw?.image_url && typeof item.raw.image_url === 'string') {
        candidates.push(item.raw.image_url);
        debugLog.candidates.push({ source: 'raw.image_url', url: item.raw.image_url });
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
    
    // 3. Media RSS
    const mediaKeys = ['media:content', 'media:thumbnail', 'media', 'media:group'];
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
    const desc = item.description || item.summary || '';
    const descStr = typeof desc === 'object' ? (desc._ || '') : String(desc);
    if (descStr) {
        const extracted = extractImageURLsFromHTML(descStr);
        candidates.push(...extracted);
    }
    
    // 6. Si raw contiene HTML completo (de newsdata.io content por ejemplo)
    if (raw.content && typeof raw.content === 'string' && raw.content.includes('<')) {
        const extracted = extractImageURLsFromHTML(raw.content);
        candidates.push(...extracted);
    }
    
    // Filtrar URLs vacías o inválidas
    const validCandidates = candidates
        .filter(url => url && typeof url === 'string' && url.trim().length > 0)
        .map(url => url.trim())
        // Filtrar URLs obvias de placeholder o tracking
        .filter(url => {
            const lower = url.toLowerCase();
            return !lower.includes('placeholder') &&
                   !lower.includes('spacer.gif') &&
                   !lower.includes('1x1') &&
                   !lower.endsWith('.svg') && // Evitar iconos SVG pequeños
                   (url.startsWith('http://') || url.startsWith('https://'));
        });
    
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
 * Limpia las estadísticas
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
