(function () {
  'use strict';

  var TARGET_ZOOM = 17;

  function waitForMap() {
    var attempts = 0;
    var timer = window.setInterval(function () {
      if (window.map && window.L) {
        window.clearInterval(timer);
        installFraming();
      } else if (++attempts > 120) {
        window.clearInterval(timer);
      }
    }, 100);
  }

  function installFraming() {
    if (map._seedbankFramingInstalled) return;
    map._seedbankFramingInstalled = true;

    var originalFlyTo = map.flyTo.bind(map);

    map.flyTo = function (center, zoom, options) {
      var safeZoom = typeof zoom === 'number' ? Math.min(zoom, TARGET_ZOOM) : zoom;
      return originalFlyTo(center, safeZoom, options);
    };

    map.on('popupopen', function (event) {
      var popup = event.popup;
      var source = popup && popup._source;
      if (!source || typeof source.getLatLng !== 'function') return;

      window.setTimeout(function () {
        if (!map.hasLayer(source) || !source.isPopupOpen()) return;

        var zoom = Math.min(map.getZoom(), TARGET_ZOOM);
        var markerPoint = map.project(source.getLatLng(), zoom);
        var verticalOffset = window.innerWidth <= 720 ? 82 : 105;
        var horizontalOffset = window.innerWidth > 720 ? -40 : 0;
        var centerPoint = markerPoint.subtract([horizontalOffset, verticalOffset]);
        var center = map.unproject(centerPoint, zoom);

        originalFlyTo(center, zoom, {
          duration: 0.45,
          easeLinearity: 0.25
        });
      }, 40);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForMap);
  } else {
    waitForMap();
  }
})();
