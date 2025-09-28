});
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
function rowHTML(r){
  const priceCell = r.editablePrice
    ? `<input type="number" class="price-input" min="0" step="1" value="${_parseMoney(r.price)}" style="width:90px; text-align:center;"> ₽`
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
    '07-09': { name:'Дополнительная трасса (за 1 м) 07–09 (BTU)', unit:'п.м.', price:1500 },
    '12':    { name:'Дополнительная трасса (за 1 м) 12 (BTU)',     unit:'п.м.', price:1700 },
    '18':    { name:'Дополнительная трасса (за 1 м) 18 (BTU)',     unit:'п.м.', price:1700 }
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
    const discRow = disc.pct > 0 ? `<tr>
      <td colspan="3" style="text-align:right;">Скидка ${disc.pct}%</td>
      <td style="white-space:nowrap; text-align:right;">−${disc.discount.toLocaleString('ru-RU')} ₽</td>
    </tr>` : '';
    const finalRow = `<tr>
      <td colspan="3" style="text-align:right;"><b>Итого со скидкой</b></td>
      <td style="white-space:nowrap; text-align:right;"><b>${(disc.withDisc || total).toLocaleString('ru-RU')} ₽</b></td>
    </tr>`;
    wrap.innerHTML = `
      <div class="kicker" style="margin-bottom:8px;">Автосформированный расчёт</div>
      <div style="overflow:auto;">
        <table class="calc-table">
          <thead><tr><th>Позиция</th><th>Кол-во</th><th>Цена ед.</th><th>Сумма</th></tr></thead>
          <tbody>${items}
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
  const rows = []; const table = wrap.querySelector('table'); if (!table) return '';
  table.querySelectorAll('tbody tr').forEach(tr => {
    const tds = tr.querySelectorAll('td');
    if (tds.length === 4){
      rows.push(`${tds[0].textContent.trim()} — ${tds[1].textContent.trim()} × ${tds[2].textContent.trim()} = ${tds[3].textContent.trim()}`);
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
      const wrap = document.getElementById('estimate-body');
      const address = document.getElementById('estimate-address')?.value?.trim() || '';
      if (!wrap || !wrap.querySelector('table')) { btnPdf.textContent='Нет данных'; setTimeout(()=>btnPdf.textContent='Скачать PDF',1200); return; }
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
  document.querySelectorAll('input[type="number"], .price-input').forEach(inp => {
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

// === PWA ===
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js', { scope: './' }).catch(console.error);
  });
}
let _deferredPrompt=null;
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); _deferredPrompt=e; document.getElementById('installBtn')?.classList.remove('hidden'); });
window.addEventListener('appinstalled', ()=>{ document.getElementById('installBtn')?.classList.add('hidden'); _deferredPrompt=null; });
document.getElementById('installBtn')?.addEventListener('click', async ()=>{ if(!_deferredPrompt) return; _deferredPrompt.prompt(); await _deferredPrompt.userChoice.catch(()=>({})); _deferredPrompt=null; });
