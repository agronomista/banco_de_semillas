(function () {
  'use strict';

  var TARGET_ZOOM = 16.5;
  var installedMarkers = [];
  var navigationToken = 0;

  function waitForMap() {
    var attempts = 0;
    var timer = window.setInterval(function () {
      if (window.map && window.L) {
        installFraming();
        installMarkers();
        if (installedMarkers.length) window.clearInterval(timer);
      } else if (++attempts > 160) {
        window.clearInterval(timer);
      }
    }, 100);
  }

  function getDestinationMarkers() {
    var markers = [];
    map.eachLayer(function (layer) {
      if (!layer || typeof layer.getLatLng !== 'function' || typeof layer.getPopup !== 'function') return;
      var title = layer.options && layer.options.title;
      if (layer.getPopup() && /^Grupo\s+\d+/i.test(title || '')) markers.push(layer);
    });
    return markers;
  }

  function groupFromMarker(marker) {
    var title = marker && marker.options && marker.options.title;
    var match = String(title || '').match(/^Grupo\s+(\d+)/i);
    return match ? match[1] : null;
  }

  function markerForGroup(group) {
    return installedMarkers.find(function (marker) {
      return groupFromMarker(marker) === String(group);
    }) || null;
  }

  function openAfterMovement(marker) {
    if (!marker || !map.hasLayer(marker)) return;

    var token = ++navigationToken;
    var opened = false;

    function finish() {
      if (opened || token !== navigationToken || !map.hasLayer(marker)) return;
      opened = true;
      map.off('moveend', finish);
      marker.openPopup();
    }

    map.closePopup();
    map.stop();
    map.once('moveend', finish);
    map.flyTo(marker.getLatLng(), TARGET_ZOOM, {
      duration: 0.75,
      easeLinearity: 0.24,
      noMoveStart: false
    });

    window.setTimeout(finish, 1000);
  }

  function installMarkers() {
    getDestinationMarkers().forEach(function (marker) {
      if (marker._seedbankConditionalPopup) return;
      marker._seedbankConditionalPopup = true;

      var popup = marker.getPopup();
      if (popup) {
        popup.options.autoPan = false;
        popup.options.keepInView = false;
      }

      marker.off('click');
      marker.on('click', function (event) {
        if (event && event.originalEvent) {
          event.originalEvent.preventDefault();
          event.originalEvent.stopPropagation();
        }
        openAfterMovement(marker);
      });

      installedMarkers.push(marker);
    });
  }

  function installFraming() {
    if (map._seedbankConditionalFramingInstalled) return;
    map._seedbankConditionalFramingInstalled = true;
    map.options.zoomSnap = 0.5;

    document.addEventListener('click', function (event) {
      var button = event.target.closest && event.target.closest('.sb-group[data-group]');
      if (!button) return;

      var marker = markerForGroup(button.getAttribute('data-group'));
      if (!marker) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      document.querySelectorAll('.sb-group').forEach(function (item) {
        item.classList.toggle('active', item === button);
      });

      if (window.innerWidth <= 720) {
        var panel = document.querySelector('.sb-panel');
        var toggle = document.getElementById('sbMobileToggle');
        if (panel) panel.classList.remove('open');
        if (toggle) {
          toggle.setAttribute('aria-expanded', 'false');
          toggle.textContent = 'Ver grupos';
        }
      }

      openAfterMovement(marker);
    }, true);

    map.on('layeradd', function () {
      window.setTimeout(installMarkers, 0);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForMap);
  } else {
    waitForMap();
  }
})();
