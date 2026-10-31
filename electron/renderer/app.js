// WTR-Lab Novel Downloader - Frontend Application Logic

let currentSelectedNovel = null;
let currentNovelChapters = [];
let currentExportNovel = null;
let isDownloading = false;

// Historial de comandos en la terminal
const commandHistory = [];
let historyIndex = -1;

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSearch();
  initDownloadModal();
  initLibrary();
  initTerminal();
  initSettings();
  initGlobalShortcuts();

  // Escuchar eventos globales de progreso
  if (window.wtrApi && window.wtrApi.onProgress) {
    window.wtrApi.onProgress((data) => {
      handleGlobalProgress(data);
    });
  }

  // Cargar estado inicial
  refreshAuthStatus();
  loadLibrary();
});

/* ==========================================================================
   1. NAVEGACIÓN ENTRE PESTAÑAS
   ========================================================================== */
function initNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      navButtons.forEach((b) => b.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('active');
      }

      if (targetId === 'tab-library') {
        loadLibrary();
      } else if (targetId === 'tab-settings') {
        refreshAuthStatus();
      }
    });
  });

  const quickOpenExports = document.getElementById('quick-open-exports');
  if (quickOpenExports) {
    quickOpenExports.addEventListener('click', () => {
      window.wtrApi?.openFolder('exports');
    });
  }
}

/* ==========================================================================
   2. BUSCADOR & DESCARGA
   ========================================================================== */
function initSearch() {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const clearBtn = document.getElementById('clear-search-btn');
  const feedback = document.getElementById('search-feedback');

  const executeSearch = async () => {
    const query = searchInput.value.trim();
    if (!query) return;

    setSearchLoading(true);
    hideFeedback(feedback);

    try {
      const results = await window.wtrApi.searchNovels(query);
      renderSearchResults(results, query);
    } catch (err) {
      showFeedback(feedback, 'error', `Error al buscar: ${err.message}`);
    } finally {
      setSearchLoading(false);
    }
  };

  searchBtn.addEventListener('click', executeSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') executeSearch();
  });

  searchInput.addEventListener('input', () => {
    if (searchInput.value.trim()) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.classList.add('hidden');
    searchInput.focus();
  });
}

function setSearchLoading(isLoading) {
  const searchBtn = document.getElementById('search-btn');
  const btnText = searchBtn.querySelector('.btn-text');
  const btnLoader = searchBtn.querySelector('.btn-loader');

  if (isLoading) {
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    searchBtn.disabled = true;
  } else {
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
    searchBtn.disabled = false;
  }
}

