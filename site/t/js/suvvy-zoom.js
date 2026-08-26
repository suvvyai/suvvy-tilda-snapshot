/* suvvy-zoom.js — замена tilda-zoom-2.0.min.js (+ его CSS) на 30 SEO-страницах.
 *
 * В выгрузке зум используется так: картинки зеро-блоков с data-zoomable="yes"
 * и data-img-zoom-url (полноразмерный файл). Картинки ОДНОГО блока (.r)
 * Тильда группирует в зацикленную карусель — переносим: стрелки ‹ ›, свайп,
 * клавиши ←/→. Кнопку доп. лупы оригинала не переносим (щипок/браузерный зум
 * работает и так). Все зумируемые картинки выгрузки видимы только на мобильных
 * ширинах (res-320/640) — проверено, на 1440 они 0×0 и в эталоне.
 *
 * Клик — по делегированию на document: пересборка <body>, которую делает
 * Тильда, не снимает обработчик. Скролл-лок — через события popupShowed /
 * popupHidden на body: их слушает компенсатор скроллбара в suvvy-core.js.
 *
 * Фон лайтбокса белый с тёмными контролами: оригинал брал цвета из фона
 * <body>, а сайт светлый — тот же результат без вычислений.
 */
(function () {
  'use strict';

  var OVERLAY_ID = 'suvvy-zoomer';

  function injectStyles() {
    if (document.getElementById('suvvy-zoom-css')) return;
    var s = document.createElement('style');
    s.id = 'suvvy-zoom-css';
    s.textContent =
      '[data-zoomable="yes"], .t-zoomable { cursor: zoom-in; }' +
      '#' + OVERLAY_ID + ' { position: fixed; inset: 0; z-index: 9999999;' +
      '  background: #fff; display: flex; align-items: center; justify-content: center;' +
      '  cursor: zoom-out; opacity: 0; transition: opacity .2s ease; touch-action: pan-y; }' +
      '#' + OVERLAY_ID + '.is-open { opacity: 1; }' +
      '#' + OVERLAY_ID + ' img { max-width: 94vw; max-height: 92vh;' +
      '  width: auto; height: auto; display: block; }' +
      '#' + OVERLAY_ID + ' .suvvy-zoomer__close { position: absolute; top: 14px; right: 14px;' +
      '  width: 44px; height: 44px; padding: 0; border: 0; background: none; cursor: pointer;' +
      '  display: flex; align-items: center; justify-content: center; opacity: .75; z-index: 2; }' +
      '#' + OVERLAY_ID + ' .suvvy-zoomer__arrow { position: absolute; top: 50%;' +
      '  transform: translateY(-50%); width: 44px; height: 60px; padding: 0; border: 0;' +
      '  background: none; cursor: pointer; display: flex; align-items: center;' +
      '  justify-content: center; opacity: .65; z-index: 2; }' +
      '#' + OVERLAY_ID + ' .suvvy-zoomer__arrow--prev { left: 2px; }' +
      '#' + OVERLAY_ID + ' .suvvy-zoomer__arrow--next { right: 2px; }' +
      '#' + OVERLAY_ID + ' .suvvy-zoomer__close:hover,' +
      '#' + OVERLAY_ID + ' .suvvy-zoomer__arrow:hover { opacity: 1; }';
    document.head.appendChild(s);
  }

  function srcOf(el) {
    var u = el.getAttribute('data-img-zoom-url');
    if (u) return u;
    var img = el.querySelector('img');
    return img ? (img.currentSrc || img.src) : null;
  }

  function altOf(el) {
    var img = el.querySelector('img');
    return (img && img.alt) || '';
  }

  var prevOverflow = null;
  var gallery = [];   // [{src, alt}]
  var current = 0;

  function close() {
    var o = document.getElementById(OVERLAY_ID);
    if (!o) return;
    o.classList.remove('is-open');
    document.removeEventListener('keydown', onKey);
    document.body.style.overflow = prevOverflow || '';
    prevOverflow = null;
    window.setTimeout(function () {
      if (o.parentNode) o.parentNode.removeChild(o);
    }, 200);
    if (typeof t_triggerEvent === 'function') t_triggerEvent(document.body, 'popupHidden');
  }

  function show(i) {
    var o = document.getElementById(OVERLAY_ID);
    if (!o) return;
    current = ((i % gallery.length) + gallery.length) % gallery.length;
    var img = o.querySelector('img');
    img.src = gallery[current].src;
    img.alt = gallery[current].alt;
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft' && gallery.length > 1) show(current - 1);
    else if (e.key === 'ArrowRight' && gallery.length > 1) show(current + 1);
  }

  var CHEVRON = '<svg width="15" height="26" viewBox="0 0 15 26" fill="none" aria-hidden="true">' +
    '<path d="M13 2 L2 13 L13 24" stroke="#111" stroke-width="2.5" stroke-linecap="round"/></svg>';

  function open(items, startIndex) {
    if (document.getElementById(OVERLAY_ID)) return;
    gallery = items;
    current = startIndex;
    var many = items.length > 1;
    var o = document.createElement('div');
    o.id = OVERLAY_ID;
    o.setAttribute('role', 'dialog');
    o.setAttribute('aria-modal', 'true');
    o.innerHTML =
      '<img src="' + items[startIndex].src + '" alt="' + items[startIndex].alt + '">' +
      (many
        ? '<button type="button" class="suvvy-zoomer__arrow suvvy-zoomer__arrow--prev" data-step="-1" aria-label="Предыдущая">' + CHEVRON + '</button>' +
          '<button type="button" class="suvvy-zoomer__arrow suvvy-zoomer__arrow--next" data-step="1" aria-label="Следующая" style="transform:translateY(-50%) scaleX(-1)">' + CHEVRON + '</button>'
        : '') +
      '<button type="button" class="suvvy-zoomer__close" aria-label="Закрыть">' +
        '<svg width="23" height="23" viewBox="0 0 23 23" fill="none" aria-hidden="true">' +
          '<path d="M2 2 L21 21 M21 2 L2 21" stroke="#111" stroke-width="2"/>' +
        '</svg>' +
      '</button>';

    o.addEventListener('click', function (e) {
      var arrow = e.target.closest && e.target.closest('.suvvy-zoomer__arrow');
      if (arrow) { show(current + (+arrow.getAttribute('data-step'))); return; }
      close();
    });

    // Свайп по горизонтали листает, лёгкий тап закрывает (обрабатывается кликом).
    var touchX = null;
    o.addEventListener('touchstart', function (e) {
      touchX = e.touches[0].clientX;
    }, { passive: true });
    o.addEventListener('touchend', function (e) {
      if (touchX === null || !many) return;
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
    }, { passive: true });

    document.body.appendChild(o);
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (typeof t_triggerEvent === 'function') t_triggerEvent(document.body, 'popupShowed');
    document.addEventListener('keydown', onKey);
    // Класс после вставки — иначе transition не отработает.
    void o.offsetHeight;
    o.classList.add('is-open');
  }

  function zoomablesIn(root) {
    var list = root.querySelectorAll('[data-zoomable="yes"], .t-zoomable');
    return Array.prototype.filter.call(list, function (el) {
      return !el.classList.contains('t-slds__thumbs_gallery') && srcOf(el);
    });
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-zoomable="yes"], .t-zoomable');
    if (!el || el.classList.contains('t-slds__thumbs_gallery')) return;
    if (!srcOf(el)) return;
    e.preventDefault();
    // Как в оригинале: картинки одной записи (.r) образуют карусель.
    var rec = el.closest('.r') || document;
    var group = zoomablesIn(rec);
    if (group.indexOf(el) === -1) group = [el];
    open(group.map(function (g) { return { src: srcOf(g), alt: altOf(g) }; }),
      Math.max(0, group.indexOf(el)));
  });

  // Имя оригинальной точки входа сохраняем: вдруг его ждёт чей-то t_onFuncLoad.
  window.t_initZoom = injectStyles;
  t_onReady(injectStyles);
})();
