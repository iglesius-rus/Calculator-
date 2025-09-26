
/* Аккордеон */
function setMaxHeight(el, open) { if (open) el.style.maxHeight = el.scrollHeight + 'px'; else el.style.maxHeight = '0px'; }
function scrollToPanel(panel){ panel.scrollIntoView({ behavior:'smooth', block:'start' }); }
function saveState(){ try { const openIds = Array.from(document.querySelectorAll('.content-section.open')).map(p => p.id); localStorage.setItem('openPanels', JSON.stringify(openIds)); } catch(e){} }
function restoreState(){ try { const openIds = JSON.parse(localStorage.getItem('openPanels') || '[]'); openIds.forEach(id => { const panel = document.getElementById(id); const btn = panel?.previousElementSibling; if (panel && btn) { panel.classList.add('open'); setMaxHeight(panel, true); btn.classList.add('active'); btn.setAttribute('aria-expanded', 'true'); } }); } catch(e){} }

// ===== Калькулятор стоимости =====
function format(n) { return n.toLocaleString('ru-RU'); }
function _parseMoney(t){
  if (t == null) return 0;
  if (typeof t === 'number') return t;
  const s = String(t)
    .replace(/[\s\u00A0]/g, '')
    .replace(/[₽рР][\.\s]*|руб\.?/g, '')
    .replace(/,/g, '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}
function rowHTML(r){
  const priceCell = r.editablePrice
    ? `<input type="number" class="price-input" min="0" step="1" value="${_parseMoney(r.price)}"> ₽`
    : `${format(_parseMoney(r.price))} ₽`;
  const step = (r.step ?? 1);
  return `
    <tr data-name="${r.name}" data-unit="${r.unit}" data-price="${_parseMoney(r.price)}" data-step="${step}">
      <td data-label="Наименование работ" aria-label="Наименование работ">${r.name}</td>
      <td data-label="Кол-во" aria-label="Кол-во"><input type="number" inputmode="numeric" pattern="[0-9]*" min="0" step="${step}" value=""></td>
      <td data-label="Ед. изм." aria-label="Ед. изм.">${r.unit}</td>
      <td class="price" data-label="Цена ед." aria-label="Цена ед.">${priceCell}</td>
      <td class="sum" data-sum="0" data-label="Цена" aria-label="Цена">0 ₽</td>
    </tr>`;
}

function extractBTU(name){
  const m = String(name).match(/\b(07-09|12|18)\b/);
  return m ? m[1] : null;
}
function buildMainWithExtras(MAIN){
  const tbody = document.querySelector('#table-main tbody');
  const EXTRA_MAP = {
    '07-09': { name:'Дополнительная трасса (за 1 м) 07–09 (BTU)', unit:'п.м.', price:1500 },
    '12':    { name:'Дополнительная трасса (за 1 м) 12 (BTU)',     unit:'п.м.', price:1700 },
    '18':    { name:'Дополнительная трасса (за 1 м) 18 (BTU)',     unit:'п.м.', price:1700 }
  };
  const rows = [];
  MAIN.forEach(m => {
    rows.push(m);
    if (/BTU/i.test(m.name)){
      const key = extractBTU(m.name) || '12';
      rows.push(EXTRA_MAP[key]);
    }
  });
  tbody.innerHTML = rows.map(r => rowHTML(r)).join('');
}
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

const TBODIES = {
  main: () => document.querySelector('#table-main tbody'),
  extra: () => document.querySelector('#table-extra tbody')
};
function recalcAll(){
  let total = 0;
  const rows = [...(TBODIES.main()?.querySelectorAll('tr') || []), ...(TBODIES.extra()?.querySelectorAll('tr') || [])];
  rows.forEach(tr => {
    const qty = _parseMoney(tr.querySelector('input[type="number"]')?.value);
    const priceEl = tr.querySelector('.price-input');
    const unitPrice = priceEl ? _parseMoney(priceEl.value) : _parseMoney(tr.dataset.price);
    const sum = Math.max(0, qty) * Math.max(0, unitPrice);
    const cell = tr.querySelector('.sum');
    if (cell){
      cell.textContent = (sum || 0).toLocaleString('ru-RU') + ' ₽';
      cell.dataset.sum = String(sum || 0);
    }
    total += sum || 0;
  });
  const grand = document.getElementById('grand-total');
  if (grand) grand.textContent = (total || 0).toLocaleString('ru-RU');
  applyDiscountToTotal(total);
  saveCalcState();
}
    total += sum || 0;
  });
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
  const collect = [...(TBODIES.main()?.querySelectorAll('tr')||[]), ...(TBODIES.extra()?.querySelectorAll('tr')||[])];
  collect.forEach(tr => {
    const name = tr.dataset.name || '';
    const unit = tr.dataset.unit || '';
    const qtyEl = tr.querySelector('input[type="number"]');
    const qty = _parseMoney(qtyEl?.value);
    const priceEl = tr.querySelector('.price-input');
    const unitPrice = priceEl ? _parseMoney(priceEl.value) : _parseMoney(tr.dataset.price);
    const sum = qty * unitPrice;
    if (qty > 0 && sum > 0){ rows.push({name, qty, unit, unitPrice, sum}); }
  });
  const wrap = document.getElementById('estimate-body');
  if (!wrap) return;
  if (!rows.length){
    wrap.innerHTML = '<p class="kicker">Пока ничего не выбрано. Укажите количество. Смета формируется автоматически при копировании или печати.</p>';
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
            <tr><td colspan="3" style="text-align:right;"><b>Итого</b></td><td style="text-align:right;"><b>${total.toLocaleString('ru-RU')} ₽</b></td></tr>
            ${discRow}
            ${finalRow}
          </tbody>
        </table>
      </div>`;
  }
  document.getElementById('estimate')?.classList.remove('hidden');
}

function estimateToPlainText(){
  const wrap = document.getElementById('estimate-body'); if (!wrap) return '';
  const table = wrap.querySelector('table'); if (!table) return '';
  const rows = []; let total = 0;
  table.querySelectorAll('tbody tr').forEach(tr => {
    const tds = tr.querySelectorAll('td');
    if (tds.length === 4){
      const name = tds[0].textContent.trim();
      const qtyPrice = tds[1].textContent.trim();
      const unitPrice = tds[2].textContent.trim();
      const sum = tds[3].textContent.trim();
      rows.push(`${name} — ${qtyPrice} × ${unitPrice} = ${sum}`);
      const s = _parseMoney(sum);
      if (s) total += s;
    }
  });
  const address = document.getElementById('estimate-address')?.value?.trim();
  let tail = '';
  const discLine = document.getElementById('discount-line');
  if (discLine && discLine.style.display !== 'none'){
    const pct = document.getElementById('discount-pct')?.textContent || '0';
    const da = document.getElementById('discount-amount')?.textContent || '0';
    const gw = document.getElementById('grand-with-discount')?.textContent || String(total);
    tail = `\nИтого: ${total.toLocaleString('ru-RU')} ₽\nСкидка ${pct}%: −${da} ₽\nИтого со скидкой: ${gw} ₽`;
  } else {
    tail = `\nИтого: ${total.toLocaleString('ru-RU')} ₽`;
  }
  return (rows.join('\n') + tail + (address ? `\nАдрес: ${address}` : '')).trim();
}
  });
  const address = document.getElementById('estimate-address')?.value?.trim();
  const totalLine = wrap.querySelector('tbody tr:last-child td:last-child')?.textContent?.trim();
  return (rows.join('\n') + (totalLine ? `\nИтого: ${totalLine}` : '') + (address ? `\nАдрес: ${address}` : '')).trim();
}

function attachEstimateUI(){
  const btnCopy = document.getElementById('btn-copy');
  const btnPdf = document.getElementById('btn-pdf');
  if (btnCopy){
    btnCopy.addEventListener('click', async () => {
      if (!document.querySelector('#estimate-body table')) buildEstimate();
      const text = estimateToPlainText();
      if (!text){ btnCopy.textContent='Нет данных'; setTimeout(()=>btnCopy.textContent='Скопировать',1200); return; }
      try { await navigator.clipboard.writeText(text); btnCopy.textContent='Скопировано ✅'; setTimeout(()=>btnCopy.textContent='Скопировать',1500); }
      catch(e){
        const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
        ta.select(); try { document.execCommand('copy'); } catch(e2){} document.body.removeChild(ta);
        btnCopy.textContent='Скопировано ✅'; setTimeout(()=>btnCopy.textContent='Скопировать',1500);
      }
    });
  }
  if (btnPdf){
  btnPdf.addEventListener('click', () => {
    if (!document.querySelector('#estimate-body table')) buildEstimate();
    window.print();
  });
}
      const inner = wrap.innerHTML.replace(/<\/script>/ig, '<\\/script>');
      const title = 'Смета' + (address ? ' — ' + address : '');
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; }
          h1 { margin: 0 0 10px; font-size: 20px; }
          .meta { font-size: 12px; opacity: .8; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 6px; }
          th, td { border-bottom: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
        </style></head><body>
        <h1>${title}</h1>
        <div class="meta">Дата: ${new Date().toLocaleString('ru-RU')}</div>
        ${address ? `<div class="meta"><b>Адрес:</b> ${address}</div>` : ''}
        ${inner}
        <script>window.print();</script>
        </body></html>`;
      const w = window.open('', '_blank'); if (!w) return;
      w.document.open(); w.document.write(html); w.document.close();
    });
  }
      inp.addEventListener('change', recalcAll);
  });
}
function debounce(fn, d=200){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), d); }; }
const recalcDebounced = debounce(recalcAll, 180);
document.addEventListener('input', e => {
  if (e.target && (e.target.matches('input[type="number"]') || e.target.classList.contains('price-input') || e.target.id === 'discount-input')){
    recalcDebounced();
  }
});
document.addEventListener('change', e => {
  if (e.target && (e.target.matches('input[type="number"]') || e.target.classList.contains('price-input') || e.target.id === 'discount-input')){
    recalcAll();
  }
});
document.addEventListener('DOMContentLoaded', () => { attachEstimateUI(); recalcAll(); restoreCalcState(); });

