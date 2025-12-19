/* © Вано
   iglesius21@gmail.com */
try { const savedTheme = localStorage.getItem('theme'); if (savedTheme === 'light') document.body.classList.remove('dark'); } catch(e){}

/* Аккордеон */
function setMaxHeight(el, open) { if (open) el.style.maxHeight = el.scrollHeight + 'px'; else el.style.maxHeight = '0px'; }
function scrollToPanel(panel){ panel.scrollIntoView({ behavior:'smooth', block:'start' }); }
function saveState(){ try { const openIds = Array.from(document.querySelectorAll('.content-section.open')).map(p => p.id); localStorage.setItem('openPanels', JSON.stringify(openIds)); } catch(e){} }
function restoreState(){ try { const openIds = JSON.parse(localStorage.getItem('openPanels') || '[]'); openIds.forEach(id => { const panel = document.getElementById(id); const btn = panel?.previousElementSibling; if (panel && btn) { panel.classList.add('open'); setMaxHeight(panel, true); btn.classList.add('active'); btn.setAttribute('aria-expanded', 'true'); } }); } catch(e){} }

// ===== Калькулятор стоимости =====
function format(n) { return n.toLocaleString('ru-RU'); }
function _parseMoney(t){
  if (t === null || t === undefined) return 0;
  if (typeof t === 'number') return t;
  const s = String(t).replace(/[\s\u00A0]/g,'').replace(/руб\.?|₽/ig,'').replace(/,/,'.');
  return parseFloat(s) || 0;
}

function readEquipmentRows(){
  const tbody = document.querySelector('#table-equip tbody');
  if (!tbody) return [];
  const rows = [];
  tbody.querySelectorAll('tr').forEach(tr => {
    const name = tr.querySelector('.equip-name')?.value?.trim() || '';
    const qty = _parseMoney(tr.querySelector('.equip-qty')?.value);
    const price = _parseMoney(tr.querySelector('.equip-price')?.value);
    const sum = Math.max(0, qty) * Math.max(0, price);
    const cell = tr.querySelector('.equip-sum');
    if (cell){
      cell.textContent = (sum || 0).toLocaleString('ru-RU') + ' ₽';
      cell.dataset.sum = String(sum || 0);
    }
    if (name && qty > 0 && price > 0 && sum > 0){
      rows.push({name, qty, unit:'шт.', unitPrice:price, sum});
    }
  });
  return rows;
}
function equipmentTotal(){
  return readEquipmentRows().reduce((acc,r)=>acc+(r.sum||0),0);
}
function rowHTML(r){
  const _rawPrice = (r.price === 0 || r.price === '0') ? 0 : (r.price ?? '');
  const _priceValue = (_rawPrice === '' || _rawPrice === null || _rawPrice === undefined) ? '' : String(_parseMoney(_rawPrice));
  const priceCell = r.editablePrice
    ? `<input type="number" class="price-input" min="0" step="1" value="${_priceValue}" style="width:90px; text-align:center;"> ₽`
    : `${format(_parseMoney(r.price))} ₽`;
  return `
    <tr>
      <td data-label="Наименование работ">${r.name}</td>
      <td data-label="Кол-во"><input type="number" inputmode="numeric" pattern="[0-9]*" min="0" step="1" value=""></td>
      <td data-label="Ед. изм.">${r.unit}</td>
      <td class="price" data-label="Цена ед.">${priceCell}</td>
      <td class="sum" data-sum="0" data-label="Цена">0 ₽</td>
    </tr>`;
}

