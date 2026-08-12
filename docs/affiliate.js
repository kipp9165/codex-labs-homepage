(function () {
  var REF_KEY = 'codex_affiliate_ref';
  var SEARCH_PARAM = 'ref';

  function getRefFromUrl() {
    try {
      return new URLSearchParams(window.location.search).get(SEARCH_PARAM);
    } catch (error) {
      return null;
    }
  }

  function persistRef(refValue) {
    if (!refValue) {
      return null;
    }

    try {
      localStorage.setItem(REF_KEY, refValue);
    } catch (error) {
      return refValue;
    }

    return refValue;
  }

  function readStoredRef() {
    try {
      return localStorage.getItem(REF_KEY);
    } catch (error) {
      return null;
    }
  }

  function withRef(urlValue, refValue) {
    if (!urlValue || !refValue || urlValue.indexOf('mailto:') === 0) {
      return urlValue;
    }

    if (/[?&]ref=/.test(urlValue)) {
      return urlValue;
    }

    var separator = urlValue.indexOf('?') === -1 ? '?' : '&';
    return urlValue + separator + 'ref=' + encodeURIComponent(refValue);
  }

  function updateAffiliateLinks(refValue) {
    if (!refValue) {
      return;
    }

    var links = document.querySelectorAll('a[data-stripe-link]');
    Array.prototype.forEach.call(links, function (link) {
      var originalHref = link.getAttribute('href');
      link.setAttribute('href', withRef(originalHref, refValue));
    });
  }

  var activeRef = persistRef(getRefFromUrl()) || readStoredRef();
  updateAffiliateLinks(activeRef);
})();