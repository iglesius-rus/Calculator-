
// ==== Данные (минимум из последних правок) ====
const MAIN = [
  { name:'Штроба в бетоне', unit:'м.п.', price:2500, step:0.5 },
  { name:'Штроба в кирпиче', unit:'м.п.', price:1500, step:0.5 },
  { name:'Штроба под дренаж в бетоне', unit:'м.п.', price:800, step:0.5 },
  { name:'Штроба под дренаж в кирпиче', unit:'м.п.', price:600, step:0.5 }
];

const EXTRA = [
  { name:'Удлинение провода', unit:'м.', price:350, step:0.5 },
  { name:'Кабель-канал под провод', unit:'м.', price:500, step:0.5 },
  { name:'Демонтаж/монтаж стеклопакета', unit:'шт.', price:1000, step:1 },
  // Фреон: цена 7 руб за грамм, вводим граммы (шаг 100)
  { name:'Дозаправка фреоном', unit:'г.', price:7, step:100 },
  // Доп. трассы с редактируемой ценой
  { name:'Дополнительная трасса 1/4–3/8 (медь+утеплитель)', unit:'п.м.', price:0, step:0.5, editablePrice:true },
  { name:'Дополнительная трасса 1/4–1/2 (медь+утеплитель)', unit:'п.м.', price:0, step:0.5, editablePrice:true },
  { name:'Дополнительная трасса 3/8–5/8 (медь+утеплитель)', unit:'п.м.', price:0, step:0.5, editablePrice:true },
  // Скидка в виде отдельной строки процента
  { name:'Персональная скидка', unit:'%', price:0, step:1, min:0, max:100, discount:true }
];

function format(n){ return (n||0).toLocaleString('ru-RU'); }
function _parseMoney(t){ if(!t) return 0; const s=String(t).replace(/[^\d.,-]/g,'').replace(/[\u00A0 ]/g,'').replace(',', '.'); const n=Number(s); return isNaN(n)?0:n; }

function renderTable(selector, data){
  const tbody = document.querySelector(selector + ' tbody');
  if (!tbody) return;
  tbody.innerHTML = data.map(row => `
    <tr data-discount="${row.discount ? '1':'0'}" data-editable-price="${row.editablePrice ? '1':'0'}">
      <td>${row.name}</td>
      <td><input type="number" min="${row.min ?? 0}" ${row.max!=null?`max="${row.max}"`:''} step="${row.step || 1}" value="0"></td>
      <td>${row.unit || ''}</td>
      <td class="num price">${
        row.discount ? '—' :
        (row.editablePrice ? `<input class="price-input" type="number" min="0" step="50" value="${row.price||0}">` : `${format(row.price)} ₽`)
      }</td>
      <td class="num sum">0 ₽</td>
    </tr>
  `).join('');
}

function getDiscountPct(){
  const dtr = document.querySelector('#table-extra tbody tr[data-discount="1"]');
  const input = dtr ? dtr.querySelector('td:nth-child(2) input') : document.getElementById('discount-input');
  if (!input) return 0;
  const v = parseFloat(String(input.value).replace(',', '.')) || 0;
  return Math.min(100, Math.max(0, v));
}

function applyDiscountToTotal(total){
  const pct = getDiscountPct();
  const discount = Math.round(total * pct) / 100;
  const final = Math.max(0, total - discount);
  const line = document.getElementById('discount-line');
  if (line){
    if (pct > 0){
      line.style.display = '';
      const dp = document.getElementById('discount-pct'); if (dp) dp.textContent = pct.toLocaleString('ru-RU');
      const da = document.getElementById('discount-amount'); if (da) da.textContent = format(discount);
      const gw = document.getElementById('grand-with-discount'); if (gw) gw.textContent = format(final);
    } else {
      line.style.display = 'none';
    }
  }
  return {pct, discount, final};
}

function strictRecalc(){
  let subTotal = 0;
  document.querySelectorAll('#table-main tbody tr, #table-extra tbody tr').forEach(tr => {
    const isDiscount = tr.getAttribute('data-discount') === '1';
    const qty = parseFloat((tr.querySelector('td:nth-child(2) input')?.value||'').replace(',', '.')) || 0;
    const priceInput = tr.querySelector('.price-input');
    const unitPrice = isDiscount ? 0 : (priceInput ? (parseFloat(priceInput.value)||0) : _parseMoney(tr.querySelector('.price')?.textContent||''));
    const sum = isDiscount ? 0 : Math.max(0, qty*unitPrice);
    const sumCell = tr.querySelector('.sum');
    if (sumCell){ sumCell.textContent = (isDiscount?0:sum).toLocaleString('ru-RU') + ' ₽'; sumCell.dataset.sum = String(isDiscount?0:sum); }
    if (!isDiscount) subTotal += sum||0;
  });
  // скидка как строка таблицы
  let discTotal = 0;
  document.querySelectorAll('#table-extra tbody tr[data-discount="1"]').forEach(tr => {
    const pct = Math.min(100, Math.max(0, parseFloat((tr.querySelector('td:nth-child(2) input')?.value||'').replace(',', '.')) || 0));
    const amount = Math.round(subTotal * pct)/100;
    const sumCell = tr.querySelector('.sum');
    if (sumCell){ sumCell.textContent = '−' + format(amount) + ' ₽'; sumCell.dataset.sum = String(-amount); }
    discTotal += amount||0;
  });
  const total = Math.max(0, subTotal - discTotal);
  const grand = document.getElementById('grand-total'); if (grand) grand.textContent = format(total);
  applyDiscountToTotal(total);
  return total;
}

