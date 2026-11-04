// Número de WhatsApp de la empresa (código de país + número, sin + ni espacios)
const WHATSAPP = "570000000000";

// Supuestos del simulador (valores aproximados para Colombia; ajústalos a tus precios)
const POTENCIA_PANEL_W = 550;
const AREA_PANEL_M2 = 2.6;        // incluye el espacio entre paneles
const EFICIENCIA_SISTEMA = 0.8;   // pérdidas por inversor, cableado, temperatura
const DEGRADACION_ANUAL = 0.005;  // los paneles pierden ~0,5 % de producción por año
const FACTOR_CO2 = 0.164;         // kg de CO2 por kWh (red colombiana)
const ANIOS = 25;

// Costo instalado por kWp según el tipo de proyecto (COP)
const TIPOS = [
  { id: "residencial", nombre: "Residencial", costoKwp: 4200000 },
  { id: "comercial", nombre: "Comercial / industrial", costoKwp: 3600000 },
  { id: "aislado", nombre: "Aislado con baterías", costoKwp: 6800000 },
];

// Horas de sol pico promedio al día (aproximadas)
const CIUDADES = [
  ["Barranquilla", 5.5], ["Bogotá", 4.1], ["Bucaramanga", 4.6], ["Cali", 4.5],
  ["Cartagena", 5.3], ["Cúcuta", 5.0], ["Ibagué", 4.6], ["Manizales", 4.2],
  ["Medellín", 4.5], ["Montería", 5.0], ["Neiva", 5.0], ["Pasto", 4.0],
  ["Pereira", 4.3], ["Riohacha", 5.9], ["Santa Marta", 5.6], ["Valledupar", 5.4],
  ["Villavicencio", 4.4], ["Otra ciudad", 4.5],
];

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

// Simulador de ahorro e inversión
const formatoMoneda = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const formatoNumero = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });
const $ = (id) => document.getElementById(id);

// Montos grandes en forma corta: $ 12,5 M
const monedaCorta = (v) => Math.abs(v) >= 1e6
  ? "$ " + formatoNumero.format(v / 1e6) + " M"
  : formatoMoneda.format(v);

$("ciudad").innerHTML = CIUDADES.map(([n], i) => `<option value="${i}"${n === "Bogotá" ? " selected" : ""}>${n}</option>`).join("");
$("tipos").innerHTML = TIPOS.map((t, i) =>
  `<label class="chip"><input type="radio" name="tipo" value="${t.id}"${i === 0 ? " checked" : ""}><span>${t.nombre}</span></label>`).join("");

let simulacion = null;

function simular() {
  const factura = Number($("factura").value);
  const precio = Math.max(100, Number($("precio").value) || 950);
  const hsp = CIUDADES[Number($("ciudad").value)][1];
  const cobertura = Number($("cobertura").value) / 100;
  const alza = Number($("alza").value) / 100;
  const tipo = TIPOS.find((t) => t.id === document.querySelector("input[name=tipo]:checked").value);

  const consumo = factura / precio;                       // kWh al mes
  const kwp = (consumo * cobertura) / (hsp * 30 * EFICIENCIA_SISTEMA);
  const paneles = Math.max(1, Math.ceil((kwp * 1000) / POTENCIA_PANEL_W));
  const kwpReal = (paneles * POTENCIA_PANEL_W) / 1000;
  const produccionMes = kwpReal * hsp * 30 * EFICIENCIA_SISTEMA;
  const inversion = kwpReal * tipo.costoKwp;

  // Ahorro de cada año: la tarifa sube y los paneles producen un poco menos
  const acumulado = [0];
  let retorno = null;
  for (let a = 1; a <= ANIOS; a++) {
    const ahorro = Math.min(produccionMes, consumo) * 12 * precio * (1 + alza) ** (a - 1) * (1 - DEGRADACION_ANUAL) ** (a - 1);
    acumulado.push(acumulado[a - 1] + ahorro);
    if (retorno === null && acumulado[a] >= inversion) {
      retorno = a - 1 + (inversion - acumulado[a - 1]) / ahorro;
    }
  }

  simulacion = { factura, hsp, cobertura, tipo, kwpReal, paneles, inversion, retorno, ahorroAnio: acumulado[1], neto: acumulado[ANIOS] - inversion };

  $("oFactura").textContent = formatoMoneda.format(factura);
  $("oCobertura").textContent = Math.round(cobertura * 100) + " %";
  $("oAlza").textContent = Math.round(alza * 100) + " %";
  $("rRetorno").textContent = retorno === null ? "Más de 25 años" : `${formatoNumero.format(retorno)} años`;
  $("rAnio").textContent = monedaCorta(acumulado[1]);
  $("rInversion").textContent = monedaCorta(inversion);
  $("rNeto").textContent = monedaCorta(acumulado[ANIOS] - inversion);
  $("rKwp").textContent = `${formatoNumero.format(kwpReal)} kWp`;
  $("rPaneles").textContent = paneles;
  $("rArea").textContent = `${Math.round(paneles * AREA_PANEL_M2)} m²`;
  $("rCo2").textContent = `${formatoNumero.format((produccionMes * 12 * FACTOR_CO2) / 1000)} t`;
  dibujarGrafica(acumulado, inversion, retorno);
}

