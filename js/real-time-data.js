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
        <div class="widget-card ocean weather-card">
            <div class="widget-header">
                <div>
                    <h3 class="widget-title">Fuerteventura Ahora</h3>
                    <p class="widget-sub">Actualizado hace instantes</p>
                </div>
                <div class="widget-icon">${icon}</div>
            </div>
            <div class="widget-grid">
                <div class="widget-metric">
                    <div class="metric-value xxl">${Math.round(current.temperature)}°C</div>
                    <div class="metric-label">Temperatura</div>
                </div>
                <div class="widget-metric">
                    <div class="metric-value lg">${Math.round(current.windspeed)} km/h</div>
                    <div class="metric-label">Viento</div>
                </div>
                <div class="widget-metric">
                    <div class="metric-value lg">${daily.temperature_2m_max[0]}° / ${daily.temperature_2m_min[0]}°</div>
                    <div class="metric-label">Máx / Mín</div>
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
        <div class="widget-card sea wave-card">
            <div class="widget-header">
                <h3 class="widget-title">Condiciones del Mar</h3>
                <div class="widget-icon">🌊</div>
            </div>
            <div class="widget-grid tight">
                <div class="widget-metric">
                    <div class="metric-value xl">${current.wave_height?.toFixed(1) || 'N/A'} m</div>
                    <div class="metric-label">Altura olas</div>
                </div>
                <div class="widget-metric">
                    <div class="metric-value lg">${current.wave_period?.toFixed(0) || 'N/A'} s</div>
                    <div class="metric-label">Periodo</div>
                </div>
                <div class="widget-metric">
                    <div class="metric-value lg">${current.wave_direction || 'N/A'}°</div>
                    <div class="metric-label">Dirección</div>
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
