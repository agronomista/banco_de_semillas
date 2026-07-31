(function () {
  'use strict';

  var MIN_ZOOM = 15;
  var MAX_ZOOM = 19;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getDestinationFeatures() {
    var data = window.json_sitio_bancosemillasitios_banco_semillas__sitio_agroecosistema_1;
    return data && Array.isArray(data.features) ? data.features : [];
  }

  function getLotContent(group) {
    var data = window.BANCO_SEMILLAS_CONTENIDO;
    if (!data || !Array.isArray(data.lots)) return null;
    return data.lots.find(function (lot) {
      return String(lot.group) === String(group);
    }) || null;
  }

  function pointInRing(point, ring) {
    var x = point[0];
    var y = point[1];
    var inside = false;

    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var xi = ring[i][0];
      var yi = ring[i][1];
      var xj = ring[j][0];
      var yj = ring[j][1];
      var crosses = ((yi > y) !== (yj > y)) &&
        (x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
      if (crosses) inside = !inside;
    }

    return inside;
  }

  function pointInPolygon(point, polygon) {
    if (!polygon || !polygon.length || !pointInRing(point, polygon[0])) return false;
    for (var i = 1; i < polygon.length; i++) {
      if (pointInRing(point, polygon[i])) return false;
    }
    return true;
  }

  function geometryContainsPoint(geometry, point) {
    if (!geometry || !geometry.coordinates) return false;
    if (geometry.type === 'Polygon') return pointInPolygon(point, geometry.coordinates);
    if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates.some(function (polygon) {
        return pointInPolygon(point, polygon);
      });
    }
    return false;
  }

  function removeGeneratedLayerControl() {
    document.querySelectorAll('.leaflet-control-layers').forEach(function (element) {
      element.remove();
    });
  }

  function silenceLayer(layer) {
    if (!layer) return;
    layer.off('mouseover');
    layer.off('mouseout');
    layer.off('popupopen');
    if (layer.unbindPopup) layer.unbindPopup();
    if (layer.unbindTooltip) layer.unbindTooltip();
  }

  function setPathInteractive(path, interactive) {
    path.options.interactive = interactive;
    if (path._path) {
      path._path.classList.toggle('leaflet-interactive', interactive);
      path._path.style.pointerEvents = interactive ? 'auto' : 'none';
    }
  }

  function styleSupportingLayer(layer, style) {
    if (!layer || !layer.eachLayer) return;
    layer.eachLayer(function (path) {
      silenceLayer(path);
      if (path.setStyle) path.setStyle(style);
      setPathInteractive(path, false);
    });
  }

  function findAssignments(lotPaths, destinations) {
    var assignments = {};
    var used = [];

    destinations.forEach(function (destination) {
      var group = String(destination.properties.GRUPO);
      var point = destination.geometry.coordinates;
      var match = lotPaths.find(function (path) {
        return used.indexOf(path) === -1 &&
          path.feature && geometryContainsPoint(path.feature.geometry, point);
      });

      if (!match) {
        var target = L.latLng(point[1], point[0]);
        var nearestDistance = Infinity;
        lotPaths.forEach(function (path) {
          if (used.indexOf(path) !== -1 || !path.getBounds) return;
          var distance = map.distance(target, path.getBounds().getCenter());
          if (distance < nearestDistance) {
            nearestDistance = distance;
            match = path;
          }
        });
      }

      if (match) {
        assignments[group] = match;
        used.push(match);
      }
    });

    return assignments;
  }

  function styleLots() {
    var lotLayer = window.layer_lotes_0;
    if (!lotLayer || !lotLayer.eachLayer) return null;

    var lotPaths = [];
    lotLayer.eachLayer(function (path) {
      lotPaths.push(path);
      silenceLayer(path);
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
      setPathInteractive(path, false);
    });

    var destinations = getDestinationFeatures();
    var assignments = findAssignments(lotPaths, destinations);
    var focusBounds = L.latLngBounds([]);

    destinations.forEach(function (destination) {
      var group = String(destination.properties.GRUPO);
      var path = assignments[group];
      var lot = getLotContent(group);
      if (!path || !lot) return;

      path.setStyle({
        color: '#1f5f46',
        weight: 2.4,
        opacity: 1,
        fillColor: '#61a67f',
        fillOpacity: 0.34,
        dashArray: ''
      });
      setPathInteractive(path, true);
      path.bindTooltip(
        '<span class="sb-lot-label-group">G' + escapeHtml(group) + '</span><span>' + escapeHtml(lot.name) + '</span>',
        {
          permanent: true,
          direction: 'center',
          className: 'sb-lot-label',
          opacity: 1
        }
      );
      path.on('click', function () {
        var groupButton = document.querySelector('.sb-group[data-group="' + group + '"]');
        if (groupButton) groupButton.click();
      });
      if (path.getBounds) focusBounds.extend(path.getBounds());
    });

    return focusBounds.isValid() ? focusBounds : null;
  }

  function applyMapLimits(bounds) {
    map.setMinZoom(MIN_ZOOM);
    map.setMaxZoom(MAX_ZOOM);
    map.options.maxBoundsViscosity = 0.9;

    if (!bounds || !bounds.isValid()) return;
    var paddedBounds = bounds.pad(0.32);
    map.setMaxBounds(paddedBounds);

    var rightPadding = window.innerWidth > 720 ? 380 : 24;
    map.fitBounds(bounds.pad(0.08), {
      paddingTopLeft: [24, 24],
      paddingBottomRight: [rightPadding, 24],
      maxZoom: 17,
      animate: false
    });

    if (map.getZoom() < MIN_ZOOM) map.setZoom(MIN_ZOOM);
  }

  function enhanceMap() {
    removeGeneratedLayerControl();

    styleSupportingLayer(window.layer_arboleda_3, {
      color: '#3f7458',
      weight: 0.8,
      opacity: 0.35,
      fillColor: '#76a88a',
      fillOpacity: 0.18
    });
    styleSupportingLayer(window.layer_caminos_4, {
      color: '#9a735d',
      weight: 2.1,
      opacity: 0.72,
      lineCap: 'round',
      lineJoin: 'round'
    });
    styleSupportingLayer(window.layer_edificios_5, {
      color: '#6f7873',
      weight: 1,
      opacity: 0.7,
      fillColor: '#b9c0bc',
      fillOpacity: 0.42
    });
    styleSupportingLayer(window.layer_plaza_futbol_2, {
      color: '#5b8c6d',
      weight: 1.2,
      opacity: 0.5,
      fillColor: '#a9c8b3',
      fillOpacity: 0.12,
      dashArray: '5,5'
    });

    var focusBounds = styleLots();
    applyMapLimits(focusBounds);

    map.on('zoomend', function () {
      document.documentElement.classList.toggle('sb-map-close', map.getZoom() >= 18);
    });
  }

  function waitForMap() {
    var attempts = 0;
    var timer = window.setInterval(function () {
      if (window.map && window.L && window.layer_lotes_0 && getDestinationFeatures().length) {
        window.clearInterval(timer);
        window.setTimeout(enhanceMap, 180);
      } else if (++attempts > 150) {
        window.clearInterval(timer);
      }
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForMap);
  } else {
    waitForMap();
  }
})();