function renderSearchResults(results, query) {
  const container = document.getElementById('search-results');
  container.innerHTML = '';

  if (!results || results.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <h3>No se encontraron resultados</h3>
        <p>No encontramos ninguna novela para "${escapeHtml(query)}". Prueba con otra palabra clave o ingresa la URL directa.</p>
      </div>
    `;
    return;
  }

  results.forEach((novel) => {
    const card = document.createElement('div');
    card.className = 'novel-card';

    const coverHtml = novel.image
      ? `<img src="${escapeHtml(novel.image)}" alt="Cover" class="novel-card-cover" onerror="this.onerror=null;this.replaceWith(createPlaceholderCover())">`
      : `<div class="novel-card-cover-placeholder">📖</div>`;

    card.innerHTML = `
      <div class="novel-card-top">
        ${coverHtml}
        <div class="novel-card-info">
          <h3 class="novel-card-title" title="${escapeHtml(novel.title)}">${escapeHtml(novel.title)}</h3>
          <span class="novel-card-author">👤 ${escapeHtml(novel.author || 'Autor desconocido')}</span>
          <span class="novel-card-chapters">📑 ${novel.chapterCount || '?'} capítulos</span>
          <div class="novel-card-meta-chips">
            <span class="badge badge-secondary">ID: ${novel.rawId || novel.id}</span>
          </div>
        </div>
      </div>
      <button class="btn btn-primary btn-sm btn-select-novel">
        Seleccionar y Descargar
      </button>
    `;

    card.querySelector('.btn-select-novel').addEventListener('click', () => {
      openDownloadModal(novel);
    });

    container.appendChild(card);
  });
}

/* ==========================================================================
   3. MODAL DE DESCARGA
   ========================================================================== */
function initDownloadModal() {
  const modal = document.getElementById('download-modal');
  const closeBtn = document.getElementById('close-modal-btn');
  const closeBottomBtn = document.getElementById('close-modal-bottom-btn');
  const cancelBtn = document.getElementById('cancel-download-btn');
  const startBtn = document.getElementById('start-download-btn');
  const rangeInput = document.getElementById('chapter-range-input');

  const chips = modal.querySelectorAll('.chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      rangeInput.value = chip.getAttribute('data-range');
    });
  });

  const closeModal = () => {
    if (isDownloading) {
      if (!confirm('Hay una descarga en curso. ¿Deseas cerrarla? La descarga continuará en segundo plano.')) {
        return;
      }
    }
    modal.classList.add('hidden');
    resetDownloadProgress();
  };

  closeBtn.addEventListener('click', closeModal);
  closeBottomBtn.addEventListener('click', closeModal);

  cancelBtn.addEventListener('click', async () => {
    await window.wtrApi.cancelDownload();
    cancelBtn.disabled = true;
    cancelBtn.textContent = 'Cancelando...';
  });

  startBtn.addEventListener('click', async () => {
    if (!currentSelectedNovel) return;

    const rawSpec = rangeInput.value.trim();
    if (!rawSpec) {
      alert('Por favor especifica un rango de capítulos (ej: 1-5, all).');
      return;
    }

    const maxChapters = currentNovelChapters.length || 1000;
    const chapterNumbers = parseChapterSpec(rawSpec, maxChapters);

    if (chapterNumbers.length === 0) {
      alert('El rango especificado no contiene capítulos válidos.');
      return;
    }

    const lang = document.getElementById('lang-select').value;
    const merge = document.getElementById('merge-checkbox').checked;
    const pdf = document.getElementById('pdf-checkbox').checked;

    startDownload({
      novel: currentSelectedNovel,
      chapterNumbers,
      lang,
      merge,
      pdf
    });
  });
}

async function openDownloadModal(novel) {
  currentSelectedNovel = novel;
  const modal = document.getElementById('download-modal');

  document.getElementById('modal-novel-title').textContent = novel.title;
  document.getElementById('modal-novel-author').textContent = novel.author || 'Desconocido';
  document.getElementById('modal-novel-chapters').textContent = novel.chapterCount || 'Cargando...';
  document.getElementById('modal-novel-desc').textContent = novel.description || 'Sin sinopsis disponible.';

  const coverImg = document.getElementById('modal-novel-cover');
  if (novel.image) {
    coverImg.src = novel.image;
    coverImg.classList.remove('hidden');
  } else {
    coverImg.classList.add('hidden');
  }

  resetDownloadProgress();
  modal.classList.remove('hidden');

  // Cargar lista oficial de capítulos desde la API
  document.getElementById('modal-total-avail').textContent = 'Consultando WTR-Lab...';
  try {
    currentNovelChapters = await window.wtrApi.getChapters(novel.rawId || novel.id);
    document.getElementById('modal-total-avail').textContent = `${currentNovelChapters.length} capítulos disponibles`;
    document.getElementById('modal-novel-chapters').textContent = currentNovelChapters.length;
  } catch (err) {
    document.getElementById('modal-total-avail').textContent = 'Información no disponible';
  }
}

function resetDownloadProgress() {
  const box = document.getElementById('progress-container');
  const bar = document.getElementById('progress-bar-fill');
  const statusLabel = document.getElementById('progress-status-label');
  const percentLabel = document.getElementById('progress-percent-label');
  const subtext = document.getElementById('progress-subtext');
  const startBtn = document.getElementById('start-download-btn');
  const cancelBtn = document.getElementById('cancel-download-btn');

  box.classList.add('hidden');
  bar.style.width = '0%';
  statusLabel.textContent = 'Preparando...';
  percentLabel.textContent = '0%';
  subtext.textContent = '';

  startBtn.classList.remove('hidden');
  startBtn.disabled = false;
  cancelBtn.classList.add('hidden');
  cancelBtn.disabled = false;
  cancelBtn.textContent = 'Detener';
  isDownloading = false;
}

async function startDownload(payload) {
  isDownloading = true;
  const box = document.getElementById('progress-container');
  const startBtn = document.getElementById('start-download-btn');
  const cancelBtn = document.getElementById('cancel-download-btn');

  box.classList.remove('hidden');
  startBtn.classList.add('hidden');
  cancelBtn.classList.remove('hidden');

  try {
    const res = await window.wtrApi.downloadChapters(payload);
    isDownloading = false;
    cancelBtn.classList.add('hidden');

    const subtext = document.getElementById('progress-subtext');
    let summary = `✓ Se descargaron ${res.successCount} de ${res.total} capítulos correctamente.`;
    if (res.mergedTxt) summary += ` Archivo consolidado creado.`;
    if (res.mergedPdf) summary += ` Libro PDF generado.`;

    subtext.innerHTML = `
      <div style="color: #34d399; margin-top: 6px;">${summary}</div>
      <button class="btn btn-outline btn-xs" style="margin-top: 8px;" onclick="window.wtrApi.openFolder('${payload.novel.slug}')">
        📂 Abrir carpeta en Explorador
      </button>
    `;

    // Recargar biblioteca SQLite
    loadLibrary();
  } catch (err) {
    isDownloading = false;
    cancelBtn.classList.add('hidden');
    document.getElementById('progress-status-label').textContent = 'Error en la descarga';
    document.getElementById('progress-subtext').textContent = err.message;
  }
}

function handleGlobalProgress(data) {
  const bar = document.getElementById('progress-bar-fill');
  const statusLabel = document.getElementById('progress-status-label');
  const percentLabel = document.getElementById('progress-percent-label');
  const subtext = document.getElementById('progress-subtext');

  if (bar) bar.style.width = `${data.percent || 0}%`;
  if (statusLabel && data.status) statusLabel.textContent = data.status;
  if (percentLabel) percentLabel.textContent = `${data.percent || 0}%`;
}

/* ==========================================================================
   4. MI BIBLIOTECA (SQLITE)
   ========================================================================== */
function initLibrary() {
  const refreshBtn = document.getElementById('refresh-library-btn');
  const openExportsBtn = document.getElementById('open-exports-folder-btn');
  const filterInput = document.getElementById('library-filter-input');

  refreshBtn.addEventListener('click', loadLibrary);
  openExportsBtn.addEventListener('click', () => {
    window.wtrApi?.openFolder('exports');
  });

  filterInput.addEventListener('input', () => {
    const filter = filterInput.value.toLowerCase().trim();
    const cards = document.querySelectorAll('#library-novel-grid .novel-card');
    cards.forEach((card) => {
      const title = card.getAttribute('data-title') || '';
      const author = card.getAttribute('data-author') || '';
      if (title.includes(filter) || author.includes(filter)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  });

  initExportModal();
}

async function loadLibrary() {
  const grid = document.getElementById('library-novel-grid');
  const totalNovelsEl = document.getElementById('lib-total-novels');
  const totalChaptersEl = document.getElementById('lib-total-chapters');

  try {
    const list = await window.wtrApi.getLibrary();
    grid.innerHTML = '';

    totalNovelsEl.textContent = list.length;
    const totalChapters = list.reduce((acc, item) => acc + (item.downloaded_chapters || 0), 0);
    totalChaptersEl.textContent = totalChapters;

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>Tu catálogo local está vacío</h3>
          <p>Usa la pestaña "Buscador & Descarga" para buscar y guardar tus novelas en SQLite.</p>
        </div>
      `;
      return;
    }

    list.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'novel-card';
      card.setAttribute('data-title', item.title.toLowerCase());
      card.setAttribute('data-author', (item.author || '').toLowerCase());

      const langBadges = (item.languages || 'ninguno')
        .split(',')
        .map(l => `<span class="badge badge-primary">${escapeHtml(l.trim().toUpperCase())}</span>`)
        .join(' ');

      card.innerHTML = `
        <div class="novel-card-top">
          <div class="novel-card-cover-placeholder">📖</div>
          <div class="novel-card-info">
            <h3 class="novel-card-title">${escapeHtml(item.title)}</h3>
            <span class="novel-card-author">👤 ${escapeHtml(item.author || 'Desconocido')}</span>
            <span class="novel-card-chapters">📑 Guardados: ${item.downloaded_chapters} / ${item.total_chapters || '?'}</span>
            <div class="novel-card-meta-chips">
              ${langBadges}
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-primary btn-sm btn-offline-export" style="flex: 1;">
            ⚡ Exportar Offline
          </button>
          <button class="btn btn-outline btn-sm btn-open-folder" title="Abrir carpeta">
            📂
          </button>
        </div>
      `;

      card.querySelector('.btn-offline-export').addEventListener('click', () => {
        openExportModal(item);
      });

      card.querySelector('.btn-open-folder').addEventListener('click', () => {
        window.wtrApi.openFolder(item.slug);
      });

      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading library:', err);
  }
}

