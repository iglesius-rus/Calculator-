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
    <tr data-id="${r.id ? r.id : ""}">
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

function buildMainWithExtras(MAIN, EXTRA) {
  const tbody = document.querySelector('#table-main tbody');
  const extraById = new Map((EXTRA || []).map(x => [x.id, x]));

  const track0709 = extraById.get('extra_track_07_09_btu') || { id:'extra_track_07_09_btu', name:'Дополнительная трасса (за 1 м) 07–09 (BTU)', unit:'п.м.', price:2000, hiddenInExtra:true };
  const track12   = extraById.get('extra_track_12_btu')     || { id:'extra_track_12_btu',     name:'Дополнительная трасса (за 1 м) 12 (BTU)',     unit:'п.м.', price:2500, hiddenInExtra:true };
  const track18   = extraById.get('extra_track_18_btu')     || { id:'extra_track_18_btu',     name:'Дополнительная трасса (за 1 м) 18 (BTU)',     unit:'п.м.', price:2500, hiddenInExtra:true };

  const rows = [];
  (MAIN || []).forEach(m => {
    rows.push(m);
    if (/BTU/i.test(m.name)) {
      const key = m.name.includes('07-09') ? '07-09' : (m.name.includes('12') && !m.name.includes('012') ? '12' : '18');
      rows.push(key === '07-09' ? track0709 : (key === '12' ? track12 : track18));
    }
  });

  if (tbody) tbody.innerHTML = rows.map(r => rowHTML(r)).join('');
}


