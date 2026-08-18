/* Наша замена tilda-animation-2.0.min.js (чистка кода Тильды, шаг 3).
 *
 * Движок входных анимаций: 805 элементов с классом .t-animate в зеро-блоках.
 * В нашей разметке используются РОВНО: стили fadein/fadeinup/fadeinright/
 * fadeinleft/zoomin; атрибуты duration, delay, distance, scale, mobile
 * и duration/delay с суффиксом -res-320 (12 шт). Цепочек (data-animate-chain),
 * счётчиков (animatednumber) и sbs-обвязки здесь нет — sbs-цепочки обслуживает
 * отдельная tilda-animation-sbs, она от этого файла не зависит (проверено).
 *
 * Механика повторена по оригиналу:
 *  - базовый CSS: opacity:0 + transform по стилю (100px / scale 0.9),
 *    transition cubic-bezier(0.19,1,0.22,1) 1s; тексты 0.7s, .t-item 0.5s;
 *  - атрибут distance/scale переопределяет стартовый transform инлайном;
 *  - триггер — IntersectionObserver (эталон тоже на IO: элементы в обрезанных
 *    лентах у него так же не анимируются до показа, это НЕ наша регрессия);
 *  - старт всего механизма с задержкой 1500 мс, как у оригинала;
 *  - уже данные классы: .t-animate_started (финал), .t-animate_no-hover
 *    на кнопках до конца анимации;
 *  - мобильные (<960): анимируются только элементы, у чьего .t396__elem
 *    стоит data-animate-mobile="y", остальные показываются сразу;
 *  - fadeinleft, вылезающий за правый край, прячется overflow-х блока
 *    (класс t-animate__overflow-x-hidden на .r), пока не доиграет;
 *  - боты/выключатель data-blocks-animationoff — показать всё сразу.
 *
 * Экспортируются t_animate__-функции, которые зовёт поблочный JS Тильды
 * (chat-bot-altegio и др.) — сигнатуры совместимы.
 */
