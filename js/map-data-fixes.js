(function () {
  'use strict';

  var ORIGINAL_LAYER_NAME = 'layer_sitio_bancosemillasitios_banco_semillas__sitio_agroecosistema_1';
  var attempts = 0;
  var timer = null;

  function getOriginalDestinationLayer() {
    return window[ORIGINAL_LAYER_NAME] || null;
  }

  function removeOriginalDestinationLayer() {
    var originalLayer = getOriginalDestinationLayer();
    if (window.map && originalLayer && map.hasLayer(originalLayer)) {
      map.removeLayer(originalLayer);
    }
  }

  function markerGroup(layer) {
    if (!layer || typeof layer.getLatLng !== 'function') return null;
    var title = layer.options && layer.options.title;
    var match = String(title || '').match(/^Grupo\s+(\d+)/i);
    return match ? match[1] : null;
  }

  function deduplicateGuideMarkers() {
    if (!window.map) return;

    var markersByGroup = {};
    map.eachLayer(function (layer) {
      var group = markerGroup(layer);
      if (!group) return;

      if (!markersByGroup[group]) {
        markersByGroup[group] = layer;
        return;
      }

      map.removeLayer(layer);
    });
  }

  function tooltipText(path) {
    if (!path || typeof path.getTooltip !== 'function') return '';
    var tooltip = path.getTooltip();
    if (!tooltip) return '';
    var content = tooltip.getContent();
    if (typeof content === 'string') {
      return content.replace(/<[^>]*>/g, ' ');
    }
    return content && content.textContent ? content.textContent : '';
  }

  function clearForestPolygon() {
    var lotLayer = window.layer_lotes_0;
    if (!lotLayer || typeof lotLayer.eachLayer !== 'function') return;

    lotLayer.eachLayer(function (path) {
      if (!/(^|\s)G5(\s|$)/i.test(tooltipText(path))) return;

      path.off('click');
      if (path.unbindTooltip) path.unbindTooltip();
      if (path.unbindPopup) path.unbindPopup();

      if (path.setStyle) {
        path.setStyle({
          color: '#8a978f',
          weight: 0.8,
          opacity: 0.58,
          fillColor: '#dfe6e1',
          fillOpacity: 0.13,
          dashArray: ''
        });
      }

      path.options.interactive = false;
      if (path._path) {
        path._path.classList.remove('leaflet-interactive');
        path._path.style.pointerEvents = 'none';
      }
    });
  }

  function removeTopBanner() {
    var topbar = document.querySelector('.sb-topbar');
    if (topbar) {
      var actions = topbar.querySelector('.sb-actions');
      if (actions && actions.children.length) {
        actions.classList.add('sb-actions-floating');
        document.body.appendChild(actions);
      }
      topbar.remove();
    }

    var mapElement = document.getElementById('map');
    if (mapElement) {
      mapElement.style.setProperty('inset', '0', 'important');
      mapElement.style.setProperty('top', '0', 'important');
    }

    var panel = document.querySelector('.sb-panel');
    if (panel && window.innerWidth > 720) {
      panel.style.setProperty('top', '18px', 'important');
    }
  }

  function applyFixes() {
    removeOriginalDestinationLayer();
    deduplicateGuideMarkers();
    clearForestPolygon();
    removeTopBanner();

    if (window.map && typeof map.invalidateSize === 'function') {
      map.invalidateSize({ animate: false });
    }
  }

  function install() {
    if (!window.map || !window.L) return false;
    if (map._seedbankDataFixesInstalled) return true;
    map._seedbankDataFixesInstalled = true;

    map.on('layeradd', function (event) {
      var originalLayer = getOriginalDestinationLayer();
      if (originalLayer && event.layer === originalLayer) {
        window.setTimeout(removeOriginalDestinationLayer, 0);
      }
      window.setTimeout(function () {
        deduplicateGuideMarkers();
        clearForestPolygon();
      }, 40);
    });

    return true;
  }

  function waitAndApply() {
    attempts += 1;
    install();
    applyFixes();

    if (attempts >= 50) {
      window.clearInterval(timer);
    }
  }

  function start() {
    waitAndApply();
    timer = window.setInterval(waitAndApply, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
