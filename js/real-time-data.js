/* real-time-data.js - Integración de datos en tiempo real */

// API de clima y oleaje (Open-Meteo)
const FUERTEVENTURA_COORDS = {
    lat: 28.3587,
    lon: -14.0537
};

// Fetch clima actual
async function fetchWeatherData() {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${FUERTEVENTURA_COORDS.lat}&longitude=${FUERTEVENTURA_COORDS.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_mean&timezone=Atlantic/Canary`
        );
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching weather:', error);
        return null;
    }
}

// Fetch datos de oleaje (Marine API)
async function fetchWaveData() {
    try {
        const response = await fetch(
            `https://marine-api.open-meteo.com/v1/marine?latitude=${FUERTEVENTURA_COORDS.lat}&longitude=${FUERTEVENTURA_COORDS.lon}&current=wave_height,wave_direction,wave_period&timezone=Atlantic/Canary`
        );
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching wave data:', error);
        return null;
    }
}

// Renderizar widget de clima
function renderWeatherWidget(data) {
    const container = document.getElementById('weather-widget');
    if (!container || !data) return;

    const current = data.current_weather;
    const daily = data.daily;

    const weatherIcons = {
        0: '☀️', // Clear
        1: '🌤️', // Mainly clear
        2: '⛅', // Partly cloudy
        3: '☁️', // Overcast
        45: '🌫️', // Fog
        48: '🌫️', // Fog
        51: '🌧️', // Drizzle
        61: '🌧️', // Rain
        71: '🌨️', // Snow
        95: '⛈️' // Thunderstorm
    };

    const icon = weatherIcons[current.weathercode] || '🌤️';

    container.innerHTML = `
        <div class="weather-card" style="background:var(--gradient-ocean);color:white;padding:2rem;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.15);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;">
                <div>
                    <h3 style="margin:0 0 0.5rem;font-family:var(--font-display);font-size:1.5rem;">Fuerteventura Ahora</h3>
                    <p style="margin:0;opacity:0.9;font-size:0.9rem;">Actualizado hace instantes</p>
                </div>
                <div style="font-size:4rem;">${icon}</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1rem;">
                <div>
                    <div style="font-size:2.5rem;font-weight:bold;">${Math.round(current.temperature)}°C</div>
                    <div style="opacity:0.9;font-size:0.9rem;">Temperatura</div>
                </div>
                <div>
                    <div style="font-size:1.5rem;font-weight:bold;">${Math.round(current.windspeed)} km/h</div>
                    <div style="opacity:0.9;font-size:0.9rem;">Viento</div>
                </div>
                <div>
                    <div style="font-size:1.5rem;font-weight:bold;">${daily.temperature_2m_max[0]}° / ${daily.temperature_2m_min[0]}°</div>
                    <div style="opacity:0.9;font-size:0.9rem;">Máx / Mín</div>
                </div>
            </div>
        </div>
    `;
}

// Renderizar widget de oleaje
function renderWaveWidget(data) {
    const container = document.getElementById('wave-widget');
    if (!container || !data) return;

    const current = data.current;

    container.innerHTML = `
        <div class="wave-card" style="background:linear-gradient(135deg, #2ec4b6 0%, #0f4c81 100%);color:white;padding:2rem;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.15);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;">
                <h3 style="margin:0;font-family:var(--font-display);font-size:1.5rem;">Condiciones del Mar</h3>
                <div style="font-size:3rem;">🌊</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:1rem;">
                <div>
                    <div style="font-size:2rem;font-weight:bold;">${current.wave_height?.toFixed(1) || 'N/A'} m</div>
                    <div style="opacity:0.9;font-size:0.9rem;">Altura olas</div>
                </div>
                <div>
                    <div style="font-size:1.5rem;font-weight:bold;">${current.wave_period?.toFixed(0) || 'N/A'} s</div>
                    <div style="opacity:0.9;font-size:0.9rem;">Periodo</div>
                </div>
                <div>
                    <div style="font-size:1.5rem;font-weight:bold;">${current.wave_direction || 'N/A'}°</div>
                    <div style="opacity:0.9;font-size:0.9rem;">Dirección</div>
                </div>
            </div>
        </div>
    `;
}

// Inicializar widgets al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    const weatherData = await fetchWeatherData();
    const waveData = await fetchWaveData();

    if (weatherData) renderWeatherWidget(weatherData);
    if (waveData) renderWaveWidget(waveData);

    // Actualizar cada 10 minutos
    setInterval(async () => {
        const weatherData = await fetchWeatherData();
        const waveData = await fetchWaveData();
        if (weatherData) renderWeatherWidget(weatherData);
        if (waveData) renderWaveWidget(waveData);
    }, 600000); // 10 minutos
});
