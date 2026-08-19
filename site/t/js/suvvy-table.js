/* suvvy-table.js — вместо tilda-table-editor.min.js.
 *
 * Косметика широких таблиц в текстах кейсов: справа затемняющий градиент-
 * оверлей (.t-table__viewport-overlying_visible из CSS Тильды), пока таблицу
 * можно скроллить вправо; у правого края (запас 45px) оверлей прячется.
 * Поведение повторено по оригиналу, включая ResizeObserver на обоих узлах.
 */
(function () {
  'use strict';
  var EDGE = 45;

  function fits(wrapper, viewport, overlay) {
    if (wrapper.offsetWidth > viewport.offsetWidth) {
      overlay.classList.add('t-table__viewport-overlying_visible');
    } else {
      overlay.classList.remove('t-table__viewport-overlying_visible');
    }
  }

  function atEnd(viewport) {
    return viewport.scrollLeft >= viewport.scrollWidth - viewport.clientWidth - EDGE;
  }

  function initOne(viewport) {
    if (viewport.dataset.initedTable === '1') return;
    var wrapper = viewport.querySelector('.t-table__wrapper');
    if (!wrapper) return;
    var overlay = viewport.querySelector('.t-table__viewport-overlying');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.classList.add('t-table__viewport-overlying');
      viewport.appendChild(overlay);
    }
    setTimeout(function () { fits(wrapper, viewport, overlay); }, 0);
    viewport.addEventListener('scroll', function () {
      if (atEnd(viewport)) overlay.classList.remove('t-table__viewport-overlying_visible');
      else overlay.classList.add('t-table__viewport-overlying_visible');
    });
    new ResizeObserver(function () { fits(wrapper, viewport, overlay); })
      .observe(viewport);
    new ResizeObserver(function () { fits(wrapper, viewport, overlay); })
      .observe(wrapper);
    viewport.dataset.initedTable = '1';
  }

  function initAll() {
    document.querySelectorAll('.t-table__viewport').forEach(initOne);
  }
  if (document.readyState !== 'loading') initAll();
  else document.addEventListener('DOMContentLoaded', initAll);
})();
