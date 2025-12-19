/* © Вано
   iglesius21@gmail.com */

(function initTheme() {
  try {
    const saved = localStorage.getItem('theme'); // 'dark' | 'light' | null
    if (saved === 'light') document.body.classList.remove('dark');
    else document.body.classList.add('dark'); // по умолчанию тёмная
  } catch (e) {}
})();

function formatMoney(n) {
  return (n || 0).toLocaleString('ru-RU');
}

function parseMoney(t) {
  if (t === null || t === undefined) return 0;
  if (typeof t === 'number') return t;
  const s = String(t)
    .replace(/[\s\u00A0]/g, '')
    .replace(/руб\.?|₽/ig, '')
    .replace(/,/, '.');
  return parseFloat(s) || 0;
}

const RS_RATE = 0.1112;

function getRsOn() {
  try { return localStorage.getItem('rsOn') === '1'; } catch (e) { return false; }
}
function setRsOn(on) {
  try { localStorage.setItem('rsOn', on ? '1' : '0'); } catch (e) {}
  const btn = document.getElementById('rsToggle');
  if (btn) btn.classList.toggle('active', !!on);
}

function getDiscountPct() {
  const el = document.getElementById('discount-input');
  if (!el) return 0;
  const v = parseFloat(String(el.value).replace(',', '.')) || 0;
  return Math.min(100, Math.max(0, v));
}

function computeDiscount(total) {
  const pct = getDiscountPct();
  const discount = Math.round(total * pct) / 100;
  const withDisc = Math.max(0, total - discount);
  return { pct, discount, withDisc };
}

function computeRs(amount) {
  if (!getRsOn()) return { on: false, add: 0, pay: amount };
  const add = Math.round(amount * RS_RATE);
  return { on: true, add, pay: amount + add };
}

function updateDiscountUI(total) {
  const { pct, discount, withDisc } = computeDiscount(total);
  const line = document.getElementById('discount-line');
  const dp = document.getElementById('discount-pct');
  const da = document.getElementById('discount-amount');
  const gw = document.getElementById('grand-with-discount');

  if (line) {
    if (pct > 0) {
      line.style.display = '';
      if (dp) dp.textContent = pct.toLocaleString('ru-RU');
      if (da) da.textContent = discount.toLocaleString('ru-RU');
      if (gw) gw.textContent = withDisc.toLocaleString('ru-RU');
    } else {
      line.style.display = 'none';
    }
  }
  return { pct, discount, withDisc };
}

function updateRsUI(subtotal) {
  const line = document.getElementById('rs-line');
  const ra = document.getElementById('rs-amount');
  const gp = document.getElementById('grand-pay');

  const rs = computeRs(subtotal);

  if (line) {
    if (rs.on) {
      line.style.display = '';
      if (ra) ra.textContent = (rs.add || 0).toLocaleString('ru-RU');
      if (gp) gp.textContent = (rs.pay || 0).toLocaleString('ru-RU');
    } else {
      line.style.display = 'none';
    }
  }
  return rs;
}

function rowHTML(r) {
  const qtyStep = r.step ? r.step : 1;
  const qty = `<input type="number" class="qty-input" inputmode="numeric" pattern="[0-9]*" min="0" step="${qtyStep}" value="">`;

  let priceCell = '';
  if (r.editablePrice) {
    const p = parseMoney(r.price);
    const val = (p === 0) ? '' : String(p);
    priceCell = `<input type="number" class="price-input" min="0" step="1" value="${val}" style="width:90px; text-align:center;"> ₽`;
  } else {
    priceCell = `${formatMoney(parseMoney(r.price))} ₽`;
  }

  return `
    <tr>
      <td data-label="Наименование работ">${r.name}</td>
      <td data-label="Кол-во">${qty}</td>
      <td data-label="Ед. изм.">${r.unit}</td>
      <td class="price" data-label="Цена ед.">${priceCell}</td>
      <td class="sum" data-sum="0" data-label="Цена">0 ₽</td>
    </tr>`;
}