function buildMainWithExtras(MAIN){
  const tbody = document.querySelector('#table-main tbody');
  const EXTRA_MAP = {
    '07-09': { name:'Дополнительная трасса (за 1 м) 07–09 (BTU)', unit:'п.м.', price:2000 },
    '12':    { name:'Дополнительная трасса (за 1 м) 12 (BTU)',     unit:'п.м.', price:2500 },
    '18':    { name:'Дополнительная трасса (за 1 м) 18 (BTU)',     unit:'п.м.', price:2500 }
  };
  const rows = [];
  MAIN.forEach(m => {
    rows.push(m);
    // добавляем доп. трассу ТОЛЬКО для монтажей с BTU
    if (/BTU/i.test(m.name)){
      const key = m.name.includes('07-09') ? '07-09' : (m.name.includes('12') && !m.name.includes('012') ? '12' : '18');
      rows.push(EXTRA_MAP[key]);
    }
  });
  tbody.innerHTML = rows.map(r => rowHTML(r)).join('');
}

function buildTable(id, rows){ const tbody = document.querySelector(id + ' tbody'); tbody.innerHTML = rows.map(r=>rowHTML(r)).join(''); }

function readUnitPrice(tr){
  const priceInput = tr.querySelector('.price-input');
  if (priceInput) return _parseMoney(priceInput.value);
  return _parseMoney(tr.querySelector('.price')?.textContent);
}

function recalcAll(){
  let total = 0;
  document.querySelectorAll('#table-main tbody tr, #table-extra tbody tr').forEach(tr => {
    const qty = _parseMoney(tr.querySelector('input[type="number"]')?.value);
    const price = readUnitPrice(tr);
    const sum = Math.max(0, qty) * Math.max(0, price);
    const cell = tr.querySelector('.sum');
    if (cell){
      cell.textContent = (sum || 0).toLocaleString('ru-RU') + ' ₽';
      cell.dataset.sum = String(sum || 0);
    }
    total += sum || 0;
  });
  total += equipmentTotal();
  const grand = document.getElementById('grand-total');
  if (grand) grand.textContent = (total || 0).toLocaleString('ru-RU');
  applyDiscountToTotal(total);
}

function getDiscountPct(){
  const el = document.getElementById('discount-input');
  if (!el) return 0;
  const v = parseFloat(String(el.value).replace(',', '.')) || 0;
  return Math.min(100, Math.max(0, v));
}
function applyDiscountToTotal(total){
  const pct = getDiscountPct();
  const discount = Math.round(total * pct) / 100;
  const withDisc = Math.max(0, total - discount);
  const line = document.getElementById('discount-line');
  const dp = document.getElementById('discount-pct');
  const da = document.getElementById('discount-amount');
  const gw = document.getElementById('grand-with-discount');
  if (line){
    if (pct > 0){
      line.style.display = '';
      if (dp) dp.textContent = pct.toLocaleString('ru-RU');
      if (da) da.textContent = discount.toLocaleString('ru-RU');
      if (gw) gw.textContent = withDisc.toLocaleString('ru-RU');
    } else {
      line.style.display = 'none';
    }
  }
  return {discount, withDisc, pct};
}

