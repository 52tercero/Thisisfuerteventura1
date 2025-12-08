(function(){
  function toYouTubeEmbed(url){
    try{
      const u = new URL(url);
      if(u.hostname.includes('youtube.com')){
        // watch?v=ID or shorts/ID
        if(u.pathname === '/watch'){
          const id = u.searchParams.get('v');
          if(id) return `https://www.youtube.com/embed/${id}`;
        }
        if(u.pathname.startsWith('/shorts/')){
          const id = u.pathname.split('/')[2];
          if(id) return `https://www.youtube.com/embed/${id}`;
        }
      }
      if(u.hostname === 'youtu.be'){
        const id = u.pathname.slice(1);
        if(id) return `https://www.youtube.com/embed/${id}`;
      }
    }catch(e){}
    return null;
  }

  function toVimeoEmbed(url){
    try{
      const u = new URL(url);
      if(u.hostname.includes('vimeo.com')){
        const parts = u.pathname.split('/').filter(Boolean);
        const id = parts.find(p => /^\d+$/.test(p));
        if(id) return `https://player.vimeo.com/video/${id}`;
      }
    }catch(e){}
    return null;
  }

  function openOverlay(embedUrl){
    const overlay = document.getElementById('video-overlay');
    const frame = document.getElementById('video-frame');
    if(!overlay || !frame) return;
    // autoplay when possible
    const url = new URL(embedUrl);
    url.searchParams.set('autoplay','1');
    url.searchParams.set('rel','0');
    frame.src = url.toString();
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeOverlay(){
    const overlay = document.getElementById('video-overlay');
    const frame = document.getElementById('video-frame');
    if(overlay){ overlay.style.display = 'none'; }
    if(frame){ frame.src = ''; }
    document.body.style.overflow = '';
  }

  function handleLinkClick(e){
    const a = e.target.closest('a');
    if(!a || !a.href) return;
    const yt = toYouTubeEmbed(a.href);
    const vm = toVimeoEmbed(a.href);
    const embed = yt || vm;
    if(embed){
      e.preventDefault();
      openOverlay(embed);
    }
  }

  function init(){
    const widgetContainer = document.querySelector('rssapp-magazine');
    if(widgetContainer){
      widgetContainer.addEventListener('click', handleLinkClick);
    }
    const closeBtn = document.getElementById('video-close');
    const overlay = document.getElementById('video-overlay');
    if(closeBtn){ closeBtn.addEventListener('click', closeOverlay); }
    if(overlay){ overlay.addEventListener('click', function(e){
      // close on backdrop click
      if(e.target === overlay) closeOverlay();
    }); }
    // Esc key to close
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeOverlay(); });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
