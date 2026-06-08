(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (toggle && panel) {
      toggle.addEventListener("click", function () {
        panel.classList.toggle("open");
      });
    }

    setupHero();
    setupFilters();
  });

  function setupHero() {
    var carousel = document.querySelector("[data-hero-carousel]");
    if (!carousel) {
      return;
    }

    var slides = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-dot]"));
    var prev = carousel.querySelector("[data-hero-prev]");
    var next = carousel.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function setupFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
    panels.forEach(function (panel) {
      var container = panel.parentElement;
      var cards = Array.prototype.slice.call(container.querySelectorAll("[data-filter-card]"));
      var empty = container.querySelector("[data-empty-state]");
      var search = panel.querySelector("[data-filter-search]");
      var type = panel.querySelector("[data-filter-type]");
      var region = panel.querySelector("[data-filter-region]");
      var year = panel.querySelector("[data-filter-year]");
      var category = panel.querySelector("[data-filter-category]");

      if (search) {
        var params = new URLSearchParams(window.location.search);
        var q = params.get("q");
        if (q) {
          search.value = q;
        }
      }

      function valueOf(input) {
        return input ? input.value.trim().toLowerCase() : "";
      }

      function apply() {
        var keyword = valueOf(search);
        var typeValue = valueOf(type);
        var regionValue = valueOf(region);
        var yearValue = valueOf(year);
        var categoryValue = valueOf(category);
        var visible = 0;

        cards.forEach(function (card) {
          var title = (card.getAttribute("data-title") || "").toLowerCase();
          var tags = (card.getAttribute("data-tags") || "").toLowerCase();
          var cardType = (card.getAttribute("data-type") || "").toLowerCase();
          var cardRegion = (card.getAttribute("data-region") || "").toLowerCase();
          var cardYear = (card.getAttribute("data-year") || "").toLowerCase();
          var cardCategory = (card.getAttribute("data-category") || "").toLowerCase();
          var text = [title, tags, cardType, cardRegion, cardYear, cardCategory].join(" ");
          var matched = true;

          if (keyword && text.indexOf(keyword) === -1) {
            matched = false;
          }
          if (typeValue && cardType.indexOf(typeValue) === -1) {
            matched = false;
          }
          if (regionValue && cardRegion.indexOf(regionValue) === -1) {
            matched = false;
          }
          if (yearValue && cardYear.indexOf(yearValue) === -1) {
            matched = false;
          }
          if (categoryValue && cardCategory.indexOf(categoryValue) === -1) {
            matched = false;
          }

          card.style.display = matched ? "" : "none";
          if (matched) {
            visible += 1;
          }
        });

        if (empty) {
          empty.classList.toggle("show", visible === 0);
        }
      }

      [search, type, region, year, category].forEach(function (input) {
        if (input) {
          input.addEventListener("input", apply);
          input.addEventListener("change", apply);
        }
      });

      apply();
    });
  }

  window.initializePlayer = function (streamUrl, videoId) {
    var video = document.getElementById(videoId);
    if (!video || !streamUrl) {
      return;
    }

    var shell = video.closest("[data-player-shell]");
    var button = shell ? shell.querySelector(".player-start") : null;
    var attached = false;
    var hls = null;

    function attach() {
      if (attached) {
        return;
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
      } else {
        video.src = streamUrl;
      }

      attached = true;
    }

    function startPlayback() {
      attach();
      if (shell) {
        shell.classList.add("is-playing");
      }
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          if (shell) {
            shell.classList.remove("is-playing");
          }
        });
      }
    }

    if (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        startPlayback();
      });
    }

    if (shell) {
      shell.addEventListener("click", function (event) {
        if (event.target === video) {
          return;
        }
        if (button && button.contains(event.target)) {
          return;
        }
        startPlayback();
      });
    }

    video.addEventListener("play", function () {
      if (shell) {
        shell.classList.add("is-playing");
      }
    });

    video.addEventListener("emptied", function () {
      if (hls) {
        hls.destroy();
        hls = null;
        attached = false;
      }
    });
  };
})();
