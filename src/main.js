/**
 * Copyright (c) 2020 Google Inc
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const exposed = {};
if (location.search) {
  var a = document.createElement("a");
  a.href = location.href;
  a.search = "";
  history.replaceState(null, null, a.href);
}

function tweet_(url) {
  open(
    "https://twitter.com/intent/tweet?url=" + encodeURIComponent(url),
    "_blank"
  );
}
function tweet(anchor) {
  tweet_(anchor.getAttribute("href"));
}
expose("tweet", tweet);

function share(anchor) {
  var url = anchor.getAttribute("href");
  if (navigator.share) {
    navigator.share({
      url: url,
    });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url);
    message("Blog site URL copied to clipboard.");
  } else {
    tweet_(url);
  }
}
expose("share", share);

function message(msg) {
  var dialog = document.getElementById("message");
  dialog.textContent = msg;
  dialog.setAttribute("open", "");
  setTimeout(function () {
    dialog.removeAttribute("open");
  }, 3000);
}

function prefetch(e) {
  if (e.target.tagName != "A") {
    return;
  }
  if (e.target.origin != location.origin) {
    return;
  }
  /**
   * Return the given url with no fragment
   * @param {string} url potentially containing a fragment
   * @return {string} url without fragment
   */
  const removeUrlFragment = (url) => url.split("#")[0];
  if (removeUrlFragment(window.location.href) === removeUrlFragment(e.target.href)) {
    return;
  }
  var l = document.createElement("link");
  l.rel = "prefetch";
  l.href = e.target.href;
  document.head.appendChild(l);
}
document.documentElement.addEventListener("mouseover", prefetch, {
  capture: true,
  passive: true,
});
document.documentElement.addEventListener("touchstart", prefetch, {
  capture: true,
  passive: true,
});

/**
 * Injects a script into document.head
 * @param {string} src path of script to be injected in <head>
 * @return {Promise} Promise object that resolves on script load event
 */
const dynamicScriptInject = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.type = "text/javascript";
    document.head.appendChild(script);
    script.addEventListener("load", () => {
      resolve(script);
    });
  });
};

// Script web-vitals.js will be injected dynamically if user opts-in to sending CWV data.
const sendWebVitals = document.currentScript.getAttribute("data-cwv-src");

if (/web-vitals.js/.test(sendWebVitals)) {
  dynamicScriptInject(`${window.location.origin}/js/web-vitals.js`)
  .then(() => {
    webVitals.getCLS(sendToGoogleAnalytics);
    webVitals.getFID(sendToGoogleAnalytics);
    webVitals.getLCP(sendToGoogleAnalytics);
  })
  .catch((error) => {
    console.error(error);
  });
}

addEventListener(
  "click",
  function (e) {
    var button = e.target.closest("button");
    if (!button) {
      return;
    }
  },
  true
);

addEventListener(
  "selectionchange",
  function () {
    var text = String(document.getSelection()).trim();
    if (text.split(/[\s\n\r]+/).length < 3) {
      return;
    }
  },
  true
);

if (window.ResizeObserver && document.querySelector("header nav #nav")) {
  var progress = document.getElementById("reading-progress");

  var timeOfLastScroll = 0;
  var requestedAniFrame = false;
  function scroll() {
    if (!requestedAniFrame) {
      requestAnimationFrame(updateProgress);
      requestedAniFrame = true;
    }
    timeOfLastScroll = Date.now();
  }
  addEventListener("scroll", scroll);

  var winHeight = 1000;
  var bottom = 10000;
  function updateProgress() {
    requestedAniFrame = false;
    var percent = Math.min(
      (document.scrollingElement.scrollTop / (bottom - winHeight)) * 100,
      100
    );
    progress.style.transform = `translate(-${100 - percent}vw, 0)`;
    if (Date.now() - timeOfLastScroll < 3000) {
      requestAnimationFrame(updateProgress);
      requestedAniFrame = true;
    }
  }

  new ResizeObserver(() => {
    bottom =
      document.scrollingElement.scrollTop +
      document.querySelector("#comments,footer").getBoundingClientRect().top;
    winHeight = window.innerHeight;
    scroll();
  }).observe(document.body);
}

function expose(name, fn) {
  exposed[name] = fn;
}

addEventListener("click", (e) => {
  const handler = e.target.closest("[on-click]");
  if (!handler) {
    return;
  }
  e.preventDefault();
  const name = handler.getAttribute("on-click");
  const fn = exposed[name];
  if (!fn) {
    throw new Error("Unknown handler" + name);
  }
  fn(handler);
});

// There is a race condition here if an image loads faster than this JS file. But
// - that is unlikely
// - it only means potentially more costly layouts for that image.
// - And so it isn't worth the querySelectorAll it would cost to synchronously check
//   load state.
document.body.addEventListener(
  "load",
  (e) => {
    if (e.target.tagName != "IMG") {
      return;
    }
    // Ensure the browser doesn't try to draw the placeholder when the real image is present.
    e.target.style.backgroundImage = "none";
  },
  /* capture */ "true"
);

const [colorscheme_light, colorscheme_dark] = ["light", "dark"];
const colorscheme_mode_key = "colorscheme-mode";

function setColorscheme(mode) {
  document.documentElement.setAttribute(colorscheme_mode_key, mode);
  
  if ("supportsLocalStorage" in setColorscheme) {
    if (setColorscheme.supportsLocalStorage) {
      localStorage.setItem(colorscheme_mode_key, mode);
    }
  } else {
    let storage = undefined;
    let fail = undefined;
    const uid = "test";
    try {
      (storage = window.localStorage).setItem(uid, uid);
      fail = storage.getItem(uid) != uid;
      storage.removeItem(uid);
      fail && (storage = false);
    } catch (exception) {}
    setColorscheme.supportsLocalStorage = setColorscheme.supportsLocalStorage || storage;
    if (storage) {
      storage.setItem(colorscheme_mode_key, mode);
    }
  }
}

function toggleColorscheme(_) {
  const mode_curr = document.documentElement.getAttribute(colorscheme_mode_key);
  const mode_next = (mode_curr && mode_curr === colorscheme_light) ? colorscheme_dark : colorscheme_light;
  setColorscheme(mode_next);
}
expose("colorscheme-toggle", toggleColorscheme);

window.matchMedia("(prefers-color-scheme: dark)").addEventListener(
  "change", 
  e => e.matches && setColorscheme(colorscheme_dark)
);

window.matchMedia("(prefers-color-scheme: light)").addEventListener(
  "change", 
  e => e.matches && setColorscheme(colorscheme_light)
);