function initExportModal() {
  const modal = document.getElementById('export-modal');
  const closeBtn = document.getElementById('close-export-modal-btn');
  const cancelBtn = document.getElementById('cancel-export-btn');
  const startBtn = document.getElementById('start-export-btn');

  const closeModal = () => modal.classList.add('hidden');
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  startBtn.addEventListener('click', async () => {
    if (!currentExportNovel) return;

    const rangeInput = document.getElementById('export-range-input').value.trim();
    const lang = document.getElementById('export-lang-select').value;
    const merge = document.getElementById('export-merge-checkbox').checked;
    const pdf = document.getElementById('export-pdf-checkbox').checked;

    const stats = await window.wtrApi.getNovelStats(currentExportNovel.slug);
    const available = lang === 'es' ? stats.esChapters : stats.enChapters;

    if (!available || available.length === 0) {
      alert(`No hay capítulos guardados en [${lang.toUpperCase()}] para esta novela.`);
      return;
    }

    const chapterNumbers = rangeInput === 'all'
      ? available
      : parseChapterSpec(rangeInput, Math.max(...available)).filter(n => available.includes(n));

    if (chapterNumbers.length === 0) {
      alert('Ninguno de los capítulos seleccionados existe en la base de datos local para este idioma.');
      return;
    }

    const box = document.getElementById('export-progress-box');
    const fill = document.getElementById('export-progress-fill');
    const statusText = document.getElementById('export-progress-status');
    box.classList.remove('hidden');
    startBtn.disabled = true;

    try {
      const res = await window.wtrApi.exportLibrary({
        slug: currentExportNovel.slug,
        chapterNumbers,
        lang,
        merge,
        pdf
      });

      statusText.textContent = `¡Completado! ${res.exportedCount} capítulos exportados.`;
      fill.style.width = '100%';
      setTimeout(() => {
        modal.classList.add('hidden');
        box.classList.add('hidden');
        startBtn.disabled = false;
        window.wtrApi.openFolder(currentExportNovel.slug);
      }, 1200);
    } catch (err) {
      alert(`Error al exportar: ${err.message}`);
      startBtn.disabled = false;
    }
  });
}

