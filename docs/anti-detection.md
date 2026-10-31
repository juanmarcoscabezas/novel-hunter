# Guía de Anti-Detección y Evasión de Cloudflare 🛡️

Este documento describe los mecanismos implementados en la aplicación para interactuar con WTR-LAB sin ser detectado como un bot y cómo gestionar las cookies de sesión de forma segura.

---

## 1. Desafíos de Protección en WTR-LAB

WTR-LAB está protegido por **Cloudflare** y el framework de **Cloudflare Turnstile** para verificar el tráfico de red:
1. **Detección de Huella de Navegador (Fingerprinting)**: Peticiones que usan `User-Agent` genéricos de `curl` o bibliotecas como `axios` sin cabeceras Client Hints son bloqueadas o desafiadas con HTTP 403.
2. **Rate Limiting (Tasa de peticiones)**: Descargar demasiados capítulos en pocos segundos genera sospecha algorítmica y bloqueos temporales por IP.
3. **Restricción de Capítulos VIP / Miembros**: Ciertos capítulos solo son accesibles si la petición lleva una cookie de sesión de un usuario registrado en WTR-Lab.

---

## 2. Estrategias Implementadas en el Código

### A. Cabeceras Idénticas a Google Chrome 130 en Windows
El módulo `src/api/client.js` inyecta en cada solicitud HTTP las cabeceras exactas que envía un navegador Chrome real:

```javascript
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
  'Sec-Ch-Ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Referer': 'https://wtr-lab.com/en'
}
```

### B. Request Throttling con Jitter Aleatorio
Para evitar patrones de tráfico robótico predecibles:
- Entre cada descarga consecutiva de capítulo se aplica una pausa aleatoria de entre **900 ms y 1900 ms**.
- Si un capítulo ya existe en la base de datos local SQLite, no se realiza ninguna petición externa y no se aplica ninguna pausa.

---

## 3. Guía Paso a Paso para Extraer tu Cookie de Sesión

Si deseas vincular tu cuenta de WTR-LAB para capítulos VIP:

1. Abre tu navegador (Google Chrome) en Windows.
2. Ingresa a [https://wtr-lab.com](https://wtr-lab.com) e inicia sesión con tu cuenta.
3. Presiona **F12** (o Ctrl + Shift + I) para abrir las Herramientas de Desarrollo.
4. Ve a la pestaña **Network** (Red) y recarga la página (F5).
5. Haz clic en la primera petición (`wtr-lab.com` o cualquier endpoint `/api/...`).
6. En el panel lateral derecho, busca la sección **Request Headers** (Cabeceras de Petición).
7. Copia todo el valor del campo `Cookie:` (es una cadena con cookies como `NEXT_LOCALE=en; cf_clearance=...; sb-...=...`).
8. En tu terminal WSL, ejecuta:
   ```bash
   node bin/cli.js auth
   ```
9. Pega la cookie cuando el sistema te lo pida y presiona Enter.

La sesión quedará guardada de forma segura en el archivo local `.wtr-session.json` (ignorado por git) y se adjuntará automáticamente a todas tus peticiones futuras.
