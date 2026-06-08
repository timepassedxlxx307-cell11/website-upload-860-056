(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    function setupMenu() {
        var button = document.querySelector(".menu-toggle");
        var panel = document.querySelector(".mobile-panel");
        if (!button || !panel) {
            return;
        }
        button.addEventListener("click", function () {
            var open = panel.classList.toggle("is-open");
            button.setAttribute("aria-expanded", open ? "true" : "false");
            button.textContent = open ? "×" : "☰";
        });
    }

    function setupHero() {
        var hero = document.querySelector(".hero-slider");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var index = 0;
        var timer = null;

        function show(target) {
            index = (target + slides.length) % slides.length;
            slides.forEach(function (slide, current) {
                slide.classList.toggle("is-active", current === index);
            });
            dots.forEach(function (dot, current) {
                dot.classList.toggle("is-active", current === index);
            });
        }

        function play() {
            clearInterval(timer);
            timer = setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                play();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                play();
            });
        }
        dots.forEach(function (dot, current) {
            dot.addEventListener("click", function () {
                show(current);
                play();
            });
        });
        show(0);
        play();
    }

    function normalize(value) {
        return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
    }

    function setupFilters() {
        var forms = document.querySelectorAll("[data-filter-panel]");
        forms.forEach(function (panel) {
            var scope = document.querySelector(panel.getAttribute("data-filter-panel"));
            if (!scope) {
                return;
            }
            var input = panel.querySelector("[data-filter-text]");
            var year = panel.querySelector("[data-filter-year]");
            var region = panel.querySelector("[data-filter-region]");
            var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-card"));
            var empty = document.querySelector(panel.getAttribute("data-empty-target"));

            function apply() {
                var q = normalize(input ? input.value : "");
                var y = normalize(year ? year.value : "");
                var r = normalize(region ? region.value : "");
                var visible = 0;
                cards.forEach(function (card) {
                    var search = normalize(card.getAttribute("data-search"));
                    var cardYear = normalize(card.getAttribute("data-year"));
                    var cardRegion = normalize(card.getAttribute("data-region"));
                    var matched = (!q || search.indexOf(q) !== -1) && (!y || cardYear === y) && (!r || cardRegion.indexOf(r) !== -1);
                    card.style.display = matched ? "" : "none";
                    if (matched) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle("is-visible", visible === 0);
                }
            }

            [input, year, region].forEach(function (item) {
                if (item) {
                    item.addEventListener("input", apply);
                    item.addEventListener("change", apply);
                }
            });
            apply();
        });
    }

    function setupSearchPage() {
        var page = document.querySelector("[data-search-page]");
        if (!page) {
            return;
        }
        var input = page.querySelector("[data-search-input]");
        var resultScope = document.querySelector("#search-results");
        var empty = document.querySelector("#search-empty");
        var cards = resultScope ? Array.prototype.slice.call(resultScope.querySelectorAll(".movie-card")) : [];
        var params = new URLSearchParams(window.location.search);
        var q = params.get("q") || "";
        if (input) {
            input.value = q;
        }

        function apply() {
            var value = normalize(input ? input.value : "");
            var visible = 0;
            cards.forEach(function (card) {
                var matched = !value || normalize(card.getAttribute("data-search")).indexOf(value) !== -1;
                card.style.display = matched ? "" : "none";
                if (matched) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.classList.toggle("is-visible", visible === 0);
            }
        }

        if (input) {
            input.addEventListener("input", apply);
        }
        apply();
    }

    window.initMoviePlayer = function (streamUrl) {
        var video = document.querySelector("[data-player-video]");
        var overlay = document.querySelector("[data-player-overlay]");
        var startButtons = document.querySelectorAll("[data-player-start]");
        var started = false;
        var hls = null;

        if (!video || !streamUrl) {
            return;
        }

        function bindStream() {
            if (started) {
                return;
            }
            started = true;
            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(streamUrl);
                hls.attachMedia(video);
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = streamUrl;
            } else {
                video.src = streamUrl;
            }
        }

        function begin() {
            bindStream();
            if (overlay) {
                overlay.classList.add("is-hidden");
            }
            var promise = video.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(function () {});
            }
        }

        startButtons.forEach(function (button) {
            button.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                begin();
            });
        });

        if (overlay) {
            overlay.addEventListener("click", begin);
        }

        video.addEventListener("click", function () {
            if (!started) {
                begin();
                return;
            }
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        });

        window.addEventListener("pagehide", function () {
            if (hls) {
                hls.destroy();
            }
        });
    };

    ready(function () {
        setupMenu();
        setupHero();
        setupFilters();
        setupSearchPage();
    });
})();