function saveCalcState(){
  const state = { discount: getDiscountPct(), rows: [] };
  const collect = [...(TBODIES.main()?.querySelectorAll('tr')||[]), ...(TBODIES.extra()?.querySelectorAll('tr')||[])];
  collect.forEach(tr => {
    const name = tr.dataset.name;
    if(!name) return;
    const qty = _parseMoney(tr.querySelector('input[type="number"]')?.value);
    const priceEl = tr.querySelector('.price-input');
    const unitPrice = priceEl ? _parseMoney(priceEl.value) : undefined;
    state.rows.push({ name, qty, unitPrice });
  });
  try{ localStorage.setItem('calcState', JSON.stringify(state)); }catch(e){}
}
function restoreCalcState(){
  let state=null;
  try{ state = JSON.parse(localStorage.getItem('calcState')||'null'); }catch(e){}
  if(!state) return;
  if(typeof state.discount === 'number'){
    const di = document.getElementById('discount-input');
    if(di) di.value = String(state.discount);
  }
  const map = new Map((state.rows||[]).map(r => [r.name, r]));
  const collect = [...(TBODIES.main()?.querySelectorAll('tr')||[]), ...(TBODIES.extra()?.querySelectorAll('tr')||[])];
  collect.forEach(tr => {
    const name = tr.dataset.name;
    if(!name) return;
    const rec = map.get(name);
    if(!rec) return;
    const qtyEl = tr.querySelector('input[type="number"]');
    if(qtyEl && Number.isFinite(rec.qty)) qtyEl.value = rec.qty;
    const priceEl = tr.querySelector('.price-input');
    if(priceEl && Number.isFinite(rec.unitPrice)) priceEl.value = rec.unitPrice;
  });
  recalcAll();
}

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
