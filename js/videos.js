/**
 * Dedicated module for loading videos feed
 * Loads from RSS feed: 0I3TKDpm3S7TZQdB.xml
 * Supports both development (localhost:3000) and production (Netlify Functions)
 */

(function() {
  'use strict';

  function loadVideos() {
    const container = document.getElementById('news-container');
    if (!container) {
      console.warn('[VIDEOS.JS] No #news-container found');
      return;
    }

    container.innerHTML = '<div class="loading">Cargando vídeos...</div>';

    // Detect environment (development vs production)
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const videosSource = 'https://rss.app/feeds/0I3TKDpm3S7TZQdB.xml';
    let apiUrl;

    if (isProduction) {
      // Netlify Functions endpoint
      apiUrl = '/.netlify/functions/aggregate?sources=' + encodeURIComponent(videosSource);
    } else {
      // Local RSS proxy (Node.js server on port 3000)
      apiUrl = 'http://localhost:3000/api/aggregate?sources=' + encodeURIComponent(videosSource);
    }

    console.log('[VIDEOS.JS] Loading from:', apiUrl);

    fetch(apiUrl, { cache: 'no-store' })
      .then(function(response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status + ': ' + response.statusText);
        }
        return response.json();
      })
      .then(function(data) {
        console.log('[VIDEOS.JS] Received data:', data);

        const items = Array.isArray(data.items) ? data.items : [];

        if (items.length === 0) {
          container.innerHTML = '<div class="no-results">No hay vídeos disponibles</div>';
          return;
        }

        // Clear container and render cards
        container.innerHTML = '';

        items.slice(0, 9).forEach(function(item) {
          const card = document.createElement('div');
          card.className = 'content-card';

          // Extract data
          const title = item.title || 'Sin título';
          const date = item.date || '';
          const description = (item.summary || item.description || '').replace(/<[^>]*>/g, ' ').trim();
          const shortDescription = description.length > 150 ? description.substring(0, 150) + '...' : description;
          const image = item.image || 'images/logo.jpg';

          // Build card HTML
          const cardHTML = 
            <img src="$"'image" alt="$"'title.replace(/"/g, '&quot;')" loading="lazy" referrerpolicy="no-referrer">
            <div class="card-content">
              <span class="date">$"'date"</span>
              <h3>$"'title"</h3>
              <p>$"'shortDescription"</p>
            </div>
          ;

          card.innerHTML = cardHTML;

          // Add error handler for broken images
          const img = card.querySelector('img');
          if (img) {
            img.addEventListener('error', function() {
              this.src = 'images/logo.jpg';
            });
          }

          // Add "View more" button
          const button = document.createElement('a');
          button.href = 'noticia.html?title=' + encodeURIComponent(title);
          button.className = 'btn';
          button.textContent = 'Ver más';

          card.querySelector('.card-content').appendChild(button);
          container.appendChild(card);
        });

        console.log('[VIDEOS.JS] Successfully rendered ' + items.length + ' videos');
      })
      .catch(function(error) {
        console.error('[VIDEOS.JS] Error:', error);
        container.innerHTML = '<div class="error">Error al cargar vídeos: ' + error.message + '</div>';
      });
  }

  // Load when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadVideos);
  } else {
    // DOM already loaded (e.g., script loaded dynamically)
    loadVideos();
  }
})();
