// feed-utils.js - Utilidades compartidas para manejo de feeds RSS
// Este módulo centraliza la lógica común de obtención y procesamiento de feeds

(function(global) {
    'use strict';

    // Fuentes de noticias RSS predefinidas
    const DEFAULT_NEWS_SOURCES = [
        'https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml',
        'https://rss.app/feeds/8SmCQL7GDZyu2xB4.xml',
        'https://rss.app/feeds/IchTPp234IVDaH7V.xml',
        'https://rss.app/feeds/cNktFJXkoIBwqQSS.xml',
        'https://rss.app/feeds/pGaOMTfcwV2mzdy7.xml'
    ];

    // Configuración de caché
    const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos

    /**
     * Formatea una fecha al formato español
     * @param {Date} date - Fecha a formatear
     * @returns {string} Fecha formateada
     */
    function formatDate(date) {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            return '';
        }
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }

    /**
     * Convierte HTML a texto plano
     * @param {string} html - HTML a convertir
     * @returns {string} Texto plano
     */
    function toPlainText(html) {
        if (!html || typeof html !== 'string') return '';
        try {
            return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        } catch (_) {
            return String(html);
        }
    }

    /**
     * Sanitiza HTML básico (elimina scripts, eventos, etc.)
     * @param {string} str - String a sanitizar
     * @returns {string} String sanitizado
     */
    function sanitizeHTML(str) {
        if (!str) return '';
        str = str.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
        str = str.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
        str = str.replace(/\son\w+=\"[^\"]*\"/gi, '');
        str = str.replace(/\son\w+='[^']*'/gi, '');
        str = str.replace(/href=\"\s*javascript:[^\"]*\"/gi, 'href="#"');
        return str;
    }

    /**
     * Sanitiza usando DOMPurify si está disponible, si no usa sanitización básica
     * @param {string} str - String a sanitizar
     * @returns {string} String sanitizado
     */
    function sanitize(str) {
        try {
            if (global.DOMPurify && typeof DOMPurify.sanitize === 'function') {
                return DOMPurify.sanitize(str);
            }
        } catch (e) {
            // fallback
        }
        return sanitizeHTML(str);
    }

    /**
     * Obtiene un valor de caché localStorage
     * @param {string} key - Clave de caché
     * @param {number} ttl - Tiempo de vida en ms
     * @returns {*} Valor cacheado o null
     */
    function cacheGet(key, ttl = CACHE_TTL_MS) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.ts) return null;
            if (Date.now() - parsed.ts > ttl) {
                localStorage.removeItem(key);
                return null;
            }
            return parsed.items || null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Establece un valor en caché localStorage
     * @param {string} key - Clave de caché
     * @param {*} items - Datos a cachear
     */
    function cacheSet(key, items) {
        try {
            localStorage.setItem(key, JSON.stringify({ ts: Date.now(), items }));
        } catch (e) {
            // Ignorar errores de quota de localStorage
        }
    }

    /**
     * Descubre automáticamente la URL del proxy RSS
     * @returns {Promise<string>} URL del proxy
     */
    async function discoverLocalProxy() {
        // Si ya tenemos una URL configurada, usarla
        if (typeof global.__RSS_PROXY_URL === 'string') {
            return global.__RSS_PROXY_URL;
        }
        
        try {
            if (global.discoverRSSProxy) {
                const u = await global.discoverRSSProxy();
                if (u) return u;
            }
        } catch (_) {}
        
        // Si no estamos en localhost, asumir Netlify Functions
        const isLocal = /^(localhost|127\.0\.0\.1)/.test(location.hostname);
        if (!isLocal) {
            console.log('[FEED-UTILS] Remote host detected, assuming Netlify Functions');
            return '';
        }
        
        // Probar puertos locales comunes
        const candidates = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
        for (const base of candidates) {
            try {
                const r = await fetch(`${base}/health`, { method: 'GET', cache: 'no-store' });
                if (r.ok) return base;
            } catch (_) { /* siguiente candidato */ }
        }
        
        return 'http://localhost:3000';
    }

    /**
     * Extrae imagen de un item de feed RSS
     * @param {Object} it - Item del feed
     * @param {string} sourceUrl - URL de origen
     * @returns {Promise<string>} URL de la imagen
     */
    async function extractImageFromRaw(it, sourceUrl = '') {
        if (global.ImageExtractor && typeof global.ImageExtractor.extractImageFromItem === 'function') {
            const img = await global.ImageExtractor.extractImageFromItem(it, { validate: false, sourceUrl });
            if (img && typeof img === 'string' && img.trim() && !img.startsWith('data:')) {
                return img;
            }
        }
        
        // Fallback simple
        let candidate = null;
        if (!it) {
            candidate = null;
        } else if (it.image && typeof it.image === 'string') {
            candidate = it.image;
        } else if (it.raw?.image_url) {
            candidate = it.raw.image_url;
        } else {
            const raw = it.raw || {};
            if (raw.enclosure) {
                if (typeof raw.enclosure === 'string') {
                    candidate = raw.enclosure;
                } else if (raw.enclosure.url) {
                    candidate = raw.enclosure.url;
                }
            }
            if (!candidate) {
                const desc = it.description || it.summary || '';
                const descStr = typeof desc === 'object' ? (desc._ || '') : String(desc);
                if (descStr) {
                    const match = descStr.match(/<img[^>]+src=["']([^"']+)["']/i);
                    if (match && match[1]) candidate = match[1];
                }
            }
        }
        
        // Validar y retornar imagen o fallback
        if (!candidate || typeof candidate !== 'string' || !candidate.trim() || candidate.startsWith('data:')) {
            return 'images/logo.jpg?v=2025110501';
        }
        
        // Si es HTTP (no seguro), usar fallback
        if (/^http:/.test(candidate)) {
            return 'images/logo.jpg?v=2025110501';
        }
        
        return candidate;
    }

    /**
     * Obtiene feeds RSS desde el proxy y los normaliza
     * @param {Array<string>} sources - URLs de los feeds
     * @returns {Promise<Array>} Items normalizados
     */
    async function fetchRSSFeeds(sources = DEFAULT_NEWS_SOURCES) {
        const proxyBase = await discoverLocalProxy();

        try {
            console.debug('[FEED-UTILS] Proxy base:', proxyBase);
            
            // Intentar endpoint agregado primero
            const aggKey = 'rss_cache_v3_media_AGG';
            let items = cacheGet(aggKey);
            
            if (!items) {
                const aggPath = proxyBase === '' 
                    ? '/.netlify/functions/aggregate' 
                    : (proxyBase.endsWith('/.netlify/functions') ? '/aggregate' : '/api/aggregate');
                const aggUrl = `${proxyBase}${aggPath}?sources=${encodeURIComponent(sources.join(','))}&dedupe=1`;
                
                console.log('[FEED-UTILS] Fetching aggregate from:', aggUrl);
                
                try {
                    const r = await fetch(aggUrl, { cache: 'no-store' });
                    console.log('[FEED-UTILS] Aggregate response status:', r.status);
                    
                    if (!r.ok) throw new Error('bad response');
                    
                    const json = await r.json();
                    items = Array.isArray(json.items) ? json.items : [];
                    console.log('[FEED-UTILS] Aggregate returned', items.length, 'items');
                    cacheSet(aggKey, items);
                } catch (e) {
                    console.warn('[FEED-UTILS] Aggregate fetch failed, trying individual sources:', e?.message);
                    
                    // Fallback: obtener feeds individualmente
                    const fetches = sources.map(async (src) => {
                        const cacheKey = 'rss_cache_v3_media_' + btoa(src);
                        const cached = cacheGet(cacheKey);
                        if (cached) return cached;
                        
                        try {
                            const rssPath = proxyBase === '' 
                                ? '/.netlify/functions/rss' 
                                : (proxyBase.endsWith('/.netlify/functions') ? '/rss' : '/api/rss');
                            const rr = await fetch(`${proxyBase}${rssPath}?url=${encodeURIComponent(src)}`, { cache: 'no-store' });
                            
                            if (!rr.ok) throw new Error('bad response');
                            
                            const jj = await rr.json();
                            const its = Array.isArray(jj.items) ? jj.items : [];
                            cacheSet(cacheKey, its);
                            return its;
                        } catch (err) {
                            console.warn('[FEED-UTILS] Failed to fetch', src, err?.message);
                            return [];
                        }
                    });
                    
                    const results = await Promise.all(fetches);
                    items = results.flat();
                }
            }

            if (items.length > 0) {
                // Deduplicar crudos primero por enlace normalizado o título+fecha
                const normalizeLink = (u) => {
                    if (!u || typeof u !== 'string') return '';
                    try {
                        const url = new URL(u);
                        url.hash = '';
                        const params = url.searchParams;
                        ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid'].forEach(k => params.delete(k));
                        url.search = params.toString();
                        url.pathname = url.pathname.replace(/\/?amp\/?$/i, '/').replace(/\/+$/,'/');
                        return url.toString();
                    } catch (_) {
                        return String(u);
                    }
                };
                const seenRaw = new Set();
                const rawDeduped = [];
                for (const it of items) {
                    const linkKey = normalizeLink(it.link || it.url || '');
                    const titlePart = (it.title && (typeof it.title === 'string' ? it.title : (it.title._ || ''))) || '';
                    const datePart = it.pubDate || it.published || it.updated || '';
                    const key = linkKey || (titlePart.trim().toLowerCase() + '|' + String(datePart).slice(0,10));
                    if (key && !seenRaw.has(key)) {
                        seenRaw.add(key);
                        rawDeduped.push(it);
                    }
                }
                items = rawDeduped;

                // Normalizar items
                const normalized = await Promise.all(items.map(async (it) => {
                    // Extraer etiquetas/categorías de múltiples campos posibles
                    const extractTags = (item) => {
                        const out = [];
                        const raw = item && item.raw ? item.raw : {};

                        const pushVal = (v) => {
                            if (!v) return;
                            if (Array.isArray(v)) {
                                v.forEach(pushVal);
                                return;
                            }
                            if (typeof v === 'object' && typeof v._ === 'string') {
                                v = v._;
                            }
                            if (typeof v !== 'string') return;
                            v.split(/[,;|]/).forEach((seg) => {
                                const s = String(seg).trim();
                                if (!s) return;
                                // normalizar visualmente (Capitalizar primera letra)
                                const display = s.charAt(0).toUpperCase() + s.slice(1);
                                // deduplicar case-insensitive
                                if (!out.some(t => t.toLowerCase() === display.toLowerCase())) {
                                    out.push(display);
                                }
                            });
                        };

                        pushVal(item.categories);
                        pushVal(item.category);
                        pushVal(raw && (raw.categories || raw.category));
                        pushVal(raw && (raw['dc:subject'] || raw['dc:subjects']));
                        pushVal(raw && (raw.keywords || raw.tags));

                        return out;
                    };

                    const title = (it.title && (typeof it.title === 'string' ? it.title : (it.title._ || ''))) || 'Sin título';
                    const descriptionRaw = it.description || it.summary || '';
                    const description = typeof descriptionRaw === 'object' ? (descriptionRaw._ || '') : descriptionRaw;
                    const link = it.link || '';
                    const pub = it.pubDate || it.published || it.updated || '';
                    
                    let source = '';
                    try {
                        source = link ? (new URL(link)).hostname.replace('www.', '') : (it.source || 'fuente');
                    } catch (e) {
                        source = it.source || 'fuente';
                    }

                    const image = await extractImageFromRaw(it, link);
                    const cleaned = sanitize(description);
                    
                    // Etiquetas y categoría primaria
                    const tags = extractTags(it);
                    let primaryCategory = 'General';
                    if (tags.length > 0) {
                        // evitar usar 'General' como primera si hay otras etiquetas
                        const nonGeneral = tags.find(t => t.toLowerCase() !== 'general');
                        primaryCategory = nonGeneral || tags[0];
                    } else if (it.category && typeof it.category === 'string') {
                        primaryCategory = it.category;
                    }

                    // Elegir contenido más rico disponible
                    const pickRichHtml = () => {
                        try {
                            const raw = it.raw || {};
                            const candidates = [
                                raw['content:encoded'],
                                raw.content,
                                it.description,
                                it.summary
                            ].filter(Boolean);
                            
                            let best = '';
                            for (const c of candidates) {
                                if (typeof c === 'string' && c.length > best.length) {
                                    best = c;
                                } else if (c && typeof c === 'object' && typeof c._ === 'string' && c._.length > best.length) {
                                    best = c._;
                                }
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
                        category: primaryCategory || 'General',
                        tags,
                        source,
                        link,
                        raw: it.raw
                    };
                }));
                
                // Segunda pasada de dedupe por link normalizado o título+fecha ya transformados
                const seenNorm = new Set();
                const final = [];
                for (const it of normalized) {
                    const linkKey = normalizeLink(it.link);
                    const baseKey = linkKey || (String(it.title||'').trim().toLowerCase() + '|' + String(it.date||''));
                    if (baseKey && !seenNorm.has(baseKey)) {
                        seenNorm.add(baseKey);
                        final.push(it);
                    }
                }
                // Ordenar descendente por fecha real si disponible
                final.sort((a,b) => {
                    const pa = Date.parse(a.raw?.pubDate || a.raw?.published || a.raw?.updated || a.date || '');
                    const pb = Date.parse(b.raw?.pubDate || b.raw?.published || b.raw?.updated || b.date || '');
                    return (isNaN(pb)?0:pb) - (isNaN(pa)?0:pa);
                });
                return final;
            }
        } catch (err) {
            console.warn('[FEED-UTILS] Error fetching feeds:', err);
        }
        
        return [];
    }

    // Exportar al objeto global
    global.FeedUtils = {
        DEFAULT_NEWS_SOURCES,
        formatDate,
        toPlainText,
        sanitize,
        sanitizeHTML,
        cacheGet,
        cacheSet,
        discoverLocalProxy,
        extractImageFromRaw,
        fetchRSSFeeds
    };

})(typeof window !== 'undefined' ? window : global);
