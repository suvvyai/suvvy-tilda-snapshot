/* Наша замена lazyload-1.3.min.export.js (чистка кода Тильды, шаг 2).
 *
 * Что делала библиотека и что обязана делать замена:
 *  1. Элементам с data-original близко к экрану ПО ВЕРТИКАЛИ подставить картинку:
 *     <img> — в src, остальным (фоны .t-bgimg и т.п.) — в background-image.
 *     Подставляется data-original как есть: сверено с эталоном, подбора
 *     resize-вариантов финальный своп не делает.
 *  2. Глобальная t_lazyload_update() — инлайн-код блоков зовёт её при
 *     переключении табов/панелей (89 вызовов по сайту).
 *
 * Почему НЕ IntersectionObserver: IO учитывает обрезку предков, а карточки
 * горизонтальных лент лежат в overflow:hidden — за краем ленты пересечение
 * пустое, и IO не срабатывает никогда. Библиотека Тильды меряла прямоугольник
 * руками и только по вертикали — повторяем её семантику, иначе часть фонов
 * в лентах остаётся на заглушках (ловилось сверкой с эталоном на главной).
 *
 * Родные loading="lazy"/decoding="async" на <img> уже стоят (build_pages.py),
 * но грузят они стартовый src — заглушку 20px. Полную версию подставляем мы.
 */
(function () {
  'use strict';

  var MARGIN = 800; // запас по обеим осям — калиброван по эталону (см. ниже)
  var pending = [];

  function show(el) {
    var full = el.getAttribute('data-original');
    if (!full) return;
    if (el.tagName === 'IMG') {
      // Мы сами решили, что пора грузить, — родной loading="lazy" снимаем.
      // Иначе взаимоблокировка у hug-картинок: их бокс 0×N до загрузки,
      // а нативная ленивость бокс нулевой площади не грузит никогда
      // (ловилось на /en/: 8 SVG с высотой 0; src=data-original, так что
      // одна установка src загрузку не перезапускала).
      el.loading = 'eager';
      el.src = full;
    } else {
      el.style.backgroundImage = 'url(\'' + full + '\')';
    }
  }

  function nearViewport(el) {
    var r = el.getBoundingClientRect();
    // Скрытый элемент (display:none) отдаёт нулевой прямоугольник в точке 0:0.
    // Эталон такие НЕ грузит, пока их не покажут (сверено: без этой проверки порт
    // грузил скрытые панели табов заранее). Останется в pending до открытия —
    // блок при показе зовёт t_lazyload_update, и картинка подхватится.
    if (!r.width && !r.height) return false;
    // Обе оси с одинаковым запасом: карточки горизонтальных лент чуть за краем
    // (x до ~2200 при окне 1440) эталон грузил, а панели, припаркованные на
    // x ≈ −33 млн, — нет. Проверка руками, без IntersectionObserver: IO учитывает
    // обрезку overflow:hidden и для лент не срабатывает вовсе.
    return r.bottom > -MARGIN && r.top < window.innerHeight + MARGIN &&
           r.right > -MARGIN && r.left < window.innerWidth + MARGIN;
  }

  function sweep() {
    if (!pending.length) return;
    var rest = [];
    for (var i = 0; i < pending.length; i++) {
      if (nearViewport(pending[i])) show(pending[i]);
      else rest.push(pending[i]);
    }
    pending = rest;
  }

  function update() {
    var els = document.querySelectorAll('[data-original]');
    for (var i = 0; i < els.length; i++) {
      if (!els[i].dataset.shwLazySeen) {
        els[i].dataset.shwLazySeen = 'y';
        pending.push(els[i]);
      }
    }
    sweep();
  }

  // Тот самый глобальный хук, который зовут блоки Тильды.
  window.t_lazyload_update = update;

  var throttled = false;
  function onScroll() {
    if (throttled || !pending.length) return;
    throttled = true;
    setTimeout(function () { throttled = false; sweep(); }, 150);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  if (document.readyState !== 'loading') update();
  else document.addEventListener('DOMContentLoaded', update);
  // Тильда пересобирает <body> после загрузки — подхватываем новые элементы.
  window.addEventListener('load', update);
})();
