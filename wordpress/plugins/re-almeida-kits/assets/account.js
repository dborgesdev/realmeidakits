(() => {
  const forms = document.querySelectorAll('[data-rak-account],.woocommerce form.login,.woocommerce form.register,.woocommerce form.woocommerce-EditAccountForm,.woocommerce form.lost_reset_password,form.checkout');
  const digits = value => value.replace(/\D/g, '');
  const phoneNumber = value => { const n=digits(value); return n.startsWith('55') && [12,13].includes(n.length) ? n.slice(2) : n; };
  function validCpf(value) {
    const n=digits(value);
    if(!/^\d{11}$/.test(n)||/^(\d)\1{10}$/.test(n))return false;
    for(let length=9;length<11;length++){let sum=0;for(let i=0;i<length;i++)sum+=Number(n[i])*(length+1-i);const digit=sum*10%11;if(Number(n[length])!==(digit===10?0:digit))return false;}
    return true;
  }
  for (const form of forms) {
    const kind = input => /^(?:rak_|billing_)?cpf$/.test(input.name) ? 'cpf' : /^(?:rak_|billing_)?phone$/.test(input.name) ? 'phone' : '';
    function error(input) {
      if (!input.name || input.type === 'hidden') return;
      const type=kind(input), value=input.value;
      let message='';
      if (type==='cpf' && value && !validCpf(value)) message='Informe um CPF válido.';
      if (type==='phone' && value && !/^[1-9]{2}(?:[2-5]\d{7}|9\d{8})$/.test(phoneNumber(value))) message='Informe telefone com DDD válido.';
      if (input.type==='date' && value) { const date=new Date(value+'T00:00:00Z'); if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value||value<'1900-01-01'||value>(input.max||'9999-12-31'))message='Informe uma data de nascimento válida.'; }
      input.setCustomValidity(message);
      let note=form.querySelector('[data-rak-error="'+input.name+'"]');
      if (message || !input.validity.valid) {
        if(!note){note=document.createElement('span');note.dataset.rakError=input.name;note.className='rak-field-error';note.id=(input.id||input.name)+'-rak-error';note.setAttribute('role','alert');input.insertAdjacentElement('afterend',note);}
        note.textContent=message||input.validationMessage;input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby',note.id);
      } else { note?.remove();input.removeAttribute('aria-invalid');input.removeAttribute('aria-describedby'); }
    }
    form.addEventListener('invalid', event => error(event.target), true);
    form.addEventListener('input', event => {
      const input=event.target;if(!(input instanceof window.HTMLInputElement))return;
      const type=kind(input);
      if(type){
        const left=digits(input.value.slice(0,input.selectionStart??input.value.length)).length;
        const n=(type==='phone'?phoneNumber(input.value):digits(input.value)).slice(0,11);
        const formatted=type==='cpf'?n.replace(/^(\d{3})(\d)/,'$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/(\d{3})(\d{1,2})$/,'$1-$2'):n.length>2?'('+n.slice(0,2)+') '+n.slice(2).replace(n.length===11?/^(\d{5})(\d)/:/^(\d{4})(\d)/,'$1-$2'):n;
        input.value=formatted;let offset=0,count=0;while(offset<formatted.length&&count<left){if(/\d/.test(formatted[offset]))count++;offset++;}input.setSelectionRange(offset,offset);
      }
      if(input.getAttribute('aria-invalid')==='true')error(input);
    });
    form.addEventListener('focusout',event=>{if(event.target instanceof window.HTMLInputElement)error(event.target);});
    form.addEventListener('submit',event=>{
      for(const input of form.querySelectorAll('input:not([type=hidden])')){if(input.type==='email')input.value=input.value.trim().toLowerCase();error(input);}
      if(!form.reportValidity())event.preventDefault();
    });
  }
})();