(function () {
  'use strict';

  var STYLES = {
    fadein: 'none',
    fadeinup: 'translate(0,100px)',
    fadeindown: 'translate(0,-100px)',
    fadeinleft: 'translate(100px,0)',
    fadeinright: 'translate(-100px,0)',
    zoomin: 'scale(0.9)',
    zoomout: 'scale(1.1)',
  };

  // Атрибут с учётом ширины окна: data-animate-<name>-res-320 действует до 480px.
  function attr(el, name) {
    if (window.innerWidth < 480) {
      var v = el.getAttribute('data-animate-' + name + '-res-320');
      if (v !== null && v !== '') return v;
    }
    return el.getAttribute('data-animate-' + name);
  }

  function els() {
    return Array.prototype.slice.call(document.querySelectorAll('.t-animate'));
  }

  function reveal(el) {
    if (el.classList.contains('t-animate_started')) return;
    var d = attr(el, 'duration');
    var delay = attr(el, 'delay');
    if (d) el.style.transitionDuration = d + 's';
    if (delay) el.style.transitionDelay = delay + 's';
    el.classList.remove('t-animate_wait');
    el.classList.add('t-animate_started');
    if (el.classList.contains('t-btn')) t_animate__removeNoHoverClassFromBtns(el);
    // fadeinleft: снять overflow-запрет с блока, когда в нём доиграл последний
    if (el.getAttribute('data-animate-style') === 'fadeinleft') {
      el.addEventListener('transitionend', function h() {
        el.removeEventListener('transitionend', h);
        var r = el.closest('.t-animate__overflow-x-hidden');
        if (r && !r.querySelector('[data-animate-style="fadeinleft"]:not(.t-animate_started)')) {
          r.classList.remove('t-animate__overflow-x-hidden');
        }
      });
    }
  }

  function showInstantly(el) {
    el.classList.remove('t-animate', 't-animate_wait', 't-animate_no-hover');
  }

  function baseCss() {
    var sel = Object.keys(STYLES).map(function (s) {
      return '.t396 .t-animate[data-animate-style="' + s + '"]';
    }).join(',');
    var css = sel + '{opacity:0;transition-property:opacity,transform;' +
      'transition-duration:1s;transition-timing-function:cubic-bezier(0.19,1,0.22,1);' +
      '-webkit-backface-visibility:hidden;backface-visibility:hidden;}';
    Object.keys(STYLES).forEach(function (s) {
      if (STYLES[s] !== 'none') {
        css += '.t396 .t-animate[data-animate-style="' + s + '"]{transform:' + STYLES[s] + ';}';
      }
    });
    css += '.t396 .t-title.t-animate,.t396 .t-subtitle.t-animate,.t396 .t-text.t-animate{transition-duration:0.7s;}';
    css += '.t396 .t-item.t-animate{transition-duration:0.5s;}';
    css += '.t396 .t-animate_started{opacity:1!important;transform:none!important;}';
    css += '.t-animate__overflow-x-hidden{overflow-x:hidden;}';
    css += '.t-btn.t-animate_no-hover{pointer-events:none;}';
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
  }

  // ── Совместимый API для поблочного JS Тильды ────────────────────────────
  window.t_animate__getAttrByResBase = function (el, name) { return attr(el, name); };
  window.t_animate__removeNoHoverClassFromBtns = function (el) {
    if (!el) return false;
    var b = el.classList.contains('t-btn') ? el : null;
    if (b) b.ontransitionend = function (e) {
      if (e.propertyName === 'opacity' || e.propertyName === 'transform') {
        b.classList.remove('t-animate_no-hover');
        b.style.transitionDelay = '';
        b.style.transitionDuration = '';
        this.ontransitionend = null;
      }
    };
  };
  window.t_animate__detectElemTriggerOffset = function (el) {
    var r = el.getBoundingClientRect();
    return r.top + window.pageYOffset;
  };
  window.t_animate__setAnimELemsState = function () {};
  window.t_animate__setCustomAnimSettings = function (el) { applyCustom(el); };
  window.t_animate__animateNumbers = function () {}; // счётчиков в разметке нет

  // distance/scale переопределяют стартовое положение инлайном, без transition.
  function applyCustom(el) {
    var style = attr(el, 'style');
    var dist = attr(el, 'distance');
    if (dist) {
      dist = String(dist).replace('px', '');
      el.style.transitionDuration = '0s';
      var t = {
        fadeinup: 'translate3d(0,' + dist + 'px,0)',
        fadeindown: 'translate3d(0,-' + dist + 'px,0)',
        fadeinleft: 'translate3d(' + dist + 'px,0,0)',
        fadeinright: 'translate3d(-' + dist + 'px,0,0)',
      }[style];
      if (t) el.style.transform = t;
      void el.offsetWidth; // repaint, чтобы стартовое положение применилось без анимации
      el.style.transitionDuration = '';
    }
    // data-animate-scale НЕ трогаем: эталон стартует zoomin с CSS-значения 0.9
    // и атрибут на стартовое состояние не влияет (сверено замером).
  }

  function init() {
    var rec = document.querySelector('.t-records');
    var off = rec && rec.getAttribute('data-blocks-animationoff');
    if (/Bot/i.test(navigator.userAgent) || off === 'yes') {
      els().forEach(showInstantly);
      return;
    }
    baseCss();

    var all = els();
    // Мобильные: без data-animate-mobile="y" на родительском элементе — без анимации.
    if (window.innerWidth < 960) {
      all = all.filter(function (el) {
        var host = el.closest('.t396__elem, .t396__group');
        if (host && host.getAttribute('data-animate-mobile') === 'y') return true;
        showInstantly(el);
        return false;
      });
    }
    all.forEach(applyCustom);

    // Кнопки не должны ловить hover, пока едут.
    all.forEach(function (el) {
      if (el.classList.contains('t-btn')) el.classList.add('t-animate_no-hover');
    });

    // fadeinleft за правым краем — прячем горизонтальный вылет блока.
    if (window.innerWidth >= 980) {
      all.forEach(function (el) {
        if (el.getAttribute('data-animate-style') === 'fadeinleft' &&
            !el.closest('.t396__artboard, .t-cover') &&
            el.getBoundingClientRect().right > window.innerWidth) {
          var r = el.closest('.r');
          if (r) r.classList.add('t-animate__overflow-x-hidden');
        }
      });
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          io.unobserve(e.target);
          reveal(e.target);
        }
      });
    });
    // Старт с той же задержкой, что у оригинала.
    setTimeout(function () { all.forEach(function (el) { io.observe(el); }); }, 1500);
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
