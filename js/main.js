// Número de WhatsApp de la empresa (código de país + número, sin + ni espacios)
const WHATSAPP = "570000000000";

// Supuestos de la calculadora
const POTENCIA_PANEL_W = 550;
const EFICIENCIA_SISTEMA = 0.8;   // pérdidas por inversor, cableado, temperatura
const FACTOR_CO2 = 0.164;         // kg de CO2 por kWh (ajustar según la red local)

const header = document.getElementById("header");
const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");

// Encabezado con fondo al hacer scroll
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll);
onScroll();

// Menú móvil
navToggle.addEventListener("click", () => nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));

// Contadores del hero
document.querySelectorAll("[data-count]").forEach((el) => {
  const meta = Number(el.dataset.count);
  const sufijo = meta === 500 ? "+" : "";
  let actual = 0;
  const paso = Math.max(1, Math.ceil(meta / 60));
  const timer = setInterval(() => {
    actual = Math.min(meta, actual + paso);
    el.textContent = actual + sufijo;
    if (actual === meta) clearInterval(timer);
  }, 25);
});

// Aparición de elementos al hacer scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Calculadora de ahorro
const formatoMoneda = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const formatoNumero = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

document.getElementById("calcForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const consumo = Number(document.getElementById("consumo").value);
  const precio = Number(document.getElementById("precio").value);
  const hsp = Number(document.getElementById("hsp").value);

  const kwp = consumo / (hsp * 30 * EFICIENCIA_SISTEMA);
  const paneles = Math.ceil((kwp * 1000) / POTENCIA_PANEL_W);
  const ahorroMes = consumo * precio * 0.9;
  const co2 = consumo * 12 * FACTOR_CO2;

  document.getElementById("rKwp").textContent = `${formatoNumero.format(kwp)} kWp`;
  document.getElementById("rPaneles").textContent = paneles;
  document.getElementById("rMes").textContent = formatoMoneda.format(ahorroMes);
  document.getElementById("rAnio").textContent = formatoMoneda.format(ahorroMes * 12);
  document.getElementById("rCo2").textContent = `${formatoNumero.format(co2)} kg`;
  document.getElementById("calcResult").hidden = false;
});

// Formulario de contacto: abre WhatsApp con el mensaje armado
document.getElementById("contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const datos = new FormData(e.target);
  const texto = [
    "Hola, quiero una cotización de paneles solares.",
    `Nombre: ${datos.get("nombre")}`,
    `Teléfono: ${datos.get("telefono")}`,
    datos.get("email") ? `Correo: ${datos.get("email")}` : "",
    `Proyecto: ${datos.get("tipo")}`,
    datos.get("mensaje") ? `Mensaje: ${datos.get("mensaje")}` : "",
  ].filter(Boolean).join("\n");
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, "_blank");
  e.target.reset();
});

// Botón flotante y año del footer
document.getElementById("waFloat").href =
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hola, quiero información sobre paneles solares.")}`;
document.getElementById("year").textContent = new Date().getFullYear();