function dibujarGrafica(acumulado, inversion, retorno) {
  const W = 600, H = 260, iz = 56, de = 30, ar = 14, ab = 30;
  const max = Math.max(acumulado[ANIOS], inversion) * 1.08;
  const x = (a) => iz + (a / ANIOS) * (W - iz - de);
  const y = (v) => ar + (1 - v / max) * (H - ar - ab);
  const linea = acumulado.map((v, a) => `${x(a).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  let svg = "";
  for (let k = 0; k <= 4; k++) {                          // guías horizontales
    const v = (max / 4) * k;
    svg += `<line class="g-guia" x1="${iz}" x2="${W - de}" y1="${y(v)}" y2="${y(v)}"/>`;
    svg += `<text class="g-eje" x="${iz - 8}" y="${y(v) + 4}" text-anchor="end">${k === 0 ? "0" : v >= 1e6 ? formatoNumero.format(v / 1e6) + " M" : Math.round(v / 1000) + " mil"}</text>`;
  }
  for (const a of [0, 5, 10, 15, 20, 25]) {
    svg += `<text class="g-eje" x="${x(a)}" y="${H - 8}" text-anchor="middle">${a === 0 ? "Hoy" : "Año " + a}</text>`;
  }
  svg += `<polygon class="g-area" points="${x(0)},${y(0)} ${linea} ${x(ANIOS)},${y(0)}"/>`;
  svg += `<line class="g-inv" x1="${iz}" x2="${W - de}" y1="${y(inversion)}" y2="${y(inversion)}"/>`;
  svg += `<polyline class="g-ahorro" points="${linea}"/>`;
  if (retorno !== null) {
    const px = x(retorno), py = y(inversion);
    svg += `<line class="g-marca" x1="${px}" x2="${px}" y1="${py}" y2="${y(0)}"/>`;
    svg += `<circle class="g-punto" cx="${px}" cy="${py}" r="6"/>`;
    const izq = px > W - 160;
    svg += `<text class="g-nota" x="${px + (izq ? -10 : 10)}" y="${py - 14}" text-anchor="${izq ? "end" : "start"}">Recuperada en ${formatoNumero.format(retorno)} años</text>`;
  }
  $("simChart").innerHTML = svg;
}

$("simForm").addEventListener("input", simular);
$("simForm").addEventListener("submit", (e) => e.preventDefault());
simular();

// Enviar la simulación por WhatsApp para pedir la cotización
$("simWhatsapp").addEventListener("click", () => {
  const s = simulacion;
  const ciudad = $("ciudad").selectedOptions[0].textContent;
  const texto = [
    "Hola, hice una simulación en su página y quiero una cotización.",
    `Factura mensual: ${formatoMoneda.format(s.factura)}`,
    `Ciudad: ${ciudad}`,
    `Proyecto: ${s.tipo.nombre}`,
    `Sistema: ${formatoNumero.format(s.kwpReal)} kWp (${s.paneles} paneles)`,
    `Inversión aproximada: ${formatoMoneda.format(s.inversion)}`,
    `Retorno estimado: ${s.retorno === null ? "más de 25 años" : formatoNumero.format(s.retorno) + " años"}`,
  ].join("\n");
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, "_blank");
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
