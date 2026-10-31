import fs from 'node:fs';
import path from 'node:path';
import { EdgeTTS } from 'node-edge-tts';
import { CONFIG } from '../config.js';

export const NATURAL_VOICES = [
  // Español (España)
  { id: 'es-ES-AlvaroNeural', name: 'Álvaro', gender: 'Hombre', lang: 'es-ES', flag: '🇪🇸', desc: 'Cálido y natural' },
  { id: 'es-ES-ElviraNeural', name: 'Elvira', gender: 'Mujer', lang: 'es-ES', flag: '🇪🇸', desc: 'Fluida y profesional' },
  // Español (México)
  { id: 'es-MX-DaliaNeural', name: 'Dalia', gender: 'Mujer', lang: 'es-MX', flag: '🇲🇽', desc: 'Expresiva y suave' },
  { id: 'es-MX-JorgeNeural', name: 'Jorge', gender: 'Hombre', lang: 'es-MX', flag: '🇲🇽', desc: 'Enérgico y dinámico' },
  // Español (Latinoamérica)
  { id: 'es-AR-TomasNeural', name: 'Tomás', gender: 'Hombre', lang: 'es-AR', flag: '🇦🇷', desc: 'Narrador argentino' },
  { id: 'es-CO-GonzaloNeural', name: 'Gonzalo', gender: 'Hombre', lang: 'es-CO', flag: '🇨🇴', desc: 'Claro colombiano' },
  // Inglés (EE.UU.)
  { id: 'en-US-GuyNeural', name: 'Guy', gender: 'Hombre', lang: 'en-US', flag: '🇺🇸', desc: 'Narrador de audiolibros' },
  { id: 'en-US-JennyNeural', name: 'Jenny', gender: 'Mujer', lang: 'en-US', flag: '🇺🇸', desc: 'Natural y expresiva' },
  { id: 'en-US-AriaNeural', name: 'Aria', gender: 'Mujer', lang: 'en-US', flag: '🇺🇸', desc: 'Vívida y atractiva' },
  // Inglés (Reino Unido)
  { id: 'en-GB-RyanNeural', name: 'Ryan', gender: 'Hombre', lang: 'en-GB', flag: '🇬🇧', desc: 'Acento británico' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia', gender: 'Mujer', lang: 'en-GB', flag: '🇬🇧', desc: 'Acento británico' }
];

/**
 * Obtiene la lista de voces naturales disponibles.
 */
export function getAvailableVoices() {
  return NATURAL_VOICES;
}

/**
 * Sintetiza un párrafo o fragmento de texto a audio MP3 con marcas de tiempo por palabra.
 * @param {string} text Texto a sintetizar
 * @param {object} options Opciones de voz ({ voice, lang, rate, pitch })
 * @returns {Promise<{ audioBase64: string, words: Array<{ part: string, start: number, end: number }> }>}
 */
export async function synthesizeParagraph(text, options = {}) {
  const cleanText = (text || '').trim();
  if (!cleanText) {
    return { audioBase64: '', words: [] };
  }

  const voice = options.voice || 'es-ES-AlvaroNeural';
  const lang = options.lang || (voice.startsWith('en-') ? 'en-US' : 'es-ES');
  const rate = options.rate || 'default';
  const pitch = options.pitch || 'default';

  const tts = new EdgeTTS({
    voice,
    lang,
    rate,
    pitch,
    saveSubtitles: true,
    timeout: 30000
  });

  const audioChunks = [];
  const words = [];

  for await (const chunk of tts.streamAudio(cleanText)) {
    if (Buffer.isBuffer(chunk)) {
      audioChunks.push(chunk);
    } else if (chunk && typeof chunk === 'object' && chunk.part) {
      words.push(chunk);
    }
  }

  const fullAudio = Buffer.concat(audioChunks);
  return {
    audioBase64: fullAudio.toString('base64'),
    words
  };
}

/**
 * Exporta un capítulo completo sintetizado a un archivo de audio MP3 local.
 * @param {string} novelSlug Slug de la novela
 * @param {number} chapterNo Número de capítulo
 * @param {string} chapterTitle Título del capítulo
 * @param {string[]} paragraphs Párrafos del capítulo
 * @param {object} options Opciones de voz ({ voice, rate })
 * @returns {Promise<{ filePath: string, sizeBytes: number, formattedSize: string }>}
 */
export async function exportChapterAudio(novelSlug, chapterNo, chapterTitle, paragraphs, options = {}) {
  if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
    throw new Error('El capítulo no contiene texto para sintetizar.');
  }

  const audioDir = path.join(CONFIG.exportsDir, novelSlug, 'audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  const safeTitle = (chapterTitle || `Capitulo_${chapterNo}`).replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_ -]/g, '').trim();
  const fileName = `Capitulo_${String(chapterNo).padStart(4, '0')} - ${safeTitle}.mp3`;
  const destPath = path.join(audioDir, fileName);

  const voice = options.voice || 'es-ES-AlvaroNeural';
  const lang = options.lang || (voice.startsWith('en-') ? 'en-US' : 'es-ES');
  const rate = options.rate || 'default';

  const tts = new EdgeTTS({
    voice,
    lang,
    rate,
    saveSubtitles: false,
    timeout: 45000
  });

  // Agrupamos párrafos en bloques manejables de ~1200 caracteres para síntesis óptima
  const blocks = [];
  let currentBlock = [];
  let currentLen = 0;

  for (const p of paragraphs) {
    const text = (p || '').trim();
    if (!text) continue;
    if (currentLen + text.length > 1200 && currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n\n'));
      currentBlock = [text];
      currentLen = text.length;
    } else {
      currentBlock.push(text);
      currentLen += text.length;
    }
  }
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n\n'));
  }

  const allAudioChunks = [];
  for (const block of blocks) {
    for await (const chunk of tts.streamAudio(block)) {
      if (Buffer.isBuffer(chunk)) {
        allAudioChunks.push(chunk);
      }
    }
  }

  const fullAudio = Buffer.concat(allAudioChunks);
  fs.writeFileSync(destPath, fullAudio);

  const stats = fs.statSync(destPath);
  const formattedSize = `${Math.round(stats.size / 1024)} KB`;

  return {
    filePath: destPath,
    sizeBytes: stats.size,
    formattedSize
  };
}
