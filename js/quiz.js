/* quiz.js: Quiz accesible y compatible con CSP (1 en 1, 25 preguntas) */
(function(){
  const CTN_ID = 'quiz-container';
  const QUESTIONS = [
    { q: '¿Cuál es la capital de Fuerteventura?', a: ['Corralejo','Puerto del Rosario','Betancuria'], c: 1 },
    { q: '¿Qué parque natural es famoso por sus dunas?', a: ['Jandía','Corralejo','Betancuria'], c: 1 },
    { q: '¿Cómo se llama el islote frente a Corralejo?', a: ['Lobos','La Graciosa','Alegranza'], c: 0 },
    { q: '¿Qué playa es célebre por el kitesurf?', a: ['Ajuy','Cofete','Sotavento'], c: 2 },
    { q: '¿En qué año fue declarada Reserva de la Biosfera por la UNESCO?', a: ['2009','2002','2015'], c: 0 },
    { q: '¿Cuál es el municipio más poblado?', a: ['Puerto del Rosario','La Oliva','Pájara'], c: 0 },
    { q: '¿Qué playa destaca por su arena negra?', a: ['Ajuy','Esquinzo','El Cotillo'], c: 0 },
    { q: '¿Cuál es la cima más alta de la isla?', a: ['Montaña de Tindaya','Pico de la Zarza','Montaña de Cardón'], c: 1 },
    { q: '¿Qué océano baña Fuerteventura?', a: ['Mar Cantábrico','Océano Atlántico','Mar Mediterráneo'], c: 1 },
    { q: '¿A qué provincia pertenece Fuerteventura?', a: ['Las Palmas','Santa Cruz de Tenerife','Cádiz'], c: 0 },
    { q: '¿Cuál es el código IATA del aeropuerto?', a: ['FUE','FTF','FVN'], c: 0 },
    { q: '¿Cuál es un producto típico de su gastronomía?', a: ['Queso majorero','Fabada','Cocido montañés'], c: 0 },
    { q: '¿Qué vientos predominan en la isla?', a: ['Alisios','Levante','Tramontana'], c: 0 },
    { q: '¿Cuál es el principal puerto comercial?', a: ['Morro Jable','Corralejo','Puerto del Rosario'], c: 2 },
    { q: 'Playas del entorno de Jandía', a: ['Cofete y Barlovento','Las Canteras y Teresitas','Papagayo y Famara'], c: 0 },
    { q: 'Localidad del norte famosa por el surf', a: ['Corralejo','Gran Tarajal','Caleta de Fuste'], c: 0 },
    { q: 'Componente frecuente de la arena', a: ['Coral y conchas','Pizarra','Basalto'], c: 0 },
    { q: 'Isla vecina más cercana al norte', a: ['Lanzarote','Gran Canaria','La Palma'], c: 0 },
    { q: 'Actividad típica impulsada por el viento', a: ['Esquí','Kitesurf','Escalada en hielo'], c: 1 },
    { q: 'Cráter volcánico popular para senderismo', a: ['Caldera de Taburiente','Calderón Hondo','Teide'], c: 1 },
    { q: '¿Desde dónde parte el barco a Lobos?', a: ['Corralejo','Morro Jable','Arrecife'], c: 0 },
    { q: 'Zona turística del centro-este', a: ['Costa Calma','Caleta de Fuste','El Cotillo'], c: 1 },
    { q: 'Ferri hacia Gran Canaria sale principalmente de', a: ['Puerto del Rosario','Morro Jable','Tazacorte'], c: 1 },
    { q: 'Bandera que indica baño seguro', a: ['Roja','Verde','Negra'], c: 1 },
    { q: 'Monumento natural cercano a Lajares', a: ['Montaña de Tindaya','Jameos del Agua','Roque Nublo'], c: 0 }
  ];

  function byId(id){ return document.getElementById(id); }
  function create(el, cls){ const n = document.createElement(el); if(cls) n.className = cls; return n; }

  function buildQuiz(container){
    const state = { idx: 0, answers: Array(QUESTIONS.length).fill(null) };

    const card = create('div','conditions-card quiz-card sea');
    const inner = create('div','quiz-inner');
    const heading = create('h3');
    heading.innerHTML = '<i class="fas fa-question-circle" aria-hidden="true"></i> Quiz';
    const progress = create('p','quiz-progress');
    progress.setAttribute('aria-live','polite');
    const progWrap = create('div','quiz-progress-wrap');
    const progTrack = create('div','quiz-progress-track');
    const progFill = create('div','quiz-progress-fill');
    progTrack.setAttribute('role','progressbar');
    progTrack.setAttribute('aria-valuemin','0');
    progTrack.setAttribute('aria-valuemax', String(QUESTIONS.length));
    progTrack.appendChild(progFill);
    progWrap.appendChild(progTrack);
    card.appendChild(heading);

    const form = create('form','quiz-form');
    const field = create('fieldset');
    const legend = create('legend');
    field.appendChild(legend);
    const optionsWrap = create('div','quiz-options');
    field.appendChild(optionsWrap);
    form.appendChild(field);

    const errorMsg = create('div','quiz-error');
    errorMsg.setAttribute('aria-live','polite');
    errorMsg.style.color = '#c0392b';

    const nav = create('div','quiz-nav');
    const prevBtn = create('button','btn'); prevBtn.type='button'; prevBtn.textContent='Anterior';
    const nextBtn = create('button','btn'); nextBtn.type='button'; nextBtn.textContent='Siguiente';
    nav.appendChild(prevBtn); nav.appendChild(nextBtn);

    const result = create('div','quiz-result'); result.setAttribute('aria-live','polite');

    inner.appendChild(progWrap);
    inner.appendChild(progress);
    inner.appendChild(form);
    inner.appendChild(errorMsg);
    inner.appendChild(nav);
    inner.appendChild(result);
    card.appendChild(inner);
    container.appendChild(card);

    function renderQuestion(i){
      const q = QUESTIONS[i];
      progress.textContent = `Pregunta ${i+1} de ${QUESTIONS.length}`;
      legend.textContent = q.q;
      optionsWrap.innerHTML = '';
      q.a.forEach((opt, idx)=>{
        const label = create('label');
        const input = create('input'); input.type='radio'; input.name='q'; input.value=String(idx);
        if(state.answers[i] !== null && Number(state.answers[i])===idx) input.checked = true;
        const span = create('span'); span.textContent = ' '+opt;
        label.appendChild(input); label.appendChild(span);
        optionsWrap.appendChild(label);
      });
      prevBtn.disabled = (i===0);
      nextBtn.textContent = (i===QUESTIONS.length-1) ? 'Enviar' : 'Siguiente';
      errorMsg.textContent = '';
      result.textContent = '';
      // Actualizar barra de progreso (posición actual)
      const currentStep = i + 1;
      const pct = Math.round((currentStep/QUESTIONS.length)*100);
      progFill.style.width = pct + '%';
      progTrack.setAttribute('aria-valuenow', String(currentStep));
    }

    function getSelected(){
      const sel = form.querySelector('input[name="q"]:checked');
      return sel ? Number(sel.value) : null;
    }

    function completeQuiz(){
      let score = 0;
      for(let i=0;i<QUESTIONS.length;i++){
        if(state.answers[i] !== null && Number(state.answers[i])===QUESTIONS[i].c) score++;
      }
      const pct = Math.round((score/QUESTIONS.length)*100);
      localStorage.setItem('tiFv_quiz_score', String(score));
      result.textContent = `Resultado: ${score}/${QUESTIONS.length} (${pct}%).`;
      // Deshabilitar navegación tras finalizar
      prevBtn.disabled = true; nextBtn.disabled = true;
      generateBadge(pct, container);
    }

    prevBtn.addEventListener('click', ()=>{
      const sel = getSelected();
      if(sel !== null) state.answers[state.idx] = sel;
      if(state.idx>0){ state.idx--; renderQuestion(state.idx); }
    });

    nextBtn.addEventListener('click', ()=>{
      const sel = getSelected();
      if(sel===null){ errorMsg.textContent = 'Selecciona una respuesta para continuar.'; return; }
      state.answers[state.idx] = sel;
      if(state.idx < QUESTIONS.length-1){
        state.idx++; renderQuestion(state.idx);
      } else {
        completeQuiz();
      }
    });

    renderQuestion(state.idx);
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
