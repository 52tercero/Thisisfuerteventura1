(function(){
  const card = document.getElementById('island-weather-card');
  if(!card) return;
  const ICONS = { clear:'fas fa-sun', cloudy:'fas fa-cloud', rain:'fas fa-cloud-showers-heavy', wind:'fas fa-wind' };
  function pickIcon(code){ if([0].includes(code)) return ICONS.clear; if([1,2,3].includes(code)) return ICONS.cloudy; if([51,53,55,61,63,65,80,81,82].includes(code)) return ICONS.rain; return ICONS.cloudy; }
  function degToCard(deg){ const dirs=['N','NE','E','SE','S','SW','W','NW']; return (isFinite(deg)?dirs[Math.round(deg/45)%8]:'N/D'); }
  function pickDesc(code){ if([0].includes(code)) return 'Despejado'; if([1,2,3].includes(code)) return 'Nubes'; if([51,53,55,61,63,65,80,81,82].includes(code)) return 'Lluvia'; return 'Variable'; }
  async function load(){
      card.innerHTML = '<div class="loading">Actualizando...</div>';
      const lat = 28.500, lon = -13.862; // Puerto del Rosario aprox.
      const params = new URLSearchParams({ latitude: lat, longitude: lon, current: 'temperature_2m,wind_speed_10m,wind_direction_10m,weather_code', daily: 'temperature_2m_max,temperature_2m_min,weather_code', timezone: 'auto' });
      try{
          const r = await fetch('https://api.open-meteo.com/v1/forecast?'+params.toString());
          if(!r.ok) throw new Error('Respuesta no válida');
          const j = await r.json();
          const cur = j.current || {};
          const icon = pickIcon(cur.weather_code);
          const desc = pickDesc(cur.weather_code);
          const timeTxt = new Date(cur.time||Date.now()).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
          const dirTxt = `${degToCard(cur.wind_direction_10m)} ${isFinite(cur.wind_direction_10m)?cur.wind_direction_10m+'°':''}`;
          const daily = j.daily || {};
          let forecastHtml = '';
          if (daily.time && daily.temperature_2m_max && daily.temperature_2m_min && daily.weather_code) {
              const days = daily.time.slice(0,3).map((d,i)=>({
                  date: d,
                  tmax: daily.temperature_2m_max[i],
                  tmin: daily.temperature_2m_min[i],
                  code: daily.weather_code[i]
              }));
              forecastHtml = '<div class="mini-forecast">' + days.map(day => {
                  const dObj = new Date(day.date);
                  const wd = dObj.toLocaleDateString('es-ES',{weekday:'short'});
                  const ic = pickIcon(day.code);
                  return `<div class="fc-day"><span class="fc-wd">${wd}</span><span class="fc-ic"><i class="${ic}"></i></span><span class="fc-t">${Math.round(day.tmax)}° / ${Math.round(day.tmin)}°</span></div>`;
              }).join('') + '</div>';
          }
          card.innerHTML =
              '<div class="temp-row">'
              +   '<div class="temp-main">'
              +     `<span class="icon-circle"><i class="${icon}"></i></span>`
              +     `<span class="temp-value">${cur.temperature_2m ?? 'N/D'}°C</span>`
              +   '</div>'
              +   '<div class="temp-meta">'
              +     `<span class="metric-badge"><i class="${ICONS.wind}"></i> ${cur.wind_speed_10m ?? 'N/D'} km/h · ${dirTxt}</span>`
              +     `<span class="metric-badge"><i class="fas fa-cloud"></i> ${desc}</span>`
              +     `<span class="metric-badge"><i class="fas fa-clock"></i> ${timeTxt}</span>`
              +   '</div>'
              + '</div>'
              + forecastHtml;
      }catch(e){ card.innerHTML = '<div class="error">Error al cargar el tiempo</div>'; }
  }
  load();
})();

