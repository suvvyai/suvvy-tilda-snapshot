/* suvvy-video.js — замена tilda-video-1.0.min.js (главная и /en).
 *
 * Реальное использование в выгрузке одно: блок t331 «видео в попапе»
 * (YouTube, mlt4NzQ5Hjg). Его инлайн-код зовёт t331_initPopup из поблочного
 * JS, а тот при открытии/закрытии попапа — t_video_lazyload__addVideo /
 * t_video_lazyload__removeVideo отсюда (через t_onFuncLoad, то есть ждёт
 * появления имён на window).
 *
 * Прочие плееры оригинала (vimeo/rutube/vk/kinescope/boomstream/html5) и
 * ленивая догрузка по вьюпорту в выгрузке не встречаются — не переносим.
 * Контракт атрибутов сохранён: data-videolazy-load 'false'→'true',
 * класс t-video__isload, id айфрейма youtubeiframe<blockid>.
 */
(function () {
  'use strict';

  function addVideo(el) {
    if (!el || el.classList.contains('t-video__isload')) return;
    if (el.getAttribute('data-videolazy-load') !== 'false') return;
    var type = el.getAttribute('data-videolazy-type');
    var id = (el.getAttribute('data-videolazy-id') || '').trim()
      .replace(/^v=/, '').replace(/[&?]+$/, '');
    if (type !== 'youtube' || !id) return;

    el.setAttribute('data-videolazy-load', 'true');
    var q = 'rel=0&fmt=18&html5=1&showinfo=0';
    if (el.getAttribute('data-videolazy-play')) q += '&autoplay=1';
    if (el.getAttribute('data-videolazy-mute')) q += '&mute=1';
    if (el.getAttribute('data-videolazy-nocontrols') === 'yes') q += '&controls=0';

    el.style.position = 'relative';
    el.style.height = '100%';
    el.insertAdjacentHTML('afterbegin',
      '<iframe id="youtubeiframe' + (el.getAttribute('data-blocklazy-id') || '') + '"' +
      ' src="https://www.youtube.com/embed/' + id + '?' + q + '"' +
      ' style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"' +
      ' allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>');
    el.classList.add('t-video__isload');
  }

  function removeVideo(el) {
    if (!el) return;
    var f = el.querySelector('iframe, video');
    if (f && f.parentNode) f.parentNode.removeChild(f);
    el.setAttribute('data-videolazy-load', 'false');
    el.classList.remove('t-video__isload');
  }

  window.t_video_lazyload__addVideo = addVideo;
  window.t_video_lazyload__removeVideo = removeVideo;
  // Точка входа оригинала: догрузка «не ленивых» блоков на старте.
  // На наших страницах все .t-video-lazyload помечены t-video-no-lazyload
  // (грузятся только по открытию попапа) — сканер оставлен для совместимости.
  window.t_video_lazyload_init = function () {
    var els = document.querySelectorAll('.t-video-lazyload:not(.t-video-no-lazyload)');
    Array.prototype.forEach.call(els, addVideo);
  };
})();
