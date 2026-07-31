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

/* Carga la guía de lotes sin alterar la exportación qgis2web. */
(function loadSeedBankInterface() {
  if (!document.querySelector('link[data-seedbank-ui]')) {
    var stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'css/seedbank-ui.css';
    stylesheet.setAttribute('data-seedbank-ui', 'true');
    document.head.appendChild(stylesheet);
  }

  function loadInterfaceScript() {
    if (document.querySelector('script[data-seedbank-ui]')) return;
    var script = document.createElement('script');
    script.src = 'js/seedbank-ui.js';
    script.defer = true;
    script.setAttribute('data-seedbank-ui', 'true');
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
