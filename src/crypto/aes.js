import crypto from 'node:crypto';
import { CONFIG } from '../config.js';

/**
 * Descifra el cuerpo de texto cifrado con AES-GCM proveniente de WTR-LAB.
 * El formato esperado es: arr:IV_B64:TAG_B64:CIPHERTEXT_B64 o str:IV_B64:TAG_B64:CIPHERTEXT_B64
 * 
 * @param {string} encryptedString 
 * @returns {Promise<Array<string>|string>}
 */
export async function decryptContent(encryptedString) {
  if (!encryptedString || typeof encryptedString !== 'string') {
    return encryptedString;
  }

  let isArr = false;
  let raw = encryptedString;

  if (encryptedString.startsWith('arr:')) {
    isArr = true;
    raw = encryptedString.substring(4);
  } else if (encryptedString.startsWith('str:')) {
    raw = encryptedString.substring(4);
  } else {
    // Si no tiene prefijo, no está cifrado en este esquema
    return encryptedString;
  }

  const parts = raw.split(':');
  if (parts.length !== 3) {
    throw new Error(`Formato de datos cifrados no reconocido (${parts.length} partes)`);
  }

  const [ivB64, tagB64, cipherB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(cipherB64, 'base64');
  
  // En WebCrypto AES-GCM, el tag de autenticación va al final del texto cifrado
  const combined = Buffer.concat([ciphertext, authTag]);

  const rawKey = Buffer.from(CONFIG.aesKey.slice(0, 32), 'utf8');
  const subtleKey = await crypto.webcrypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decryptedBuf = await crypto.webcrypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    subtleKey,
    combined
  );

  const decodedText = new TextDecoder('utf8').decode(decryptedBuf);
  return isArr ? JSON.parse(decodedText) : decodedText;
}
