(function(){
  const S = {
    ocean: 'sonidos/olas.mp3',
    wind: 'sonidos/viento.mp3',
    music: 'sonidos/musica-local.mp3'
  };
  let current = null;
  let audio = null;

  function ui(container){
    const wrap = document.createElement('div');
    wrap.className='ambient-sounds';
    const title = document.createElement('h3'); title.textContent='Sonidos ambientales (opcional)';
    const desc = document.createElement('p'); desc.textContent='Activa olas, viento o música local mientras navegas.';
    const select = document.createElement('select'); select.ariaLabel='Selecciona ambiente';
    const opt0 = document.createElement('option'); opt0.value=''; opt0.textContent='— Selecciona —'; select.appendChild(opt0);
    Object.keys(S).forEach(k=>{ const o=document.createElement('option'); o.value=k; o.textContent=k==='ocean'?'Olas':k==='wind'?'Viento':'Música local'; select.appendChild(o); });
    const btn = document.createElement('button'); btn.className='btn'; btn.textContent='Reproducir';
    const status = document.createElement('div'); status.className='ambient-status'; status.setAttribute('aria-live','polite');
    wrap.appendChild(title); wrap.appendChild(desc); wrap.appendChild(select); wrap.appendChild(btn); wrap.appendChild(status);
    container.appendChild(wrap);

    btn.addEventListener('click', async ()=>{
      try{
        if(audio){ audio.pause(); audio=null; }
        const key = select.value;
        if(!key){ status.textContent='Selecciona un ambiente.'; return; }
        const src = S[key];
        audio = new Audio(src);
        audio.loop = true;
        await audio.play();
        current = key;
        status.textContent = 'Reproduciendo: ' + (key==='ocean'?'Olas':key==='wind'?'Viento':'Música local');
      }catch(e){
        status.textContent = 'No se pudo reproducir. ¿Está el audio en /sonidos/?';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const hook = document.querySelector('.quiz-section') || document.querySelector('.newsletter');
    if(hook){ ui(hook); }
  });
})();
