/* suvvy-phonemask.js — замена tilda-phone-mask-1.1.min.js (волна форм).
 *
 * ЗАЧЕМ УПРОЩАЛИ. В оригинале 39 КБ, из них ~400 строк — таблица 205 стран,
 * выпадающий селектор с поиском по названию и коду, спрайт флагов с
 * static.tildacdn.com и запрос страны в geo.tildaapi.com. На suvvy.ai маска
 * стоит на 8 классических полях + 3 полях zero-форм, и лишь у двух полей
 * задан data-phonemask-maskcountry="RU". У остальных страну определял geo-API,
 * а при его ошибке — data-tilda-project-country, который у нас на всех
 * страницах RU. То есть де-факто маска везде +7 — только ценой похода в Тильду.
 *
 * ЧТО СТАЛО. Ходов в Тильду нет вообще (ни geo, ни CDN, ни спрайта флагов),
 * страна не выбирается руками. Два режима:
 *   1) RU-маска +7 (ххх) ххх-хх-хх — везде, кроме /en/;
 *   2) свободный ввод «+<код><номер>» — на /en/ и если maskcountry задан,
 *      но не RU. Поле не перестраивается, чистятся только буквы и мусор,
 *      валидность («+» и 10–15 цифр) проверяет suvvy-forms.js по
 *      data-tilda-rule="phone".
 * Так иностранный лид с /en/ не упирается в чужую маску, а 6 RU-полей без
 * maskcountry получают ту же маску, что и сегодня в проде.
 *
 * Публичное имя, которое зовут снаружи (сохранено дословно):
 *   t_form_phonemask_load(inputOrList) — из 8 инлайнов фрагментов через
 *   t_onFuncLoad, после t_loadJsFile. Рядом оставлен t_form_phonemask_load_one(recId).
 * Разметка, которую мы строим вокруг поля, тоже дословная
 * (.t-input-phonemask__wrap / __select / __select-code / .t-input-phonemask /
 * .js-phonemask-result / .js-phonemask-result-iso, атрибут data-init-mask
 * на группе) — на неё завязаны инлайновый t_animateInputs в фрагментах,
 * CSS Тильды (.js-error-control-box .t-input:not(.t-input-phonemask)) и
 * очистка полей в suvvy-forms.js.
 *
 * Выброшено: таблица 205 стран, __chooseCountry/__searchCountry/__scrollToCountry/
 * __getDrawSelector/__initSelectEvents (селектор страны), флаги-спрайт,
 * __saveISOtoLocalStorage, __phoneToISO, geo-запрос, режим multiple
 * (в разметке ни одного .t-phonemask-input-group).
 *
 * Зависимостей нет, кроме глобалов suvvy-core.js. jQuery не нужен.
 */