async function openExportModal(novelItem) {
  currentExportNovel = novelItem;
  const modal = document.getElementById('export-modal');
  document.getElementById('export-modal-title').textContent = `Exportar: ${novelItem.title}`;

  const stats = await window.wtrApi.getNovelStats(novelItem.slug);
  const hint = document.getElementById('export-avail-hint');
  hint.textContent = `Capítulos guardados: EN (${stats?.enChapters?.length || 0}), ES (${stats?.esChapters?.length || 0})`;

  document.getElementById('export-range-input').value = 'all';
  modal.classList.remove('hidden');
}

/* ==========================================================================
   5. TERMINAL CLI
   ========================================================================== */
function initTerminal() {
  const terminalInput = document.getElementById('terminal-input');
  const runBtn = document.getElementById('terminal-run-btn');
  const outputContainer = document.getElementById('terminal-output');

  const executeCommand = async () => {
    const cmd = terminalInput.value.trim();
    if (!cmd) return;

    commandHistory.push(cmd);
    historyIndex = commandHistory.length;
    terminalInput.value = '';

    if (cmd === 'clear' || cmd === 'cls') {
      outputContainer.innerHTML = '';
      return;
    }

    await window.wtrApi.execCli(cmd);
  };

  runBtn.addEventListener('click', executeCommand);
  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      if (historyIndex > 0) {
        historyIndex--;
        terminalInput.value = commandHistory[historyIndex] || '';
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        terminalInput.value = commandHistory[historyIndex] || '';
      } else {
        historyIndex = commandHistory.length;
        terminalInput.value = '';
      }
    }
  });

  // Botones de comando rápido
  document.querySelectorAll('.terminal-quick-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      if (cmd === 'clear') {
        outputContainer.innerHTML = '';
      } else {
        terminalInput.value = cmd;
        executeCommand();
      }
    });
  });

  // Escuchar salidas de la CLI
  if (window.wtrApi && window.wtrApi.onCliOutput) {
    window.wtrApi.onCliOutput((text) => {
      appendTerminalOutput(text);
    });
  }
}

function appendTerminalOutput(rawText) {
  const outputContainer = document.getElementById('terminal-output');
  if (rawText.includes('\x1b[2J')) {
    outputContainer.innerHTML = '';
    return;
  }

  const html = ansiToHtml(rawText);
  const span = document.createElement('span');
  span.innerHTML = html;
  outputContainer.appendChild(span);
  outputContainer.scrollTop = outputContainer.scrollHeight;
}

