/* suvvy-core.js — наша обвязка вместо tilda-scripts-3.0 (шаг A чистки).
 *
 * Реализует те же обязанности, что и оригинал, но написана заново и читаемо:
 *  1) браузерные флаги (isMobile, isSafari, …) и browserLang;
 *  2) утилиты t_onReady / t_onFuncLoad / t_throttle / t_debounce / t_addClass /
 *     t_removeClass / t_removeEl / t_outerWidth / t_triggerEvent / t_scrollTo /
 *     t_loadJsFile / t_loadCSSFile — их зовут поблочный JS и файлы Тильды;
 *  3) появление записей на скролле (классы r_hidden / r_showed / r_anim);
 *  4) show/hide записей по data-screen-min / data-screen-max + winWidth/winHeight;
 *  5) компенсатор ширины скроллбара при открытии попапов (popupShowed/popupHidden);
 *  6) мобильные коррекции (vh у каверов, ширина блоков, крупные шрифты) —
 *     как в оригинале, только под мобильным UA;
 *  7) rel=noopener у внешних ссылок, сборщик window.t_jserrors, фикс html display.
 *
 * Не перенесено (на опубликованной странице не работает и в выгрузке не встречается):
 * режим редактора Тильды, лейбл «Made on Tilda» (в выгрузке его нет).
 */