(function() {
  const select = document.getElementById('beach-select');
  const weatherCard = document.getElementById('weather-card');
  const marineCard = document.getElementById('marine-card');
  const toggleWrap = document.querySelector('.horizon-toggle');
  if (!select || !weatherCard || !marineCard) return;

  const ICONS = { clear:'fas fa-sun', cloudy:'fas fa-cloud', rain:'fas fa-cloud-showers-heavy', wind:'fas fa-wind', waves:'fas fa-water' };
  function pickIcon(code){
      if ([0].includes(code)) return ICONS.clear;
      if ([1,2,3].includes(code)) return ICONS.cloudy;
      if ([51,53,55,61,63,65,80,81,82].includes(code)) return ICONS.rain;
      return ICONS.cloudy;
  }

  let horizonHours = 6;
  let currentLat = null, currentLon = null;

  async function load(lat, lon){
      currentLat = lat; currentLon = lon;
      weatherCard.innerHTML = '<div class="loading">Actualizando...</div>';
      marineCard.innerHTML = '<div class="loading">Actualizando...</div>';
      try {
          const weatherParams = new URLSearchParams({
              latitude: lat,
              longitude: lon,
              current: 'temperature_2m,wind_speed_10m,weather_code',
              timezone: 'auto'
          });
          const wRes = await fetch('https://api.open-meteo.com/v1/forecast?' + weatherParams.toString());
          if(!wRes.ok) throw new Error('Respuesta no válida (tiempo)');
          const wJson = await wRes.json();
          const cur = wJson.current || {};
          const icon = pickIcon(cur.weather_code);
          const beachName = (select.options[select.selectedIndex]||{}).text || 'Playa seleccionada';
          const timeTxt = new Date(cur.time || Date.now()).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
          weatherCard.innerHTML =
              `<div class="card-title">${beachName}</div>`+
              '<div class="temp-row">'
              +   '<div class="temp-main">'
              +     `<span class="icon-circle"><i class="${icon}"></i></span>`
              +     `<span class="temp-value">${cur.temperature_2m ?? 'N/D'}°C</span>`
              +   '</div>'
              +   '<div class="temp-meta">'
              +     `<span class="metric-badge"><i class="${ICONS.wind}"></i> ${cur.wind_speed_10m ?? 'N/D'} km/h</span>`
              +     `<span class="metric-badge"><i class="fas fa-clock"></i> ${timeTxt}</span>`
              +   '</div>'
              + '</div>';

          const marineParams = new URLSearchParams({
              latitude: lat,
              longitude: lon,
              hourly: 'wave_height',
              timezone: 'auto'
          });
          const mRes = await fetch('https://marine-api.open-meteo.com/v1/marine?' + marineParams.toString());
          if(!mRes.ok) throw new Error('Respuesta no válida (mar)');
          const mJson = await mRes.json();
          const hourly = mJson.hourly || {};
          const waves = (hourly.wave_height && hourly.time) ? hourly.wave_height.map((h,i)=>({ h, t: hourly.time[i] })) : [];
          const now = new Date();
          const nowHourIso = now.toISOString().slice(0,13);
          let start = 0;
          if (hourly.time && Array.isArray(hourly.time)) {
              const idx = hourly.time.findIndex((t)=> t.slice(0,13) === nowHourIso);
              start = idx >= 0 ? idx : 0;
          }
          const count = Math.max(1, Math.min(horizonHours, waves.length - start));
          const next = waves.slice(start, start + count);

          marineCard.innerHTML =
              `<div class="card-title">${beachName}</div>`+
              `<div class="waves-block"><p><i class="${ICONS.waves}"></i> Próximas ${count}h (altura de ola)</p>`
              + `<ul class="wave-list">${ next.map(w => (
                  `<li class="wave-chip"><i class="${ICONS.waves}"></i> <strong>${(w.h ?? 'N/D')} m</strong> <span>${new Date(w.t).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</span></li>`
              )).join('') || '<li>Sin datos</li>'}</ul></div>`;
      } catch(e) {
          weatherCard.innerHTML = '<div class="error">Error tiempo</div>';
          marineCard.innerHTML = '<div class="error">Error mar</div>';
      }
  }

  const [ilat, ilon] = (select.value || '28.7319,-13.8697').split(',');
  load(ilat, ilon);
  select.addEventListener('change', () => {
      const [lat, lon] = select.value.split(',');
      load(lat, lon);
  });
  if (toggleWrap) {
      toggleWrap.addEventListener('click', (e)=>{
          const btn = e.target.closest('.toggle');
          if(!btn) return;
          const h = parseInt(btn.dataset.h, 10);
          if(!isFinite(h)) return;
          horizonHours = h;
          toggleWrap.querySelectorAll('.toggle').forEach(b=> b.classList.toggle('active', b===btn));
          if (currentLat && currentLon) load(currentLat, currentLon);
      });
  }
})();
