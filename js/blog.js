(function(){
  const LIST_ID = 'blog-list';
  const PREVIEW_ID = 'blog-preview';
  const ARTICLE_ID = 'blog-article';
  const DATA_URL = 'data/blog.json';

  function byId(id){ return document.getElementById(id); }
  function create(el, cls){ const n = document.createElement(el); if(cls) n.className = cls; return n; }
  function formatDate(iso){ try { return new Date(iso).toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'});} catch(e){ return iso; } }

  async function loadJSON(url){
    const r = await fetch(url, { credentials: 'same-origin' });
    if(!r.ok) throw new Error('HTTP '+r.status);
    return r.json();
  }

  function renderCard(post){
    const card = create('article','news-card');
    const img = create('img');
    img.src = post.image;
    img.alt = post.title;
    img.loading = 'lazy';
    const content = create('div','news-content');
    const h3 = create('h3'); h3.textContent = post.title;
    const meta = create('div','news-meta'); meta.textContent = `${post.category} · ${formatDate(post.date)}`;
    const p = create('p'); p.textContent = post.excerpt;
    const a = create('a','btn'); a.href = `blog-post.html?slug=${encodeURIComponent(post.slug)}`; a.textContent = 'Leer más';
    content.appendChild(h3); content.appendChild(meta); content.appendChild(p); content.appendChild(a);
    card.appendChild(img); card.appendChild(content);
    return card;
  }

  function getParam(name){ const u = new URL(location.href); return u.searchParams.get(name); }

  async function renderList(targetId, limit){
    const target = byId(targetId);
    if(!target) return;
    target.innerHTML = '<div class="loading">Cargando artículos...</div>';
    try {
      const data = await loadJSON(DATA_URL);
      const posts = (data.posts||[]).sort((a,b)=> new Date(b.date)-new Date(a.date));
      target.innerHTML = '';
      const grid = create('div','news-grid card-stagger');
      (limit? posts.slice(0,limit): posts).forEach(p=> grid.appendChild(renderCard(p)) );
      target.appendChild(grid);
    } catch(e){
      target.innerHTML = '<div class="no-results">No se pudieron cargar los artículos</div>';
    }
  }

  async function renderSingle(){
    const wrap = byId(ARTICLE_ID);
    if(!wrap) return;
    wrap.innerHTML = '<div class="loading">Cargando artículo...</div>';
    try{
      const slug = getParam('slug');
      const data = await loadJSON(DATA_URL);
      const post = (data.posts||[]).find(p=>p.slug===slug);
      if(!post){ wrap.innerHTML = '<div class="no-results">Artículo no encontrado</div>'; return; }
      const article = create('article','article');
      const h1 = create('h1'); h1.textContent = post.title;
      const meta = create('div','news-meta'); meta.textContent = `${post.category} · ${formatDate(post.date)}`;
      const img = create('img'); img.src = post.image; img.alt = post.title; img.loading='lazy';
      const body = create('div','article-body');
      post.content.split('\n\n').forEach(par=>{ const p = create('p'); p.textContent = par.trim(); if(p.textContent) body.appendChild(p);});
      article.appendChild(h1); article.appendChild(meta); article.appendChild(img); article.appendChild(body);
      wrap.innerHTML = '';
      wrap.appendChild(article);
      // update basic meta if present
      const t = document.querySelector('title'); if(t) t.textContent = `${post.title} | Blog - This is Fuerteventura`;
    }catch(e){
      wrap.innerHTML = '<div class="no-results">Error al cargar el artículo</div>';
    }
  }

  // Init
  document.addEventListener('DOMContentLoaded', ()=>{
    // homepage preview
    if(byId(PREVIEW_ID)) renderList(PREVIEW_ID, 3);
    // blog list
    if(byId(LIST_ID)) renderList(LIST_ID);
    // blog article
    if(byId(ARTICLE_ID)) renderSingle();
  });
})();
