import { CONFIG, getSavedSession } from '../config.js';

/**
 * Cliente HTTP personalizado con cabeceras de navegador y sesión de cookies.
 */
class HttpClient {
  constructor() {
    this.baseUrl = CONFIG.baseUrl;
  }

  /**
   * Genera las cabeceras completas incluyendo cookies si existen.
   */
  getHeaders(customHeaders = {}) {
    const headers = { ...CONFIG.headers, ...customHeaders };
    const session = getSavedSession();
    if (session && session.cookie) {
      headers['Cookie'] = session.cookie;
    }
    return headers;
  }

  /**
   * Espera aleatoria para emular comportamiento humano y evitar detección de bots.
   * @param {number} minMs 
   * @param {number} maxMs 
   */
  async delay(minMs = 800, maxMs = 1800) {
    const time = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise(resolve => setTimeout(resolve, time));
  }

  /**
   * Realiza una petición GET.
   * @param {string} endpoint 
   * @param {object} headers 
   */
  async get(endpoint, customHeaders = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(customHeaders)
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Bloqueo Cloudflare 403: Se requiere actualizar la cookie de sesión o verificar Turnstile.');
      }
      throw new Error(`Error HTTP ${response.status} al consultar ${endpoint}`);
    }

    return response.json();
  }

  /**
   * Realiza una petición POST enviando JSON.
   * @param {string} endpoint 
   * @param {object} body 
   * @param {object} customHeaders 
   */
  async post(endpoint, body = {}, customHeaders = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders({
      'Content-Type': 'application/json',
      ...customHeaders
    });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Bloqueo Cloudflare 403: Se requiere actualizar la cookie de sesión.');
      }
      throw new Error(`Error HTTP ${response.status} al consultar ${endpoint}`);
    }

    return response.json();
  }
}

export const client = new HttpClient();
