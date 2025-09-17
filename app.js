// Конфиг калькулятора (цены можно править здесь)
const CONFIG = {
  basePrice: 12000,              // Базовый монтаж
  lengthPricePerMeter: 0,        // Цена за м "Длина трассы" (0 — пока не учитываем)
  extraPricePerMeter: 1200       // Цена за м "Доп. магистраль"
};

// Утилиты
const rub = n => n.toLocaleString('ru-RU') + ' ₽';

function toNumberSafe(v) {
  if (v == null) return 0;
  const s = String(v).replace(',', '.').trim();
  if (s === '') return 0;
  const x = Number(s);
  return Number.isFinite(x) && x >= 0 ? x : NaN;
}

function onlyNumericInput(el) {
  el.addEventListener('input', () => {
    const prev = el.value;
    // Разрешаем только цифры, запятую/точку и один разделитель
    let val = prev.replace(/[^0-9.,]/g, '');
    // Не более одного разделителя
    const parts = val.split(/[.,]/);
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('').replace(/[.,]/g, '');
    }
    if (val !== prev) el.value = val;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('calc');
  const inpLength = document.getElementById('length');
  const inpExtra  = document.getElementById('extra');
  const res       = document.getElementById('result');
  const btnClear  = document.getElementById('btn-clear');

  // Без автонулей
  inpLength.value = '';
  inpExtra.value = '';

  // Ограничиваем ввод символов
  [inpLength, inpExtra].forEach(onlyNumericInput);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const lengthMeters = toNumberSafe(inpLength.value);
    const extraMeters  = toNumberSafe(inpExtra.value);

    // Проверка
    if (Number.isNaN(lengthMeters) || Number.isNaN(extraMeters)) {
      res.classList.remove('hidden');
      res.innerHTML = '<div style="color:#b00020">Проверь ввод. Допускаются только числа (например 3 или 2,5).</div>';
      return;
    }

    const base   = CONFIG.basePrice;
    const lenSum = Math.round(lengthMeters * CONFIG.lengthPricePerMeter);
    const extSum = Math.round(extraMeters  * CONFIG.extraPricePerMeter);
    const total  = base + lenSum + extSum;

    // Вывод
    res.classList.remove('hidden');
    res.innerHTML = `
      <div class="line"><span>Базовый монтаж</span><span>${rub(base)}</span></div>
      <div class="line"><span>Длина трассы: ${lengthMeters || 0} м</span><span>${rub(lenSum)}</span></div>
      <div class="line"><span>Доп. магистраль: ${extraMeters || 0} м</span><span>${rub(extSum)}</span></div>
      <div class="line sum"><span>Итого</span><span>${rub(total)}</span></div>
    `;
  });

  btnClear.addEventListener('click', () => {
    form.reset();
    inpLength.value = '';
    inpExtra.value = '';
    res.classList.add('hidden');
    res.innerHTML = '';
  });
});
