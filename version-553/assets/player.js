function initMoviePlayer(options) {
  var video = document.querySelector(options.videoSelector);
  var button = document.querySelector(options.buttonSelector);
  var panel = document.querySelector(options.panelSelector);
  var sourceUrl = options.sourceUrl;
  var hlsInstance = null;
  var ready = false;

  function attach() {
    if (!video || ready || !sourceUrl) {
      return;
    }
    ready = true;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = sourceUrl;
    } else if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsInstance.loadSource(sourceUrl);
      hlsInstance.attachMedia(video);
    } else {
      video.src = sourceUrl;
    }
  }

  function play() {
    attach();
    if (panel) {
      panel.classList.add("is-hidden");
    }
    var promise = video && video.play ? video.play() : null;
    if (promise && promise.catch) {
      promise.catch(function () {});
    }
  }

  if (button) {
    button.addEventListener("click", play);
  }
  if (panel && panel !== button) {
    panel.addEventListener("click", play);
  }
  if (video) {
    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      }
    });
    video.addEventListener("play", function () {
      if (panel) {
        panel.classList.add("is-hidden");
      }
    });
    video.addEventListener("emptied", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }
      ready = false;
    });
  }
}
