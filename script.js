// v1.022 — Only "Скопировать смету" shows estimate
(function(){
  const copyBtn = document.getElementById('copyBtn');
  const resultWrap = document.getElementById('resultWrap');
  const result = document.getElementById('result');

  function buildEstimate(){
    // здесь твоя логика расчёта сметы со всеми позициями
    return "Смета (пример)";
  }

  async function copyAndReveal(){
    const text = buildEstimate();
    try{
      await navigator.clipboard.writeText(text);
    }catch(e){
      result.value = text;
      result.select();
      document.execCommand('copy');
    }
    result.value = text;
    resultWrap.classList.remove('hidden');
  }

  copyBtn.addEventListener('click', copyAndReveal);
})();