function equipmentRowHTML() {
  return `
    <tr>
      <td data-label="Модель">
        <input type="text" class="name-input" placeholder="Модель кондиционера / оборудование" value="">
      </td>
      <td data-label="Кол-во">
        <input type="number" class="qty-input" inputmode="numeric" pattern="[0-9]*" min="0" step="1" value="">
      </td>
      <td data-label="Ед. изм.">шт.</td>
      <td class="price" data-label="Цена ед.">
        <input type="number" class="price-input" min="0" step="1" value="" style="width:90px; text-align:center;"> ₽
      </td>
      <td class="sum" data-sum="0" data-label="Цена">0 ₽</td>
    </tr>`;
}

function buildEquipmentTable(count) {
  const tbody = document.querySelector('#table-equip tbody');
  if (!tbody) return;
  const rows = [];
  for (let i = 0; i < (count || 3); i++) rows.push(equipmentRowHTML());
  tbody.innerHTML = rows.join('');
}

function buildMainWithExtras(MAIN) {
  const tbody = document.querySelector('#table-main tbody');
  const EXTRA_MAP = {
    '07-09': { name:'Дополнительная трасса (за 1 м) 07–09 (BTU)', unit:'п.м.', price:2000 },
    '12':    { name:'Дополнительная трасса (за 1 м) 12 (BTU)',     unit:'п.м.', price:2500 },
    '18':    { name:'Дополнительная трасса (за 1 м) 18 (BTU)',     unit:'п.м.', price:2500 }
  };
  const rows = [];
  MAIN.forEach(m => {
    rows.push(m);
    if (/BTU/i.test(m.name)) {
      const key = m.name.includes('07-09') ? '07-09' : (m.name.includes('12') && !m.name.includes('012') ? '12' : '18');
      rows.push(EXTRA_MAP[key]);
    }
  });
  if (tbody) tbody.innerHTML = rows.map(r => rowHTML(r)).join('');
}

function buildTable(id, rows) {
  const tbody = document.querySelector(id + ' tbody');
  if (tbody) tbody.innerHTML = rows.map(r => rowHTML(r)).join('');
}

function readUnitPrice(tr) {
  const priceInput = tr.querySelector('.price-input');
  if (priceInput) return parseMoney(priceInput.value);
  return parseMoney(tr.querySelector('.price')?.textContent);
}

function readQty(tr) {
  return parseMoney(tr.querySelector('.qty-input')?.value);
}

function readName(tr) {
  const inp = tr.querySelector('.name-input');
  if (inp) return (inp.value || '').trim();
  return (tr.querySelector('td:nth-child(1)')?.textContent || '').trim();
}

function recalcAll() {
  let total = 0;

  document.querySelectorAll('#table-equip tbody tr, #table-main tbody tr, #table-extra tbody tr').forEach(tr => {
    const qty = readQty(tr);
    const price = readUnitPrice(tr);
    const sum = Math.max(0, qty) * Math.max(0, price);

    const cell = tr.querySelector('.sum');
    if (cell) {
      cell.textContent = formatMoney(sum || 0) + ' ₽';
      cell.dataset.sum = String(sum || 0);
    }

    total += sum || 0;
  });

  const grand = document.getElementById('grand-total');
  if (grand) grand.textContent = formatMoney(total || 0);

  const disc = updateDiscountUI(total);
  const subtotal = (disc.pct > 0) ? disc.withDisc : total;
  updateRsUI(subtotal);
}

