/* quiz.js: lightweight quiz modal */
(function(){
  const openBtn = document.getElementById('open-quiz');
  let modal = document.getElementById('quiz-modal');
  if(!modal){
    modal = document.createElement('div'); modal.id = 'quiz-modal'; modal.style.cssText = 'position:fixed;inset:0;z-index:10002;display:none;background:rgba(0,0,0,.6)';
    modal.innerHTML = '<div style="background:#fff;max-width:560px;margin:10vh auto;border-radius:12px;overflow:hidden">\
      <div style="padding:14px 16px;background:var(--primary-color);color:#fff;display:flex;justify-content:space-between;align-items:center">\
        <strong>Quiz: ¿Cuánto sabes de Fuerteventura?</strong>\
        <button id="quiz-close" style="background:transparent;border:0;color:#fff;font-size:22px;line-height:1;cursor:pointer">×</button>\
      </div>\
      <div style="padding:16px" id="quiz-body"></div>\
    </div>';
    document.body.appendChild(modal);
  }
  const q = [
    {t:'¿Cuál es la playa famosa por su arena negra?', a:['Ajuy','Sotavento','Corralejo'], c:0},
    {t:'¿Qué isla se visita desde Corralejo?', a:['La Gomera','Lobos','El Hierro'], c:1},
    {t:'¿Capital de Fuerteventura?', a:['Arrecife','Puerto del Rosario','Santa Cruz'], c:1}
  ];
  function render(){
    const body = document.getElementById('quiz-body'); let score=0;
    body.innerHTML = q.map((qq,idx)=>{
      return `<div style="margin-bottom:14px"><div style="font-weight:600;margin-bottom:6px">${idx+1}. ${qq.t}</div>`+
             qq.a.map((opt,i)=>`<label style=\"display:block;margin:4px 0\"><input type=\"radio\" name=\"q${idx}\" value=\"${i}\"> ${opt}</label>`).join('')+
             `</div>`;}).join('') +
             '<button id="quiz-submit" class="btn" style="margin-top:8px">Enviar</button> <span id="quiz-result" style="margin-left:8px;font-weight:600"></span>';
    body.querySelector('#quiz-submit').addEventListener('click', ()=>{
      score = 0; q.forEach((qq,i)=>{ const v = body.querySelector(`input[name=q${i}]:checked`); if(v && parseInt(v.value,10)===qq.c) score++; });
      body.querySelector('#quiz-result').textContent = `Puntuación: ${score}/${q.length}`;
    });
  }
  function open(){ modal.style.display='block'; render(); }
  function close(){ modal.style.display='none'; }
  modal.addEventListener('click', (e)=>{ if(e.target.id==='quiz-modal') close(); });
  modal.querySelector('#quiz-close').addEventListener('click', close);
  if(openBtn){ openBtn.addEventListener('click', open); }
  // optionally auto-add a button if missing
  if(!openBtn){
    const hdr = document.querySelector('header .logo-container');
    if(hdr){ const b = document.createElement('button'); b.id='open-quiz'; b.className='btn'; b.textContent='Quiz'; b.style.marginLeft='12px'; hdr.appendChild(b); b.addEventListener('click', open); }
  }
})();
