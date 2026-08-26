/* suvvy-zero-forms.js — довесок к пререндеру zero-форм (волна форм).
 *
 * ЗАЧЕМ. tilda-zero-forms-1.0.min.js (72 КБ) строил DOM всех четырёх zero-форм
 * из JSON в рантайме и перестраивал его на каждом ресайзе, а зависимости —
 * tilda-range-1.0.min.js, tilda-calc-1.0.min.js, tilda-phone-mask-1.1.min.js,
 * tilda-zero-form-errorbox.min.css — тянул прямо со static.tildacdn.com
 * (notes_forms §1.5). Разметку теперь печатает build_pages.py на сборке
 * (prerender_zero_forms), CSS лежит локально, а здесь остаётся только то,
 * что действительно живое:
 *
 *   1) ползунок-калькулятор на главной: движение ручки → подпись значения,
 *      градиент дорожки (замена t_input_range_init из tilda-range);
 *   2) формула a*16 → «N руб.» и скрытое поле Formula (замена tcalc__init
 *      из tilda-calc; разбор выражения — тот же, слева направо, без приоритета
 *      операций, чтобы результат совпадал с тильдовским);
 *   3) маска телефона: вызвать t_form_phonemask_load на полях zero-форм —
 *      раньше это делал сам движок через t_zeroForms__onRender;
 *   4) «поднятая» подпись поля (.t-input_has-content) — её вешал
 *      t_zeroForms__animateInputs; в разметке подпись уже есть, здесь только
 *      слушатели blur и проверка на загрузке.
 *
 * Ничего не грузится с CDN. Файл подключается только страницам с zero-формами
 * (JS_ADD_IF в build_pages.py).
 */