function buildEstimate(){
  const total = strictRecalc();
  const rows = [];
  let subTotal = 0, discountPct = 0, discountAmount = 0;
  document.querySelectorAll('#table-main tbody tr, #table-extra tbody tr').forEach(tr => {
    const isDiscount = tr.getAttribute('data-discount') === '1';
    const name = tr.querySelector('td:nth-child(1)')?.textContent.trim() || '';
    const qty  = parseFloat((tr.querySelector('td:nth-child(2) input')?.value||'').replace(',', '.')) || 0;
    const unit = tr.querySelector('td:nth-child(3)')?.textContent.trim() || '';
    const unitPrice = _parseMoney(tr.querySelector('.price')?.textContent) || (parseFloat(tr.querySelector('.price-input')?.value)||0);
    const sum  = _parseMoney(tr.querySelector('.sum')?.textContent);
    if (isDiscount){
      discountPct = Math.min(100, Math.max(0, qty));
      discountAmount = Math.round(subTotal * discountPct)/100;
    } else {
      if (qty > 0 && sum > 0) rows.push({name, qty, unit, unitPrice, sum});
      subTotal += sum || 0;
    }
  });
  const wrap = document.getElementById('estimate-body'); if (!wrap) return;
  if (!rows.length && discountPct <= 0){
    wrap.innerHTML = '<p class="kicker">Пока ничего не выбрано. Укажите количество и нажмите «Рассчёт».</p>';
  } else {
    const items = rows.map(r => `<tr>
      <td>${r.name}</td><td style="text-align:center;">${r.qty} ${r.unit}</td>
      <td style="white-space:nowrap;">${format(r.unitPrice)} ₽</td>
      <td style="white-space:nowrap; text-align:right;"><b>${format(r.sum)} ₽</b></td>
    </tr>`).join('');
    const discRow = discountPct>0 ? `<tr><td colspan="3" style="text-align:right;">Скидка ${discountPct}%</td>
      <td style="white-space:nowrap; text-align:right; color:#a3e635;">−${format(discountAmount)} ₽</td></tr>` : '';
    const final = Math.max(0, subTotal - discountAmount);
    wrap.innerHTML = `<div style="overflow:auto;">
      <table class="calc-table"><thead><tr><th>Позиция</th><th>Кол-во</th><th>Цена ед.</th><th>Сумма</th></tr></thead>
      <tbody>${items}
        <tr><td colspan="3" style="text-align:right;"><b>Итого</b></td><td style="text-align:right;"><b>${format(subTotal)} ₽</b></td></tr>
        ${discRow}
        <tr><td colspan="3" style="text-align:right;"><b>Итого со скидкой</b></td><td style="text-align:right;"><b>${format(final)} ₽</b></td></tr>
      </tbody></table></div>`;
  }
  document.getElementById('estimate')?.classList.remove('hidden');
}

function wire(){
  document.querySelectorAll('input[type="number"], .price-input').forEach(inp => {
    if (!inp._wired){ inp.addEventListener('input', strictRecalc); inp.addEventListener('change', strictRecalc); inp._wired=true; }
  });
  const br = document.getElementById('btn-estimate'); if (br && !br._wired){ br.addEventListener('click', ()=>{ strictRecalc(); buildEstimate(); }); br._wired=true; }
  const bc = document.getElementById('btn-copy-estimate'); if (bc && !bc._wired){ bc.addEventListener('click', async ()=>{ strictRecalc(); buildEstimate(); try{ await navigator.clipboard.writeText(document.getElementById('estimate-body')?.innerText||''); }catch(e){} }); bc._wired=true; }
  const bp = document.getElementById('btn-estimate-pdf'); if (bp && !bp._wired){ bp.addEventListener('click', ()=>{ strictRecalc(); buildEstimate(); const w=window.open('', '_blank'); if(!w) return; const html=document.getElementById('estimate-body')?.innerHTML||'<p>Смета пуста</p>'; w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Расчёт</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Arial,sans-serif;padding:20px;}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;}th{text-align:left}</style></head><body><h2>Расчёт</h2>${html}</body></html>`); w.document.close(); setTimeout(()=>w.print(),300); }); bp._wired=true; }
}

function init(){
  renderTable('#table-main', MAIN);
  renderTable('#table-extra', EXTRA);
  wire();
  strictRecalc();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
