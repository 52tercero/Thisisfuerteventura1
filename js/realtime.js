(function(){
  const LAT = 28.5;
  const LON = -13.86;

  function byId(id){ return document.getElementById(id); }
  function setLoading(el, msg){ if(el) el.innerHTML = '<div class="loading">'+msg+'</div>'; }
  function setError(el, msg){ if(el) el.innerHTML = '<div class="no-results">'+msg+'</div>'; }
  function esc(str){ return String(str==null? '': str).replace(/[&<>"']/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s])); }
  function wmoToText(code){
    const map = {
      0:'Despejado',1:'Mayormente despejado',2:'Parcialmente nublado',3:'Nublado',
      45:'Niebla',48:'Escarcha con niebla',51:'Llovizna débil',53:'Llovizna',55:'Llovizna intensa',
      61:'Lluvia débil',63:'Lluvia',65:'Lluvia intensa',66:'Lluvia helada débil',67:'Lluvia helada',
      71:'Nieve débil',73:'Nieve',75:'Nieve intensa',77:'Granos de nieve',
      80:'Chubascos débiles',81:'Chubascos',82:'Chubascos fuertes',
      85:'Chubascos de nieve débiles',86:'Chubascos de nieve fuertes',
      95:'Tormenta',96:'Tormenta con granizo débil',99:'Tormenta con granizo fuerte'
    };
    return map[code] || '—';
  }
  function degToCompass(deg){
    if(typeof deg!=='number' || !isFinite(deg)) return '—';
    const dirs=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];
    return dirs[Math.round(((deg%360)+360)%360/22.5)%16];
  }
  const ICONS = { clear:'fas fa-sun', cloudy:'fas fa-cloud', rain:'fas fa-cloud-showers-heavy', wind:'fas fa-wind', waves:'fas fa-water', clock:'fas fa-clock', compass:'fas fa-compass', period:'fas fa-wave-square' };
  function pickIcon(code){ if([0].includes(code)) return ICONS.clear; if([1,2,3].includes(code)) return ICONS.cloudy; if([51,53,55,61,63,65,80,81,82].includes(code)) return ICONS.rain; return ICONS.cloudy; }

  async function loadWeather(){
    const wrap = byId('weather-widget');
    if(!wrap) return;
    const body = wrap.querySelector('.widget-body') || wrap;
    setLoading(body, 'Cargando tiempo...');
    try{
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current_weather=true&current=temperature_2m,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;
      const r = await fetch(url, { credentials: 'omit' });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const data = await r.json();
      const cw = data.current_weather || {};
      const cur = data.current || {};

      // Prefer current_weather (legacy), then current API, then hourly nearest
      let temp = (typeof cw.temperature==='number') ? cw.temperature : (typeof cur.temperature_2m==='number' ? cur.temperature_2m : undefined);
      let wind = (typeof cw.windspeed==='number') ? cw.windspeed : (typeof cur.wind_speed_10m==='number' ? cur.wind_speed_10m : undefined);
      let wcode = (typeof cw.weathercode==='number') ? cw.weathercode : (typeof cur.weather_code==='number' ? cur.weather_code : undefined);
      let timeStr = cw.time || cur.time || '';

      if(temp===undefined || wind===undefined || wcode===undefined){
        const h = data.hourly || {};
        const times = h.time || [];
        if(times.length){
          let idx = 0, bestDiff = Infinity, now = Date.now();
          for(let i=0;i<times.length;i++){
            const t = Date.parse(times[i]);
            const d = Math.abs(t-now);
            if(d<bestDiff){ bestDiff=d; idx=i; }
          }
          if(temp===undefined && Array.isArray(h.temperature_2m)) temp = h.temperature_2m[idx];
          if(wind===undefined && Array.isArray(h.wind_speed_10m)) wind = h.wind_speed_10m[idx];
          if(wcode===undefined && Array.isArray(h.weather_code)) wcode = h.weather_code[idx];
          if(!timeStr) timeStr = times[idx] || '';
        }
      }

      const wtxt = wmoToText(wcode);
      const updated = timeStr ? new Date(timeStr).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : '';
      const tempText = (typeof temp==='number') ? temp.toFixed(0) : '—';
      const windText = (typeof wind==='number') ? wind.toFixed(0) : '—';
      const icon = pickIcon(wcode);
      body.innerHTML =
        '<div class="temp-row">'
        +  '<div class="temp-main">'
        +    `<span class="icon-circle"><i class="${icon}"></i></span>`
        +    `<span class="temp-value">${esc(tempText)}°C</span>`
        +  '</div>'
        +  '<div class="temp-meta">'
        +    `<span class="metric-badge"><i class="${ICONS.wind}"></i> ${esc(windText)} km/h</span>`
        +    `<span class="metric-badge"><i class="fas fa-cloud"></i> ${esc(wtxt)}</span>`
        +    `<span class="metric-badge"><i class="${ICONS.clock}"></i> ${esc(updated)}</span>`
        +  '</div>'
        + '</div>';
    }catch(e){
      setError(wrap, 'No se pudo cargar el clima');
    }
  }

  async function loadWaves(){
    const wrap = byId('wave-widget');
    if(!wrap) return;
    const body = wrap.querySelector('.widget-body') || wrap;
    setLoading(body, 'Cargando condiciones del mar...');
    try{
      const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}&hourly=wave_height,wave_direction,wave_period&timezone=auto`;
      const r = await fetch(url, { credentials: 'omit' });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const data = await r.json();
      const h = data.hourly || {};
      const times = h.time || [];
      const idx = (()=>{
        const now = Date.now();
        let best = 0, bestDiff = Infinity;
        for(let i=0;i<times.length;i++){
          const t = Date.parse(times[i]);
          const diff = Math.abs(t-now);
          if(diff < bestDiff){ bestDiff = diff; best = i; }
        }
        return best;
      })();
      const height = h.wave_height && typeof h.wave_height[idx]==='number' ? h.wave_height[idx].toFixed(1) : '—';
      const period = h.wave_period && typeof h.wave_period[idx]==='number' ? h.wave_period[idx].toFixed(0) : '—';
      const dir = h.wave_direction && typeof h.wave_direction[idx]==='number' ? degToCompass(h.wave_direction[idx]) : '—';
      const updated = times[idx] ? new Date(times[idx]).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : '';
      body.innerHTML =
        '<div class="temp-row">'
        +  '<div class="temp-main">'
        +    `<span class="icon-circle"><i class="${ICONS.waves}"></i></span>`
        +    `<span class="temp-value">${esc(height)} m</span>`
        +  '</div>'
        +  '<div class="temp-meta">'
        +    `<span class="metric-badge"><i class="${ICONS.period}"></i> ${esc(period)} s</span>`
        +    `<span class="metric-badge"><i class="${ICONS.compass}"></i> ${esc(dir)}</span>`
        +    `<span class="metric-badge"><i class="${ICONS.clock}"></i> ${esc(updated)}</span>`
        +  '</div>'
        + '</div>';
    }catch(e){
      setError(wrap, 'No se pudieron cargar las olas');
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    loadWeather();
    loadWaves();
  });
})();