(function () {
  'use strict';

  var TRACK_BG = '#f4f4f4';     /* цвет незалитой части дорожки — как у Тильды */
  var THUMB = 21;               /* ширина ручки: сдвиг подписи считается по ней */

  function forms() {
    return document.querySelectorAll('[data-suvvy-form="prerendered"]');
  }

  function recIdOf(el) {
    var rec = el.closest('.t-rec');
    return rec ? rec.id.replace('rec', '') : '';
  }

  /* ---------- 1. Ползунок ---------- */

  function initRange(group, recId) {
    var input = group.querySelector('.t-range');
    if (!input) return;
    var lid = group.getAttribute('data-input-lid');

    /* Тильда нормализовала границы: «10000+» в подписи остаётся, а в атрибут
     * max уходит число. Без этого браузер молча берёт max=100. */
    var max = parseFloat((input.getAttribute('max') || '').replace(/\s/g, ''));
    var min = parseFloat((input.getAttribute('min') || '').replace(/\s/g, ''));
    if (isNaN(max)) max = 100;
    if (isNaN(min)) min = 0;
    input.setAttribute('max', max);
    input.setAttribute('min', min);
    /* Стартовое значение у Тильды ставилось свойством (a.value = li_value), то
     * есть атрибута value в разметке нет. Без явной установки браузер берёт
     * середину диапазона — на главной ползунок стоял бы не на нуле. */
    var def = group.getAttribute('data-default-value');
    input.value = (def === null || def === '') ? min : def;

    var style = group.querySelector('style.range-' + recId + '-' + lid);
    if (!style) {
      style = document.createElement('style');
      style.className = 'range-' + recId + '-' + lid;
      group.appendChild(style);
    }

    function update() {
      var width = input.offsetWidth;
      if (!width) return;               /* форма скрыта — пересчитаем позже */
      var valueBox = group.querySelector('.t-range__value-txt');
      var color = input.getAttribute('data-range-color') || '#000';
      var span = max - min || 1;
      var k = (input.value - min) / span;
      var left = Math.floor(k * (width - THUMB) + 10.5);
      var pct = 100 * k;
      var gradient = 'linear-gradient(to right, ' + color + ' 0%, ' + color + ' ' + pct +
        '%, ' + TRACK_BG + ' ' + pct + '%, ' + TRACK_BG + ' 100%)';
      var sel = '#rec' + recId + ' [data-input-lid="' + lid + '"] .t-range';
      style.innerHTML =
        sel + '::-webkit-slider-runnable-track{\nbackground:' + gradient + ';\n}\n' +
        sel + '::-moz-range-track{\nbackground:' + gradient + ';\n}\n' +
        sel + '::-ms-fill-upper{\nbackground:' + TRACK_BG + ';\n}\n' +
        sel + '::-ms-fill-lower{\nbackground:' + color + ';\n}';
      if (valueBox) {
        valueBox.textContent = input.value;
        valueBox.style.cssText = 'left:' + left + 'px; display: block;';
      }
    }

    ['input', 'change', 'popupOpened', 'displayChanged'].forEach(function (ev) {
      input.addEventListener(ev, function () { setTimeout(update); });
    });
    window.addEventListener('resize', function () { setTimeout(update, 300); });
    update();
    group.dispatchEvent(new CustomEvent('inputReady'));
    group.setAttribute('data-input-ready', 'true');
  }

  /* ---------- 2. Формула ---------- */

  /* Разбор как у tilda-calc: выражение режется на операнды и операторы подряд,
   * считается СЛЕВА НАПРАВО без приоритета умножения. Скобок в наших формулах
   * нет, но правило сохраняем, чтобы цифра совпадала с боевой. */
  function parseExpr(expr) {
    var src = (expr || '').replace(/\s/g, '').replace(/,/g, '.');
    var operands = [''];
    var operators = [];
    var fresh = true;
    for (var i = 0; i < src.length; i++) {
      var c = src.charAt(i);
      if (c === '(' || c === ')') continue;
      if ('+-*/'.indexOf(c) !== -1 && !fresh) {
        operators.push(c);
        operands.push('');
        fresh = true;
      } else {
        operands[operands.length - 1] += c;
        fresh = false;
      }
    }
    return { operands: operands, operators: operators };
  }

  function operandValue(form, str) {
    if (str !== '' && !isNaN(str)) return parseFloat(str);
    var field = form.querySelector('[name="' + str + '"]');
    if (!field) return NaN;
    var raw = (field.value || '').toString().replace(/\s/g, '').replace(/,/g, '.');
    var num = parseFloat(raw);
    return isNaN(num) ? 0 : num;
  }

  function initCalc(group, form) {
    var out = group.querySelector('.t-calc');
    var hidden = group.querySelector('.t-calc__hiddeninput');
    if (!out || !hidden) return;
    var parsed = parseExpr(out.getAttribute('data-calc-expr'));

    function recalc() {
      var acc = operandValue(form, parsed.operands[0]);
      for (var i = 0; i < parsed.operators.length; i++) {
        var v = operandValue(form, parsed.operands[i + 1]);
        switch (parsed.operators[i]) {
          case '+': acc += v; break;
          case '-': acc -= v; break;
          case '*': acc *= v; break;
          case '/': acc = v ? acc / v : NaN; break;
        }
      }
      if (isNaN(acc)) acc = 0;
      /* Хвост с плавающей точкой (0.1*3) режем, как это делает Тильда. */
      acc = Math.round(acc * 100) / 100;
      out.innerHTML = acc;
      hidden.value = acc;
    }

    Array.prototype.forEach.call(form.querySelectorAll('.t-input, .t-range'), function (f) {
      ['input', 'change'].forEach(function (ev) { f.addEventListener(ev, recalc); });
    });
    group.addEventListener('recalculate', recalc);
    recalc();
    group.setAttribute('data-init-calc', 'y');
    group.setAttribute('data-input-ready', 'true');
  }

  /* ---------- 3. Маска телефона ---------- */

  function initMasks(elem, recId) {
    var inputs = elem.querySelectorAll('.js-phonemask-input[data-phonemask-init="no"]');
    if (!inputs.length) return;
    t_onFuncLoad('t_form_phonemask_load', function () {
      Array.prototype.forEach.call(inputs, function (input) {
        try { t_form_phonemask_load(input); } catch (e) { console.log(e); }
      });
    });
  }

  /* ---------- 4. Подпись поля, поднятая над заполненным полем ---------- */

  function initFloatingLabels(elem) {
    var inputs = elem.querySelectorAll('.t-input_pvis');
    Array.prototype.forEach.call(inputs, function (input) {
      input.addEventListener('blur', function () {
        if (input.value) input.classList.add('t-input_has-content');
        else input.classList.remove('t-input_has-content');
      });
      if (input.value) input.classList.add('t-input_has-content');
    });
  }

  /* ---------- сборка ---------- */

  function init() {
    Array.prototype.forEach.call(forms(), function (elem) {
      var recId = recIdOf(elem);
      var form = elem.querySelector('form.t-form');
      if (!form) return;
      Array.prototype.forEach.call(elem.querySelectorAll('.t-input-group_rg'), function (g) {
        initRange(g, recId);
      });
      Array.prototype.forEach.call(elem.querySelectorAll('.t-input-group_fr'), function (g) {
        initCalc(g, form);
      });
      initMasks(elem, recId);
      initFloatingLabels(elem);
      /* Тот же сигнал, что слал zero-forms: на него подписан tilda-forms
       * (мост «форма построена»), а после волны — suvvy-forms.js. */
      elem.dispatchEvent(new CustomEvent('render', { bubbles: true }));
    });
  }

  if (typeof t_onReady === 'function') t_onReady(init);
  else document.addEventListener('DOMContentLoaded', init);
})();
