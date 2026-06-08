(function () {
  var MovieSite = {};

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setupMenu() {
    var button = qs('.mobile-menu-button');
    var nav = qs('.mobile-nav');
    if (!button || !nav) {
      return;
    }
    button.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      button.textContent = open ? '×' : '☰';
    });
  }

  function setupForms() {
    qsa('.site-search-form').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        var input = qs('input[name="q"]', form);
        if (!input || !input.value.trim()) {
          event.preventDefault();
          return;
        }
      });
    });
  }

  function setupHero() {
    var hero = qs('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = qsa('.hero-slide', hero);
    var dots = qsa('.hero-dot', hero);
    var prev = qs('.hero-prev', hero);
    var next = qs('.hero-next', hero);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-slide') || '0'));
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    restart();
  }

  function setupFiltering() {
    qsa('[data-filter-panel]').forEach(function (panel) {
      var keyword = qs('[data-filter-keyword]', panel);
      var year = qs('[data-filter-year]', panel);
      var list = qs('[data-card-list]');
      if (!list) {
        return;
      }
      var cards = qsa('.movie-card', list);

      function apply() {
        var key = keyword ? keyword.value.trim().toLowerCase() : '';
        var selectedYear = year ? year.value : '';
        cards.forEach(function (card) {
          var text = card.getAttribute('data-search') || '';
          var cardYear = card.getAttribute('data-year') || '';
          var matchedText = !key || text.indexOf(key) !== -1;
          var matchedYear = !selectedYear || cardYear === selectedYear;
          card.classList.toggle('is-filtered-out', !(matchedText && matchedYear));
        });
      }

      if (keyword) {
        keyword.addEventListener('input', apply);
      }
      if (year) {
        year.addEventListener('change', apply);
      }

      var params = new URLSearchParams(window.location.search);
      var query = params.get('q');
      if (query && keyword) {
        keyword.value = query;
      }
      apply();
    });
  }

  MovieSite.initPlayer = function (source, poster) {
    var root = qs('[data-player]');
    if (!root) {
      return;
    }
    var video = qs('video', root);
    var cover = qs('.player-cover', root);
    var playButton = qs('.player-play', root);
    var ready = false;
    var hls = null;

    function prepare() {
      if (ready || !video) {
        return;
      }
      if (poster) {
        video.setAttribute('poster', poster);
      }
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls();
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
      ready = true;
    }

    function start(event) {
      if (event) {
        event.preventDefault();
      }
      prepare();
      if (cover) {
        cover.classList.add('is-hidden');
      }
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {});
      }
    }

    if (cover) {
      cover.addEventListener('click', start);
    }
    if (playButton) {
      playButton.addEventListener('click', start);
    }
    if (video) {
      video.addEventListener('click', function () {
        if (video.paused) {
          start();
        }
      });
    }

    window.addEventListener('pagehide', function () {
      if (hls) {
        hls.destroy();
      }
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupForms();
    setupHero();
    setupFiltering();
  });

  window.MovieSite = MovieSite;
})();
