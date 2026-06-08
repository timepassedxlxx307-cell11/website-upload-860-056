(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    ready(function () {
        var menuButton = document.querySelector('[data-menu-toggle]');
        var nav = document.querySelector('.site-nav');

        if (menuButton && nav) {
            menuButton.addEventListener('click', function () {
                nav.classList.toggle('is-open');
            });
        }

        document.querySelectorAll('[data-hero]').forEach(function (hero) {
            var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
            var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
            var previous = hero.querySelector('[data-hero-prev]');
            var next = hero.querySelector('[data-hero-next]');
            var active = 0;
            var timer = null;

            function show(index) {
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

            function start() {
                timer = window.setInterval(function () {
                    show(active + 1);
                }, 5200);
            }

            function restart() {
                window.clearInterval(timer);
                start();
            }

            if (previous) {
                previous.addEventListener('click', function () {
                    show(active - 1);
                    restart();
                });
            }

            if (next) {
                next.addEventListener('click', function () {
                    show(active + 1);
                    restart();
                });
            }

            dots.forEach(function (dot) {
                dot.addEventListener('click', function () {
                    show(parseInt(dot.getAttribute('data-hero-dot'), 10));
                    restart();
                });
            });

            show(active);
            start();
        });

        document.querySelectorAll('[data-search-area]').forEach(function (area) {
            var container = area.closest('.section') || document;
            var input = container.querySelector('[data-search-input]');
            var typeFilter = container.querySelector('[data-type-filter]');
            var cards = Array.prototype.slice.call(area.querySelectorAll('[data-card]'));

            function applyFilter() {
                var keyword = input ? input.value.trim().toLowerCase() : '';
                var type = typeFilter ? typeFilter.value : '';

                cards.forEach(function (card) {
                    var content = (card.getAttribute('data-title') || '').toLowerCase();
                    var cardType = card.getAttribute('data-type') || '';
                    var matchedKeyword = !keyword || content.indexOf(keyword) !== -1;
                    var matchedType = !type || cardType.indexOf(type) !== -1;
                    card.classList.toggle('is-hidden', !(matchedKeyword && matchedType));
                });
            }

            if (input) {
                input.addEventListener('input', applyFilter);
            }

            if (typeFilter) {
                typeFilter.addEventListener('change', applyFilter);
            }
        });

        document.querySelectorAll('[data-player]').forEach(function (player) {
            var video = player.querySelector('video');
            var button = player.querySelector('[data-play-button]');
            var source = video ? video.getAttribute('data-url') : '';
            var hls = null;
            var prepared = false;

            function prepare() {
                if (!video || !source || prepared) {
                    return;
                }

                prepared = true;

                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                } else if (window.Hls && window.Hls.isSupported()) {
                    hls = new window.Hls();
                    hls.loadSource(source);
                    hls.attachMedia(video);
                } else {
                    video.src = source;
                }
            }

            function play() {
                prepare();
                player.classList.add('is-playing');

                if (video) {
                    var action = video.play();

                    if (action && typeof action.catch === 'function') {
                        action.catch(function () {
                            player.classList.remove('is-playing');
                        });
                    }
                }
            }

            if (button) {
                button.addEventListener('click', play);
            }

            if (video) {
                video.addEventListener('play', function () {
                    player.classList.add('is-playing');
                });

                video.addEventListener('pause', function () {
                    if (!video.currentTime) {
                        player.classList.remove('is-playing');
                    }
                });
            }

            window.addEventListener('beforeunload', function () {
                if (hls && typeof hls.destroy === 'function') {
                    hls.destroy();
                }
            });
        });
    });
})();
