/* global document */
(() => {
  const number = "5521994123883";
  if (!/^[1-9]\d{7,14}$/.test(number) || document.querySelector(".rak-whatsapp")) return;

  const link = document.createElement("a");
  link.className = "rak-whatsapp";
  link.href = "https://wa.me/" + number + "?text=" + encodeURIComponent(
    "Olá, Re Almeida Kits! Gostaria de informações sobre a retirada de kits."
  );
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", "Falar com a Re Almeida Kits no WhatsApp (abre em nova aba)");
  const icon = document.createElement("img");
  icon.src = "/design/whatsapp.svg";
  icon.alt = "";
  icon.width = 28;
  icon.height = 28;
  link.append(icon);
  document.body.append(link);
})();
