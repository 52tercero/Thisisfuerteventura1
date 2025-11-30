"use client";
import { useEffect, useState } from 'react';

interface Question { q: string; a: string[]; c: number }
const QUESTIONS: Question[] = [
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
];

interface State { idx: number; answers: (number|null)[]; completed: boolean }

export default function Quiz(){
  const [state, setState] = useState<State>({ idx:0, answers: Array(QUESTIONS.length).fill(null), completed:false });
  const [error, setError] = useState('');
  const STORAGE_KEY = 'tiFv_quiz_state_short';
  const SCORE_KEY = 'tiFv_quiz_score_short';

  useEffect(()=>{
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        const data = JSON.parse(raw);
        if(data && Array.isArray(data.answers)){ setState(data); }
      }
    } catch{}
  },[]);

  function persist(next: State){
    setState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch{}
  }

  function selectAnswer(ans: number){
    const next = { ...state, answers: state.answers.map((v,i)=> i===state.idx? ans : v) };
    persist(next);
    setError('');
  }

  function next(){
    if(state.answers[state.idx] == null){ setError('Selecciona una respuesta.'); return; }
    if(state.idx < QUESTIONS.length-1){
      persist({ ...state, idx: state.idx+1 });
    } else {
      complete();
    }
  }

  function prev(){
    if(state.idx>0){ persist({ ...state, idx: state.idx-1 }); }
  }

  function complete(){
    let score=0; QUESTIONS.forEach((q,i)=>{ if(state.answers[i]===q.c) score++; });
    try { localStorage.setItem(SCORE_KEY, String(score)); } catch{}
    persist({ ...state, completed:true });
  }

  function restart(){ persist({ idx:0, answers:Array(QUESTIONS.length).fill(null), completed:false }); }

  if(state.completed){
    const score = state.answers.filter((v,i)=> v===QUESTIONS[i].c).length;
    const pct = Math.round(score/QUESTIONS.length*100);
    return (
      <div className="quiz-card border rounded p-4 max-w-xl">
        <h3 className="text-xl font-semibold mb-2">Resultado</h3>
        <p className="mb-4">{score}/{QUESTIONS.length} ({pct}%).</p>
        <button className="btn" onClick={restart}>Reiniciar</button>
      </div>
    );
  }

  const q = QUESTIONS[state.idx];
  return (
    <div className="quiz-card border rounded p-4 max-w-xl">
      <p className="text-sm mb-2">Pregunta {state.idx+1} de {QUESTIONS.length}</p>
      <h3 className="text-lg font-semibold mb-3">{q.q}</h3>
      <div className="space-y-2 mb-4">
        {q.a.map((opt,i)=>{
          const selected = state.answers[state.idx]===i;
          return (
            <label key={i} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="q" value={i} checked={selected} onChange={()=>selectAnswer(i)} />
              <span>{opt}</span>
            </label>
          );
        })}
      </div>
      {error && <p className="text-red-600 text-sm mb-2" role="alert">{error}</p>}
      <div className="flex gap-3">
        <button className="btn" type="button" onClick={prev} disabled={state.idx===0}>Anterior</button>
        <button className="btn" type="button" onClick={next}>{state.idx===QUESTIONS.length-1? 'Enviar':'Siguiente'}</button>
      </div>
    </div>
  );
}