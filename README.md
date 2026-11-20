# DJAZ 🎧
### Plataforma Web de Mezcla Musical Interactiva para TikTok Live y DJing Profesional

**DJAZ** es una aplicación web moderna de DJ inspirada en la agilidad de YouDJ y la distribución de controles de VirtualDJ, diseñada especialmente para creadores de contenido, transmisiones en vivo en **TikTok Live**, YouTube Live, Twitch y DJs en vivo.

**Dominio de producción:** `https://djaz.appzplay.online`  
**Repositorio GitHub:** `https://github.com/DiegoAzz/djaz.git`

---

## 🚀 Características Principales

### 1. Juego Casual Integrado para TikTok Live (Central Arcade)
- **Modo TikTok Live:** Diseñado para mantener a la audiencia enganchada durante transmisiones en vivo.
- **Neon Beat Runner:** Mini juego retro synthwave de 60 FPS donde saltas y esquivas con tu mascota DJ vinyl mientras mezclas.
- **Audio-Reactivo:** El juego pulsa al ritmo del BPM y el volumen de la música activa.
- **Controles Táctiles y Teclado:** Toca cualquier parte de la pantalla en móvil o pulsa Espacio / Flecha Arriba en PC.
- **Controles de Mezcla Siempre Accesibles:** El botón de **AUTO MIX** y el **Crossfader** permanecen en la parte inferior para transiciones inmediatas sin parar de jugar.

### 2. Modo Música Online (Seguro y Streamer-Safe)
- **Interfaz Libre de Marcas:** Vocabulario neutral (*"Música Online"*, *"Catálogo Musical"*) para evitar restricciones de algoritmos en TikTok Live por mención a plataformas externas.
- **Búsqueda Integrada:** Busca directamente canciones y artistas sin salir de la plataforma ni copiar URLs.
- **Doble Reproductor Oficial:** Dos platos independientes (`Deck A` en naranja eléctrico `#FF6B00` y `Deck B` en magenta neón `#FF0055`).
- **Compatibilidad con Cuentas Premium:** Al contar con sesión de YouTube Premium en el navegador, **la música se reproduce completamente sin anuncios comerciales**.
- **Persistencia Total:** Las canciones cargadas en los platos, el crossfader, el volumen y los resultados de búsqueda se guardan permanentemente en `localStorage`. Si recargas, ¡nada se pierde!
- **Protección Anti-Cortes:** Si hay música reproduciéndose, la aplicación bloquea recargas accidentales con un aviso de confirmación.

### 3. Modo DJ Local (Web Audio API)
- **Audio de Alta Precisión:** Motor nativo de baja latencia con `AudioContext`, `BiquadFilterNode`, `DelayNode`, `ConvolverNode` y `AnalyserNode`.
- **Formas de Onda Reales:** Renderizado interactivo en Canvas del audio decodificado.
- **Detección Automática de BPM:** Análisis de picos y autocorrelación de tempo con botón **SYNC** entre platos.
- **Ecualizador de 3 Bandas:** LOW, MID y HIGH con botones individuales de corte **KILL**.
- **Loops & Cue Points:** Loops de 1, 2, 4 y 8 beats y botón CUE estilo Pioneer CDJ.

### 4. 100% Responsivo en Móvil y Escritorio
- **Diseño Adaptativo Móvil:** Pestañas rápidas en smartphone (`[DECK A]`, `[TIKTOK LIVE]`, `[DECK B]`, `[TODO]`) para control con una mano.
- **Touch Targets Optimizados:** Botones y sliders diseñados para respuesta táctil precisa en iOS y Android.

---

## 🐳 Despliegue en Coolify

Este proyecto cuenta con un contenedor Docker unificado y `docker-compose.yml` listo para producción con 1 solo clic.

### Pasos para desplegar en Coolify:
1. En tu panel de Coolify, crea una nueva aplicación y selecciona **Public Git Repository**.
2. URL del repositorio: `https://github.com/DiegoAzz/djaz.git`
3. Rama: `main`
4. Build Pack: **Docker Compose** o **Dockerfile**.
5. Configura el dominio: `https://djaz.appzplay.online`
6. Puerto de la aplicación: `3000`
7. Variables de entorno (opcional):
   - `PORT=3000`
   - `NODE_ENV=production`
   - `YOUTUBE_API_KEY=` *(Opcional: el buscador incluye scraping inteligente y catálogo demo automático si no se configura clave)*.
8. Haz clic en **Deploy**. Coolify compilará automáticamente el frontend en Vite, el backend en Express y generará el certificado SSL HTTPS gratuito con Let's Encrypt para `djaz.appzplay.online`.

---

## 💻 Desarrollo Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/DiegoAzz/djaz.git
cd djaz

# 2. Instalar dependencias
npm install

# 3. Iniciar entorno de desarrollo
npm run dev

# Acceder en el navegador:
# Frontend: http://localhost:5173
# API Backend: http://localhost:3001
```

O en Windows ejecutando directamente:
`iniciar.bat`
