import fs from 'node:fs';
import path from 'node:path';
import { EdgeTTS } from 'node-edge-tts';
import { CONFIG } from '../config.js';

export const NATURAL_VOICES = [
  // Colombia (Voces prioritarias)
  { id: 'es-CO-SalomeNeural', name: 'Salomé', gender: 'Mujer', lang: 'es-CO', flag: '🇨🇴', desc: 'Expresiva y cálida', country: 'Colombia' },
  { id: 'es-ES-XimenaNeural', name: 'Ximena', gender: 'Mujer', lang: 'es-CO', flag: '🇨🇴', desc: 'Clara y juvenil', country: 'Colombia' },
  { id: 'es-CO-GonzaloNeural', name: 'Gonzalo', gender: 'Hombre', lang: 'es-CO', flag: '🇨🇴', desc: 'Claro colombiano', country: 'Colombia' },

  // Español - Voces Femeninas (Latinoamérica y España)
  { id: 'es-MX-DaliaNeural', name: 'Dalia', gender: 'Mujer', lang: 'es-MX', flag: '🇲🇽', desc: 'Expresiva y suave', country: 'México' },
  { id: 'es-AR-ElenaNeural', name: 'Elena', gender: 'Mujer', lang: 'es-AR', flag: '🇦🇷', desc: 'Dulce y pausada', country: 'Argentina' },
  { id: 'es-CL-CatalinaNeural', name: 'Catalina', gender: 'Mujer', lang: 'es-CL', flag: '🇨🇱', desc: 'Clara y natural', country: 'Chile' },
  { id: 'es-PE-CamilaNeural', name: 'Camila', gender: 'Mujer', lang: 'es-PE', flag: '🇵🇪', desc: 'Natural y melódica', country: 'Perú' },
  { id: 'es-US-PalomaNeural', name: 'Paloma', gender: 'Mujer', lang: 'es-US', flag: '🇺🇸', desc: 'Agradable y versátil', country: 'EE.UU. (Latino)' },
  { id: 'es-VE-PaolaNeural', name: 'Paola', gender: 'Mujer', lang: 'es-VE', flag: '🇻🇪', desc: 'Dulce y expresiva', country: 'Venezuela' },
  { id: 'es-CR-MariaNeural', name: 'María', gender: 'Mujer', lang: 'es-CR', flag: '🇨🇷', desc: 'Amable y cálida', country: 'Costa Rica' },
  { id: 'es-EC-AndreaNeural', name: 'Andrea', gender: 'Mujer', lang: 'es-EC', flag: '🇪🇨', desc: 'Clara y modulada', country: 'Ecuador' },
  { id: 'es-UY-ValentinaNeural', name: 'Valentina', gender: 'Mujer', lang: 'es-UY', flag: '🇺🇾', desc: 'Envolvente y amena', country: 'Uruguay' },
  { id: 'es-PR-KarinaNeural', name: 'Karina', gender: 'Mujer', lang: 'es-PR', flag: '🇵🇷', desc: 'Expresiva y brillante', country: 'Puerto Rico' },
  { id: 'es-CU-BelkysNeural', name: 'Belkys', gender: 'Mujer', lang: 'es-CU', flag: '🇨🇺', desc: 'Cálida y serena', country: 'Cuba' },
  { id: 'es-BO-SofiaNeural', name: 'Sofía', gender: 'Mujer', lang: 'es-BO', flag: '🇧🇴', desc: 'Serena y clara', country: 'Bolivia' },
  { id: 'es-GT-MartaNeural', name: 'Marta', gender: 'Mujer', lang: 'es-GT', flag: '🇬🇹', desc: 'Natural y suave', country: 'Guatemala' },
  { id: 'es-ES-ElviraNeural', name: 'Elvira', gender: 'Mujer', lang: 'es-ES', flag: '🇪🇸', desc: 'Fluida y profesional', country: 'España' },

  // Español - Voces Masculinas
  { id: 'es-MX-JorgeNeural', name: 'Jorge', gender: 'Hombre', lang: 'es-MX', flag: '🇲🇽', desc: 'Enérgico y dinámico', country: 'México' },
  { id: 'es-AR-TomasNeural', name: 'Tomás', gender: 'Hombre', lang: 'es-AR', flag: '🇦🇷', desc: 'Narrador argentino', country: 'Argentina' },
  { id: 'es-ES-AlvaroNeural', name: 'Álvaro', gender: 'Hombre', lang: 'es-ES', flag: '🇪🇸', desc: 'Cálido y natural', country: 'España' },

  // Inglés (EE.UU. y Reino Unido)
  { id: 'en-US-JennyNeural', name: 'Jenny', gender: 'Mujer', lang: 'en-US', flag: '🇺🇸', desc: 'Natural y expresiva', country: 'EE.UU.' },
  { id: 'en-US-AriaNeural', name: 'Aria', gender: 'Mujer', lang: 'en-US', flag: '🇺🇸', desc: 'Vívida y atractiva', country: 'EE.UU.' },
  { id: 'en-US-GuyNeural', name: 'Guy', gender: 'Hombre', lang: 'en-US', flag: '🇺🇸', desc: 'Narrador de audiolibros', country: 'EE.UU.' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia', gender: 'Mujer', lang: 'en-GB', flag: '🇬🇧', desc: 'Acento británico', country: 'Reino Unido' },
  { id: 'en-GB-RyanNeural', name: 'Ryan', gender: 'Hombre', lang: 'en-GB', flag: '🇬🇧', desc: 'Acento británico', country: 'Reino Unido' }
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
  const cleanText = (text || '').replace(/\s+/g, ' ').trim();
  if (!cleanText) {
    return { audioBase64: '', words: [] };
  }

  const voice = options.voice || 'es-CO-SalomeNeural';
  const matchedVoice = NATURAL_VOICES.find(v => v.id === voice);
  const lang = options.lang || (matchedVoice ? matchedVoice.lang : (voice.startsWith('en-') ? 'en-US' : (voice.startsWith('es-') ? voice.slice(0, 5) : 'es-ES')));
  const rate = options.rate || 'default';
  const pitch = options.pitch || 'default';

  const audioChunks = [];
  const words = [];

  let retries = 2;
  while (retries >= 0) {
    try {
      const tts = new EdgeTTS({
        voice,
        lang,
        rate,
        pitch,
        saveSubtitles: true,
        timeout: 30000
      });

      for await (const chunk of tts.streamAudio(cleanText)) {
        if (Buffer.isBuffer(chunk)) {
          audioChunks.push(chunk);
        } else if (chunk && typeof chunk === 'object' && chunk.part) {
          words.push(chunk);
        }
      }
      break;
    } catch (err) {
      if (retries === 0) throw err;
      retries--;
      audioChunks.length = 0;
      words.length = 0;
      await new Promise(r => setTimeout(r, 400));
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

  const voice = options.voice || 'es-CO-SalomeNeural';
  const matchedVoice = NATURAL_VOICES.find(v => v.id === voice);
  const lang = options.lang || (matchedVoice ? matchedVoice.lang : (voice.startsWith('en-') ? 'en-US' : (voice.startsWith('es-') ? voice.slice(0, 5) : 'es-ES')));
  const rate = options.rate || 'default';

  // Agrupamos párrafos en bloques manejables de ~1200 caracteres para síntesis óptima
  const blocks = [];
  let currentBlock = [];
  let currentLen = 0;

  for (const p of paragraphs) {
    const text = (p || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (currentLen + text.length > 1200 && currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n'));
      currentBlock = [text];
      currentLen = text.length;
    } else {
      currentBlock.push(text);
      currentLen += text.length;
    }
  }
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }

  const allAudioChunks = [];
  for (const block of blocks) {
    let retries = 2;
    while (retries >= 0) {
      try {
        const tts = new EdgeTTS({
          voice,
          lang,
          rate,
          saveSubtitles: false,
          timeout: 45000
        });
        for await (const chunk of tts.streamAudio(block)) {
          if (Buffer.isBuffer(chunk)) {
            allAudioChunks.push(chunk);
          }
        }
        break;
      } catch (err) {
        if (retries === 0) throw err;
        retries--;
        await new Promise(r => setTimeout(r, 500));
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
