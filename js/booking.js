(function(){
  function byId(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
  function formatDate(d){ try { return new Date(d).toLocaleDateString('es-ES',{year:'numeric',month:'2-digit',day:'2-digit'});} catch(e){ return d; } }
  function nightsBetween(a,b){ try { const d1=new Date(a), d2=new Date(b); return Math.max(0, Math.round((d2-d1)/(1000*60*60*24))); } catch(e){ return 0; } }

  function updateSummary(){
    const loc = byId('location').value || 'Cualquier zona';
    const typ = byId('type').value || 'Cualquier tipo';
    const bgt = byId('budget').value ? `Hasta ${byId('budget').value}€/noche` : 'Sin límite';
    const ci = byId('checkin').value; const co = byId('checkout').value; const g = byId('guests').value || '2';
    const n = ci && co ? nightsBetween(ci,co) : 0;
    const out = byId('booking-summary');
    if(!out) return;
    if(ci && co){
      out.textContent = `Búsqueda: ${esc(loc)}, ${esc(typ)}, ${esc(bgt)} · ${n} noche(s), ${esc(g)} huésped(es) (${formatDate(ci)} → ${formatDate(co)})`;
    } else {
      out.textContent = '';
    }
  }

  function handleSearch(e){
    e.preventDefault();
    updateSummary();
  }

  function buildMailTo(){
    const loc = byId('location').value || 'Cualquier zona';
    const typ = byId('type').value || 'Cualquier tipo';
    const bgt = byId('budget').value ? `Hasta ${byId('budget').value}€/noche` : 'Sin límite';
    const ci = byId('checkin').value; const co = byId('checkout').value; const g = byId('guests').value || '2';
    const n = ci && co ? nightsBetween(ci,co) : 0;
    const subject = encodeURIComponent('Solicitud de reserva directa - This is Fuerteventura');
    const body = encodeURIComponent(`Hola,

Me interesa realizar una reserva directa con estos detalles:

- Zona: ${loc}
- Tipo: ${typ}
- Presupuesto: ${bgt}
- Entrada: ${formatDate(ci)}
- Salida: ${formatDate(co)}
- Noches: ${n}
- Huéspedes: ${g}

¿Podrían confirmar disponibilidad y precio final? Gracias.`);
    return `mailto:info@thisisfuerteventura.es?subject=${subject}&body=${body}`;
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const form = byId('booking-search');
    if(form){
      form.addEventListener('submit', handleSearch);
      ['location','type','budget','checkin','checkout','guests'].forEach(id=>{
        const el = byId(id); if(el) el.addEventListener('change', updateSummary);
      });
    }
    const btn = byId('booking-direct');
    if(btn){
      btn.addEventListener('click', ()=>{
        const ci = byId('checkin').value; const co = byId('checkout').value;
        if(!ci || !co){
          alert('Selecciona fechas de entrada y salida antes de solicitar la reserva.');
          return;
        }
        location.href = buildMailTo();
      });
    }
  });
})();
