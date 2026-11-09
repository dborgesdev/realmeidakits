(() => {
  'use strict';
  const form = document.querySelector('[data-rak-account]');
  if (!form) return;
  const cpf = form.querySelector('[name="cpf"]');
  const phone = form.querySelector('[name="phone"]');
  function validCpf(value) {
    const digits=value.replace(/\D/g,'');
    if(!/^\d{11}$/.test(digits)||/^(\d)\1{10}$/.test(digits))return false;
    for(let length=9;length<11;length++){
      let sum=0;for(let i=0;i<length;i++)sum+=Number(digits[i])*(length+1-i);
      const digit=(sum*10)%11;if(Number(digits[length])!==(digit===10?0:digit))return false;
    }
    return true;
  }
  function validate(){
    if(cpf)cpf.setCustomValidity(validCpf(cpf.value)?'':'Informe um CPF válido.');
    if(phone)phone.setCustomValidity(/^[1-9]{2}(?:[2-5]\d{7}|9\d{8})$/.test(phone.value.replace(/\D/g,''))?'':'Informe telefone com DDD válido.');
  }
  form.addEventListener('input',validate);
  form.addEventListener('submit',event=>{validate();if(!form.reportValidity())event.preventDefault();});
})();
