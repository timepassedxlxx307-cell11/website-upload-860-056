(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;"
      }[char];
    });
  }

  function setupMenu() {
    var toggle = $("[data-menu-toggle]");
    var panel = $("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var root = $("[data-hero]");
    if (!root) {
      return;
    }
    var slides = $all("[data-hero-slide]", root);
    var dotsRoot = $("[data-hero-dots]", root);
    var prev = $("[data-hero-prev]", root);
    var next = $("[data-hero-next]", root);
    if (!slides.length || !dotsRoot) {
      return;
    }
    var current = 0;
    var dots = slides.map(function (_, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", "切换到第" + (index + 1) + "部影片");
      button.addEventListener("click", function () {
        show(index);
      });
      dotsRoot.appendChild(button);
      return button;
    });
    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }
    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
      });
    }
    show(0);
    window.setInterval(function () {
      show(current + 1);
    }, 5600);
  }

  function setupFilters() {
    var bar = $("[data-filter-bar]");
    var grid = $("[data-filter-grid]");
    if (!bar || !grid) {
      return;
    }
    var text = $("[data-filter-text]", bar);
    var year = $("[data-filter-year]", bar);
    var type = $("[data-filter-type]", bar);
    var cards = $all("[data-movie-card]", grid);
    function run() {
      var q = (text && text.value || "").trim().toLowerCase();
      var y = year && year.value || "";
      var t = type && type.value || "";
      cards.forEach(function (card) {
        var haystack = [card.dataset.title, card.dataset.region, card.dataset.type, card.dataset.genre, card.dataset.year].join(" ").toLowerCase();
        var okText = !q || haystack.indexOf(q) !== -1;
        var okYear = !y || card.dataset.year === y;
        var okType = !t || card.dataset.type === t;
        card.classList.toggle("is-hidden", !(okText && okYear && okType));
      });
    }
    [text, year, type].forEach(function (input) {
      if (input) {
        input.addEventListener("input", run);
        input.addEventListener("change", run);
      }
    });
    run();
  }

  function cardHTML(movie) {
    var tags = [movie.region, movie.type, movie.year].filter(Boolean).slice(0, 3).map(function (tag) {
      return "<span>" + escapeHTML(tag) + "</span>";
    }).join("");
    return "<article class=\"movie-card\">" +
      "<a class=\"poster-link\" href=\"./" + escapeHTML(movie.file) + "\"><span class=\"poster-frame\">" +
      "<img src=\"" + escapeHTML(movie.cover) + "\" alt=\"" + escapeHTML(movie.title) + "\" loading=\"lazy\">" +
      "<span class=\"poster-type\">" + escapeHTML(movie.type) + "</span>" +
      "<span class=\"poster-year\">" + escapeHTML(movie.year) + "</span>" +
      "</span></a><div class=\"card-content\"><div class=\"tag-row\">" + tags + "</div>" +
      "<h3><a href=\"./" + escapeHTML(movie.file) + "\">" + escapeHTML(movie.title) + "</a></h3>" +
      "<p>" + escapeHTML(movie.oneLine) + "</p></div></article>";
  }

  function setupSearchPage() {
    var results = $("[data-search-results]");
    var input = $("[data-search-input]");
    var form = $("[data-search-form]");
    if (!results || !input || !window.SEARCH_MOVIES) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    input.value = params.get("q") || "";
    function render() {
      var query = input.value.trim().toLowerCase();
      var list = window.SEARCH_MOVIES.filter(function (movie) {
        var haystack = [movie.title, movie.oneLine, movie.region, movie.type, movie.year, movie.genre, movie.tags].join(" ").toLowerCase();
        return !query || haystack.indexOf(query) !== -1;
      }).slice(0, 80);
      results.innerHTML = list.map(cardHTML).join("");
    }
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var url = new URL(window.location.href);
        if (input.value.trim()) {
          url.searchParams.set("q", input.value.trim());
        } else {
          url.searchParams.delete("q");
        }
        history.replaceState(null, "", url.toString());
        render();
      });
    }
    input.addEventListener("input", render);
    render();
  }

  setupMenu();
  setupHero();
  setupFilters();
  setupSearchPage();
})();