(function () {
  'use strict';

  /* Единственная страна в таблице: n/c/m — как в оригинале (название, код, шаблон). */
  var RU = { n: 'Russian Federation (Российская Федерация)', c: '+7', m: '+7(000) 000-00-00' };

  /* Свободный ввод: /en, /en/, /en/contact, /tilda/en — англоязычная ветка сайта. */
  function isEnPage() {
    return /(^|\/)en(\/|$)/.test(location.pathname);
  }

  /* Стили маски в CSS сайта отсутствуют: оригинал вставлял их из JS
   * (<style id="phone-mask-style">). Берём тот же набор без правил селектора
   * стран и без флагов — фон флагов тянулся со static.tildacdn.com. */
  function addStyle() {
    if (document.getElementById('phone-mask-style')) return;
    var style = document.createElement('style');
    style.id = 'phone-mask-style';
    style.textContent =
      '.t-input-group.js-error-control-box .t-input-phonemask{border:0!important}' +
      '.t-input_pvis.t-input-phonemask__wrap{padding-top:0;padding-bottom:0}' +
      '.t-input-phonemask__wrap{position:relative;display:flex}' +
      '.t-input .t-input-phonemask,.t-input-phonemask{height:auto;padding:0;background-color:transparent}' +
      '.t-input-phonemask__select{display:flex;align-items:center;flex-shrink:0;' +
      'margin-right:5px;margin-left:0;font-size:16px}' +
      '.t-input-phonemask__select-code{white-space:nowrap}';
    document.head.appendChild(style);
  }

  /* ---------- Публичный вход ---------- */

  /* Инлайны фрагментов передают сюда NodeList из одного элемента —
   * оригинал брал первый, поведение сохраняем. */
  function t_form_phonemask_load(target) {
    var input = target instanceof Element ? target : (target && target[0]);
    if (!input || typeof input.getAttribute !== 'function') return;
    if (input.getAttribute('data-phonemask-init') === 'yes') return;
    input.setAttribute('data-phonemask-init', 'yes');
    t_form_phonemask_init(
      input.getAttribute('data-phonemask-id'),
      input.getAttribute('data-phonemask-lid'),
      input.getAttribute('data-phonemask-maskcountry') || '',
      input
    );
  }

  function t_form_phonemask_load_one(recId) {
    var inputs = document.querySelectorAll('#rec' + recId + ' .js-phonemask-input');
    Array.prototype.forEach.call(inputs, t_form_phonemask_load);
  }

  function t_form_phonemask_init(recId, lid, maskCountry, knownInput) {
    var group = getInputGroup(recId, lid, knownInput);
    if (!group || group.getAttribute('data-init-mask') === 'yes') return;

    var country = (maskCountry || '').toLowerCase();
    var free = isEnPage() || (country && country !== 'ru');

    addStyle();
    if (free) initFreeInput(group, lid);
    else initRuMask(group, lid);

    /* Те же события и флаги, что ставил оригинал: их ждут .t-input-group_ph
     * в инлайновом t_animateInputs и наш валидатор. */
    group.dispatchEvent(new CustomEvent('phoneMaskReady'));
    group.dispatchEvent(new CustomEvent('inputReady'));
    group.setAttribute('data-init-mask', 'yes');
    group.setAttribute('data-input-ready', 'true');
  }

  function getInputGroup(recId, lid, knownInput) {
    var rec = recId ? document.querySelector('#rec' + recId) : null;
    var group = rec && lid ? rec.querySelector('[data-input-lid="' + lid + '"]') : null;
    if (group) return group;
    /* zero-формы и любая разметка без data-input-lid: берём блок вокруг поля. */
    if (knownInput) return knownInput.closest('.t-input-group') || knownInput.parentElement;
    return null;
  }

  /* ---------- Режим 1: RU-маска +7 (ххх) ххх-хх-хх ---------- */

  function initRuMask(group, lid) {
    replaceInput(group);
    var input = group.querySelector('.t-input-phonemask');
    if (!input) return;

    var code = RU.c;                                   /* +7 */
    var body = RU.m.substr(code.length).replace(/^-+/, ''); /* (000) 000-00-00 */

    if (lid) input.setAttribute('id', 'input_' + lid);
    input.setAttribute('data-phonemask-iso', 'ru');
    input.setAttribute('data-phonemask-code', code);
    input.setAttribute('data-phonemask-mask', RU.m);
    input.setAttribute('data-phonemask-without-code', body);
    input.setAttribute('maxlength', body.length);
    input.setAttribute('placeholder', body);

    var codeBox = group.querySelector('.t-input-phonemask__select-code');
    if (codeBox) codeBox.innerHTML = code;

    /* minlength на скрытом поле — так недобитый номер валится правилом
     * minlength в suvvy-forms.js, ровно как у Тильды. */
    var result = group.querySelector('.js-phonemask-result');
    if (result) result.setAttribute('data-tilda-rule-minlength', code.length + 1 + body.length);

    copyStyles(group);
    bindMaskEvents(group, input);
    changeVal(group, input);
  }

  /* Перестройка поля в пару «код + номер»: снаружи форма по-прежнему видит
   * одно поле с родным именем (скрытый .js-phonemask-result), видимый input
   * зовётся tildaspec-phone-part[] и в приёмник не уходит. */
  function replaceInput(group) {
    var input = group.querySelector('.js-phonemask-input');
    if (!input) return;
    var name = input.getAttribute('name') || '';
    var req = input.getAttribute('data-tilda-req') ? ' data-tilda-req="1"' : '';
    var bbonly = input.classList.contains('t-input_bbonly');
    var style = input.getAttribute('style') || '';
    var value = input.value || '';

    input.outerHTML =
      '<div class="t-input t-input-phonemask__wrap" style="' + style + '">' +
      '<div class="t-input-phonemask__select">' +
      '<span class="t-input-phonemask__select-code"></span>' +
      '</div>' +
      '<input type="hidden" class="js-phonemask-result-iso" name="tildaspec-phone-part[]-iso" value="" tabindex="-1">' +
      '<input type="tel" class="t-input t-input-phonemask" name="tildaspec-phone-part[]" value="' + value + '" placeholder="">' +
      '<input type="hidden" class="js-phonemask-result js-tilda-rule" data-tilda-rule="phone" name="' + name + '" value="' + value + '"' + req + ' tabindex="-1">' +
      '</div>';

    var wrap = group.querySelector('.t-input-phonemask__wrap');
    if (bbonly && wrap) wrap.classList.add('t-input_bbonly');

    /* Видимую подпись (.t-input__vis-ph от t_animateInputs) убираем: её место
     * занимает код страны, иначе она наезжает на «+7». */
    if (wrap && wrap.parentElement) {
      Array.prototype.forEach.call(wrap.parentElement.querySelectorAll('.t-input__vis-ph'), function (ph) {
        if (ph.parentNode) ph.parentNode.removeChild(ph);
      });
    }
  }

  /* Инлайновые стили из разметки висят на обёртке — переносим на сам input
   * и на подпись кода, чтобы шрифт/цвет поля не поехали. */
  function copyStyles(group) {
    var wrap = group.querySelector('.t-input-phonemask__wrap');
    var input = group.querySelector('.t-input-phonemask');
    var block = group.querySelector('.t-input-block');
    var codeBox = group.querySelector('.t-input-phonemask__select-code');
    if (!wrap || !input) return;
    if (block) block.style.overflow = 'visible';
    if (wrap.style.color && wrap.style.color !== 'rgb(0, 0, 0)') input.style.color = wrap.style.color;
    input.style.fontSize = wrap.style.fontSize;
    input.style.fontWeight = wrap.style.fontWeight;
    input.style.fontFamily = wrap.style.fontFamily;
    if (codeBox) {
      codeBox.style.fontSize = wrap.style.fontSize;
      codeBox.style.fontWeight = wrap.style.fontWeight;
    }
  }

  function bindMaskEvents(group, input) {
    input.addEventListener('input', function () { handleChangeInputValue(group, input); });
    input.addEventListener('paste', function (e) {
      var text = (e.clipboardData || window.clipboardData).getData('text');
      if (!text) return;
      e.preventDefault();
      input.value = text.replace(/[^0-9+]/g, '');
      handleChangeInputValue(group, input);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    /* reset шлёт suvvy-forms.js после успешной отправки. */
    group.addEventListener('reset', function () {
      input.value = '';
      changeVal(group, input);
    });
  }

  function handleChangeInputValue(group, input) {
    var value = input.value;
    if (!value || value === '(') {
      input.value = '';
      setResult(group, '', '');
      return;
    }
    /* Номер, набранный как 8 9xx / 7 9xx: ведущую 8/7 съедаем — код уже +7. */
    if (value.indexOf('89') === 1 || value.indexOf('79') === 1) {
      input.value = value.replace(/^.(8|7)9/, '9');
    }
    addNumberMask(copypasteHandling(input), input);
    changeVal(group, input);
    input.setAttribute('data-phonemask-current', input.value);
  }

  /* Вставили номер вместе с кодом страны — код отрезаем, иначе он съест
   * первые цифры маски. */
  function copypasteHandling(input) {
    var value = input.value;
    var digits = value.match(/[0-9]/g) || [];
    var body = input.getAttribute('data-phonemask-without-code') || '';
    var bodyDigits = (body.match(/[0-9]/g) || []).length;
    if (digits.length > bodyDigits) return removeCountryCode(value, input.getAttribute('data-phonemask-code'));
    return value;
  }

  function removeCountryCode(value, code) {
    var digits = (value || '').replace('+', '').replace(/^8/, '7');
    var codeDigits = (code || '').replace('+', '');
    if (digits && codeDigits && digits.indexOf(codeDigits) === 0) return digits.substring(codeDigits.length).trim();
    return value;
  }

  /* Раскладываем цифры по шаблону: «0» — место под цифру, всё остальное —
   * разделители. Хвостовые разделители обрезаем, чтобы курсор не висел
   * после скобки на пустом месте. */
  function addNumberMask(rawValue, input) {
    var code = input.getAttribute('data-phonemask-code');
    var pattern = input.getAttribute('data-phonemask-mask').substr(code.length);
    var digits = (rawValue.match(/\d+/g) || []).join('').split('');
    var parts = pattern.match(/(\+|\d+|[\s()-]|0+)/g);
    if (!parts) return;
    var out = '';
    for (var i = 0; i < parts.length; i++) {
      if (parts[i][0] === '0') {
        out += digits.slice(0, parts[i].length).join('');
        digits.splice(0, parts[i].length);
      } else {
        out += parts[i];
      }
    }
    input.value = out.replace(/[\s()-]+$/, '').replace(/^-+/, '');
  }

  function changeVal(group, input) {
    if (!input.value) { setResult(group, '', ''); return; }
    setResult(group, input.getAttribute('data-phonemask-code') + ' ' + input.value,
      input.getAttribute('data-phonemask-code'));
  }

  function setResult(group, value, iso) {
    var result = group.querySelector('.js-phonemask-result');
    var resultIso = group.querySelector('.js-phonemask-result-iso');
    if (result) result.value = value;
    if (resultIso) resultIso.value = iso;
  }

  /* ---------- Режим 2: свободный ввод (/en/ и не-RU maskcountry) ---------- */

  /* Поле не перестраиваем: оно остаётся обычным input[name="Phone"], и в
   * приёмник уходит ровно то, что человек написал. Чистим только буквы и
   * лишние «+», подставляем «+» в начало. */
  function initFreeInput(group, lid) {
    var input = group.querySelector('.js-phonemask-input') || group.querySelector('input[type="tel"]');
    if (!input) return;
    if (lid && !input.id) input.setAttribute('id', 'input_' + lid);
    if (!input.getAttribute('data-tilda-rule')) input.setAttribute('data-tilda-rule', 'phone');
    input.classList.add('js-tilda-rule');
    input.setAttribute('data-phonemask-free', 'yes');
    input.setAttribute('inputmode', 'tel');

    input.addEventListener('focus', function () {
      if (!input.value) input.value = '+';
    });
    input.addEventListener('input', function () {
      var cleaned = input.value.replace(/[^\d+()\-\s]/g, '');
      /* «+» имеет смысл только первым символом. */
      cleaned = cleaned.charAt(0).replace(/[^+\d]/, '') + cleaned.slice(1).replace(/\+/g, '');
      if (cleaned && cleaned.charAt(0) !== '+') cleaned = '+' + cleaned;
      if (cleaned !== input.value) input.value = cleaned;
    });
    input.addEventListener('blur', function () {
      if (input.value === '+') input.value = '';
    });
  }

  window.t_form_phonemask_load = t_form_phonemask_load;
  window.t_form_phonemask_load_one = t_form_phonemask_load_one;
})();
