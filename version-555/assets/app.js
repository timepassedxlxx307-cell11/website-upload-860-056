(function () {
  var toggle = document.querySelector('[data-mobile-toggle]');
  var panel = document.querySelector('[data-mobile-panel]');

  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var active = 0;
    var timer = null;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }

      active = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === active);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === active);
      });
    }

    function startTimer() {
      if (timer) {
        clearInterval(timer);
      }

      timer = setInterval(function () {
        showSlide(active + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(active - 1);
        startTimer();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(active + 1);
        startTimer();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
        startTimer();
      });
    });

    showSlide(0);
    startTimer();
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function getCards(gridId) {
    var grid = document.getElementById(gridId);
    if (!grid) {
      return [];
    }
    return Array.prototype.slice.call(grid.querySelectorAll('.movie-card'));
  }

  function applyTextFilter(input) {
    var gridId = input.getAttribute('data-page-filter');
    var query = normalize(input.value);
    getCards(gridId).forEach(function (card) {
      var text = normalize(card.getAttribute('data-search'));
      card.classList.toggle('is-filtered-out', query && text.indexOf(query) === -1);
    });
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-page-filter]')).forEach(function (input) {
    input.addEventListener('input', function () {
      applyTextFilter(input);
    });
  });

  function sortCards(select) {
    var gridId = select.getAttribute('data-sort-select');
    var grid = document.getElementById(gridId);
    if (!grid) {
      return;
    }

    var mode = select.value;
    var cards = getCards(gridId);

    cards.sort(function (a, b) {
      if (mode === 'year-desc') {
        return Number(b.getAttribute('data-year')) - Number(a.getAttribute('data-year'));
      }

      if (mode === 'year-asc') {
        return Number(a.getAttribute('data-year')) - Number(b.getAttribute('data-year'));
      }

      if (mode === 'title') {
        return String(a.getAttribute('data-title')).localeCompare(String(b.getAttribute('data-title')), 'zh-CN');
      }

      return 0;
    });

    cards.forEach(function (card) {
      grid.appendChild(card);
    });
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-sort-select]')).forEach(function (select) {
    select.addEventListener('change', function () {
      sortCards(select);
    });
  });

  var searchControls = document.querySelector('[data-search-controls]');

  if (searchControls) {
    var queryInput = searchControls.querySelector('[data-query-input]');
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';

    if (queryInput && initialQuery) {
      queryInput.value = initialQuery;
    }

    function applyAdvancedFilters() {
      var gridId = queryInput ? queryInput.getAttribute('data-page-filter') : 'search-grid';
      var query = normalize(queryInput ? queryInput.value : '');
      var fields = Array.prototype.slice.call(searchControls.querySelectorAll('[data-filter-field]'));

      getCards(gridId).forEach(function (card) {
        var text = normalize(card.getAttribute('data-search'));
        var visible = !query || text.indexOf(query) !== -1;

        fields.forEach(function (field) {
          var value = normalize(field.value);
          var name = field.getAttribute('data-filter-field');
          if (value && normalize(card.getAttribute('data-' + name)) !== value) {
            visible = false;
          }
        });

        card.classList.toggle('is-filtered-out', !visible);
      });
    }

    Array.prototype.slice.call(searchControls.querySelectorAll('input, select')).forEach(function (control) {
      control.addEventListener('input', applyAdvancedFilters);
      control.addEventListener('change', applyAdvancedFilters);
    });

    applyAdvancedFilters();
  }
}());

var SitePlayer = (function () {
  var hlsPromise = null;

  function loadHls() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }

    if (hlsPromise) {
      return hlsPromise;
    }

    hlsPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return hlsPromise;
  }

  function attach(video, url) {
    if (video.getAttribute('data-ready') === '1') {
      return Promise.resolve();
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.setAttribute('data-ready', '1');
      return Promise.resolve();
    }

    return loadHls().then(function (Hls) {
      if (Hls && Hls.isSupported()) {
        var hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        video.hlsInstance = hls;
        video.setAttribute('data-ready', '1');
      } else {
        video.src = url;
        video.setAttribute('data-ready', '1');
      }
    }).catch(function () {
      video.src = url;
      video.setAttribute('data-ready', '1');
    });
  }

  function init(videoId, coverId, url) {
    var video = document.getElementById(videoId);
    var cover = document.getElementById(coverId);

    if (!video || !cover || !url) {
      return;
    }

    function play() {
      attach(video, url).then(function () {
        cover.classList.add('is-hidden');
        video.controls = true;
        var result = video.play();
        if (result && typeof result.catch === 'function') {
          result.catch(function () {});
        }
      });
    }

    cover.addEventListener('click', play);
    video.addEventListener('click', function () {
      if (video.paused) {
        play();
      }
    });
  }

  return {
    init: init
  };
}());
