var hideLabel = function(label) {
    label.labelObject.style.opacity = 0;
    label.labelObject.style.transition = 'opacity 0s';
};
var showLabel = function(label) {
    label.labelObject.style.opacity = 1;
    label.labelObject.style.transition = 'opacity 1s';
};
labelEngine = new labelgun.default(hideLabel, showLabel);

var id = 0;
var labels = [];
var totalMarkers = 0;

function resetLabels(markers) {
    labelEngine.reset();
    var i = 0;
    for (var j = 0; j < markers.length; j++) {
        markers[j].eachLayer(function(label){
            addLabel(label, ++i);
        });
    }
  labelEngine.update();
}

function addLabel(layer, id) {
  if (layer.getTooltip()) {
      var label = layer.getTooltip()._source._tooltip._container;
      if (label) {
        var rect = label.getBoundingClientRect();
        var bottomLeft = map.containerPointToLatLng([rect.left, rect.bottom]);
        var topRight = map.containerPointToLatLng([rect.right, rect.top]);
        var boundingBox = {
          bottomLeft : [bottomLeft.lng, bottomLeft.lat],
          topRight   : [topRight.lng, topRight.lat]
        };
        labelEngine.ingestLabel(
          boundingBox,
          id,
          parseInt(Math.random() * (5 - 1) + 1),
          label,
          "Test " + id,
          false
        );
        if (!layer.added) {
          layer.addTo(map);
          layer.added = true;
        }
      }
  }
}

/* Carga la guía de lotes y las mejoras cartográficas sin alterar qgis2web. */
(function loadSeedBankInterface() {
  if (!document.querySelector('link[data-seedbank-ui]')) {
    var stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'css/seedbank-ui.css';
    stylesheet.setAttribute('data-seedbank-ui', 'true');
    document.head.appendChild(stylesheet);
  }

  if (!document.querySelector('link[data-map-aesthetics]')) {
    var mapStylesheet = document.createElement('link');
    mapStylesheet.rel = 'stylesheet';
    mapStylesheet.href = 'css/map-aesthetics.css';
    mapStylesheet.setAttribute('data-map-aesthetics', 'true');
    document.head.appendChild(mapStylesheet);
  }

  if (!document.querySelector('link[data-photo-quality]')) {
    var photoStylesheet = document.createElement('link');
    photoStylesheet.rel = 'stylesheet';
    photoStylesheet.href = 'css/photo-quality.css';
    photoStylesheet.setAttribute('data-photo-quality', 'true');
    document.head.appendChild(photoStylesheet);
  }

  function loadMapAesthetics() {
    if (document.querySelector('script[data-map-aesthetics]')) return;
    var mapScript = document.createElement('script');
    mapScript.src = 'js/map-aesthetics.js';
    mapScript.defer = true;
    mapScript.setAttribute('data-map-aesthetics', 'true');
    document.head.appendChild(mapScript);
  }

  function loadInterfaceScript() {
    if (document.querySelector('script[data-seedbank-ui]')) {
      loadMapAesthetics();
      return;
    }
    var script = document.createElement('script');
    script.src = 'js/seedbank-ui.js';
    script.defer = true;
    script.setAttribute('data-seedbank-ui', 'true');
    script.onload = loadMapAesthetics;
    script.onerror = loadMapAesthetics;
    document.head.appendChild(script);
  }

  if (!document.querySelector('script[data-lotes-content]')) {
    var contentScript = document.createElement('script');
    contentScript.src = 'data/lotes-content.js';
    contentScript.defer = true;
    contentScript.setAttribute('data-lotes-content', 'true');
    contentScript.onload = loadInterfaceScript;
    contentScript.onerror = loadInterfaceScript;
    document.head.appendChild(contentScript);
  } else {
    loadInterfaceScript();
  }
})();
