/* suvvy-nolim.js — ваниллизация двух сторонних «нолим»-инлайнов Тильды.
 *
 * Это был ПОСЛЕДНИЙ потребитель jQuery на сайте (notes_blocks_js.md §3): сами
 * файлы Тильды jQuery не требуют, а вот эти два скрипта из T123-блоков лежали
 * в разметке top-level и валили страницу с «$ is not defined», если jquery снять.
 * Их два текста, повторённых на ~51 слаге, поэтому одна переписка закрывает всё.
 *
 *  1) NLM068 «второе меню» — мега-меню «Интеграторам» в шапке. Инлайн сам по
 *     себе разметки не несёт: он берёт ГОТОВЫЙ zero-блок с пунктами и делает из
 *     него выпадашку — вешает классы, прячет, позиционирует под шапкой,
 *     открывает по наведению/клику и закрывает, когда мышь ушла.
 *  2) ANNEXX-стайлер кнопок — дописывает в кнопки <img>-иконку и служебные
 *     классы (цвет/шрифт кнопок задаёт CSS блока по этим классам).
 *
 * Оба инлайна ПАРАМЕТРИЗОВАНЫ (id блоков, суффиксы классов, скорость, z-index,
 * набор селекторов кнопок), причём на разных страницах генератор Тильды выдал
 * слегка разные редакции текста. Поэтому код здесь один, а параметры build_pages.py
 * вынимает из каждого инлайна и печатает в инертный
 * <script type="application/json" class="suvvy-nolim-cfg">.
 *
 * ⚠️ Эталон поведения — НЕ выгрузка Тильды, а текущий порт: часть глобалов у нас
 * своя (t396_doResize живёт в suvvy-zero.js, у Тильды на подстраницах он падал),
 * поэтому на боевом снапшоте мега-меню живое на ВСЕХ слагах. Сверка — снимок
 * init/hover/click/away в tilda-port/nolim_check.mjs.
 */
