
// ==== v0.2.4 базовый набор ====
const MAIN = [
  { name:'Штроба в бетоне', unit:'п.м.', price:2500, step:0.5 },
  { name:'Штроба в кирпиче', unit:'п.м.', price:1500, step:0.5 },
  { name:'Штроба под дренаж в бетоне', unit:'п.м.', price:800, step:0.5 },
  { name:'Штроба под дренаж в кирпиче', unit:'п.м.', price:600, step:0.5 },
  { name:'Установка помпы', unit:'шт.', price:0, step:1, editablePrice:true },
  { name:'Пробивка доп. отверстия (ГКЛ и т.п., Ø до 52 мм)', unit:'шт.', price:0, step:1, editablePrice:true }
];

const EXTRA = [
  { name:'Демонтаж кондиционера 07–12', unit:'шт.', price:3000, step:1 },
  { name:'Демонтаж внутреннего/наружного блока (за каждый)', unit:'шт.', price:2000, step:1 },
  { name:'Разборка/сборка потолка «армстронг»', unit:'шт.', price:200, step:1 },
  { name:'Чистка кондиционера (внутр. и наружн. блок)', unit:'шт.', price:3000, step:1 },
  { name:'Чистка кондиционера — полный комплекс', unit:'шт.', price:4000, step:1 },
  { name:'Автовышка (от 3 часов)', unit:'час', price:2000, step:1, note:'Минимум 3 часа' },
  { name:'Удлинение провода', unit:'м.', price:350, step:0.5 },
  { name:'Кабель-канал под провод', unit:'м.', price:500, step:0.5 },
  // Новые позиции (единственное изменение!)
  { name:'Короб DKC', unit:'п.м.', price:1200, step:1 },
  { name:'Элементы короба', unit:'шт.', price:350, step:1 },
  { name:'Демонтаж/монтаж стеклопакета', unit:'шт.', price:1000, step:1 },
  { name:'Дозаправка фреоном', unit:'г.', price:7, step:100 },
  { name:'Дополнительная трасса 1/4–3/8 (медь+утеплитель)', unit:'п.м.', price:0, step:0.5, editablePrice:true },
  { name:'Дополнительная трасса 1/4–1/2 (медь+утеплитель)', unit:'п.м.', price:0, step:0.5, editablePrice:true },
  { name:'Дополнительная трасса 3/8–5/8 (медь+утеплитель)', unit:'п.м.', price:0, step:0.5, editablePrice:true }
];

function format(n){ return (n||0).toLocaleString('ru-RU'); }
function _parseMoney(t){ if(!t) return 0; const s=String(t).replace(/[^\d.,-]/g,'').replace(/[\u00A0 ]/g,'').replace(',', '.'); const n=Number(s); return isNaN(n)?0:n; }

function renderTable(selector, data){
  const tbody = document.querySelector(selector + ' tbody');
  tbody.innerHTML = data.map(row => `
    <tr data-editable-price="${row.editablePrice ? '1':'0'}">
      <td>${row.name}${row.note?`<div class="kicker" style="font-weight:400">${row.note}</div>`:''}</td>
      <td><input type="number" min="${row.min ?? 0}" ${row.max!=null?`max="${row.max}"`:''} step="${row.step || 1}" value="0"></td>
      <td>${row.unit || ''}</td>
      <td class="num price">${
        row.editablePrice ? `<input class="price-input" type="number" min="0" step="50" value="${row.price||0}">`
                          : `${format(row.price)} ₽`
      }</td>
      <td class="num sum">0 ₽</td>
    </tr>
  `).join('');
}

function strictRecalc(){
  let subTotal = 0;
  document.querySelectorAll('#table-main tbody tr, #table-extra tbody tr').forEach(tr => {
    const qty = parseFloat((tr.querySelector('td:nth-child(2) input')?.value||'').replace(',','.'))||0;
    const priceInput = tr.querySelector('.price-input');
    const unitPrice = priceInput ? (parseFloat(priceInput.value)||0) : _parseMoney(tr.querySelector('.price')?.textContent||'');
    const sum = Math.max(0, qty*unitPrice);
    const sumCell = tr.querySelector('.sum'); if (sumCell){ sumCell.textContent = format(sum)+' ₽'; }
    subTotal += sum||0;
  });
  const grand = document.getElementById('grand-total'); if (grand) grand.textContent = format(subTotal);
  return subTotal;
}

function buildEstimate(){
  const total = strictRecalc();
  const rows = []; let subTotal = 0;
  document.querySelectorAll('#table-main tbody tr, #table-extra tbody tr').forEach(tr => {
    const name = tr.querySelector('td:nth-child(1)')?.childNodes[0]?.textContent.trim() || '';
    const qty  = parseFloat((tr.querySelector('td:nth-child(2) input')?.value||'').replace(',','.'))||0;
    const unit = tr.querySelector('td:nth-child(3)')?.textContent.trim() || '';
    const unitPrice = _parseMoney(tr.querySelector('.price')?.textContent) || (parseFloat(tr.querySelector('.price-input')?.value)||0);
    const sum  = qty*unitPrice;
    if (qty>0 && sum>0) rows.push({name, qty, unit, unitPrice, sum});
    subTotal += sum||0;
  });
  const wrap = document.getElementById('estimate-body');
  if (!rows.length){ wrap.innerHTML = '<p class="kicker">Пока ничего не выбрано.</p>'; return; }
  const items = rows.map(r=>`<tr><td>${r.name}</td><td style="text-align:center;">${r.qty} ${r.unit}</td><td>${format(r.unitPrice)} ₽</td><td style="text-align:right;"><b>${format(r.sum)} ₽</b></td></tr>`).join('');
  wrap.innerHTML = `<div style="overflow:auto;"><table class="calc-table"><thead><tr><th>Позиция</th><th>Кол-во</th><th>Цена ед.</th><th>Сумма</th></tr></thead><tbody>
    ${items}
    <tr><td colspan="3" style="text-align:right;"><b>Итого</b></td><td style="text-align:right;"><b>${format(subTotal)} ₽</b></td></tr>
  </tbody></table></div>`;
  document.getElementById('estimate')?.classList.remove('hidden');
}

function wire(){
  document.querySelectorAll('input[type="number"], .price-input').forEach(inp=>{
    if(!inp._wired){ inp.addEventListener('input', strictRecalc); inp.addEventListener('change', strictRecalc); inp._wired=true; }
  });
  const br=document.getElementById('btn-estimate'); if(br && !br._wired){ br.addEventListener('click', ()=>{ buildEstimate(); }); br._wired=true; }
  const bc=document.getElementById('btn-copy-estimate'); if(bc && !bc._wired){ bc.addEventListener('click', async ()=>{
    buildEstimate();
    try{ await navigator.clipboard.writeText(document.getElementById('estimate-body')?.innerText||''); }catch(e){}
  }); bc._wired=true; }
  const bp=document.getElementById('btn-estimate-pdf'); if(bp && !bp._wired){ bp.addEventListener('click', ()=>{
    buildEstimate();
    const w=window.open('', '_blank'); if(!w) return;
    const html=document.getElementById('estimate-body')?.innerHTML||'<p>Смета пуста</p>';
    w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Расчёт</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Arial,sans-serif;padding:20px;}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;}th{text-align:left}</style></head><body><h2>Расчёт</h2>'+html+'</body></html>');
    w.document.close(); setTimeout(()=>w.print(),300);
  }); bp._wired=true; }
}

function init(){ renderTable('#table-main', MAIN); renderTable('#table-extra', EXTRA); wire(); strictRecalc(); }
if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
