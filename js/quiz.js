/* quiz.js: Quiz accesible y compatible con CSP */
(function(){
  const CTN_ID = 'quiz-container';
  const QUESTIONS = [
    { q: '¿Cuál es la capital de Fuerteventura?', a: ['Corralejo','Puerto del Rosario','Betancuria'], c: 1 },
    { q: '¿Qué playa es famosa por el kitesurf?', a: ['Sotavento','Ajuy','La Concha'], c: 0 },
    { q: '¿Cómo se llama la isla frente a Corralejo?', a: ['La Graciosa','Lobos','La Gomera'], c: 1 }
  ];

  function byId(id){ return document.getElementById(id); }
  function create(el, cls){ const n = document.createElement(el); if(cls) n.className = cls; return n; }

  function buildQuiz(container){
    const card = create('div','conditions-card quiz-card');
    const inner = create('div','quiz-inner');
    const heading = create('h3');
    heading.innerHTML = '<i class="fas fa-question-circle" aria-hidden="true"></i> Quiz';
    card.appendChild(heading);

    const form = create('form','quiz-form');
    QUESTIONS.forEach((it, idx)=>{
      const field = create('fieldset');
      const legend = create('legend'); legend.textContent = `${idx+1}. ${it.q}`; field.appendChild(legend);
      it.a.forEach((opt, i)=>{
        const label = create('label');
        const input = create('input'); input.type='radio'; input.name='q'+idx; input.value=String(i);
        label.appendChild(input);
        const span = create('span'); span.textContent = ' '+opt; label.appendChild(span);
        field.appendChild(label);
      });
      form.appendChild(field);
    });
    const submit = create('button','btn'); submit.type='submit'; submit.textContent='Enviar';
    form.appendChild(submit);

    const result = create('div','quiz-result'); result.setAttribute('aria-live','polite');
    inner.appendChild(form);
    inner.appendChild(result);
    card.appendChild(inner);
    container.appendChild(card);

    form.addEventListener('submit', e=>{
      e.preventDefault();
      let score = 0;
      QUESTIONS.forEach((it, idx)=>{
        const sel = form.querySelector(`input[name="q${idx}"]:checked`);
        if(sel && Number(sel.value)===it.c) score++;
      });
      const pct = Math.round((score/QUESTIONS.length)*100);
      localStorage.setItem('tiFv_quiz_score', String(score));
      result.textContent = `Resultado: ${score}/${QUESTIONS.length} (${pct}%).`;
      generateBadge(pct, container);
    });
  }

  function generateBadge(pct, container){
    const wrap = create('div','badge-wrap');
    const cv = document.createElement('canvas'); cv.width=400; cv.height=200;
    const ctx = cv.getContext('2d');
    ctx.fillStyle='#0f4c81'; ctx.fillRect(0,0,400,200);
    ctx.fillStyle='#fff'; ctx.font='bold 22px Inter, Arial, sans-serif';
    ctx.fillText('This is Fuerteventura', 16, 40);
    ctx.font='18px Inter, Arial, sans-serif'; ctx.fillText('Insignia de Conocimiento', 16, 75);
    ctx.font='bold 48px Inter, Arial, sans-serif'; ctx.fillText(pct+'%', 16, 140);
    const a = create('a','btn'); a.href=cv.toDataURL('image/png'); a.download='insignia-fuerteventura.png'; a.textContent='Descargar insignia';
    wrap.appendChild(cv); wrap.appendChild(a);
    container.appendChild(wrap);
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const ctn = byId(CTN_ID);
    if(ctn){
      ctn.innerHTML='';
      buildQuiz(ctn);
    }
  });
})();