(function () {
  'use strict';

  /* ─────────────────── мини-замены jQuery-хелперов ─────────────────── */

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  var all = function (sel) {
    // Пустая строка селектора: у jQuery $('') — пустой набор, а не ошибка.
    if (!sel) return [];
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  };

  // Ключ отмены анимации на элементе: второй fadeIn поверх незакончившегося
  // fadeOut должен отменить первый, иначе догоняющий колбэк вернёт display:none.
  var RUN = '__suvvyNolimAnim';

  function animate(el, ms, step, done) {
    var t0 = null;
    var token = (el[RUN] = {});
    function frame(ts) {
      if (el[RUN] !== token) return; // анимацию перебили
      if (t0 === null) t0 = ts;
      var p = ms > 0 ? Math.min(1, (ts - t0) / ms) : 1;
      step(p);
      if (p < 1) requestAnimationFrame(frame);
      else { el[RUN] = null; done(); }
    }
    requestAnimationFrame(frame);
  }

  /* jQuery .fadeOut(ms): гасит opacity до нуля, ставит display:none и ВОЗВРАЩАЕТ
   * прежнее значение opacity. Над уже скрытым элементом анимации нет вовсе. */
  function fadeOut(el, ms, cb) {
    if (!el) return;
    if (getComputedStyle(el).display === 'none') { if (cb) cb.call(el); return; }
    var from = parseFloat(getComputedStyle(el).opacity);
    if (isNaN(from)) from = 1;
    var restore = el.style.opacity;
    animate(el, ms, function (p) { el.style.opacity = String(from * (1 - p)); }, function () {
      el.style.display = 'none';
      el.style.opacity = restore;
      if (cb) cb.call(el);
    });
  }

  /* jQuery .fadeIn(ms): показывает элемент и разгоняет opacity с нуля до того
   * значения, которое у скрытого элемента уже прописано.
   * ⚠️ Важная деталь 1:1: show() СНИМАЕТ инлайновый display, а не пишет «block».
   * На страницах, где инлайн после fadeIn не дописывал display вручную, у блока
   * в итоге пустой style.display — от этого зависит тёмная подложка (её
   * наблюдатель смотрит именно на инлайновый display). */
  function fadeIn(el, ms, cb) {
    if (!el) return;
    var end = parseFloat(getComputedStyle(el).opacity);
    if (isNaN(end)) end = 1;
    el.style.display = '';
    if (getComputedStyle(el).display === 'none') el.style.display = 'block';
    el.style.opacity = '0';
    animate(el, ms, function (p) { el.style.opacity = String(end * p); }, function () {
      el.style.opacity = String(end);
      if (cb) cb.call(el);
    });
  }

  /* jQuery .slideUp(ms): схлопывает высоту и ставит display:none, возвращая
   * прежние height/overflow. Живёт на кликах по ссылкам внутри второго меню. */
  function slideUp(el, ms) {
    if (!el) return;
    if (getComputedStyle(el).display === 'none') return;
    var h = el.getBoundingClientRect().height;
    var restoreH = el.style.height, restoreO = el.style.overflow;
    el.style.overflow = 'hidden';
    animate(el, ms, function (p) { el.style.height = (h * (1 - p)) + 'px'; }, function () {
      el.style.display = 'none';
      el.style.height = restoreH;
      el.style.overflow = restoreO;
    });
  }

  /* ─────────────────────────── NLM068: мега-меню ─────────────────────────── */

  function initNolimMenu(cfg) {
    // Глобалы инлайна: их читают соседние нолимы (в т.ч. второй экземпляр на
    // странице), поэтому имена сохраняем.
    if (!window.nlm068obj) window.nlm068obj = { openSide: '' };
    if (!window.nlmFixedZeroBlocksObj068) {
      window.nlmFixedZeroBlocksObj068 = { top: '', bottom: '', list: [] };
    }

    var speed = cfg.speed;
    var darkSel = '.' + cfg.darkClass;
    var secondSel = '.' + cfg.secondClass;

    var background = document.querySelector(darkSel);
    if (background) background.style.display = 'none';

    // Стартовый <style> прячет второе меню до инициализации, чтобы оно не
    // мелькнуло развёрнутым. Дальше за скрытие отвечает класс nolimAutoScaleFix.
    var pre = document.querySelector('#' + cfg.styleTagId);
    if (pre) pre.remove();

    var opener = document.querySelector('.' + cfg.openClass);
    if (!opener) return;
    var block = opener.closest('.t-rec');
    if (!block) return;

    var blockWithMenu = document.querySelector(cfg.idBlockMenu + ' .t396__artboard');
    // ⚠️ Инлайн тут падал (getComputedStyle(null)), если блок шапки с этим id на
    // странице отсутствует — так на chat-bot-amocrm умирает первый из двух
    // экземпляров. Выходим в той же точке: наблюдаемый результат тот же,
    // только без записи в консоль.
    if (!blockWithMenu) return;

    var artboard = block.querySelector('.t396__artboard');
    var fixed = !block.classList.contains('nlm009fixmenu') && artboard &&
      artboard.getAttribute('data-artboard-pos') === 'fixed';
    if (fixed) {
      window.nlmFixedZeroBlocksObj068.list.push('#' + block.id);
      if (artboard.getAttribute('data-artboard-fixed-pos') === 'bottom') {
        window.nlmFixedZeroBlocksObj068.bottom = block.id;
      } else {
        window.nlmFixedZeroBlocksObj068.top = block.id;
      }
    } else if (artboard) {
      artboard.style.position =
        getComputedStyle(blockWithMenu).position === 'absolute' ? 'absolute' : 'relative';
      if (cfg.zIndex) artboard.style.zIndex = cfg.zIndex;
    }
    blockWithMenu.style.zIndex = String((Number(cfg.zIndex) || 0) + 1);

    // Разбор пунктов шапки: пункт с href="#recNNN" превращается в кнопку
    // выпадашки (href затирается на «#», реальный id уезжает в атрибут),
    // а сам блок #recNNN получает роль второго меню.
    var menus = [];
    var itemsWoRec = [];
    Array.prototype.forEach.call(document.querySelectorAll('.' + cfg.openClass), function (item) {
      var a = item.querySelector('[href]');
      var hr = a ? a.getAttribute('href') : null;
      if (hr && (hr.indexOf('#rec') === 0 || hr.indexOf('/#rec') === 0)) {
        if (hr.indexOf('/#rec') === 0) hr = hr.substring(1);
        var target = document.querySelector(hr);
        if (target) {
          target.classList.add(cfg.secondClass);
          target.style.zIndex = cfg.zIndex || '99999';
          if (cfg.opacityZero) target.style.opacity = '0';
          target.classList.add('nolim_forMenu');
          target.classList.add('nolimAutoScaleFix');
          a.setAttribute('nolim-data-menuid', hr);
          a.setAttribute('href', '#');
          menus.push(hr);
        } else {
          item.classList.remove(cfg.openClass);
        }
      } else if (hr) {
        itemsWoRec.push(item);
      }
    });

    var secondLevelId = Array.prototype.map.call(
      document.querySelectorAll('[nolim-data-menuid]'),
      function (el) { return el.getAttribute('nolim-data-menuid').replace('#', ''); }
    );

    var menu2 = menus.join(',');
    // Второе меню растягивается на всю ширину окна. Стиль лежит СНАРУЖИ body
    // (как и у инлайна) — иначе он попал бы под правила блока-контейнера.
    var st = document.createElement('style');
    st.textContent = menu2 + ' { width: 100%; }';
    document.body.parentNode.insertBefore(st, document.body.nextSibling);

    // Пункты появляются не сразу: zero-блок шапки собирает .tn-atom своим JS.
    var sI = setInterval(function () {
      if (!document.querySelector('.' + cfg.openClass + ' .tn-atom')) return;
      clearInterval(sI);
      start();
    }, 50);

    function start() {
      var anchors = Array.prototype.slice.call(
        document.querySelectorAll('.' + cfg.openClass + ' a[nolim-data-menuid]'));
      var headerRec = document.querySelector('.' + cfg.openClass + ' .tn-atom').closest('.t-rec');
      var idPos = headerRec ? getComputedStyle(headerRec).position : 'static';

      /* Позиционирование выпадашки: она встаёт вплотную под нижнюю границу
       * блока шапки. Для фиксированной шапки — position:fixed от низа блока,
       * для обычной — absolute с поправкой на прокрутку. */
      function checkHeight(target) {
        var rec = target.closest('.t-rec');
        if (!rec) return;
        var idH = rec.getBoundingClientRect().bottom;
        window.nlm068obj.openSide = 'top';
        all(menu2).forEach(function (m) {
          m.style.bottom = '';
          if (idPos === 'fixed') {
            m.style.position = 'fixed';
            m.style.top = idH + 'px';
          } else if (idPos === 'static' || idPos === 'absolute') {
            m.style.position = 'absolute';
            m.style.top = (window.pageYOffset + idH) + 'px';
          }
        });
      }

      /* Пересчёт зеро-блока: пока выпадашка скрыта, её артборд не знает своих
       * размеров, поэтому перед показом блок на миг делают видимым и просят
       * движок пересчитаться. */
      function forAutoscaleMode(blockId, blockEl) {
        if (typeof window.t_slds_updateSlider !== 'undefined') window.t_slds_updateSlider(blockId);
        if (blockEl && blockEl.querySelector('.t396')) window.t396_doResize(blockId);
        if (blockEl) blockEl.dispatchEvent(new CustomEvent('displayChanged', { bubbles: true, cancelable: true }));
        if (window.lazy === 'y') window.t_lazyload_update();
      }

      function firstBlocksCall() {
        anchors.forEach(function (a) {
          var id = a.getAttribute('nolim-data-menuid');
          var x = document.querySelector(id);
          if (!x) return;
          x.style.overflow = 'visible';
          x.style.display = 'block';
          forAutoscaleMode(id.replace('#rec', ''), x);
          x.style.overflow = 'visible';
          x.style.display = 'none';
          x.style.opacity = '1';
        });
      }

      function resizeFunction() {
        anchors.forEach(function (a) {
          var id = a.getAttribute('nolim-data-menuid');
          var x = document.querySelector(id);
          if (!x) return;
          if (!cfg.resizeGuard640 || window.innerWidth > 640) forAutoscaleMode(id.replace('#rec', ''), x);
        });
        if (background) background.style.display = 'none';
      }

      function hideOthers(exceptId) {
        Array.prototype.forEach.call(document.querySelectorAll(secondSel), function (b) {
          if (b.id !== exceptId.slice(1)) b.style.display = 'none';
        });
      }

      function openMenu(id, target, viaClick) {
        all(menu2).forEach(function (m) { m.classList.remove('nolimAutoScaleFix'); });
        all(menu2).forEach(function (m) { fadeOut(m, speed); });
        if (viaClick) firstBlocksCall();
        checkHeight(target);
        var el = document.querySelector(id);
        if (!el) return;
        if (!viaClick) el.style.overflow = 'visible';
        fadeIn(el, speed, function () {
          el.style.overflow = 'visible';
          if (viaClick) el.style.display = 'block';
        });
        // На наведении часть редакций инлайна дописывала display:block сразу
        // после fadeIn (не в колбэке) — от этого зависит тёмная подложка.
        if (!viaClick && cfg.hoverDisplayBlock) el.style.display = 'block';
        hideOthers(id);
      }

      setTimeout(function () {
        firstBlocksCall();

        // Тёмная подложка под открытым меню: следим за инлайновым display
        // блоков второго уровня — ровно так это делал инлайн.
        var watched = all(cfg.idBlocksFromSecondMenu);
        if (background && watched.length) {
          var obs = new MutationObserver(function (list) {
            list.forEach(function (m) {
              if (m.type !== 'attributes' || m.attributeName !== 'style') return;
              var d = m.target.style.display;
              background.style.display = (d === 'none' || !d) ? 'none' : 'block';
            });
          });
          watched.forEach(function (el) {
            obs.observe(el, { attributes: true, attributeFilter: ['style'] });
          });
        }

        if (cfg.scrollHide) {
          window.addEventListener('scroll', function () {
            all(menu2).forEach(function (m) { fadeOut(m, speed); });
          });
        }

        anchors.forEach(function (a) {
          a.addEventListener('click', function (e) {
            e.preventDefault();
            if (cfg.clickResize) window.dispatchEvent(new Event('resize'));
            all(menu2).forEach(function (m) { m.classList.remove('nolimAutoScaleFix'); });
            var id = a.getAttribute('nolim-data-menuid');
            var el = document.querySelector(id);
            if (!el) return;
            if (getComputedStyle(el).display === 'none') {
              openMenu(id, e.target, true);
            } else {
              fadeOut(el, speed, function () { el.style.overflow = 'hidden'; });
            }
          });
        });

        if (background) {
          background.addEventListener('click', function (e) {
            e.preventDefault();
            Array.prototype.forEach.call(document.querySelectorAll(secondSel), function (b) {
              b.style.display = 'none';
            });
          });
        }
      }, cfg.readyDelay);

      // Наведение открывает меню только на широких экранах: на планшете и уже
      // остаётся клик (инлайн проверял ровно clientWidth > 1200).
      anchors.forEach(function (a) {
        a.addEventListener('mouseover', function (e) {
          e.preventDefault();
          if (document.documentElement.clientWidth <= 1200) return;
          var id = a.getAttribute('nolim-data-menuid');
          var el = document.querySelector(id);
          if (!el) return;
          if (getComputedStyle(el).display === 'none') openMenu(id, e.target, false);
        });
      });

      // Пункты без выпадашки: наведение на них гасит открытое меню.
      itemsWoRec.forEach(function (item) {
        item.addEventListener('mouseover', function (e) {
          e.preventDefault();
          all(menu2).forEach(function (m) { slideUp(m, speed); });
          window.nlm068obj.openSide = '';
        });
      });

      // Клик по внутренней ссылке-якорю самого меню — меню сворачивается.
      window.addEventListener('click', function (e) {
        var r = e.target.closest ? e.target.closest('.r') : null;
        if (r && secondLevelId.indexOf(r.getAttribute('id')) > -1 &&
            e.target.hasAttribute('href') && e.target.getAttribute('href').indexOf('#') === 0) {
          all(menu2).forEach(function (m) { slideUp(m, speed); });
          window.nlm068obj.openSide = '';
        }
      });

      window.addEventListener('resize', resizeFunction);

      /* Закрытие «мышь ушла»: пока меню открыто, на документе висит closeMenu,
       * который закрывает выпадашку, как только курсор оказался вне неё и вне
       * шапки. Часть редакций инлайна взводит closeMenu не сразу, а только
       * после того, как курсор побывал НАД меню (cfg.hoverArm) — на таких
       * страницах меню не закрывается, если увести мышь мимо него. */
      function isSecondMenuOnHover(e) {
        if (cfg.hoverArm && !inside(menu2, e.target)) return;
        document.removeEventListener('pointermove', isSecondMenuOnHover);
        document.removeEventListener('mousemove', isSecondMenuOnHover);
        document.removeEventListener('pointermove', closeMenu);
        document.removeEventListener('mousemove', closeMenu);
        document.addEventListener('pointermove', closeMenu);
        document.addEventListener('mousemove', closeMenu);
      }
      function inside(sel, node) {
        return all(sel).some(function (m) { return m === node || m.contains(node); });
      }
      function closeMenu(e) {
        var outside = !inside(menu2, e.target) &&
          !(headerRec && headerRec.contains(e.target));
        if (outside || document.querySelector('.' + cfg.closeClass + ':hover')) {
          all(menu2).forEach(function (m) { fadeOut(m, speed); });
          window.nlm068obj.openSide = '';
          document.removeEventListener('pointermove', closeMenu);
          document.removeEventListener('mousemove', closeMenu);
          document.addEventListener('pointermove', isSecondMenuOnHover);
          document.addEventListener('mousemove', isSecondMenuOnHover);
        }
      }

      // Кнопки шапки, помеченные «закрой меню при наведении».
      Array.prototype.forEach.call(document.querySelectorAll('.' + cfg.hideBtnClass), function (btn) {
        btn.addEventListener('mouseover', function () {
          if (cfg.hideBtnHard) {
            Array.prototype.forEach.call(document.querySelectorAll(secondSel), function (b) {
              b.style.display = 'none';
            });
            return;
          }
          all(menu2).forEach(function (m) { fadeOut(m, speed); });
          window.nlm068obj.openSide = '';
          if (cfg.hideBtnHardDelay) {
            setTimeout(function () {
              Array.prototype.forEach.call(document.querySelectorAll(secondSel), function (b) {
                b.style.display = 'none';
              });
            }, cfg.hideBtnHardDelay);
          }
        });
      });

      document.addEventListener('pointerup', closeMenu);
      document.addEventListener('mouseup', closeMenu);
      document.addEventListener('pointermove', isSecondMenuOnHover);
      document.addEventListener('mousemove', isSecondMenuOnHover);

      /* Не переносим (мертво на сайте, проверено грепом и рантаймом):
       *  — выравнивание высот t650/t959: этих блоков нет, инлайн просто
       *    крутил два интервала по 50мс и гасил их через 2 секунды;
       *  — pointer-events по .t396__artboard-fixed-*: фиксированных артбордов
       *    в выгрузке нет (data-artboard-pos="fixed" — ноль совпадений);
       *  — .nolimSearch / .menuNolimClose068: элементов с такими классами нет. */
    }

    /* Наблюдатель «есть ли хоть одно открытое меню» — второй, независимый от
     * того, что внутри start(): он гасит подложку, когда меню закрыли. */
    var nodes = Array.prototype.slice.call(document.querySelectorAll(secondSel));
    if (nodes.length) {
      var cb = function () {
        var bg = document.querySelector(darkSel);
        if (!bg) return;
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i].style.display !== 'none' && nodes[i].style.display) {
            bg.style.display = 'block';
            bg.classList.remove('nolimAutoScaleFix');
            return;
          }
        }
        bg.style.display = 'none';
      };
      nodes.forEach(function (n) {
        new MutationObserver(cb).observe(n, {
          attributes: true, attributeOldValue: true, attributeFilter: ['style'],
        });
      });
    }
  }

  /* ─────────────────── ANNEXX: иконки и классы кнопок ─────────────────── */

  function initAnnexxButtons(cfg) {
    var newClass = cfg.newClass;

    /* Проверка «эта кнопка уже обработана»: инлайн считал кнопку готовой,
     * только если на ней есть и класс, и картинка — иначе перерисовывал. */
    function done(el) {
      var marked = el.classList.contains(newClass) ||
        el.querySelector('.annexx-modified-button-icon') ||
        el.querySelector('.' + newClass);
      return !!marked && !!el.querySelector('img');
    }

    function decorate() {
      Array.prototype.forEach.call(document.querySelectorAll(cfg.selector), function (el) {
        if (done(el)) return;
        var target = el.querySelector('.tn-atom') || el;
        target.classList.add(newClass);
        target.classList.add('annexx-modified-button-icon');
        var text = target.textContent;
        var spans = target.querySelectorAll('span');
        if (!spans.length) {
          // Кнопка формы: подписи-обёртки нет, собираем её целиком по шаблону.
          target.innerHTML = cfg.tplWhole.replace('${text}', text);
        } else {
          /* ⚠️ 1:1 с инлайном: иконка уезжает во ВСЕ span'ы кнопки, включая
           * .tn-atom__button-border (рамку) — там она наложилась бы на текст.
           * Гасит её правило `.tn-atom__button-border img{display:none}` в
           * onest.css; переносим поведение, а не «как задумывалось». */
          Array.prototype.forEach.call(spans, function (sp) {
            sp.classList.add(cfg.iconClass);
            sp.insertAdjacentHTML('afterbegin', cfg.tplIcon);
          });
        }
        if (cfg.imgHover) {
          target.addEventListener('mouseover', function () {
            Array.prototype.forEach.call(target.querySelectorAll('img'), function (i) {
              i.setAttribute('src', cfg.imgHover);
            });
          });
          target.addEventListener('mouseout', function () {
            Array.prototype.forEach.call(target.querySelectorAll('img'), function (i) {
              i.setAttribute('src', cfg.img);
            });
          });
        }
      });
    }

    // window.isMobile ставит suvvy-core.js; до него ширину мерить нечем.
    var wait = setInterval(function () {
      if (typeof window.isMobile === 'undefined') return;
      clearInterval(wait);
      var w = window.isMobile ? window.outerWidth : window.innerWidth;
      var fits = cfg.adaptive.some(function (r) { return r[0] <= w && w <= r[1]; });
      if (!fits) return;

      decorate();
      ready(function () {
        decorate();
        /* Кнопки форм появляются позже разметки блока: ждём, пока селектор
         * начнёт попадать внутрь <form>, и красим ещё раз. */
        if (/button\.t-submit/.test(cfg.selector) || /t400__submit/i.test(cfg.selector)) {
          var f = setInterval(function () {
            var hit = Array.prototype.some.call(document.querySelectorAll(cfg.selector), function (el) {
              return el.closest('form') || el.closest('.t400');
            });
            if (!hit) return;
            clearInterval(f);
            setTimeout(decorate, 1000);
          }, 500);
          setTimeout(function () { clearInterval(f); }, 30000);
        }
      });

      /* Не переносим (мертво): подмена t657_init (блоков .t657 на сайте нет,
       * и самой функции в suvvy-blocks.js тоже) и наблюдатели за каталогом
       * .t-store — магазина в выгрузке нет. */
    }, 500);
  }

  /* ───────────────────────────── запуск ───────────────────────────── */

  ready(function () {
    Array.prototype.forEach.call(
      document.querySelectorAll('script.suvvy-nolim-cfg'), function (tag) {
        var cfg;
        try { cfg = JSON.parse(tag.textContent); } catch (e) { return; }
        if (cfg.kind === 'nlm068') initNolimMenu(cfg);
        else if (cfg.kind === 'annexx') initAnnexxButtons(cfg);
      });
  });
})();
