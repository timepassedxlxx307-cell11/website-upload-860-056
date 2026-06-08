(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function setupNavigation() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-main-nav]");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  function setupHero() {
    var root = document.querySelector("[data-hero]");
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
    var prev = root.querySelector("[data-hero-prev]");
    var next = root.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === current);
      });
    }

    function play() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        play();
      });
    });
    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        play();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        play();
      });
    }
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", play);
    show(0);
    play();
  }

  function setupSearch() {
    var input = document.querySelector("[data-search-input]");
    if (!input) {
      return;
    }
    var list = document.querySelector("[data-search-list]") || document;
    var items = Array.prototype.slice.call(list.querySelectorAll("[data-search-item]"));
    var empty = document.querySelector("[data-search-empty]");
    var clear = document.querySelector("[data-clear-search]");
    var params = new URLSearchParams(window.location.search);
    var firstQuery = params.get("q") || "";

    function filter() {
      var query = input.value.trim().toLowerCase();
      var shown = 0;
      items.forEach(function (item) {
        var text = (item.getAttribute("data-search-text") || item.textContent || "").toLowerCase();
        var matched = !query || text.indexOf(query) !== -1;
        item.style.display = matched ? "" : "none";
        if (matched) {
          shown += 1;
        }
      });
      if (empty) {
        empty.classList.toggle("visible", shown === 0);
      }
    }

    if (firstQuery) {
      input.value = firstQuery;
    }
    input.addEventListener("input", filter);
    if (clear) {
      clear.addEventListener("click", function () {
        input.value = "";
        filter();
        input.focus();
      });
    }
    filter();
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));
    players.forEach(function (player) {
      var video = player.querySelector("video[data-stream]");
      var button = player.querySelector("[data-play-button]");
      var status = player.querySelector("[data-player-status]");
      var instance = null;
      var loaded = false;

      if (!video) {
        return;
      }

      function setStatus(message) {
        if (status) {
          status.textContent = message || "";
        }
      }

      function loadStream() {
        var streamUrl = video.getAttribute("data-stream");
        if (loaded || !streamUrl) {
          return;
        }
        setStatus("正在准备播放");
        if (window.Hls && window.Hls.isSupported()) {
          instance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          instance.loadSource(streamUrl);
          instance.attachMedia(video);
          instance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            setStatus("");
          });
          instance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setStatus("播放暂不可用，请稍后再试");
              if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                instance.startLoad();
              } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                instance.recoverMediaError();
              } else {
                instance.destroy();
              }
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
          setStatus("");
        } else {
          setStatus("播放暂不可用，请稍后再试");
        }
        loaded = true;
      }

      function playVideo() {
        loadStream();
        var result = video.play();
        if (result && typeof result.catch === "function") {
          result.catch(function () {
            setStatus("点击视频控件继续播放");
          });
        }
      }

      if (button) {
        button.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          playVideo();
        });
      }
      player.addEventListener("click", function (event) {
        if (event.target === video || event.target === player) {
          playVideo();
        }
      });
      video.addEventListener("play", function () {
        if (button) {
          button.classList.add("hidden");
        }
        setStatus("");
      });
      video.addEventListener("pause", function () {
        if (button && video.currentTime === 0) {
          button.classList.remove("hidden");
        }
      });
      video.addEventListener("ended", function () {
        if (button) {
          button.classList.remove("hidden");
        }
      });
      window.addEventListener("pagehide", function () {
        if (instance) {
          instance.destroy();
          instance = null;
        }
      });
    });
  }

  ready(function () {
    setupNavigation();
    setupHero();
    setupSearch();
    setupPlayers();
  });
})();
