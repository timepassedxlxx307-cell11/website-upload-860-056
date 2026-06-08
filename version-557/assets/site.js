(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function initMobileMenu() {
    var toggle = document.querySelector(".mobile-toggle");
    var panel = document.querySelector(".mobile-panel");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function start() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        start();
      });
    });

    show(0);
    start();
  }

  function initSearchForms() {
    var forms = document.querySelectorAll("form[data-search-form]");
    Array.prototype.forEach.call(forms, function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input[name='q']");
        var query = input ? input.value.trim() : "";
        if (query) {
          var prefix = form.getAttribute("data-prefix") || "";
          window.location.href = prefix + "search.html?q=" + encodeURIComponent(query);
        }
      });
    });
  }

  function initSearchPage() {
    var resultBox = document.getElementById("searchResults");
    var searchInput = document.getElementById("searchInput");
    var sortSelect = document.getElementById("sortSelect");
    if (!resultBox || !searchInput || !window.MOVIE_CATALOG) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    searchInput.value = initial;

    function card(movie) {
      return [
        '<a class="movie-card" href="' + movie.link + '">',
        '<div class="poster-wrap">',
        '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '">',
        '<span class="card-badge">' + movie.rating + '</span>',
        '<div class="card-overlay"><p class="line-clamp-3">' + escapeHtml(movie.oneLine) + '</p></div>',
        '</div>',
        '<h3 class="movie-title">' + escapeHtml(movie.title) + '</h3>',
        '<p class="card-small">' + escapeHtml(movie.year + ' · ' + movie.region + ' · ' + movie.genre) + '</p>',
        '</a>'
      ].join("");
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function normalize(value) {
      return String(value || "").toLowerCase();
    }

    function render() {
      var query = searchInput.value.trim();
      if (!query) {
        resultBox.innerHTML = '<div class="search-results-empty">输入片名、地区、类型或标签即可快速查找影片。</div>';
        return;
      }
      var lower = normalize(query);
      var results = window.MOVIE_CATALOG.filter(function (movie) {
        var haystack = normalize([
          movie.title,
          movie.year,
          movie.region,
          movie.type,
          movie.genre,
          movie.tags,
          movie.oneLine,
          movie.category
        ].join(" "));
        return haystack.indexOf(lower) !== -1;
      });
      var sort = sortSelect ? sortSelect.value : "relevance";
      if (sort === "rating") {
        results.sort(function (a, b) { return b.rating - a.rating; });
      }
      if (sort === "year") {
        results.sort(function (a, b) { return b.year - a.year; });
      }
      if (!results.length) {
        resultBox.innerHTML = '<div class="search-results-empty">没有找到匹配内容，换一个关键词试试。</div>';
        return;
      }
      resultBox.innerHTML = '<div class="movie-grid">' + results.slice(0, 120).map(card).join("") + '</div>';
    }

    searchInput.addEventListener("input", render);
    if (sortSelect) {
      sortSelect.addEventListener("change", render);
    }
    render();
  }

  window.initializePlayer = function (source) {
    ready(function () {
      var video = document.getElementById("videoPlayer");
      var cover = document.querySelector(".player-cover");
      if (!video || !source) {
        return;
      }
      var attached = false;

      function attach() {
        if (attached) {
          return;
        }
        attached = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
        } else if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls();
          hls.loadSource(source);
          hls.attachMedia(video);
        } else {
          video.src = source;
        }
      }

      function play() {
        attach();
        if (cover) {
          cover.classList.add("is-hidden");
        }
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {});
        }
      }

      if (cover) {
        cover.addEventListener("click", play);
      }
      video.addEventListener("click", function () {
        if (video.paused) {
          play();
        }
      });
      video.addEventListener("play", function () {
        if (cover) {
          cover.classList.add("is-hidden");
        }
      });
    });
  };

  ready(function () {
    initMobileMenu();
    initHero();
    initSearchForms();
    initSearchPage();
  });
})();
