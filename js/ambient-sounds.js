(function(){
  const SOURCES = {
    ocean: 'sonidos/olas.mp3',
    wind: 'sonidos/viento.mp3',
    music: 'sonidos/musica_local.mp3'
  };
  // Map generalized cues to concrete sources
  const CUES = {
    waves: 'ocean',
    wind: 'wind',
    earth: 'music' // symbolic low hum via music track as placeholder
  };

  const Ambient = {
    isEnabled: false,
    currentKey: null,
    volume: 0.3,
    el: null,

    ensure() {
      if (!this.el) {
        this.el = new Audio();
        this.el.loop = true;
        this.el.volume = this.volume;
      }
    },
    async playKey(key, opts = {}) {
      try {
        this.ensure();
        const src = SOURCES[key];
        if (!src) return;
        if (typeof opts.volume === 'number') this.setVolume(opts.volume);
        if (!this.isEnabled) return; // respect global enable state
        if (!this.el.paused) { try { this.el.pause(); } catch(_) {} }
        this.el.src = src;
        await this.el.play();
        this.currentKey = key;
      } catch (e) {
        // Most browsers require user gesture; swallow errors silently
      }
    },
    async playCue(cue, opts = {}) {
      const key = CUES[cue] || cue; // allow direct keys
      return this.playKey(key, opts);
    },
    enable(opts = {}) {
      this.isEnabled = true;
      if (typeof opts.volume === 'number') this.setVolume(opts.volume);
      // If we had a current key, resume it; else default to wind
      const key = this.currentKey || 'wind';
      this.playKey(key, opts);
    },
    disable() {
      this.isEnabled = false;
      if (this.el) { try { this.el.pause(); } catch(_) {} }
    },
    setVolume(v) {
      try {
        const vol = Math.max(0, Math.min(1, v));
        this.volume = vol;
        if (this.el) this.el.volume = vol;
      } catch(_) {}
    },
    fadeOut(seconds = 0.8) {
      const steps = Math.max(1, Math.floor(seconds * 30));
      const dv = (this.volume) / steps;
      let i = 0;
      const id = setInterval(() => {
        i++;
        this.setVolume(this.volume - dv);
        if (i >= steps) { clearInterval(id); }
      }, 1000/30);
    }
  };

  // Expose API globally
  try { window.AmbientSounds = Ambient; } catch(_) {}

  // Lightweight inline UI for pages that want an in-content control
  function ui(container){
    const wrap = document.createElement('div');
    wrap.className='ambient-sounds';
    const title = document.createElement('h3'); title.textContent='Sonidos ambientales (opcional)';
    const desc = document.createElement('p'); desc.textContent='Activa olas, viento o música local mientras navegas.';
    const select = document.createElement('select'); select.ariaLabel='Selecciona ambiente';
    const opt0 = document.createElement('option'); opt0.value=''; opt0.textContent='— Selecciona —'; select.appendChild(opt0);
    Object.keys(SOURCES).forEach(k=>{ const o=document.createElement('option'); o.value=k; o.textContent=k==='ocean'?'Olas':k==='wind'?'Viento':'Música local'; select.appendChild(o); });
    const btn = document.createElement('button'); btn.className='btn'; btn.textContent='Reproducir';
    const status = document.createElement('div'); status.className='ambient-status'; status.setAttribute('aria-live','polite');
    wrap.appendChild(title); wrap.appendChild(desc); wrap.appendChild(select); wrap.appendChild(btn); wrap.appendChild(status);
    container.appendChild(wrap);

    btn.addEventListener('click', async ()=>{
      const key = select.value;
      if(!key){ status.textContent='Selecciona un ambiente.'; return; }
      Ambient.enable({ volume: Ambient.volume });
      await Ambient.playKey(key);
      status.textContent = 'Reproduciendo: ' + (key==='ocean'?'Olas':key==='wind'?'Viento':'Música local');
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    if(document.querySelector('.ambient-sounds')) return;
    const selectors = [
      '.quiz-section',
      '.widgets-section',
      '.newsletter',
      '.beaches-content',
      '.tourism-content',
      '.contact-content',
      '.news-content',
      'main'
    ];
    let hook = null;
    for(const sel of selectors){ hook = document.querySelector(sel); if(hook) break; }
    if(hook){ ui(hook); }
  });
})();
