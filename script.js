// v1.020 — "Рассчёт" считает, но не раскрывает смету.
// "Скопировать смету" пересчитывает, копирует и только после этого показывает блок.
(function(){
  const priceBase = 12000;
  const addressEl = document.getElementById('address');
  const powerEl = document.getElementById('power');
  const pipeEl = document.getElementById('pipe');
  const floorEl = document.getElementById('floor');
  const chasingEl = document.getElementById('chasing');
  const copyBtn = document.getElementById('copyBtn');
  const calcBtn = document.getElementById('calcBtn');
  const resultWrap = document.getElementById('resultWrap');
  const result = document.getElementById('result');

  function buildEstimate(){
    const addr = addressEl.value.trim() || 'Адрес не указан';
    const power = Number(powerEl.value || 0);
    const pipe = Number(pipeEl.value || 0);
    const floor = floorEl.value;
    const chasing = chasingEl.value === 'yes';

    let extras = [];
    let total = priceBase;

    if (pipe > 3){
      const extraLen = pipe - 3;
      const extraCost = Math.ceil(extraLen) * 800;
      total += extraCost;
      extras.push(`Доп. трасса: +${extraLen.toFixed(1)} м ≈ ${extraCost.toLocaleString('ru-RU')} ₽`);
    }

    if (Number(floor) >= 3){
      total += 1000;
      extras.push('Высотные работы: +1 000 ₽');
    }

    if (chasing){
      total += 1500;
      extras.push('Штробление: +1 500 ₽');
    }

    const lines = [
      `СМЕТА НА МОНТАЖ СПЛИТ-СИСТЕМЫ`,
      `Адрес: ${addr}`,
      `Мощность: ${power.toFixed(1)} кВт`,
      `Базовый монтаж: 12 000 ₽`,
      ...(extras.length ? extras : ['Без допработ']),
      `ИТОГО: ${total.toLocaleString('ru-RU')} ₽`,
      ``,
      `Примечание: сумма ориентировочная. Итог подтверждается после осмотра.`
    ];
    return lines.join('\n');
  }

  function computeOnly(){
    // Посчитать и сохранить в textarea, но НЕ показывать блок
    result.value = buildEstimate();
    // гарантия, что блок скрыт
    if (!resultWrap.classList.contains('hidden')) resultWrap.classList.add('hidden');
  }

  async function copyAndReveal(){
    // подсчитать на свежих данных
    computeOnly();
    const text = result.value;
    try{
      await navigator.clipboard.writeText(text);
    }catch(e){
      result.select();
      document.execCommand('copy');
    }
    // теперь показать блок
    resultWrap.classList.remove('hidden');
  }

  calcBtn.addEventListener('click', computeOnly);
  copyBtn.addEventListener('click', copyAndReveal);
})();