function buildEstimate(){
  recalcAll();
  const rows = [];

  // equipment first
  const equipRows = readEquipmentRows();
  equipRows.forEach(r => rows.push(r));

  document.querySelectorAll('#table-main tbody tr, #table-extra tbody tr').forEach(tr => {
    const name = tr.querySelector('td:nth-child(1)')?.textContent.trim() || '';
    const qty  = _parseMoney(tr.querySelector('input[type="number"]')?.value);
    const unit = tr.querySelector('td:nth-child(3)')?.textContent.trim() || '';
    const unitPrice = readUnitPrice(tr);
    const sum  = _parseMoney(tr.querySelector('.sum')?.textContent);
    if (qty > 0 && sum > 0) rows.push({name, qty, unit, unitPrice, sum});
  });
  const wrap = document.getElementById('estimate-body');
  if (!wrap) return;
  if (!rows.length){
    wrap.innerHTML = '<p class="kicker">Пока ничего не выбрано. Укажите количество. Смета формируется автоматически при копировании или печати в PDF.</p>';
  } else {
    let total = 0;
    const items = rows.map(r => { total += r.sum; return (
      `<tr>
        <td>${r.name}</td>
        <td style="text-align:center;">${r.qty} ${r.unit}</td>
        <td style="white-space:nowrap;">${r.unitPrice.toLocaleString('ru-RU')} ₽</td>
        <td style="white-space:nowrap; text-align:right;"><b>${r.sum.toLocaleString('ru-RU')} ₽</b></td>
      </tr>`);
    }).join('');
    const disc = applyDiscountToTotal(total);
    let discRow = '';
    let finalRow = '';
    if (disc.pct > 0){
      discRow = `<tr>
        <td colspan="3" style="text-align:right;">Скидка ${disc.pct}%</td>
        <td style="white-space:nowrap; text-align:right;">−${disc.discount.toLocaleString('ru-RU')} ₽</td>
      </tr>`;
      finalRow = `<tr>
        <td colspan="3" style="text-align:right;"><b>Итого со скидкой</b></td>
        <td style="white-space:nowrap; text-align:right;"><b>${(disc.withDisc || total).toLocaleString('ru-RU')} ₽</b></td>
      </tr>`;
    } else {
      finalRow = `<tr>
        <td colspan="3" style="text-align:right;"><b>Итого</b></td>
        <td style="white-space:nowrap; text-align:right;"><b>${total.toLocaleString('ru-RU')} ₽</b></td>
      </tr>`;
    }
    
    wrap.innerHTML = `
      <div class="kicker" style="margin-bottom:8px;">Автосформированный расчёт</div>
      <div style="overflow:auto;">
        <table class="calc-table">
          <thead><tr><th>Позиция</th><th>Кол-во</th><th>Цена ед.</th><th>Сумма</th></tr></thead>
          <tbody>${items}
            
            ${discRow}
            ${finalRow}
          </tbody>
        </table>
      </div>`;
  }
  document.getElementById('estimate')?.classList.remove('hidden');
}

function estimateToPlainText(){
  const wrap = document.getElementById('estimate-body');
  if (!wrap) return '';
  const table = wrap.querySelector('table');
  if (!table) return '';
  
  const rows = [];
  table.querySelectorAll('tbody tr').forEach(tr => {
    const tds = tr.querySelectorAll('td');
    if (tds.length === 4) {
      rows.push(`${tds[0].textContent.trim()} — ${tds[1].textContent.trim()} × ${tds[2].textContent.trim()} = ${tds[3].textContent.trim()}`);
    }
  });
  
  const address = document.getElementById('estimate-address')?.value?.trim();
  const totalLine = wrap.querySelector('tbody tr:last-child td:last-child')?.textContent?.trim();
  
  return (rows.join('\n') + (totalLine ? `\nИтого: ${totalLine}` : '') + (address ? `\nАдрес: ${address}` : '')).trim();
}