function ansiToHtml(text) {
  let res = escapeHtml(text);
  res = res.replace(/\x1b\[31m/g, '<span class="term-red">');
  res = res.replace(/\x1b\[32m/g, '<span class="term-green">');
  res = res.replace(/\x1b\[33m/g, '<span class="term-yellow">');
  res = res.replace(/\x1b\[34m/g, '<span class="term-cyan">');
  res = res.replace(/\x1b\[36m/g, '<span class="term-cyan">');
  res = res.replace(/\x1b\[90m/g, '<span class="term-dim">');
  res = res.replace(/\x1b\[1m/g, '<strong>');
  res = res.replace(/\x1b\[0m/g, '</span></strong>');
  return res;
}

/* ==========================================================================
   6. CONFIGURACIÓN
   ========================================================================== */
function initSettings() {
  const saveBtn = document.getElementById('save-cookie-btn');
  const testBtn = document.getElementById('test-session-btn');
  const clearBtn = document.getElementById('clear-cookie-btn');
  const feedback = document.getElementById('session-feedback');
  const cookieInput = document.getElementById('cookie-input');

  const openExportsAction = document.getElementById('open-exports-action-btn');
  const openDataAction = document.getElementById('open-data-action-btn');

  saveBtn.addEventListener('click', async () => {
    const val = cookieInput.value.trim();
    if (!val) {
      showFeedback(feedback, 'error', 'Por favor ingresa una cadena de cookies válida.');
      return;
    }
    try {
      await window.wtrApi.saveAuth(val);
      showFeedback(feedback, 'success', '✓ Cookies de sesión guardadas con éxito.');
      refreshAuthStatus();
    } catch (err) {
      showFeedback(feedback, 'error', `Error al guardar: ${err.message}`);
    }
  });

  testBtn.addEventListener('click', async () => {
    showFeedback(feedback, 'info', 'Probando conexión con WTR-Lab...');
    const res = await window.wtrApi.testAuth();
    if (res.ok) {
      showFeedback(feedback, 'success', '✓ Conexión exitosa con WTR-Lab.');
    } else {
      showFeedback(feedback, 'error', `Fallo de conexión: ${res.error || 'Código ' + res.status}`);
    }
  });

  clearBtn.addEventListener('click', async () => {
    await window.wtrApi.clearAuth();
    cookieInput.value = '';
    showFeedback(feedback, 'info', 'Sesión eliminada. Modo invitado activo.');
    refreshAuthStatus();
  });

  openExportsAction.addEventListener('click', () => {
    window.wtrApi.openFolder('exports');
  });

  openDataAction.addEventListener('click', () => {
    window.wtrApi.openFolder('data');
  });
}

async function refreshAuthStatus() {
  try {
    const auth = await window.wtrApi.getAuth();
    const pill = document.getElementById('settings-session-pill');
    const sidebarText = document.getElementById('session-status-text');

    if (auth.hasSession) {
      if (pill) {
        pill.className = 'badge badge-success';
        pill.textContent = `Autenticado (${auth.cookieLength} chars)`;
      }
      if (sidebarText) {
        sidebarText.textContent = 'Sesión Activa';
      }
    } else {
      if (pill) {
        pill.className = 'badge badge-secondary';
        pill.textContent = 'Invitado';
      }
      if (sidebarText) {
        sidebarText.textContent = 'Invitado Público';
      }
    }
  } catch (err) {
    console.error('Error refreshing auth:', err);
  }
}

/* ==========================================================================
   7. UTILIDADES
   ========================================================================== */
function initGlobalShortcuts() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModals = document.querySelectorAll('.modal:not(.hidden)');
      activeModals.forEach(m => m.classList.add('hidden'));
    }
  });
}

function parseChapterSpec(spec, max) {
  if (!spec || spec.toLowerCase() === 'all') {
    return Array.from({ length: max }, (_, i) => i + 1);
  }
  const result = new Set();
  const parts = spec.split(',').map(s => s.trim());
  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = Math.min(parseInt(endStr, 10), max);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          if (i > 0 && i <= max) result.add(i);
        }
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num > 0 && num <= max) result.add(num);
    }
  }
  return Array.from(result).sort((a, b) => a - b);
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showFeedback(el, type, msg) {
  if (!el) return;
  el.className = `feedback-banner ${type}`;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideFeedback(el) {
  if (!el) return;
  el.classList.add('hidden');
}

window.createPlaceholderCover = function() {
  const div = document.createElement('div');
  div.className = 'novel-card-cover-placeholder';
  div.textContent = '📖';
  return div;
};
