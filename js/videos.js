/**
 * Dedicated module for loading videos feed
 * Loads from RSS feed: 0I3TKDpm3S7TZQdB.xml
 * Supports both development (localhost:3000) and production (Netlify Functions)
 */

(function() {
  'use strict';

  function loadVideos() {
    var container = document.getElementById('news-container');
    if (!container) {
      console.warn('[VIDEOS.JS] No #news-container found');
      return;
    }

    container.innerHTML = '<div class=\"loading\">Cargando vídeos...</div>';

    // Detect environment (development vs production)
    var isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    var videosSource = 'https://rss.app/feeds/0I3TKDpm3S7TZQdB.xml';
    var apiUrl;

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

        var items = Array.isArray(data.items) ? data.items : [];

        if (items.length === 0) {
          container.innerHTML = '<div class=\"no-results\">No hay vídeos disponibles</div>';
          return;
        }

        // Clear container and render cards
        container.innerHTML = '';

        items.slice(0, 9).forEach(function(item) {
          var card = document.createElement('div');
          card.className = 'content-card';

          // Extract data
          var title = item.title || 'Sin título';
          var date = item.date || '';
          var description = (item.summary || item.description || '').replace(/<[^>]*>/g, ' ').trim();
          var shortDescription = description.length > 150 ? description.substring(0, 150) + '...' : description;
          var image = item.image || 'images/logo.jpg';

          // Build card HTML using DOM methods for safety
          var img = document.createElement('img');
          img.src = image;
          img.alt = title;
          img.loading = 'lazy';
          img.referrerPolicy = 'no-referrer';
          img.addEventListener('error', function() {
            this.src = 'images/logo.jpg';
          });

          var dateSpan = document.createElement('span');
          dateSpan.className = 'date';
          dateSpan.textContent = date;

          var h3 = document.createElement('h3');
          h3.textContent = title;

          var p = document.createElement('p');
          p.textContent = shortDescription;

          var cardContent = document.createElement('div');
          cardContent.className = 'card-content';
          cardContent.appendChild(dateSpan);
          cardContent.appendChild(h3);
          cardContent.appendChild(p);

          var button = document.createElement('a');
          button.href = 'noticia.html?title=' + encodeURIComponent(title);
          button.className = 'btn';
          button.textContent = 'Ver más';
          cardContent.appendChild(button);

          card.appendChild(img);
          card.appendChild(cardContent);
          container.appendChild(card);
        });

        console.log('[VIDEOS.JS] Successfully rendered ' + items.length + ' videos');
      })
      .catch(function(error) {
        console.error('[VIDEOS.JS] Error:', error);
        container.innerHTML = '<div class=\"error\">Error al cargar vídeos: ' + error.message + '</div>';
      });
  }

  // Load when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadVideos);
  } else {
    // DOM already loaded
    loadVideos();
  }
})();