function numberToWordsRu(n){
  // integer rubles only
  n = Math.floor(Math.max(0, _parseMoney(n)));
  const ones = [
    ['ноль','один','два','три','четыре','пять','шесть','семь','восемь','девять'],
    ['ноль','одна','две','три','четыре','пять','шесть','семь','восемь','девять']
  ];
  const tens = ['','десять','двадцать','тридцать','сорок','пятьдесят','шестьдесят','семьдесят','восемьдесят','девяносто'];
  const teens = ['десять','одиннадцать','двенадцать','тринадцать','четырнадцать','пятнадцать','шестнадцать','семнадцать','восемнадцать','девятнадцать'];
  const hundreds = ['','сто','двести','триста','четыреста','пятьсот','шестьсот','семьсот','восемьсот','девятьсот'];

  function morph(num, f1, f2, f5){
    const n10 = num % 10;
    const n100 = num % 100;
    if (n100 >= 11 && n100 <= 19) return f5;
    if (n10 === 1) return f1;
    if (n10 >= 2 && n10 <= 4) return f2;
    return f5;
  }

  function triadToWords(num, gender){
    const h = Math.floor(num/100);
    const t = Math.floor((num%100)/10);
    const o = num%10;
    const out = [];
    if (h) out.push(hundreds[h]);
    if (t === 1){
      out.push(teens[o]);
    } else {
      if (t) out.push(tens[t]);
      if (o) out.push(ones[gender][o]);
    }
    return out.join(' ');
  }

  if (n === 0) return 'ноль рублей';

  const parts = [];
  const rub = n % 1000;
  let rest = Math.floor(n/1000);

  const th = rest % 1000;
  rest = Math.floor(rest/1000);

  const mil = rest % 1000;
  rest = Math.floor(rest/1000);

  const bil = rest % 1000;

  if (bil){
    parts.push(triadToWords(bil,0));
    parts.push(morph(bil,'миллиард','миллиарда','миллиардов'));
  }
  if (mil){
    parts.push(triadToWords(mil,0));
    parts.push(morph(mil,'миллион','миллиона','миллионов'));
  }
  if (th){
    parts.push(triadToWords(th,1));
    parts.push(morph(th,'тысяча','тысячи','тысяч'));
  }
  if (rub){
    parts.push(triadToWords(rub,0));
  }
  parts.push(morph(n,'рубль','рубля','рублей'));
  return parts.join(' ').replace(/\s+/g,' ').trim();
}
// Новая функция для создания PDF
function generatePDF() {
  if (!document.querySelector('#estimate-body table')) buildEstimate();
  
  const wrap = document.getElementById('estimate-body');
  const address = document.getElementById('estimate-address')?.value?.trim() || '';
  
  if (!wrap || !wrap.querySelector('table')) {
    const btnPdf = document.getElementById('btn-pdf');
    btnPdf.textContent = 'Нет данных';
    setTimeout(() => btnPdf.textContent = 'Скачать PDF', 1200);
    return;
  }

  // Создаем HTML для PDF
  const title = 'Смета' + (address ? ' — ' + address : '');
  const date = new Date().toLocaleString('ru-RU');
  // total for words (includes equipment + discount)
  recalcAll();
  const totalNow = _parseMoney(document.getElementById('grand-total')?.textContent);
  const pctNow = getDiscountPct();
  const discountNow = Math.round(totalNow * pctNow) / 100;
  const finalNow = Math.max(0, totalNow - discountNow);
  const wordsLine = numberToWordsRu(finalNow);
  
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
        .total-row {
          background: #f9f9f9;
          font-weight: bold;
        }
        .discount-row {
          color: #d32f2f;
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
      <div style="margin-top:14px; font-size:14px; color:#000;">${wordsLine}</div>
    </body>
    </html>
  `;

  // Открываем в новом окне для печати/сохранения как PDF
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Разрешите всплывающие окна для создания PDF');
    return;
  }
  
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Даем время на загрузку контента перед печатью
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
      } catch(e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
        } catch(e2) {}
        document.body.removeChild(ta);
        btnCopy.textContent = 'Скопировано ✅';
        setTimeout(() => btnCopy.textContent = 'Скопировать', 1500);
      }
    });
  }
  
  if (btnPdf) {
    btnPdf.addEventListener('click', generatePDF);
  }

  document.querySelectorAll('input[type="number"], .price-input, .equip-qty, .equip-price, .equip-name').forEach(inp => {
    inp.addEventListener('input', recalcAll);
    inp.addEventListener('change', recalcAll);
  });
}

document.addEventListener('DOMContentLoaded', () => { attachEstimateUI(); recalcAll(); });

// ---- Scroll FAB (умная) ----
function initScrollFab(){
  const fab = document.getElementById('scrollFab');
  if (!fab) return;
  const update = () => {
    const doc = document.documentElement;
    const maxScroll = Math.max(document.body.scrollHeight, doc.scrollHeight) - window.innerHeight;
    const y = window.scrollY || doc.scrollTop || 0;
    if (maxScroll < 200) { fab.style.display = 'none'; return; } else { fab.style.display = 'grid'; }
    const pos = y / (maxScroll || 1);
    if (pos < 0.20) { fab.dataset.mode = 'down'; fab.textContent = '↓'; fab.title = 'Вниз'; fab.setAttribute('aria-label','Прокрутить вниз'); }
    else { fab.dataset.mode = 'up'; fab.textContent = '↑'; fab.title = 'Вверх'; fab.setAttribute('aria-label','Прокрутить вверх'); }
  };
  update();
  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update);
  fab.addEventListener('click', () => {
    if (fab.dataset.mode === 'up'){
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const doc = document.documentElement;
      const bottom = Math.max(document.body.scrollHeight, doc.scrollHeight) - window.innerHeight;
      window.scrollTo({ top: bottom, behavior: 'smooth' });
    }
  });
}
document.addEventListener('DOMContentLoaded', initScrollFab);

try{ window.doCopy = doCopy; window.doPdf = doPdf; }catch(e){}

// discount-input listener
document.addEventListener('input', function(e){
  if (e.target && e.target.id === 'discount-input'){
    const wasOpen = !!document.querySelector('#estimate-body table');
    recalcAll();
    if (wasOpen) buildEstimate();
  }
});

// equipment inputs listener (keep estimate in sync)
document.addEventListener('input', function(e){
  if (e.target && (e.target.classList?.contains('equip-qty') || e.target.classList?.contains('equip-price') || e.target.classList?.contains('equip-name'))){
    const wasOpen = !!document.querySelector('#estimate-body table');
    recalcAll();
    if (wasOpen) buildEstimate();
  }
});


function setTheme(mode){
  const body = document.body;
  if(mode==='dark'){ body.classList.add('dark'); }
  else { body.classList.remove('dark'); }
  try{ localStorage.setItem('theme', mode); }catch(e){}
  const btn = document.getElementById('themeToggle');
  if(btn){
    const dark = body.classList.contains('dark');
    btn.title = dark ? 'Тёмная тема' : 'Светлая тема';
    btn.setAttribute('aria-pressed', String(dark));
  }
}
(function(){
  const body = document.body;
  let saved=null;
  try{ saved = localStorage.getItem('theme'); }catch(e){}
  if(saved==='dark') body.classList.add('dark');
  else if(saved==='light') body.classList.remove('dark');
  else body.classList.remove('dark'); // по умолчанию светлая
  document.addEventListener('click', function(e){
    if(e.target && (e.target.id==='themeToggle' || (e.target.closest && e.target.closest('#themeToggle')))){
      const dark = body.classList.contains('dark');
      setTheme(dark ? 'light' : 'dark');
    }
  });
  // sync on load
  setTheme(body.classList.contains('dark') ? 'dark' : 'light');
})();

document.addEventListener('DOMContentLoaded', () => {
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
    { name:'Монтаж корзины', unit:'шт.', price:'', editablePrice:true },
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
  EXTRA = EXTRA.sort((a,b) => a.name.localeCompare(b.name, 'ru'));

  // ensure DKS order
  const iBox = EXTRA.findIndex(x => x.name === 'Короб ДКС');
  const iEl  = EXTRA.findIndex(x => x.name === 'Элементы короба ДКС');
  if (iBox !== -1 && iEl !== -1 && iBox > iEl){
    const tmp = EXTRA[iBox]; EXTRA[iBox] = EXTRA[iEl]; EXTRA[iEl] = tmp;
  }

  buildMainWithExtras(MAIN);
  buildTable('#table-extra', EXTRA);

  try { attachEstimateUI?.(); } catch(e){}
  try { recalcAll?.(); } catch(e){}
  try { initScrollFab?.(); } catch(e){}
});


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js', { scope: './' }).catch(console.error);
  });
}
let _deferredPrompt=null;
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); _deferredPrompt=e; document.getElementById('installBtn')?.classList.remove('hidden'); });
window.addEventListener('appinstalled', ()=>{ document.getElementById('installBtn')?.classList.add('hidden'); _deferredPrompt=null; });
document.getElementById('installBtn')?.addEventListener('click', async ()=>{ if(!_deferredPrompt) return; _deferredPrompt.prompt(); await _deferredPrompt.userChoice.catch(()=>({})); _deferredPrompt=null; });