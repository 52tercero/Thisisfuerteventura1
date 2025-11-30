/**
 * Keyboard navigation support for Leaflet maps
 * @module MapKeyboard
 * 
 * Features:
 * - Arrow key pan (left/right/up/down)
 * - +/- or =/- for zoom in/out
 * - Tab through POI markers with focus outline
 * - Enter to open popup
 * - Escape to close popup
 * - Announces map actions to screen readers
 */

class MapKeyboard {
  constructor(map, markersData = []) {
    this.map = map;
    this.markers = [];
    this.currentMarkerIndex = -1;
    this.panzoom = {
      panPixels: 100,     // pixels to pan per key press
      zoomBy: 1,          // zoom levels per key press
      panDuration: 300    // animation duration (ms)
    };
    
    this.init(markersData);
  }

  init(markersData) {
    if (!this.map) return;
    
    // Enable keyboard navigation on the map
    this.map.keyboard.enable();
    
    // Make map focusable
    this.mapContainer = this.map.getContainer();
    this.mapContainer.setAttribute('tabindex', '0');
    this.mapContainer.setAttribute('role', 'application');
    this.mapContainer.setAttribute('aria-label', 'Mapa interactivo. Use arrow keys to pan, +/- to zoom, Tab to navigate markers');
    
    // Setup keyboard event listener
    this.mapContainer.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Store marker references for keyboard nav
    this.storeMarkers(markersData);
  }

  /**
   * Store marker data for keyboard navigation
   * @private
   */
  storeMarkers(markersData) {
    this.markers = markersData || [];
    this.currentMarkerIndex = -1;
  }

  /**
   * Announce message to screen readers
   * @private
   */
  announce(msg) {
    const ariaLive = document.getElementById('map-aria-live');
    if (ariaLive) {
      ariaLive.textContent = msg;
    }
  }

  /**
   * Handle keyboard input
   * @private
   */
  handleKeydown(event) {
    // Don't interfere with browser shortcuts
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    
    const { key } = event;
    
    switch (key) {
      case 'ArrowUp':
        event.preventDefault();
        this.panUp();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.panDown();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.panLeft();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.panRight();
        break;
      case '+':
      case '=':
        event.preventDefault();
        this.zoomIn();
        break;
      case '-':
      case '_':
        event.preventDefault();
        this.zoomOut();
        break;
      case 'Tab':
        // Custom Tab behavior: navigate markers instead of default tab
        if (this.markers.length > 0) {
          event.preventDefault();
          event.shiftKey ? this.prevMarker() : this.nextMarker();
        }
        break;
      case 'Enter':
      case ' ':
        // Open popup for current marker
        if (this.currentMarkerIndex >= 0 && this.markers[this.currentMarkerIndex].popupOpen) {
          event.preventDefault();
          this.markers[this.currentMarkerIndex].popupOpen();
        }
        break;
      case 'Escape':
        // Close any open popups
        event.preventDefault();
        this.map.closePopup();
        this.currentMarkerIndex = -1;
        this.announce('Popup cerrado');
        break;
    }
  }

  // Pan methods
  panUp() {
    const center = this.map.getCenter();
    const pixels = this.panzoom.panPixels;
    const latDelta = (pixels / this.map.getZoom()) * 0.0002; // rough conversion
    this.map.panTo({ lat: center.lat + latDelta, lng: center.lng }, { duration: this.panzoom.panDuration });
    this.announce('Movido hacia arriba');
  }

  panDown() {
    const center = this.map.getCenter();
    const pixels = this.panzoom.panPixels;
    const latDelta = (pixels / this.map.getZoom()) * 0.0002;
    this.map.panTo({ lat: center.lat - latDelta, lng: center.lng }, { duration: this.panzoom.panDuration });
    this.announce('Movido hacia abajo');
  }

  panLeft() {
    const center = this.map.getCenter();
    const pixels = this.panzoom.panPixels;
    const lngDelta = (pixels / this.map.getZoom()) * 0.0002;
    this.map.panTo({ lat: center.lat, lng: center.lng - lngDelta }, { duration: this.panzoom.panDuration });
    this.announce('Movido hacia la izquierda');
  }

  panRight() {
    const center = this.map.getCenter();
    const pixels = this.panzoom.panPixels;
    const lngDelta = (pixels / this.map.getZoom()) * 0.0002;
    this.map.panTo({ lat: center.lat, lng: center.lng + lngDelta }, { duration: this.panzoom.panDuration });
    this.announce('Movido hacia la derecha');
  }

  zoomIn() {
    this.map.zoomIn(this.panzoom.zoomBy);
    this.announce(`Zoom aumentado. Nivel: ${this.map.getZoom()}`);
  }

  zoomOut() {
    this.map.zoomOut(this.panzoom.zoomBy);
    this.announce(`Zoom reducido. Nivel: ${this.map.getZoom()}`);
  }

  // Marker navigation
  nextMarker() {
    if (this.markers.length === 0) return;
    this.currentMarkerIndex = (this.currentMarkerIndex + 1) % this.markers.length;
    this.focusMarker();
  }

  prevMarker() {
    if (this.markers.length === 0) return;
    this.currentMarkerIndex = (this.currentMarkerIndex - 1 + this.markers.length) % this.markers.length;
    this.focusMarker();
  }

  focusMarker() {
    const marker = this.markers[this.currentMarkerIndex];
    if (!marker) return;
    
    // Pan map to marker
    this.map.panTo(marker.latlng, { duration: 300 });
    
    // Optionally open popup
    if (marker.popup) {
      marker.popup.openPopup();
    }
    
    // Add visual focus
    if (marker.element) {
      marker.element.focus();
      marker.element.classList.add('focused');
    }
    
    // Announce to screen readers
    this.announce(`${marker.title}. Presiona Enter para ver detalles.`);
  }

  /**
   * Detach keyboard handler (cleanup)
   */
  destroy() {
    if (this.mapContainer) {
      this.mapContainer.removeEventListener('keydown', this.handleKeydown.bind(this));
    }
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.MapKeyboard = MapKeyboard;
}