function buildTable(id, rows) {
  const tbody = document.querySelector(id + ' tbody');
  const filtered = (rows || []).filter(r => !r || !r.hiddenInExtra);
  if (tbody) tbody.innerHTML = filtered.map(r => rowHTML(r)).join('');
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
      <tr class="rs-row">
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
        tr.rs-row { display: none; }
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

// === Prices: base JSON + local overrides ===
const PRICES_SCHEMA = 1;
const PRICES_VERSION = '0701_03';
const PRICES_URL = `./prices.json?v=${PRICES_VERSION}`;
const PRICES_OVERRIDE_KEY = 'smeta_pro_prices_override_v1';

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


function _safeJsonParse(raw) {
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function loadPriceOverride() {
  try {
    const raw = localStorage.getItem(PRICES_OVERRIDE_KEY);
    const obj = _safeJsonParse(raw);
    if (!obj || obj.schema !== PRICES_SCHEMA || typeof obj.prices !== 'object') return null;
    return obj;
  } catch (e) {
    return null;
  }
}

function savePriceOverrideFromData(priceData) {
  const prices = {};
  (priceData.MAIN || []).forEach(it => { if (it && it.id) prices[it.id] = parseMoney(it.price); });
  (priceData.EXTRA || []).forEach(it => { if (it && it.id) prices[it.id] = parseMoney(it.price); });

  const payload = {
    schema: PRICES_SCHEMA,
    updatedAt: new Date().toISOString(),
    prices
  };
  try { localStorage.setItem(PRICES_OVERRIDE_KEY, JSON.stringify(payload)); } catch (e) {}
}

function resetPriceOverride() {
  try { localStorage.removeItem(PRICES_OVERRIDE_KEY); } catch (e) {}
}

function normalizePriceData(data) {
  const out = { schema: PRICES_SCHEMA, currency: 'RUB', MAIN: [], EXTRA: [] };
  if (!data || typeof data !== 'object') return out;

  const fixList = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(x => x && typeof x === 'object')
      .map(x => ({
        id: String(x.id || ''),
        name: String(x.name || ''),
        unit: String(x.unit || ''),
        price: parseMoney(x.price),
        step: x.step ? parseMoney(x.step) : undefined,
        editablePrice: !!x.editablePrice,
        hiddenInExtra: !!x.hiddenInExtra
      }))
      .filter(x => x.id && x.name);
  };

  out.MAIN = fixList(data.MAIN);
  out.EXTRA = fixList(data.EXTRA);
  return out;
}

function applyOverrideToData(base, override) {
  if (!override || override.schema !== PRICES_SCHEMA) return base;
  const map = (override.prices && typeof override.prices === 'object') ? override.prices : {};

  const applyList = (list) => {
    list.forEach(it => {
      if (!it || !it.id) return;
      const v = map[it.id];
      if (v === null || v === undefined) return;
      const n = parseMoney(v);
      if (Number.isFinite(n) && n >= 0) it.price = n;
    });
  };

  applyList(base.MAIN);
  applyList(base.EXTRA);
  return base;
}

function fallbackPriceData() {
  // Аварийный запасной вариант, если prices.json не загрузился.
  // Да, мир несовершенен.
  return normalizePriceData({"schema": 1, "currency": "RUB", "MAIN": [{"name": "Монтаж настенного кондиционера 07-09 BTU", "unit": "компл.", "price": 12000, "id": "main_montazh_nastennogo_konditsionera_07_09_btu"}, {"name": "Монтаж настенного кондиционера 12 BTU", "unit": "компл.", "price": 14000, "id": "main_montazh_nastennogo_konditsionera_12_btu"}, {"name": "Монтаж настенного кондиционера 18 BTU", "unit": "компл.", "price": 16000, "id": "main_montazh_nastennogo_konditsionera_18_btu"}], "EXTRA": [{"id": "extra_track_07_09_btu", "name": "Дополнительная трасса (за 1 м) 07–09 (BTU)", "unit": "п.м.", "price": 2000, "hiddenInExtra": true}, {"id": "extra_track_12_btu", "name": "Дополнительная трасса (за 1 м) 12 (BTU)", "unit": "п.м.", "price": 2500, "hiddenInExtra": true}, {"id": "extra_track_18_btu", "name": "Дополнительная трасса (за 1 м) 18 (BTU)", "unit": "п.м.", "price": 2500, "hiddenInExtra": true}, {"name": "Автовышка (от 3 часов)", "unit": "ч.", "price": 2000, "id": "extra_avtovyshka_ot_3_chasov"}, {"name": "Демонтаж внутреннего/наружного блока (за каждый)", "unit": "блок", "price": 2000, "id": "extra_demontazh_vnutrennego_naruzhnogo_bloka_za_kazhdyy"}, {"name": "Демонтаж кондиционера 07–12", "unit": "шт.", "price": 3000, "id": "extra_demontazh_konditsionera_07_12"}, {"name": "Демонтаж кондиционера 18–24", "unit": "шт.", "price": 4000, "id": "extra_demontazh_konditsionera_18_24"}, {"name": "Демонтаж/монтаж стеклопакета", "unit": "шт.", "price": 1000, "id": "extra_demontazh_montazh_steklopaketa"}, {"name": "Дозаправка кондиционера фреоном", "unit": "г.", "price": 7, "step": 100, "id": "extra_dozapravka_konditsionera_freonom"}, {"name": "Кабель гибкий ПВС 3×1,5 мм², ГОСТ (с монтажом штепсельной вилки)", "unit": "м.", "price": 250, "id": "extra_kabel_gibkiy_pvs_3x1_5_mm2_gost_s_montazhom_shtepselnoy_vilk"}, {"name": "Кабель-канал под провод", "unit": "м.", "price": 500, "id": "extra_kabel_kanal_pod_provod"}, {"name": "Каждый дополнительный выезд", "unit": "выезд", "price": 1000, "id": "extra_kazhdyy_dopolnitelnyy_vyezd"}, {"name": "Короб ДКС", "unit": "п.м.", "price": 1200, "id": "extra_korob_dks"}, {"name": "Монтаж дополнительного дренажа без короба", "unit": "п.м.", "price": 150, "id": "extra_montazh_dopolnitelnogo_drenazha_bez_koroba"}, {"name": "Монтаж корзины", "unit": "шт.", "price": 0, "editablePrice": true, "id": "extra_montazh_korziny"}, {"name": "Монтаж наружного блока на вентилируемый фасад", "unit": "услуга", "price": 3500, "id": "extra_montazh_naruzhnogo_bloka_na_ventiliruemyy_fasad"}, {"name": "Пайка фреоновых труб (за каждую)", "unit": "пайка", "price": 500, "id": "extra_payka_freonovyh_trub_za_kazhduyu"}, {"name": "Потолок «Армстронг» (разборка/сборка)", "unit": "шт.", "price": 200, "id": "extra_potolok_armstrong_razborka_sborka"}, {"name": "Пробивка доп. отверстия (бетон, Ø 52 мм)", "unit": "отв.", "price": 2000, "id": "extra_probivka_dop_otverstiya_beton_52_mm"}, {"name": "Пробивка доп. отверстия (ГКЛ и т.п., Ø до 52 мм)", "unit": "отв.", "price": 500, "id": "extra_probivka_dop_otverstiya_gkl_i_t_p_do_52_mm"}, {"name": "Пробивка доп. отверстия (кирпич, Ø 52 мм)", "unit": "отв.", "price": 1000, "id": "extra_probivka_dop_otverstiya_kirpich_52_mm"}, {"name": "Установка антивандальной решётки", "unit": "шт.", "price": 3000, "id": "extra_ustanovka_antivandalnoy_reshetki"}, {"name": "Установка зимнего комплекта", "unit": "шт.", "price": 3000, "id": "extra_ustanovka_zimnego_komplekta"}, {"name": "Установка помпы", "unit": "шт.", "price": 2000, "id": "extra_ustanovka_pompy"}, {"name": "Чистка кондиционера (внутренний и наружный блок)", "unit": "компл.", "price": 3000, "id": "extra_chistka_konditsionera_vnutrenniy_i_naruzhnyy_blok"}, {"name": "Чистка кондиционера — полный комплекс", "unit": "компл.", "price": 4000, "id": "extra_chistka_konditsionera_polnyy_kompleks"}, {"name": "Штроба в бетоне", "unit": "п.м.", "price": 2500, "id": "extra_shtroba_v_betone"}, {"name": "Штроба в кирпиче", "unit": "п.м.", "price": 1500, "id": "extra_shtroba_v_kirpiche"}, {"name": "Штроба под дренаж в бетоне", "unit": "п.м.", "price": 800, "id": "extra_shtroba_pod_drenazh_v_betone"}, {"name": "Штроба под дренаж в кирпиче", "unit": "п.м.", "price": 600, "id": "extra_shtroba_pod_drenazh_v_kirpiche"}, {"name": "Элементы короба ДКС", "unit": "шт.", "price": 350, "id": "extra_elementy_koroba_dks"}]});
}

async function loadPriceData() {
  try {
    const res = await fetch(PRICES_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('prices.json not loaded');
    const json = await res.json();
    const base = normalizePriceData(json);
    const ov = loadPriceOverride();
    return applyOverrideToData(base, ov);
  } catch (e) {
    const base = fallbackPriceData();
    const ov = loadPriceOverride();
    return applyOverrideToData(base, ov);
  }
}

// === Price editor UI ===
function ensurePriceEditorMarkup() {
  if (document.getElementById('priceEditorBackdrop')) return;

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div id="priceEditorBackdrop" class="pe-backdrop hidden" role="dialog" aria-modal="true" aria-label="Редактор цен">
      <div class="pe-modal">
        <div class="pe-head">
          <div class="pe-title">Редактор цен</div>
          <button id="peClose" class="pe-btn" type="button">Закрыть</button>
        </div>

        <div class="pe-tabs">
          <button class="pe-tab is-active" data-tab="MAIN" type="button">MAIN</button>
          <button class="pe-tab" data-tab="EXTRA" type="button">EXTRA</button>
        </div>

        <div class="pe-body">
          <div class="pe-toolbar">
            <input id="peSearch" type="text" placeholder="Поиск..." />
            <button id="peExport" class="pe-btn" type="button">Экспорт JSON</button>
            <label class="pe-import">
              Импорт JSON
              <input id="peImport" type="file" accept="application/json" hidden />
            </label>
            <button id="peReset" class="pe-btn" type="button">Сброс</button>
          </div>

          <div id="peTableWrap"></div>
          <div class="kicker" style="margin-top:10px;">
            Сохранение цен: этот браузер (localStorage). На другом телефоне это не появится, потому что магии не существует.
          </div>
        </div>

        <div class="pe-foot">
          <div class="kicker">Подсказка: меняешь цену и жмёшь «Сохранить».</div>
          <button id="peSave" class="pe-btn" type="button">Сохранить</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap.firstElementChild);
}

function openPriceEditor() {
  const b = document.getElementById('priceEditorBackdrop');
  if (!b) return;
  b.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closePriceEditor() {
  const b = document.getElementById('priceEditorBackdrop');
  if (!b) return;
  b.classList.add('hidden');
  document.body.style.overflow = '';
}

function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function readJsonFile(file) {
  const text = await file.text();
  return JSON.parse(text);
}

function priceEditorRender(state) {
  const wrap = document.getElementById('peTableWrap');
  if (!wrap) return;

  const q = (document.getElementById('peSearch')?.value || '').trim().toLowerCase();
  const list = (state.data && state.data[state.tab]) ? state.data[state.tab] : [];

  const filtered = q ? list.filter(x =>
    (x.name || '').toLowerCase().includes(q) ||
    (x.unit || '').toLowerCase().includes(q) ||
    (x.id || '').toLowerCase().includes(q)
  ) : list;

  const rows = filtered.map(item => {
    const badge = (state.tab === 'EXTRA' && item.hiddenInExtra) ? `<span class="pe-badge">авто (BTU)</span>` : '';
    return `
      <tr>
        <td>${escapeHtml(item.name)} ${badge}</td>
        <td>${escapeHtml(item.unit)}</td>
        <td style="opacity:.75;">${escapeHtml(item.id)}</td>
        <td>
          <input class="pe-price" type="number" min="0" step="1" value="${Number(item.price) || 0}" data-id="${escapeHtml(item.id)}" />
        </td>
      </tr>
    `;
  }).join('');

  wrap.innerHTML = `
    <table class="pe-table">
      <thead>
        <tr><th>Название</th><th>Ед.</th><th>ID</th><th>Цена</th></tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="4">Пусто. Цены ушли покурить.</td></tr>`}
      </tbody>
    </table>
  `;

  wrap.querySelectorAll('input.pe-price').forEach(inp => {
    inp.addEventListener('input', () => {
      const id = inp.getAttribute('data-id');
      const val = parseMoney(inp.value);
      const arr = state.data[state.tab] || [];
      const obj = arr.find(x => x.id === id);
      if (obj && Number.isFinite(val) && val >= 0) obj.price = val;
    });
  });
}

function updatePricesInTables(priceData) {
  const map = new Map();
  (priceData.MAIN || []).forEach(it => map.set(it.id, it));
  (priceData.EXTRA || []).forEach(it => map.set(it.id, it));

  document.querySelectorAll('#table-main tbody tr, #table-extra tbody tr').forEach(tr => {
    const id = tr.getAttribute('data-id') || '';
    if (!id || !map.has(id)) return;

    if (tr.querySelector('.price-input')) return;

    const priceCell = tr.querySelector('td.price');
    const item = map.get(id);
    if (priceCell && item) priceCell.textContent = formatMoney(parseMoney(item.price)) + ' ₽';
  });

  const wasOpen = !!document.querySelector('#estimate-body table');
  recalcAll();
  if (wasOpen) buildEstimate();
}

function wirePriceEditor(state) {
  const btn = document.getElementById('pricesBtn');
  if (btn) btn.addEventListener('click', () => {
    priceEditorRender(state);
    openPriceEditor();
  });

  document.getElementById('peClose')?.addEventListener('click', closePriceEditor);

  document.getElementById('priceEditorBackdrop')?.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'priceEditorBackdrop') closePriceEditor();
  });

  document.querySelectorAll('.pe-tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.pe-tab').forEach(x => x.classList.remove('is-active'));
      t.classList.add('is-active');
      state.tab = t.getAttribute('data-tab') || 'MAIN';
      priceEditorRender(state);
    });
  });

  document.getElementById('peSearch')?.addEventListener('input', () => priceEditorRender(state));

  document.getElementById('peSave')?.addEventListener('click', () => {
    savePriceOverrideFromData(state.data);
    closePriceEditor();
    updatePricesInTables(state.data);
  });

  document.getElementById('peReset')?.addEventListener('click', async () => {
    resetPriceOverride();
    closePriceEditor();
    state.data = await loadPriceData();
    updatePricesInTables(state.data);
  });

  document.getElementById('peExport')?.addEventListener('click', () => {
    downloadJson('prices.custom.json', {
      schema: PRICES_SCHEMA,
      currency: 'RUB',
      MAIN: state.data.MAIN,
      EXTRA: state.data.EXTRA
    });
  });

  document.getElementById('peImport')?.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const importedRaw = await readJsonFile(file);
      const imported = normalizePriceData(importedRaw);

      const byId = new Map();
      (imported.MAIN || []).forEach(it => byId.set(it.id, it.price));
      (imported.EXTRA || []).forEach(it => byId.set(it.id, it.price));

      const applyMap = (list) => {
        list.forEach(it => {
          if (!it || !it.id) return;
          if (!byId.has(it.id)) return;
          const n = parseMoney(byId.get(it.id));
          if (Number.isFinite(n) && n >= 0) it.price = n;
        });
      };
      applyMap(state.data.MAIN);
      applyMap(state.data.EXTRA);

      savePriceOverrideFromData(state.data);
      closePriceEditor();
      updatePricesInTables(state.data);
    } catch (err) {
      alert('Импорт не удался: ' + (err && err.message ? err.message : String(err)));
    } finally {
      e.target.value = '';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Восстановить состояние РС
  setRsOn(getRsOn());

  const init = async () => {
    // 1) Грузим цены (prices.json + override)
    const priceData = await loadPriceData();

    // 2) Редактор цен
    ensurePriceEditorMarkup();
    const editorState = { data: priceData, tab: 'MAIN' };
    wirePriceEditor(editorState);

    // 3) Сортировка EXTRA: обычные позиции по алфавиту, а ДКС-строки держим внизу
    let EXTRA = (priceData.EXTRA || []).slice();

    EXTRA = EXTRA.sort((a, b) => {
      const an = a.name || '';
      const bn = b.name || '';

      const dksRank = (n) => {
        if (n === 'Короб ДКС') return 1;
        if (n === 'Элементы короба ДКС') return 2;
        return 0;
      };

      const ar = dksRank(an);
      const br = dksRank(bn);

      if (ar === 0 && br !== 0) return -1;
      if (ar !== 0 && br === 0) return 1;

      if (ar === 0 && br === 0) return an.localeCompare(bn, 'ru');

      return ar - br;
    });

    // 4) Строим таблицы
    buildMainWithExtras(priceData.MAIN, EXTRA);
    buildTable('#table-extra', EXTRA);
    buildEquipmentTable(3);

    attachEstimateUI();
    initScrollFab();
    recalcAll();

    // чтобы редактор работал с тем же объектом, который в таблицах
    editorState.data = { ...priceData, EXTRA };
  };

  init().catch((e) => {
    console.error(e);
    buildEquipmentTable(3);
    attachEstimateUI();
    initScrollFab();
    recalcAll();
  });
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