function buildEstimate() {
  recalcAll();

  const rows = [];
  document.querySelectorAll('#table-equip tbody tr, #table-main tbody tr, #table-extra tbody tr').forEach(tr => {
    const qty = readQty(tr);
    const unit = (tr.querySelector('td:nth-child(3)')?.textContent || '').trim() || 'шт.';
    const unitPrice = readUnitPrice(tr);
    const sum = parseMoney(tr.querySelector('.sum')?.textContent);

    if (qty > 0 && sum > 0) {
      let name = readName(tr);
      if (!name) name = 'Оборудование'; // если человек ввёл цифры, а модель забыл
      rows.push({ name, qty, unit, unitPrice, sum });
    }
  });

  const wrap = document.getElementById('estimate-body');
  if (!wrap) return;

  if (!rows.length) {
    wrap.innerHTML = '<p class="kicker">Пока ничего не выбрано. Укажите количество. Смета формируется автоматически при копировании или печати в PDF.</p>';
  } else {
    let total = 0;
    const items = rows.map(r => {
      total += r.sum;
      return (
        `<tr>
          <td>${r.name}</td>
          <td style="text-align:center;">${r.qty} ${r.unit}</td>
          <td style="white-space:nowrap;">${formatMoney(r.unitPrice)} ₽</td>
          <td style="white-space:nowrap; text-align:right;"><b>${formatMoney(r.sum)} ₽</b></td>
        </tr>`
      );
    }).join('');

    const disc = computeDiscount(total);
    const afterDisc = (disc.pct > 0) ? disc.withDisc : total;
    const rs = computeRs(afterDisc);

    const discRow = (disc.pct > 0) ? `
      <tr>
        <td colspan="3" style="text-align:right;">Скидка ${disc.pct}%</td>
        <td style="white-space:nowrap; text-align:right;">−${formatMoney(disc.discount)} ₽</td>
      </tr>` : '';

    const rsRow = (rs.on) ? `
      <tr>
        <td colspan="3" style="text-align:right;">РС +11,12%</td>
        <td style="white-space:nowrap; text-align:right;">+${formatMoney(rs.add)} ₽</td>
      </tr>` : '';

    const finalLabel = rs.on ? 'К оплате' : (disc.pct > 0 ? 'Итого со скидкой' : 'Итого');
    const finalValue = rs.on ? rs.pay : afterDisc;

    wrap.innerHTML = `
      <div class="kicker" style="margin-bottom:8px;">Автосформированный расчёт</div>
      <div style="overflow:auto;">
        <table class="calc-table">
          <thead><tr><th>Позиция</th><th>Кол-во</th><th>Цена ед.</th><th>Сумма</th></tr></thead>
          <tbody>
            ${items}
            ${discRow}
            ${rsRow}
            <tr class="total-row">
              <td colspan="3" style="text-align:right;"><b>${finalLabel}</b></td>
              <td style="white-space:nowrap; text-align:right;"><b>${formatMoney(finalValue)} ₽</b></td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }

  document.getElementById('estimate')?.classList.remove('hidden');
}

function estimateToPlainText() {
  const wrap = document.getElementById('estimate-body');
  if (!wrap) return '';
  const table = wrap.querySelector('table');
  if (!table) return '';

  const lines = [];
  table.querySelectorAll('tbody tr').forEach(tr => {
    const tds = tr.querySelectorAll('td');
    if (tds.length === 4 && !tr.classList.contains('total-row')) {
      lines.push(`${tds[0].textContent.trim()} — ${tds[1].textContent.trim()} × ${tds[2].textContent.trim()} = ${tds[3].textContent.trim()}`);
    }
  });

  const lastRow = table.querySelector('tbody tr:last-child');
  let finalLine = '';
  if (lastRow) {
    const tds = lastRow.querySelectorAll('td');
    if (tds.length >= 2) {
      const label = tds[0].textContent.replace(/\s+/g,' ').trim();
      const value = tds[tds.length - 1].textContent.trim();
      if (label && value) finalLine = `${label}: ${value}`;
    }
  }

  const address = document.getElementById('estimate-address')?.value?.trim();
  return (lines.join('\n') + (finalLine ? `\n${finalLine}` : '') + (address ? `\nАдрес: ${address}` : '')).trim();
}

function capitalizeFirst(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Число -> слова (рубли). Нормально работает для целых рублей.
function moneyToWordsRu(n) {
  n = Math.floor(Math.abs(parseMoney(n) || 0));

  const ones = [
    ['ноль','один','два','три','четыре','пять','шесть','семь','восемь','девять'],
    ['ноль','одна','две','три','четыре','пять','шесть','семь','восемь','девять']
  ];
  const teens = ['десять','одиннадцать','двенадцать','тринадцать','четырнадцать','пятнадцать','шестнадцать','семнадцать','восемнадцать','девятнадцать'];
  const tens = ['','десять','двадцать','тридцать','сорок','пятьдесят','шестьдесят','семьдесят','восемьдесят','девяносто'];
  const hundreds = ['','сто','двести','триста','четыреста','пятьсот','шестьсот','семьсот','восемьсот','девятьсот'];

  function morph(num, f1, f2, f5) {
    const n10 = num % 10;
    const n100 = num % 100;
    if (n100 >= 11 && n100 <= 19) return f5;
    if (n10 === 1) return f1;
    if (n10 >= 2 && n10 <= 4) return f2;
    return f5;
  }

  function triadToWords(num, female) {
    let out = [];
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const o = num % 10;
    if (h) out.push(hundreds[h]);
    if (t > 1) {
      out.push(tens[t]);
      if (o) out.push(ones[female ? 1 : 0][o]);
    } else if (t === 1) {
      out.push(teens[o]);
    } else {
      if (o) out.push(ones[female ? 1 : 0][o]);
    }
    return out.join(' ');
  }

  const parts = [];
  const billion = Math.floor(n / 1000000000);
  const million = Math.floor((n % 1000000000) / 1000000);
  const thousand = Math.floor((n % 1000000) / 1000);
  const rest = n % 1000;

  if (billion) {
    parts.push(triadToWords(billion, false));
    parts.push(morph(billion, 'миллиард', 'миллиарда', 'миллиардов'));
  }
  if (million) {
    parts.push(triadToWords(million, false));
    parts.push(morph(million, 'миллион', 'миллиона', 'миллионов'));
  }
  if (thousand) {
    parts.push(triadToWords(thousand, true));
    parts.push(morph(thousand, 'тысяча', 'тысячи', 'тысяч'));
  }
  if (rest || (!billion && !million && !thousand)) {
    parts.push(triadToWords(rest, false) || 'ноль');
  }

  parts.push(morph(n, 'рубль', 'рубля', 'рублей'));

  return capitalizeFirst(parts.filter(Boolean).join(' ').replace(/\s+/g,' ').trim());
}

function generatePDF() {
  if (!document.querySelector('#estimate-body table')) buildEstimate();

  const wrap = document.getElementById('estimate-body');
  const address = document.getElementById('estimate-address')?.value?.trim() || '';

  if (!wrap || !wrap.querySelector('table')) {
    const btnPdf = document.getElementById('btn-pdf');
    if (btnPdf) {
      btnPdf.textContent = 'Нет данных';
      setTimeout(() => btnPdf.textContent = 'Скачать PDF', 1200);
    }
    return;
  }

  const title = 'Смета' + (address ? ' — ' + address : '');
  const date = new Date().toLocaleString('ru-RU');

  const lastCell = wrap.querySelector('table tbody tr:last-child td:last-child');
  const finalSum = parseMoney(lastCell?.textContent || 0);
  const words = moneyToWordsRu(finalSum);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #000;
          background: #fff;
        }
        h1 {
          margin: 0 0 10px;
          font-size: 22px;
          color: #333;
          border-bottom: 2px solid #333;
          padding-bottom: 5px;
        }
        .meta {
          font-size: 14px;
          color: #666;
          margin-bottom: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          font-size: 14px;
        }
        th {
          background: #f5f5f5;
          font-weight: bold;
          padding: 10px 8px;
          border: 1px solid #ddd;
          text-align: left;
        }
        td {
          padding: 8px;
          border: 1px solid #ddd;
          vertical-align: top;
        }
        .total-row td {
          background: #f9f9f9;
          font-weight: bold;
        }
        @media print {
          body { margin: 15mm; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">
        <div><strong>Дата составления:</strong> ${date}</div>
        ${address ? `<div><strong>Адрес объекта:</strong> ${address}</div>` : ''}
      </div>

      ${wrap.innerHTML}

      <div style="margin-top:14px; font-size:14px;">
        <b>${words}</b>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Разрешите всплывающие окна для создания PDF');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
  }, 500);
}

function attachEstimateUI() {
  const btnCopy = document.getElementById('btn-copy');
  const btnPdf = document.getElementById('btn-pdf');

  if (btnCopy) {
    btnCopy.addEventListener('click', async () => {
      if (!document.querySelector('#estimate-body table')) buildEstimate();
      const text = estimateToPlainText();
      if (!text) {
        btnCopy.textContent = 'Нет данных';
        setTimeout(() => btnCopy.textContent = 'Скопировать', 1200);
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        btnCopy.textContent = 'Скопировано ✅';
        setTimeout(() => btnCopy.textContent = 'Скопировать', 1500);
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e2) {}
        document.body.removeChild(ta);
        btnCopy.textContent = 'Скопировано ✅';
        setTimeout(() => btnCopy.textContent = 'Скопировать', 1500);
      }
    });
  }

  if (btnPdf) btnPdf.addEventListener('click', generatePDF);

  // РС toggle
  const rsBtn = document.getElementById('rsToggle');
  if (rsBtn) {
    rsBtn.addEventListener('click', () => {
      const next = !getRsOn();
      setRsOn(next);
      const wasOpen = !!document.querySelector('#estimate-body table');
      recalcAll();
      if (wasOpen) buildEstimate();
    });
  }

  // Делегирование событий ввода
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (!t) return;

    if (t.id === 'discount-input') {
      const wasOpen = !!document.querySelector('#estimate-body table');
      recalcAll();
      if (wasOpen) buildEstimate();
      return;
    }

    if (t.classList && (t.classList.contains('qty-input') || t.classList.contains('price-input'))) {
      const wasOpen = !!document.querySelector('#estimate-body table');
      recalcAll();
      if (wasOpen) buildEstimate();
      return;
    }
  });
}

function setTheme(mode) {
  const body = document.body;
  if (mode === 'dark') body.classList.add('dark');
  else body.classList.remove('dark');

  try { localStorage.setItem('theme', mode); } catch (e) {}

  const btn = document.getElementById('themeToggle');
  if (btn) {
    const dark = body.classList.contains('dark');
    btn.title = dark ? 'Тёмная тема' : 'Светлая тема';
    btn.setAttribute('aria-pressed', String(dark));
  }
}

(function initThemeToggle() {
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t && (t.id === 'themeToggle' || (t.closest && t.closest('#themeToggle')))) {
      const dark = document.body.classList.contains('dark');
      setTheme(dark ? 'light' : 'dark');
    }
  });
  setTheme(document.body.classList.contains('dark') ? 'dark' : 'light');
})();

// ---- Scroll FAB (умная) ----
function initScrollFab() {
  const fab = document.getElementById('scrollFab');
  if (!fab) return;

  const update = () => {
    const doc = document.documentElement;
    const maxScroll = Math.max(document.body.scrollHeight, doc.scrollHeight) - window.innerHeight;
    const y = window.scrollY || doc.scrollTop || 0;

    if (maxScroll < 200) {
      fab.style.display = 'none';
      return;
    } else {
      fab.style.display = 'grid';
    }

    const pos = y / (maxScroll || 1);
    if (pos < 0.20) {
      fab.dataset.mode = 'down';
      fab.textContent = '↓';
      fab.title = 'Вниз';
      fab.setAttribute('aria-label', 'Прокрутить вниз');
    } else {
      fab.dataset.mode = 'up';
      fab.textContent = '↑';
      fab.title = 'Вверх';
      fab.setAttribute('aria-label', 'Прокрутить вверх');
    }
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);

  fab.addEventListener('click', () => {
    if (fab.dataset.mode === 'up') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const doc = document.documentElement;
      const bottom = Math.max(document.body.scrollHeight, doc.scrollHeight) - window.innerHeight;
      window.scrollTo({ top: bottom, behavior: 'smooth' });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Восстановить состояние РС
  setRsOn(getRsOn());

  const MAIN = [
    { name:'Монтаж настенного кондиционера 07-09 BTU', unit:'компл.', price:12000 },
    { name:'Монтаж настенного кондиционера 12 BTU', unit:'компл.', price:14000 },
    { name:'Монтаж настенного кондиционера 18 BTU', unit:'компл.', price:16000 }
  ];

  let EXTRA = [
    { name:'Автовышка (от 3 часов)', unit:'ч.', price:2000 },
    { name:'Демонтаж внутреннего/наружного блока (за каждый)', unit:'блок', price:2000 },
    { name:'Демонтаж кондиционера 07–12', unit:'шт.', price:3000 },
    { name:'Демонтаж кондиционера 18–24', unit:'шт.', price:4000 },
    { name:'Демонтаж/монтаж стеклопакета', unit:'шт.', price:1000 },
    { name:'Дозаправка кондиционера фреоном', unit:'г.', price:7, step:100 },
    { name:'Кабель гибкий ПВС 3×1,5 мм², ГОСТ (с монтажом штепсельной вилки)', unit:'м.', price:250 },
    { name:'Кабель-канал под провод', unit:'м.', price:500 },
    { name:'Каждый дополнительный выезд', unit:'выезд', price:1000 },
    { name:'Короб ДКС', unit:'п.м.', price:1200 },
    { name:'Монтаж дополнительного дренажа без короба', unit:'п.м.', price:150 },
    { name:'Монтаж корзины', unit:'шт.', price:0, editablePrice:true },
    { name:'Монтаж наружного блока на вентилируемый фасад', unit:'услуга', price:3500 },
    { name:'Пайка фреоновых труб (за каждую)', unit:'пайка', price:500 },
    { name:'Потолок «Армстронг» (разборка/сборка)', unit:'шт.', price:200 },
    { name:'Пробивка доп. отверстия (бетон, Ø 52 мм)', unit:'отв.', price:2000 },
    { name:'Пробивка доп. отверстия (ГКЛ и т.п., Ø до 52 мм)', unit:'отв.', price:500 },
    { name:'Пробивка доп. отверстия (кирпич, Ø 52 мм)', unit:'отв.', price:1000 },
    { name:'Установка антивандальной решётки', unit:'шт.', price:3000 },
    { name:'Установка зимнего комплекта', unit:'шт.', price:3000 },
    { name:'Установка помпы', unit:'шт.', price:2000 },
    { name:'Чистка кондиционера (внутренний и наружный блок)', unit:'компл.', price:3000 },
    { name:'Чистка кондиционера — полный комплекс', unit:'компл.', price:4000 },
    { name:'Штроба в бетоне', unit:'п.м.', price:2500 },
    { name:'Штроба в кирпиче', unit:'п.м.', price:1500 },
    { name:'Штроба под дренаж в бетоне', unit:'п.м.', price:800 },
    { name:'Штроба под дренаж в кирпиче', unit:'п.м.', price:600 },
    { name:'Элементы короба ДКС', unit:'шт.', price:350 }
  ];

  // Сортировка, но "Короб ДКС" держим выше "Элементы короба ДКС"
  EXTRA = EXTRA.sort((a, b) => {
    const an = a.name || '';
    const bn = b.name || '';
    if (an === 'Короб ДКС' && bn === 'Элементы короба ДКС') return -1;
    if (an === 'Элементы короба ДКС' && bn === 'Короб ДКС') return 1;
    return an.localeCompare(bn, 'ru');
  });

  buildMainWithExtras(MAIN);
  buildTable('#table-extra', EXTRA);
  buildEquipmentTable(3);
  // Синхронизация состояния РС при загрузке (чтобы не выглядело как "не работает")
  setRsOn(getRsOn());


  attachEstimateUI();
  initScrollFab();
  recalcAll();
});

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js', { scope: './' }).catch(console.error);
  });
}

// Install prompt
let _deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _deferredPrompt = e;
  document.getElementById('installBtn')?.classList.remove('hidden');
});
window.addEventListener('appinstalled', () => {
  document.getElementById('installBtn')?.classList.add('hidden');
  _deferredPrompt = null;
});
document.getElementById('installBtn')?.addEventListener('click', async () => {
  if (!_deferredPrompt) return;
  _deferredPrompt.prompt();
  await _deferredPrompt.userChoice.catch(() => ({}));
  _deferredPrompt = null;
});