(function () {
  'use strict';

  /* ---------- 1. Браузерные флаги ---------- */
  var ua = navigator.userAgent;
  window.isSearchBot = /Bot/i.test(ua);
  window.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  window.$isMobile = window.isMobile;
  window.isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(ua);
  window.isiOS = /iPhone|iPad|iPod/i.test(ua);
  window.isiOSChrome = !!ua.match('CriOS');
  window.isFirefox = /firefox/i.test(ua);
  window.isOpera = (!!window.opr && !!window.opr.addons) || !!window.opera || ua.indexOf(' OPR/') >= 0;
  window.isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  window.isIE = !!document.documentMode;

  window.isiOSVersion = '';
  if (window.isiOS) {
    var iosV = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
    if (iosV) window.isiOSVersion = [parseInt(iosV[1], 10), parseInt(iosV[2], 10), parseInt(iosV[3] || 0, 10)];
  }
  window.isSafariVersion = '';
  if (window.isSafari) {
    var safV = navigator.appVersion.match(/Version\/(\d+)\.(\d+)\.?(\d+)? Safari/);
    if (safV) window.isSafariVersion = [parseInt(safV[1], 10), parseInt(safV[2], 10), parseInt(safV[3] || 0, 10)];
  }

  window.browserLang = (window.navigator.userLanguage || window.navigator.language).toUpperCase().slice(0, 2);
  window.tildaBrowserLang = window.browserLang;

  /* ---------- 2. Утилиты ---------- */
  window.t_onReady = function (fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  };

  window.t_addClass = function (el, cls) { el.classList.add(cls); };
  window.t_removeClass = function (el, cls) { el.classList.remove(cls); };
  window.t_removeEl = function (el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  };

  window.t_outerWidth = function (el) {
    var cs = getComputedStyle(el);
    var w = cs.width === 'auto' ? 0 : parseInt(cs.width);
    var ml = cs.marginLeft === 'auto' ? 0 : parseInt(cs.marginLeft);
    var mr = cs.marginRight === 'auto' ? 0 : parseInt(cs.marginRight);
    return w + ml + mr;
  };

  window.t_throttle = function (fn, delay, ctx) {
    var last, timer;
    delay = delay || 250;
    return function () {
      var self = ctx || this, now = +new Date(), args = arguments;
      if (last && now < last + delay) {
        clearTimeout(timer);
        timer = setTimeout(function () { last = now; fn.apply(self, args); }, delay);
      } else {
        last = now;
        fn.apply(self, args);
      }
    };
  };

  window.t_debounce = function (fn, delay, ctx) {
    var timer;
    delay = delay || 250;
    return function () {
      var self = ctx || this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(self, args); }, delay);
    };
  };

  // Режим редактора: на опубликованной странице data-tilda-mode="edit" не бывает,
  // но функции оставлены — с ними t_onFuncLoad ведёт себя как оригинал.
  window.t_checkIsEditMode = function () {
    var root = document.getElementById('allrecords');
    return !!(root && root.getAttribute('data-tilda-mode') === 'edit');
  };
  window.t_checkEditorIsReady = function () {
    if (!t_checkIsEditMode()) return false;
    return document.body.getAttribute('data-ready-status') === 'ready';
  };

  // Ждёт появления window[name] и зовёт колбэк. Как в оригинале: поллинг 100мс,
  // а если через 15с после полной загрузки функции всё нет — бросает ошибку
  // (t_menuburger_init / t_animateInputs не определены и в выгрузке — известно).
  window.t_onFuncLoad = function (name, cb, interval) {
    var TIMEOUT = 15000;
    var inEdit = t_checkIsEditMode();
    var editorOk = function () { return !inEdit || t_checkEditorIsReady(); };
    var exists = function () {
      return typeof window[name] === 'function' || typeof window[name] === 'object';
    };
    if (exists() && editorOk()) { cb(); return; }
    var started = Date.now();
    var err = new Error(name + ' is undefined');
    setTimeout(function poll() {
      if (exists() && editorOk()) { cb(); return; }
      if (document.readyState === 'complete' && Date.now() - started > TIMEOUT && !exists()) {
        throw err;
      }
      setTimeout(poll, interval || 100);
    });
  };

  window.t_triggerEvent = function (el, name) {
    var ev = document.createEvent('HTMLEvents');
    ev.initEvent(name, true, false);
    ev.eventName = name;
    el.dispatchEvent(ev);
  };

  window.t_getRootZone = function () {
    var root = document.getElementById('allrecords');
    return (root && root.getAttribute('data-tilda-root-zone')) || 'com';
  };
  window.t_modifyRootZone = function (url) {
    return url && url.includes('static.tildacdn.com')
      ? url.replace('static.tildacdn.com', 'static.tildacdn.' + t_getRootZone())
      : url;
  };

  function loadFile(kind, src, cb, attempt) {
    attempt = attempt || 0;
    src = t_modifyRootZone(src);
    var found = kind === 'js'
      ? document.querySelector('script[src^="' + src + '"]')
      : document.querySelector('link[href^="' + src + '"]');
    if (found) { if (cb) cb(); return; }
    var el;
    if (kind === 'js') {
      el = document.createElement('script');
      el.type = 'text/javascript';
      el.src = src;
    } else {
      el = document.createElement('link');
      el.rel = 'stylesheet';
      el.type = 'text/css';
      el.media = 'all';
      el.crossOrigin = 'anonymous';
      el.href = src;
    }
    if (cb) el.addEventListener('load', function () { cb(); });
    el.addEventListener('error', function (e) {
      if (attempt > 3) {
        throw new Error('Failed to load ' + src + ': ' + (e.message || '<no error message>'));
      }
      setTimeout(function () {
        el.remove();
        loadFile(kind, src, cb, attempt + 1);
        console.warn('Retrying to load ' + src + '. Retry: ' + (attempt + 1));
      }, attempt * 1000);
    });
    document.head.appendChild(el);
  }
  window.t_loadJsFile = function (src, cb, attempt) { loadFile('js', src, cb, attempt); };
  window.t_loadCSSFile = function (src, cb, attempt) { loadFile('css', src, cb, attempt); };

  window.t_smoothScrollTo = function (top, duration) {
    duration = duration === undefined ? 500 : duration;
    var body = document.body;
    var from = window.scrollY || window.pageYOffset;
    var dist = top - from;
    var started = performance.now();
    body.setAttribute('data-scroll', 'true');
    body.setAttribute('data-scrollable', 'true');
    requestAnimationFrame(function step() {
      var t = Math.min((performance.now() - started) / duration, 1);
      window.scrollTo(0, from + dist * t * t);
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        body.removeAttribute('data-scroll');
        body.removeAttribute('data-scrollable');
        window.scrollTo(0, top);
      }
    });
  };

  window.t_scrollTo = function (el, opts) {
    if (!el) return;
    opts = opts || {};
    var behavior = opts.behavior === undefined ? 'instant' : opts.behavior;
    var offset = opts.offset || 0;
    var top = Math.max(parseInt(el.getBoundingClientRect().top + window.scrollY - offset, 10), 0);
    if (opts.useNativeScrollTo || behavior === 'instant') {
      window.scrollTo({ left: 0, top: top, behavior: behavior });
    } else {
      t_smoothScrollTo(top, opts.duration);
    }
  };

  /* ---------- 5. Компенсатор ширины скроллбара (попапы) ---------- */
  // При открытии попапа Тильда прячет прокрутку body; чтобы страница не дёргалась
  // на ширину скроллбара, body и fixed-элементы получают компенсирующий отступ.
  var COMPENSATOR_SKIP = ['t450', 't282__container', 't282__container__bg_opened',
    't282__menu__container', 't830m', 't830__panel', 't451m', 't204__menu',
    'tn-atom__sbs-anim-wrapper', 't-menu-popover__burgermenu__sidebar_right',
    't-menu-popover_fullscreen'];

  function compensatorCheckSize(cs, sbw) {
    var iw = window.innerWidth, ih = window.innerHeight;
    var w = cs.getPropertyValue('width'), wNum = parseFloat(w) || 0;
    var h = cs.getPropertyValue('height'), hNum = parseFloat(h) || 0;
    var margins = (parseFloat(cs.getPropertyValue('margin-left')) || 0) +
                  (parseFloat(cs.getPropertyValue('margin-right')) || 0);
    return {
      isFullscreenWidth: w === '100%' || w === '100vw' || wNum === iw ||
        wNum === iw - sbw || wNum === iw - margins || wNum === iw - margins - sbw,
      isFullscreenHeight: h === '100%' || h === '100vh' || h === 'auto' ||
        hNum === ih || hNum === ih - sbw,
      computedMarginNum: margins,
    };
  }

  function compensatorSetObject() {
    window.scrollBarWidthCompensator = {
      isInited: false,
      scrollBarWidth: Math.abs(window.innerWidth - document.documentElement.clientWidth),
      delay: 0,
      cancelTimeout: null,
      fixedElements: [],
    };
    var c = window.scrollBarWidthCompensator;
    var all = Array.prototype.filter.call(document.querySelectorAll('*'), function (el) {
      return !el.closest('.t1093') && !COMPENSATOR_SKIP.some(function (cls) {
        return el.classList.contains(cls);
      });
    });
    all.forEach(function (el) {
      if (el.classList.contains('t975')) return;
      var cs = window.getComputedStyle(el);
      var pos = cs.getPropertyValue('position');
      var size = compensatorCheckSize(cs, c.scrollBarWidth);
      if (pos === 'fixed' || (pos === 'absolute' && size.isFullscreenWidth && !size.isFullscreenHeight)) {
        c.fixedElements.push({ el: el, computedStyle: cs });
      }
    });
  }

  function compensatorInit() {
    if (window.isMobile || t_checkIsEditMode()) return;
    if (!window.scrollBarWidthCompensator) compensatorSetObject();
    var c = window.scrollBarWidthCompensator;
    c.scrollBarWidth = Math.abs(window.innerWidth - document.documentElement.clientWidth);
    if (c.cancelTimeout) {
      window.clearTimeout(c.cancelTimeout);
      c.cancelTimeout = null;
    }
    if (c.isInited || !c.scrollBarWidth) return;
    c.isInited = true;

    var bodyPad = parseInt(window.getComputedStyle(document.body).getPropertyValue('padding-right').replace('px', ''), 10);
    if (document.body.style.paddingRight) {
      document.body.setAttribute('data-tilda-initial-padding-right', document.body.style.paddingRight);
    }
    document.body.style.paddingRight = (c.scrollBarWidth + bodyPad) + 'px';
    document.body.style.height = '100vh';
    document.body.style.minHeight = '100vh';
    document.body.style.overflow = 'hidden';

    var delays = [];
    c.fixedElements.forEach(function (item) {
      var el = item.el;
      if (!document.body.contains(el) || el.classList.contains('t975')) return;
      var cs = item.computedStyle;
      var pos = cs.getPropertyValue('position');
      if (pos !== 'fixed' && pos !== 'absolute') return;

      var trans = cs.getPropertyValue('transition-duration');
      if (trans.indexOf('ms') + 1) delays.push(parseInt(trans.replace('ms', ''), 10));
      else if (trans.indexOf('s') + 1) delays.push(1000 * parseFloat(trans.replace('s', '')));

      var right = parseInt(cs.getPropertyValue('right').replace('px', ''), 10);
      if (el.style.right) el.setAttribute('data-tilda-initial-right', el.style.right);
      if (el.style.width) el.setAttribute('data-tilda-initial-width', el.style.width);

      var zoomParent = el.closest('.r');
      var zoom = (zoomParent && parseFloat(getComputedStyle(zoomParent).getPropertyValue('zoom'))) || 1;
      var sbwZoomed = c.scrollBarWidth / zoom;
      var size = compensatorCheckSize(cs, c.scrollBarWidth);
      var fullW = size.isFullscreenWidth ||
        el.classList.contains('t-menu-popover_fullwidth') ||
        (el.classList.contains('t-menu-popover') && zoom > 1);

      if ((right || right === 0) && el.style.right !== 'auto' && pos !== 'absolute' && !fullW) {
        el.style.right = (sbwZoomed + right) + 'px';
      } else if (fullW && !size.isFullscreenHeight) {
        el.style.width = 'calc(100vw / ' + (window.isSafari ? 1 : zoom) + ' - ' +
          size.computedMarginNum + 'px - ' + sbwZoomed + 'px)';
      }
    });
    if (delays.length) c.delay = Math.max.apply(null, delays);
  }

  function compensatorCancel() {
    var c = window.scrollBarWidthCompensator;
    if (!c || !c.isInited) return;
    c.isInited = false;
    c.delay = 0;
    if (document.body.hasAttribute('data-tilda-initial-padding-right')) {
      document.body.style.paddingRight = document.body.getAttribute('data-tilda-initial-padding-right');
      document.body.removeAttribute('data-tilda-initial-padding-right');
    } else {
      document.body.style.removeProperty('padding-right');
    }
    document.body.style.removeProperty('height');
    document.body.style.removeProperty('min-height');
    document.body.style.removeProperty('overflow');
    c.fixedElements.forEach(function (item) {
      var el = item.el;
      var isWrapper = el.classList.contains('tn-atom__sticky-wrapper') ||
        el.classList.contains('tn-atom__sbs-anim-wrapper');
      if (el.hasAttribute('data-tilda-initial-right')) {
        el.style.right = el.getAttribute('data-tilda-initial-right');
        el.removeAttribute('data-tilda-initial-right');
      } else {
        el.style.removeProperty('right');
      }
      if (el.hasAttribute('data-tilda-initial-width')) {
        el.style.width = el.getAttribute('data-tilda-initial-width');
        el.removeAttribute('data-tilda-initial-width');
      } else {
        el.style.removeProperty('width');
        if (isWrapper) el.style.width = 'inherit';
      }
    });
  }

  window.t_scrollBarWidthCompensator__setObject = compensatorSetObject;
  window.t_scrollBarWidthCompensator__init = compensatorInit;
  window.t_scrollBarWidthCompensator__cancel = compensatorCancel;
  window.t_scrollBarWidthCompensator__checkSize = compensatorCheckSize;

  t_onReady(function () {
    document.body.addEventListener('popupShowed', compensatorInit);
    document.body.addEventListener('popupHidden', function () {
      var c = window.scrollBarWidthCompensator;
      if (!c) return;
      if (c.cancelTimeout) {
        window.clearTimeout(c.cancelTimeout);
        c.cancelTimeout = null;
      }
      c.cancelTimeout = window.setTimeout(function () {
        c.cancelTimeout = null;
        compensatorCancel();
      }, Math.min(300, c.delay));
    });
  });

  /* ---------- 1а. Язык проекта и фиксы in-app браузеров ---------- */
  t_onReady(function () {
    var root = document.getElementById('allrecords');
    var lang = root && root.getAttribute('data-tilda-project-lang');
    if (lang) window.browserLang = lang;
  });

  // Android-браузеры внутри приложений (Instagram, FB, …) рендерят текст с иным
  // масштабом — оригинал мерит эталонный абзац и компенсирует zoom у zero-текстов.
  t_onReady(function () {
    var inApp = ua.indexOf('Instagram') !== -1 || ua.indexOf('FBAV') !== -1 ||
      ua.indexOf('YaSearchBrowser') !== -1 || ua.indexOf('SamsungBrowser') !== -1 ||
      ua.indexOf('DuckDuckGo') !== -1;
    if (ua.indexOf('Android') !== -1 && inApp) {
      var probe = document.createElement('p');
      probe.style.lineHeight = '100px';
      probe.style.padding = '0';
      probe.style.margin = '0';
      probe.style.height = 'auto';
      probe.style.position = 'absolute';
      probe.style.opacity = '0.001';
      probe.innerText = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      document.body.appendChild(probe);
      var ratio = 100 / probe.getBoundingClientRect().height;
      probe.parentNode.removeChild(probe);
      if (ratio < 0.98) {
        document.body.insertAdjacentHTML('beforeend',
          '<style>.t396 [data-elem-type="text"] .tn-atom {zoom: ' + 100 * ratio + '%;}</style>');
      }
    }
    if (window.isiOS && !window.MSStream) {
      document.body.style.setProperty('-webkit-text-size-adjust', '100%');
      document.body.style.setProperty('text-size-adjust', '100%');
    }
  });

  /* ---------- 3. Появление записей на скролле ---------- */
  t_onReady(function () {
    var root = document.getElementById('allrecords');
    if (!window.isMobile && root &&
        root.getAttribute('data-blocks-animationoff') !== 'yes' && !window.isSearchBot) {
      var all = document.querySelectorAll('.r');
      for (var i = 0; i < all.length; i++) {
        var style = all[i].getAttribute('style');
        if (style && style.indexOf('background') !== -1) {
          all[i].setAttribute('data-animationappear', 'off');
        }
      }
      var pending = Array.prototype.slice.call(all).filter(function (el) {
        return !el.getAttribute('data-animationappear') &&
          !el.getAttribute('data-screen-min') && !el.getAttribute('data-screen-max');
      });
      for (var j = 0; j < pending.length; j++) {
        var el = pending[j];
        var top = el.getBoundingClientRect().top + window.pageYOffset;
        var edge = window.pageYOffset + window.innerHeight + 300;
        t_addClass(el, top > 1000 && top > edge ? 'r_hidden' : 'r_showed');
        t_addClass(el, 'r_anim');
      }
      if (pending.length) {
        var reveal = function () {
          for (var k = pending.length - 1; k >= 0; k--) {
            var rec = pending[k];
            var limit = rec.offsetHeight <= 100
              ? window.pageYOffset + window.innerHeight
              : window.pageYOffset + window.innerHeight - 100;
            if (rec.getBoundingClientRect().top + window.pageYOffset < limit) {
              t_removeClass(rec, 'r_hidden');
              t_addClass(rec, 'r_showed');
              pending = Array.prototype.slice.call(pending);
              pending.splice(k, 1);
            }
          }
        };
        // Записи-обёртки типа 400 сначала прячут содержимое; ждём, пока все
        // отработают (как в оригинале — интервал с потолком в 300 тиков).
        var wrappers = document.querySelectorAll('[data-record-type="400"], [data-parenttplid="400"]');
        if (wrappers.length > 0) {
          var done = 0, ticks = 0;
          var timer = setInterval(function () {
            if (++ticks === 300) clearInterval(timer);
            done = 0;
            for (var m = 0; m < wrappers.length; m++) {
              if (wrappers[m].getAttribute('data-hiding-completed') === 'yes') done += 1;
            }
            if (done === wrappers.length) {
              reveal();
              clearInterval(timer);
            }
          }, 100);
        }
        window.addEventListener('scroll', t_throttle(reveal, 200));
        window.addEventListener('tildatab:change', t_throttle(reveal, 200));
        setTimeout(reveal);
      }
    }
    // Кастомный код мог спрятать html до готовности — возвращаем как оригинал.
    var html = document.querySelector('html');
    if (html.style.display === 'none') html.style.display = 'block';
  });

  /* ---------- 4. winWidth/winHeight и data-screen-min/max ---------- */
  function updateWinSize() {
    window.winWidth = window.innerWidth;
    window.winHeight = window.innerHeight;
  }

  function applyScreenLimits() {
    var w = window.isMobile ? document.documentElement.clientWidth : window.innerWidth;
    if (navigator.userAgent.indexOf('Instagram') !== -1) w = screen.width;
    var recs = document.querySelectorAll('.r[data-screen-max], .r[data-screen-min]');
    for (var i = 0; i < recs.length; i++) {
      var el = recs[i];
      var id = el.id.replace('rec', '');
      // Записи, привязанные к табам или попапам, показывает их собственный код.
      if (el.getAttribute('data-connect-with-tab') === 'yes' ||
          document.querySelector('[data-popup-rec-ids="' + id + '"]')) return;
      var display = getComputedStyle(el).display;
      var max = parseInt(el.getAttribute('data-screen-max') || 10000);
      var min = parseInt(el.getAttribute('data-screen-min') || 0);
      if (min > max) continue;
      if (w <= max && w > min) {
        if (display !== 'block') el.style.display = 'block';
      } else if (display !== 'none') {
        el.style.display = 'none';
      }
    }
  }

  t_onReady(function () {
    updateWinSize();
    applyScreenLimits();
    window.addEventListener('resize', t_throttle(updateWinSize, 200));
    window.addEventListener('resize', t_throttle(applyScreenLimits, 200));
  });

  /* ---------- 6. Мобильные коррекции (как оригинал — только мобильный UA) ---------- */
  (function () {
    var isInstagram = navigator.userAgent.indexOf('Instagram') !== -1;

    // vh в высоте каверов: мобильные браузеры меняют 100vh при скрытии панелей,
    // оригинал переводит vh в px по фактической высоте окна.
    function fixCoverVh() {
      var carriers = document.querySelectorAll('.t-cover__carrier');
      for (var i = 0; i < carriers.length; i++) {
        var el = carriers[i];
        if (el.style.height.indexOf('vh') === -1) continue;
        var share = parseInt(el.style.height, 10) / 100;
        var probe = document.createElement('div');
        probe.id = 'tempDiv';
        probe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100vh;visibility:hidden;';
        document.body.appendChild(probe);
        var vh = parseInt(getComputedStyle(probe).height.replace('px', ''));
        t_removeEl(probe);
        var px = Math.round(vh * share) + 'px';
        var cover = el.closest('.t-cover');
        if (cover) {
          cover.style.height = px;
          var filter = cover.querySelector('.t-cover__filter');
          var wrapper = cover.querySelector('.t-cover__wrapper');
          if (filter) filter.style.height = px;
          if (wrapper) wrapper.style.height = px;
        }
        el.style.height = px;
      }
      var corrected = document.querySelectorAll('[data-height-correct-vh]');
      for (var j = 0; j < corrected.length; j++) {
        var c = corrected[j];
        if (c.style.height.indexOf('vh') === -1) continue;
        var k = parseInt(c.style.height) / 100;
        c.style.height = window.innerHeight * (isNaN(k) ? 1 : k) + 'px';
      }
    }

    // Блоки шире экрана: отмечаем в консоли и включаем overflow/word-break.
    var INNER_SKIP = 'div:not([data-auto-correct-mobile-width="false"]):not(.tn-elem):not(.tn-atom)' +
      ':not(.tn-atom__sbs-anim-wrapper):not(.tn-atom__prx-wrapper):not(.tn-atom__videoiframe)' +
      ':not(.tn-atom__sticky-wrapper):not(.t-catalog__relevants__container):not(.t-slds__items-wrapper)' +
      ':not(.js-product-controls-wrapper):not(.t-store__relevants__container)' +
      ':not(.js-product-edition-option):not(.t-product__option-variants)';

    function fixMobileWidth() {
      var w = isInstagram ? screen.width : window.innerWidth;
      if (window.isMobile && !isInstagram) w = document.documentElement.clientWidth;
      var recs = document.querySelectorAll(
        '.r:not([data-record-type="396"], [data-record-type="1003"], [data-parenttplid="396"], [data-parenttplid="1003"])');
      var visible = [];
      for (var i = 0; i < recs.length; i++) {
        var cs = getComputedStyle(recs[i]);
        if (cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0') {
          visible.push(recs[i]);
        }
      }
      for (var j = 0; j < visible.length; j++) {
        var rec = visible[j];
        var parts = rec.querySelectorAll(INNER_SKIP);
        for (var k = 0; k < parts.length; k++) {
          var el = parts[k];
          rec.style.wordBreak = '';
          var width = t_outerWidth(el);
          if (width > w) {
            if (el.getAttribute('[data-customstyle]') === 'yes' &&
                el.parentNode.getAttribute('[data-auto-correct-mobile-width]') === 'false') return;
            console.log('Block not optimized for mobile width. Block width:' + width +
              ' Block id:' + rec.getAttribute('id'));
            console.log(el);
            rec.style.overflow = 'auto';
            rec.style.wordBreak = width - 3 > w ? 'break-word' : '';
          }
        }
      }
    }

    var TEXT_SEL = ['.t-text', '.t-name', '.t-title', '.t-descr', '.t-heading',
      '.t-text-impact', '.t-subtitle', '.t-uptitle'].map(function (c) {
        return c + ':not(.tn-elem):not(.tn-atom):not([data-auto-correct-line-height="false"])';
      }).join(', ');

    // Крупные инлайновые шрифты на узких экранах: прячем font-size/line-height
    // переименованием свойства (fontsize/lineheight), как делает оригинал.
    function fixLargeFonts(threshold) {
      var els = document.querySelectorAll(TEXT_SEL);
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var style = el.getAttribute('style');
        if (!style) continue;
        var useRem = el.getAttribute('data-auto-correct-font-size') === 'rem';
        var out;
        if (document.documentElement.clientWidth > threshold) {
          out = style.replace('lineheight', 'line-height').replace('fontsize', 'font-size');
          el.setAttribute('style', out);
        } else {
          if (style.indexOf('font-size') === -1) continue;
          if (parseInt(getComputedStyle(el).fontSize.replace('px', '')) < 26) continue;
          out = style.replace('line-height', 'lineheight');
          out = useRem
            ? out.replace(/font-size.*px;/gi, 'font-size: 1.6rem;')
            : out.replace('font-size', 'fontsize');
          el.setAttribute('style', out);
        }
      }
    }

    function clearOversizeInline(limit) {
      var custom = document.querySelectorAll('[data-customstyle="yes"]');
      var spans = document.querySelectorAll('[field] span, [field] strong, [field] em, [field] a');
      for (var i = 0; i < custom.length; i++) {
        if (parseInt(getComputedStyle(custom[i]).fontSize.replace('px', '')) > limit) {
          custom[i].style.fontSize = null;
          custom[i].style.lineHeight = null;
        }
      }
      for (var j = 0; j < spans.length; j++) {
        if (parseInt(getComputedStyle(spans[j]).fontSize.replace('px', '')) > limit) {
          spans[j].style.fontSize = null;
        }
      }
    }

    if (window.isMobile || window.parent.isPagePreview) {
      t_onReady(function () { setTimeout(fixCoverVh, 400); });
      window.addEventListener('load', function () { setTimeout(fixCoverVh, 400); });
      var narrow = window.innerWidth < 480 ||
        (window.isMobile && document.documentElement.clientWidth < 480) ||
        (isInstagram && screen.width < 480);
      var medium = window.innerWidth < 900 ||
        (window.isMobile && document.documentElement.clientWidth < 900) ||
        (isInstagram && screen.width < 900);
      if (narrow) {
        t_onReady(function () {
          clearOversizeInline(26);
          fixLargeFonts(480);
          window.addEventListener('orientationchange', function () {
            setTimeout(function () { fixLargeFonts(480); }, 500);
          });
        });
        window.addEventListener('load', fixMobileWidth);
        window.addEventListener('orientationchange', function () {
          setTimeout(fixMobileWidth, 500);
        });
      } else if (medium) {
        t_onReady(function () {
          clearOversizeInline(30);
          var els = document.querySelectorAll(TEXT_SEL);
          for (var i = 0; i < els.length; i++) {
            var el = els[i];
            var style = el.getAttribute('style');
            if (!style || style.indexOf('font-size') === -1) continue;
            if (parseInt(getComputedStyle(el).fontSize.replace('px', '')) <= 30) continue;
            var out = el.getAttribute('data-auto-correct-font-size') === 'rem'
              ? style.replace(/font-size.*px;/gi, 'font-size: 1.6rem;').replace('line-height', 'lineheight')
              : style.replace('font-size', 'fontsize').replace('line-height', 'lineheight');
            el.setAttribute('style', out);
          }
        });
      }
    }
  })();

  /* ---------- 7. noopener и сборщик ошибок ---------- */
  t_onReady(function () {
    setTimeout(function () {
      var links = document.querySelectorAll('a[href^="http"][target="_blank"]');
      for (var i = 0; i < links.length; i++) {
        var rel = links[i].getAttribute('rel') || '';
        if (rel === '') links[i].setAttribute('rel', 'noopener');
        else if (rel.indexOf('noopener') === -1) links[i].setAttribute('rel', rel + ' noopener');
      }
    }, 2500);
  });

  window.onerror = function (message, filename, lineno, colno, error) {
    if (typeof window.t_jserrors !== 'object') window.t_jserrors = [];
    window.t_jserrors.push({ message: message, filename: filename, lineno: lineno, colno: colno, error: error });
  };
})();
