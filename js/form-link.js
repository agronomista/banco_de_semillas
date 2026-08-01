(function () {
  'use strict';

  var FORM_URL = 'https://forms.gle/dpznXJkcoEWZb3688';
  var attempts = 0;

  function installFormLink() {
    var groups = document.getElementById('sbGroups');
    if (!groups) return false;
    if (document.querySelector('[data-seedbank-form-link]')) return true;

    var wrapper = document.createElement('div');
    wrapper.className = 'sb-form-link-wrap';
    wrapper.setAttribute('data-seedbank-form-link', 'true');
    wrapper.innerHTML =
      '<a class="sb-form-link" href="' + FORM_URL + '" target="_blank" rel="noopener noreferrer" ' +
      'aria-label="Abrir formulario de registro en una pestaña nueva">' +
        '<span class="sb-form-link-icon" aria-hidden="true">✎</span>' +
        '<span class="sb-form-link-copy">' +
          '<strong>Abrir formulario de registro</strong>' +
          '<small>Registrar datos del banco de semillas</small>' +
        '</span>' +
        '<span class="sb-form-link-arrow" aria-hidden="true">↗</span>' +
      '</a>';

    groups.insertAdjacentElement('afterend', wrapper);
    return true;
  }

  function start() {
    if (installFormLink()) return;

    var timer = window.setInterval(function () {
      attempts += 1;
      if (installFormLink() || attempts >= 120) {
        window.clearInterval(timer);
      }
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
