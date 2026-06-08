(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function setupMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!button || !menu) return;
    button.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function setupSearchForms() {
    document.querySelectorAll("[data-search-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input[name='q']");
        var value = input ? input.value.trim() : "";
        var target = "search.html";
        if (value) target += "?q=" + encodeURIComponent(value);
        window.location.href = target;
      });
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    if (!slides.length) return;
    var index = 0;
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener("mouseenter", function () {
        var next = parseInt(dot.getAttribute("data-hero-dot"), 10);
        if (!isNaN(next)) show(next);
      });
    });
    window.setInterval(function () {
      show(index + 1);
    }, 5200);
  }

  function setupFilters() {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
    if (!cards.length) return;
    var textInput = document.querySelector("[data-filter-input]");
    var yearInput = document.querySelector("[data-filter-year]");
    var typeInput = document.querySelector("[data-filter-type]");
    var categoryInput = document.querySelector("[data-filter-category]");
    var empty = document.querySelector("[data-empty-result]");
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    if (textInput && query) textInput.value = query;
    function includes(value, needle) {
      return (value || "").toLowerCase().indexOf(needle) !== -1;
    }
    function apply() {
      var q = textInput ? textInput.value.trim().toLowerCase() : "";
      var year = yearInput ? yearInput.value : "";
      var type = typeInput ? typeInput.value : "";
      var category = categoryInput ? categoryInput.value : "";
      var visible = 0;
      cards.forEach(function (card) {
        var text = [
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-type"),
          card.getAttribute("data-year"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-tags"),
          card.getAttribute("data-category")
        ].join(" ").toLowerCase();
        var cardYear = card.getAttribute("data-year") || "";
        var cardType = card.getAttribute("data-type") || "";
        var cardCategory = card.getAttribute("data-category") || "";
        var ok = true;
        if (q && !includes(text, q)) ok = false;
        if (year && year !== "older" && cardYear.indexOf(year) === -1) ok = false;
        if (year === "older") {
          var number = parseInt(cardYear, 10);
          if (!number || number >= 2022) ok = false;
        }
        if (type && cardType.indexOf(type) === -1) ok = false;
        if (category && cardCategory !== category) ok = false;
        card.style.display = ok ? "" : "none";
        if (ok) visible += 1;
      });
      if (empty) empty.classList.toggle("show", visible === 0);
    }
    [textInput, yearInput, typeInput, categoryInput].forEach(function (input) {
      if (!input) return;
      input.addEventListener("input", apply);
      input.addEventListener("change", apply);
    });
    apply();
  }

  function initMoviePlayer(streamUrl) {
    var box = document.querySelector(".movie-player");
    if (!box) return;
    var video = box.querySelector("video");
    var overlay = box.querySelector(".play-overlay");
    var loaded = false;
    var hlsInstance = null;
    function attach() {
      if (loaded || !video || !streamUrl) return;
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(video);
      } else {
        video.src = streamUrl;
      }
    }
    function play() {
      attach();
      if (overlay) overlay.classList.add("is-hidden");
      video.setAttribute("controls", "controls");
      var promise = video.play();
      if (promise && promise.catch) promise.catch(function () {});
    }
    if (overlay) overlay.addEventListener("click", play);
    if (video) {
      video.addEventListener("click", function () {
        if (video.paused) play();
      });
      video.addEventListener("play", function () {
        if (overlay) overlay.classList.add("is-hidden");
      });
    }
    window.addEventListener("beforeunload", function () {
      if (hlsInstance && hlsInstance.destroy) hlsInstance.destroy();
    });
  }

  window.initMoviePlayer = initMoviePlayer;

  ready(function () {
    setupMenu();
    setupSearchForms();
    setupHero();
    setupFilters();
  });
})();
