# SolarVida — Sitio web de paneles solares

Página web estática (HTML, CSS y JavaScript, sin dependencias ni build).

## Ver la página

Abre `index.html` con doble clic en el navegador.

## Estructura

```
index.html      Página principal (todas las secciones)
css/styles.css  Estilos y colores (variables en :root)
js/main.js      Menú, simulador de ahorro e inversión y envío por WhatsApp
img/            Imágenes propias (logo, fotos de instalaciones)
```

## Personalizar

- **Nombre de la empresa:** busca "SolarVida" en `index.html`.
- **WhatsApp:** cambia `WHATSAPP` al inicio de `js/main.js`.
- **Teléfono, correo y dirección:** sección `#contacto` de `index.html`.
- **Colores:** variables `--primary` y `--navy` en `css/styles.css`.
- **Simulador:** costo por kWp de cada tipo de proyecto, horas de sol de cada ciudad y demás supuestos al inicio de `js/main.js`.

## Fotos

Las fotos de `img/` son de [Unsplash](https://unsplash.com) (licencia libre, uso comercial permitido).
Cámbialas por fotos de instalaciones propias cuando las tengas, con el mismo nombre de archivo.
