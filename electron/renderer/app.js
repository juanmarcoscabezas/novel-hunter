// Novel Hunter - Frontend Application Logic

const ICONS = {
  book: '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
  bookXl: '<svg class="svg-icon" viewBox="0 0 24 24" style="width: 28px; height: 28px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
  bookOpenSm: '<svg class="svg-icon icon-sm" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
  user: '<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
  fileText: '<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
  fileTextSm: '<svg class="svg-icon icon-sm" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
  folderSm: '<svg class="svg-icon icon-sm" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
  zapSm: '<svg class="svg-icon icon-sm" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
  cpu: '<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>',
  edit: '<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
  globe: '<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
  xCircle: '<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
};

let currentSelectedNovel = null;
let currentNovelChapters = [];
let currentExportNovel = null;
let isDownloading = false;

// Estado para exploración de capítulos y modo lector
let currentChaptersNovel = null;
let currentReadingNovel = null;
let currentReadingChapterNo = 1;
let currentReadingLang = 'en';
let currentReadingChaptersList = [];
let readerFontSize = 16;

// Historial de comandos en la terminal
const commandHistory = [];
let historyIndex = -1;

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSearch();
  initDownloadModal();
  initLibrary();
  initChaptersModal();
  initReaderModal();
  initTtsControls();
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
  updateLastReadWidget();
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
        <div class="empty-icon">${ICONS.xCircle}</div>
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
      ? `<img src="${escapeHtml(novel.image)}" alt="Cover" class="novel-card-cover" referrerpolicy="no-referrer" loading="lazy" onerror="this.onerror=null;this.replaceWith(createPlaceholderCover())">`
      : `<div class="novel-card-cover-placeholder">${ICONS.book}</div>`;

    card.innerHTML = `
      <div class="novel-card-top">
        ${coverHtml}
        <div class="novel-card-info">
          <h3 class="novel-card-title" title="${escapeHtml(novel.title)}">${escapeHtml(novel.title)}</h3>
          <span class="novel-card-author">${ICONS.user} ${escapeHtml(novel.author || 'Autor desconocido')}</span>
          <span class="novel-card-chapters">${ICONS.fileText} ${novel.chapterCount || '?'} capítulos</span>
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
    coverImg.referrerPolicy = 'no-referrer';
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
    let summary = `Se descargaron ${res.successCount} de ${res.total} capítulos correctamente.`;
    if (res.mergedTxt) summary += ` Archivo consolidado creado.`;
    if (res.mergedPdf) summary += ` Libro PDF generado.`;

    subtext.innerHTML = `
      <div style="color: #34d399; margin-top: 6px;">${summary}</div>
      <div style="display: flex; gap: 8px; margin-top: 10px;">
        <button id="dl-view-library-btn" class="btn btn-primary btn-xs">
          ${ICONS.bookOpenSm} Ver en Mi Biblioteca
        </button>
        <button id="dl-open-folder-btn" class="btn btn-outline btn-xs">
          ${ICONS.folderSm} Abrir carpeta en Explorador
        </button>
      </div>
    `;

    document.getElementById('dl-open-folder-btn')?.addEventListener('click', () => {
      window.wtrApi?.openFolder(payload.novel.slug);
    });

    document.getElementById('dl-view-library-btn')?.addEventListener('click', () => {
      document.getElementById('download-modal').classList.add('hidden');
      resetDownloadProgress();
      const libTabBtn = document.querySelector('[data-tab="tab-library"]');
      if (libTabBtn) libTabBtn.click();
    });

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

  // También actualizar barra de progreso de exportación
  const exportFill = document.getElementById('export-progress-fill');
  const exportStatus = document.getElementById('export-progress-status');
  const exportPercent = document.getElementById('export-progress-percent');
  if (exportFill) exportFill.style.width = `${data.percent || 0}%`;
  if (exportStatus && data.status) exportStatus.textContent = data.status;
  if (exportPercent) exportPercent.textContent = `${data.percent || 0}%`;

  // Y actualizar barra de progreso de traducción de capítulos
  const transFill = document.getElementById('translate-progress-fill');
  const transStatus = document.getElementById('translate-progress-status');
  const transPercent = document.getElementById('translate-progress-percent');
  if (transFill) transFill.style.width = `${data.percent || 0}%`;
  if (transStatus && data.status) transStatus.textContent = data.status;
  if (transPercent) transPercent.textContent = `${data.percent || 0}%`;
}

/* ==========================================================================
   4. MI BIBLIOTECA (SQLITE)
   ========================================================================== */
function initLibrary() {
  const refreshBtn = document.getElementById('refresh-library-btn');
  const filterInput = document.getElementById('library-filter-input');

  refreshBtn.addEventListener('click', loadLibrary);

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
  const storageSizeEl = document.getElementById('lib-storage-size');

  try {
    const list = await window.wtrApi.getLibrary();
    if (window.wtrApi.getStorageStats && storageSizeEl) {
      try {
        const storage = await window.wtrApi.getStorageStats();
        storageSizeEl.textContent = storage?.formatted || '0 KB';
      } catch {
        storageSizeEl.textContent = '0 KB';
      }
    }
    grid.innerHTML = '';

    totalNovelsEl.textContent = list.length;
    const totalChapters = list.reduce((acc, item) => acc + (item.downloaded_chapters || 0), 0);
    totalChaptersEl.textContent = totalChapters;

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.bookXl}</div>
          <h3>Tu biblioteca está vacía</h3>
          <p>Usa la pestaña "Buscador & Descarga" para buscar y guardar tus novelas en tu biblioteca local.</p>
        </div>
      `;
      return;
    }

    list.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'novel-card';
      card.setAttribute('data-title', (item.title || '').toLowerCase());
      card.setAttribute('data-author', (item.author || '').toLowerCase());

      const coverHtml = item.cover_url
        ? `<img src="${escapeHtml(item.cover_url)}" alt="Cover" class="novel-card-cover" referrerpolicy="no-referrer" loading="lazy" onerror="this.onerror=null;this.replaceWith(createPlaceholderCover())">`
        : `<div class="novel-card-cover-placeholder">${ICONS.book}</div>`;

      const langBadges = (item.languages || 'ninguno')
        .split(',')
        .map(l => `<span class="badge badge-primary">${escapeHtml(l.trim().toUpperCase())}</span>`)
        .join(' ');

      const continueBtnHtml = item.last_read_chapter_no
        ? `
          <button class="btn btn-sm btn-continue-novel" style="width: 100%;" title="Ir al último capítulo visto">
            <svg class="svg-icon icon-sm" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            <span>Continuar: Cap. ${item.last_read_chapter_no}</span>
          </button>
        `
        : '';

      card.innerHTML = `
        <div class="novel-card-top">
          ${coverHtml}
          <div class="novel-card-info">
            <h3 class="novel-card-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h3>
            <span class="novel-card-author">${ICONS.user} ${escapeHtml(item.author || 'Desconocido')}</span>
            <span class="novel-card-chapters">${ICONS.fileText} Guardados: <strong>${item.downloaded_chapters}</strong> / ${item.total_chapters || '?'}</span>
            <div class="novel-card-meta-chips">
              ${langBadges}
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 8px; flex-direction: column;">
          ${continueBtnHtml}
          <button class="btn btn-primary btn-sm btn-view-chapters" style="width: 100%;">
            ${ICONS.fileTextSm}
            <span>Ver Capítulos (${item.downloaded_chapters})</span>
          </button>
        </div>
      `;

      if (item.last_read_chapter_no) {
        card.querySelector('.btn-continue-novel')?.addEventListener('click', async () => {
          let lang = item.last_read_language || (item.languages ? item.languages.split(',')[0].trim() : 'en');
          let chapters = await window.wtrApi.getDownloadedChapters(item.raw_id || item.id, lang);
          if (!chapters || chapters.length === 0) {
            const altLang = lang === 'es' ? 'en' : 'es';
            const altChapters = await window.wtrApi.getDownloadedChapters(item.raw_id || item.id, altLang);
            if (altChapters && altChapters.length > 0) {
              lang = altLang;
              chapters = altChapters;
            }
          }
          currentReadingChaptersList = chapters || [];
          let targetChNo = item.last_read_chapter_no;
          if (chapters && chapters.length > 0 && !chapters.some(c => c.chapter_no === targetChNo)) {
            targetChNo = chapters[0].chapter_no;
          }
          openReaderModal(item, targetChNo, lang);
        });
      }

      card.querySelector('.btn-view-chapters').addEventListener('click', () => {
        openChaptersModal(item);
      });

      grid.appendChild(card);
    });

    updateLastReadWidget();
  } catch (err) {
    console.error('Error loading library:', err);
  }
}

/* ==========================================================================
   4b. MODAL DE CAPÍTULOS DE LA NOVELA
   ========================================================================== */
function initChaptersModal() {
  const modal = document.getElementById('chapters-modal');
  const closeBtn = document.getElementById('close-chapters-modal-btn');
  const closeBottomBtn = document.getElementById('close-chapters-bottom-btn');
  const langFilter = document.getElementById('chapters-lang-filter');

  const closeModal = () => {
    stopTts();
    modal.classList.add('hidden');
    loadLibrary();
  };
  closeBtn?.addEventListener('click', closeModal);
  closeBottomBtn?.addEventListener('click', closeModal);

  const exportBtn = document.getElementById('detail-export-btn');
  const openFolderBtn = document.getElementById('detail-open-folder-btn');
  const translateBtn = document.getElementById('detail-translate-btn');

  exportBtn?.addEventListener('click', () => {
    if (currentChaptersNovel) {
      openExportModal(currentChaptersNovel);
    }
  });

  openFolderBtn?.addEventListener('click', () => {
    if (currentChaptersNovel) {
      window.wtrApi.openFolder(currentChaptersNovel.slug);
    }
  });

  translateBtn?.addEventListener('click', async () => {
    if (!currentChaptersNovel) return;
    const novelId = currentChaptersNovel.raw_id || currentChaptersNovel.id;
    
    // Consultar capítulos en inglés pendientes de traducir al español
    const untranslated = await window.wtrApi.getUntranslatedChapters(novelId, 'en', 'es');
    const progressBox = document.getElementById('chapters-translate-progress');
    const statusLabel = document.getElementById('translate-progress-status');
    const percentLabel = document.getElementById('translate-progress-percent');
    const fillBar = document.getElementById('translate-progress-fill');

    if (!untranslated || untranslated.length === 0) {
      const allEs = await window.wtrApi.getDownloadedChapters(novelId, 'es');
      if (allEs && allEs.length > 0) {
        showFeedback('Todos los capítulos descargados de esta novela ya están disponibles en español.', 'info');
        langFilter.value = 'es';
        await loadChaptersListForNovel(currentChaptersNovel, 'es');
      } else {
        showFeedback('No hay capítulos descargados para traducir.', 'error');
      }
      return;
    }

    // Iniciar traducción en lote
    translateBtn.disabled = true;
    if (progressBox) progressBox.classList.remove('hidden');
    if (fillBar) fillBar.style.width = '0%';
    if (statusLabel) statusLabel.textContent = `Iniciando traducción de ${untranslated.length} capítulos a español...`;
    if (percentLabel) percentLabel.textContent = '0%';

    try {
      const result = await window.wtrApi.batchTranslateToSpanish({
        novelId,
        chapterNumbers: untranslated
      });

      if (result && !result.cancelled) {
        if (statusLabel) statusLabel.textContent = `¡Listo! ${result.translatedCount} capítulos traducidos a español.`;
        if (fillBar) fillBar.style.width = '100%';
        if (percentLabel) percentLabel.textContent = '100%';

        langFilter.value = 'es';
        await loadChaptersListForNovel(currentChaptersNovel, 'es');
        loadLibrary();

        setTimeout(() => {
          if (progressBox) progressBox.classList.add('hidden');
        }, 3500);
      }
    } catch (err) {
      if (statusLabel) statusLabel.textContent = `Error: ${err.message}`;
    } finally {
      translateBtn.disabled = false;
    }
  });

  langFilter?.addEventListener('change', () => {
    if (currentChaptersNovel) {
      loadChaptersListForNovel(currentChaptersNovel, langFilter.value);
    }
  });
}

async function openChaptersModal(novelItem) {
  currentChaptersNovel = novelItem;
  const modal = document.getElementById('chapters-modal');
  document.getElementById('chapters-modal-title').textContent = novelItem.title;
  document.getElementById('chapters-novel-author').textContent = novelItem.author || 'Desconocido';
  document.getElementById('chapters-novel-total').textContent = `${novelItem.total_chapters || '?'} en WTR-Lab`;

  const coverImg = document.getElementById('chapters-novel-cover');
  if (novelItem.cover_url) {
    coverImg.referrerPolicy = 'no-referrer';
    coverImg.src = novelItem.cover_url;
    coverImg.classList.remove('hidden');
  } else {
    coverImg.classList.add('hidden');
  }

  const langFilter = document.getElementById('chapters-lang-filter');
  const langs = (novelItem.languages || 'en').split(',').map(s => s.trim());
  if (langs.includes('es') && !langs.includes('en')) {
    langFilter.value = 'es';
  } else {
    langFilter.value = 'en';
  }

  await loadChaptersListForNovel(novelItem, langFilter.value);
  modal.classList.remove('hidden');
}

async function loadChaptersListForNovel(novelItem, lang) {
  const container = document.getElementById('chapters-list-container');
  container.innerHTML = '<div style="color: var(--text-muted); padding: 16px; text-align: center;">Cargando capítulos...</div>';

  const chapters = await window.wtrApi.getDownloadedChapters(novelItem.raw_id || novelItem.id, lang);
  currentReadingChaptersList = chapters;
  container.innerHTML = '';

  if (!chapters || chapters.length === 0) {
    container.innerHTML = `
      <div style="color: var(--text-muted); padding: 24px; text-align: center;">
        No hay capítulos descargados en [${lang.toUpperCase()}] para esta novela.
      </div>
    `;
    return;
  }

  chapters.forEach((ch) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'chapter-item';
    const displayTitle = ch.title || ch.raw_title || `Capítulo ${ch.chapter_no}`;

    const isEn = lang === 'en';
    itemEl.innerHTML = `
      <div class="chapter-item-left">
        <span class="chapter-item-title">Capítulo ${ch.chapter_no}: ${escapeHtml(displayTitle)}</span>
        <div class="chapter-item-meta">
          <span>${ICONS.cpu} ${escapeHtml(ch.model || 'Gemini AI')}</span>
          <span>${ICONS.edit} ${(ch.char_length || 0).toLocaleString()} caracteres</span>
          <span>${ICONS.globe} ${ch.language.toUpperCase()}</span>
        </div>
      </div>
      <div class="chapter-item-actions">
        ${isEn ? `
          <button class="btn btn-outline btn-sm btn-translate-ch" title="Traducir solo este capítulo a Español">
            ${ICONS.globe} <span>Traducir</span>
          </button>
        ` : ''}
        <button class="btn btn-primary btn-sm btn-read-ch">
          ${ICONS.bookOpenSm} <span>Leer</span>
        </button>
      </div>
    `;

    if (isEn) {
      const translateChBtn = itemEl.querySelector('.btn-translate-ch');
      translateChBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        translateChBtn.disabled = true;
        translateChBtn.innerHTML = `<span>Traduciendo...</span>`;
        try {
          const res = await window.wtrApi.translateChapterToSpanish(novelItem.raw_id || novelItem.id, ch.chapter_no);
          if (res && res.success) {
            const langFilterEl = document.getElementById('chapters-lang-filter');
            if (langFilterEl) langFilterEl.value = 'es';
            await loadChaptersListForNovel(novelItem, 'es');
            loadLibrary();
          } else {
            alert(res?.error || 'No se pudo traducir el capítulo.');
            translateChBtn.disabled = false;
            translateChBtn.innerHTML = `${ICONS.globe} <span>Traducir</span>`;
          }
        } catch (err) {
          alert(`Error al traducir: ${err.message}`);
          translateChBtn.disabled = false;
          translateChBtn.innerHTML = `${ICONS.globe} <span>Traducir</span>`;
        }
      });
    }

    itemEl.querySelector('.btn-read-ch').addEventListener('click', () => {
      openReaderModal(novelItem, ch.chapter_no, lang);
    });

    container.appendChild(itemEl);
  });
}

/* ==========================================================================
   4c. MODAL DE LECTURA (READER VIEW)
   ========================================================================== */
function initReaderModal() {
  const modal = document.getElementById('reader-modal');
  const closeBtn = document.getElementById('close-reader-modal-btn');
  const closeBottomBtn = document.getElementById('close-reader-bottom-btn');
  const prevBtn = document.getElementById('reader-prev-btn');
  const nextBtn = document.getElementById('reader-next-btn');
  const decFontBtn = document.getElementById('reader-font-decrease');
  const incFontBtn = document.getElementById('reader-font-increase');
  const translateBtn = document.getElementById('reader-translate-btn');
  const translateLabel = document.getElementById('reader-translate-label');

  const closeModal = () => {
    stopTts();
    modal.classList.add('hidden');
    loadLibrary();
  };
  closeBtn?.addEventListener('click', closeModal);
  closeBottomBtn?.addEventListener('click', closeModal);

  translateBtn?.addEventListener('click', async () => {
    if (!currentReadingNovel || !currentReadingChapterNo) return;
    
    // Si ya estamos viendo la traducción en español, ofrecer alternar a inglés si existe
    if (currentReadingLang === 'es') {
      const enChapter = await window.wtrApi.readChapter(currentReadingNovel.raw_id || currentReadingNovel.id, currentReadingChapterNo, 'en');
      if (enChapter) {
        await openReaderModal(currentReadingNovel, currentReadingChapterNo, 'en');
        return;
      }
    }

    // Traducir capítulo actual a español
    translateBtn.disabled = true;
    if (translateLabel) translateLabel.textContent = 'Traduciendo...';

    try {
      const res = await window.wtrApi.translateChapterToSpanish(
        currentReadingNovel.raw_id || currentReadingNovel.id,
        currentReadingChapterNo
      );

      if (res && res.success) {
        currentReadingLang = 'es';
        await openReaderModal(currentReadingNovel, currentReadingChapterNo, 'es');
        loadLibrary();
      } else {
        alert(res?.error || 'No se pudo traducir el capítulo a español.');
        if (translateLabel) translateLabel.textContent = 'Traducir a Español';
      }
    } catch (err) {
      alert(`Error al traducir a español: ${err.message}`);
      if (translateLabel) translateLabel.textContent = 'Traducir a Español';
    } finally {
      translateBtn.disabled = false;
    }
  });

  decFontBtn?.addEventListener('click', () => {
    if (readerFontSize > 12) {
      readerFontSize -= 2;
      const art = document.getElementById('reader-article-content');
      if (art) art.style.fontSize = `${readerFontSize}px`;
    }
  });

  incFontBtn?.addEventListener('click', () => {
    if (readerFontSize < 28) {
      readerFontSize += 2;
      const art = document.getElementById('reader-article-content');
      if (art) art.style.fontSize = `${readerFontSize}px`;
    }
  });

  prevBtn?.addEventListener('click', () => {
    const idx = currentReadingChaptersList.findIndex(c => c.chapter_no === currentReadingChapterNo);
    if (idx > 0) {
      const prevCh = currentReadingChaptersList[idx - 1];
      openReaderModal(currentReadingNovel, prevCh.chapter_no, currentReadingLang);
    }
  });

  nextBtn?.addEventListener('click', () => {
    const idx = currentReadingChaptersList.findIndex(c => c.chapter_no === currentReadingChapterNo);
    if (idx !== -1 && idx < currentReadingChaptersList.length - 1) {
      const nextCh = currentReadingChaptersList[idx + 1];
      openReaderModal(currentReadingNovel, nextCh.chapter_no, currentReadingLang);
    }
  });
}

async function openReaderModal(novelItem, chapterNo, lang) {
  currentReadingNovel = novelItem;
  currentReadingChapterNo = chapterNo;
  currentReadingLang = lang;

  const modal = document.getElementById('reader-modal');
  const titleEl = document.getElementById('reader-chapter-title');
  const novelTitleEl = document.getElementById('reader-novel-title');
  const articleEl = document.getElementById('reader-article-content');
  const modelBadge = document.getElementById('reader-model-badge');
  const paragraphsInfo = document.getElementById('reader-paragraphs-info');

  novelTitleEl.textContent = novelItem.title;
  titleEl.textContent = `Cargando Capítulo ${chapterNo}...`;
  articleEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;">Cargando contenido...</div>';
  modal.classList.remove('hidden');

  try {
    let chapterData = await window.wtrApi.readChapter(novelItem.raw_id || novelItem.id, chapterNo, lang);
    if (!chapterData) {
      // Fallback automático al idioma alternativo si el capítulo existe localmente
      const altLang = lang === 'es' ? 'en' : 'es';
      const altData = await window.wtrApi.readChapter(novelItem.raw_id || novelItem.id, chapterNo, altLang);
      if (altData) {
        chapterData = altData;
        lang = altLang;
        currentReadingLang = altLang;
      }
    }

    if (!chapterData) {
      titleEl.textContent = `Capítulo ${chapterNo} no encontrado`;
      // Buscar si existen otros capítulos descargados para orientar al usuario
      const availChapters = (await window.wtrApi.getDownloadedChapters(novelItem.raw_id || novelItem.id, lang))
        || (await window.wtrApi.getDownloadedChapters(novelItem.raw_id || novelItem.id, lang === 'es' ? 'en' : 'es'))
        || [];

      if (availChapters.length > 0) {
        const firstCh = availChapters[0];
        articleEl.innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <p style="color: #f87171; font-weight: 600; margin-bottom: 12px;">No se encontró el capítulo ${chapterNo} en la base de datos (${lang.toUpperCase()}).</p>
            <p style="color: var(--text-muted); margin-bottom: 24px;">Hay ${availChapters.length} capítulo(s) disponibles para esta novela.</p>
            <div style="display: flex; gap: 12px; justify-content: center;">
              <button class="btn btn-primary btn-sm" id="reader-jump-first-btn">Leer Capítulo ${firstCh.chapter_no} (${(firstCh.language || lang).toUpperCase()})</button>
              <button class="btn btn-outline btn-sm" id="reader-view-all-btn">Ver lista de capítulos</button>
            </div>
          </div>
        `;
        document.getElementById('reader-jump-first-btn')?.addEventListener('click', () => {
          currentReadingChaptersList = availChapters;
          openReaderModal(novelItem, firstCh.chapter_no, firstCh.language || lang);
        });
        document.getElementById('reader-view-all-btn')?.addEventListener('click', () => {
          modal.classList.add('hidden');
          openChaptersModal(novelItem);
        });
      } else {
        articleEl.innerHTML = `<div style="color: #f87171; text-align: center; padding: 40px;">No se encontró el capítulo ${chapterNo} ni hay capítulos guardados para esta novela.</div>`;
      }
      return;
    }

    titleEl.textContent = chapterData.title || `Capítulo ${chapterNo}`;
    modelBadge.textContent = chapterData.model || 'Gemini AI';
    paragraphsInfo.textContent = `${chapterData.paragraphs?.length || 0} párrafos (${lang.toUpperCase()})`;

    const langBadge = document.getElementById('reader-lang-badge');
    if (langBadge) {
      langBadge.textContent = lang.toUpperCase();
    }

    const readerTranslateBtn = document.getElementById('reader-translate-btn');
    const readerTranslateLabel = document.getElementById('reader-translate-label');
    if (readerTranslateBtn && readerTranslateLabel) {
      readerTranslateBtn.disabled = false;
      if (lang === 'es') {
        readerTranslateBtn.classList.add('in-spanish');
        readerTranslateLabel.textContent = 'En Español (Ver EN)';
        readerTranslateBtn.title = 'Capítulo disponible en Español. Clic para alternar a versión en Inglés.';
      } else {
        readerTranslateBtn.classList.remove('in-spanish');
        readerTranslateLabel.textContent = 'Traducir a Español';
        readerTranslateBtn.title = 'Traducir este capítulo a Español';
      }
    }

    stopTts();
    currentTtsParagraphs = chapterData.paragraphs || [];
    currentTtsParagraphIndex = 0;

    // Seleccionar automáticamente una voz adecuada al idioma del capítulo
    const voiceSelect = document.getElementById('tts-voice-select');
    if (voiceSelect && voiceSelect.options.length > 0) {
      if (lang === 'es') {
        const esVoice = Array.from(voiceSelect.options).find(o => o.value.startsWith('es-'));
        if (esVoice) voiceSelect.value = esVoice.value;
      } else {
        const enVoice = Array.from(voiceSelect.options).find(o => o.value.startsWith('en-'));
        if (enVoice) voiceSelect.value = enVoice.value;
      }
    }

    articleEl.innerHTML = '';
    currentTtsParagraphs.forEach((pText, pIdx) => {
      const p = document.createElement('p');
      p.className = 'reader-paragraph';
      p.setAttribute('data-pindex', pIdx);

      // Dividir el texto conservando espacios para hacer clic en cualquier palabra
      const tokens = pText.split(/(\s+)/);
      tokens.forEach((token) => {
        if (!token.trim()) {
          p.appendChild(document.createTextNode(token));
        } else {
          const span = document.createElement('span');
          span.className = 'reader-word';
          span.setAttribute('data-pindex', pIdx);
          span.textContent = token;
          span.title = 'Clic para escuchar desde aquí';
          span.addEventListener('click', (e) => {
            e.stopPropagation();
            playFromWord(pIdx, token);
          });
          p.appendChild(span);
        }
      });
      articleEl.appendChild(p);
    });

    document.querySelector('.reader-body')?.scrollTo({ top: 0, behavior: 'instant' });
    updateReaderNavButtons();
    updateLastReadWidget();
  } catch (err) {
    titleEl.textContent = 'Error al cargar capítulo';
    articleEl.innerHTML = `<div style="color: #f87171; text-align: center; padding: 40px;">Error: ${escapeHtml(err.message)}</div>`;
  }
}

function updateReaderNavButtons() {
  const prevBtn = document.getElementById('reader-prev-btn');
  const nextBtn = document.getElementById('reader-next-btn');

  const idx = currentReadingChaptersList.findIndex(c => c.chapter_no === currentReadingChapterNo);
  if (idx > 0) {
    prevBtn.disabled = false;
    prevBtn.style.opacity = '1';
  } else {
    prevBtn.disabled = true;
    prevBtn.style.opacity = '0.4';
  }

  if (idx !== -1 && idx < currentReadingChaptersList.length - 1) {
    nextBtn.disabled = false;
    nextBtn.style.opacity = '1';
  } else {
    nextBtn.disabled = true;
    nextBtn.style.opacity = '0.4';
  }
}

async function updateLastReadWidget() {
  try {
    const lastRead = await window.wtrApi.getLastRead();
    const container = document.getElementById('sidebar-last-read');
    if (!container) return;

    if (!lastRead || !lastRead.last_read_chapter_no) {
      container.classList.add('hidden');
      return;
    }

    let lang = lastRead.last_read_language || 'en';
    let chapters = await window.wtrApi.getDownloadedChapters(lastRead.novel_id, lang);
    if (!chapters || chapters.length === 0) {
      const altLang = lang === 'es' ? 'en' : 'es';
      const altChapters = await window.wtrApi.getDownloadedChapters(lastRead.novel_id, altLang);
      if (altChapters && altChapters.length > 0) {
        lang = altLang;
        chapters = altChapters;
      }
    }

    if (!chapters || chapters.length === 0) {
      container.classList.add('hidden');
      return;
    }

    let targetChNo = lastRead.last_read_chapter_no;
    if (!chapters.some(c => c.chapter_no === targetChNo)) {
      targetChNo = chapters[0].chapter_no;
    }

    container.classList.remove('hidden');
    const titleEl = document.getElementById('last-read-title');
    const chEl = document.getElementById('last-read-chapter');
    const langEl = document.getElementById('last-read-lang');

    if (titleEl) titleEl.textContent = lastRead.title || 'Novela';
    if (chEl) chEl.textContent = `Capítulo ${targetChNo}`;
    if (langEl) langEl.textContent = lang.toUpperCase();

    const btn = document.getElementById('menu-continue-reading-btn');
    if (btn) {
      btn.onclick = async (e) => {
        e.preventDefault();
        const novelObj = {
          raw_id: lastRead.novel_id,
          id: lastRead.novel_id,
          slug: lastRead.slug,
          title: lastRead.title,
          cover_url: lastRead.cover_url,
          author: lastRead.author
        };
        currentReadingChaptersList = chapters;
        openReaderModal(novelObj, targetChNo, lang);
      };
    }
  } catch (err) {
    console.warn('Error al actualizar widget de última lectura:', err);
  }
}

/* ==========================================================================
   4d. MOTOR DE LECTURA NATURAL EN VOZ ALTA (TTS) Y REPRODUCTOR
   ========================================================================== */
let currentTtsAudio = null;
let isTtsPlaying = false;
let currentTtsParagraphIndex = 0;
let currentTtsParagraphs = [];
let ttsPlaybackSessionId = 0;

async function initTtsControls() {
  const playBtn = document.getElementById('tts-play-btn');
  const stopBtn = document.getElementById('tts-stop-btn');
  const exportBtn = document.getElementById('tts-export-btn');
  const voiceSelect = document.getElementById('tts-voice-select');

  try {
    const voices = await window.wtrApi.ttsGetVoices();
    if (voiceSelect && voices && voices.length > 0) {
      voiceSelect.innerHTML = '';
      voices.forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = `${v.flag} ${v.name} (${v.gender} - ${v.desc})`;
        voiceSelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.warn('Error al cargar voces naturales:', err);
  }

  playBtn?.addEventListener('click', () => {
    if (isTtsPlaying) {
      pauseTts();
    } else {
      resumeOrStartTts();
    }
  });

  stopBtn?.addEventListener('click', () => {
    stopTts();
  });

  exportBtn?.addEventListener('click', async () => {
    await exportCurrentChapterAudio();
  });
}

function updateTtsUiPlayingState(playing) {
  const playBtn = document.getElementById('tts-play-btn');
  const playLabel = document.getElementById('tts-play-label');
  const stopBtn = document.getElementById('tts-stop-btn');

  if (playing) {
    playBtn?.classList.add('playing');
    if (playLabel) playLabel.textContent = 'Pausar';
    stopBtn?.classList.remove('hidden');
  } else {
    playBtn?.classList.remove('playing');
    if (playLabel) playLabel.textContent = 'Escuchar';
  }
}

function updateTtsStatus(msg) {
  const el = document.getElementById('tts-status-text');
  if (el) el.textContent = msg;
}

function clearWordHighlights() {
  document.querySelectorAll('.reader-word.active-word').forEach(el => el.classList.remove('active-word'));
}

function clearParagraphHighlights() {
  document.querySelectorAll('.reader-paragraph.active-paragraph').forEach(el => el.classList.remove('active-paragraph'));
}

function highlightActiveParagraph(pIndex) {
  clearParagraphHighlights();
  const p = document.querySelector(`.reader-paragraph[data-pindex="${pIndex}"]`);
  if (p) {
    p.classList.add('active-paragraph');
    p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function pauseTts() {
  if (currentTtsAudio) {
    currentTtsAudio.pause();
    isTtsPlaying = false;
    updateTtsUiPlayingState(false);
    updateTtsStatus('En pausa. Haz clic en Escuchar para reanudar.');
  }
}

function resumeOrStartTts() {
  if (currentTtsAudio && currentTtsAudio.paused && currentTtsAudio.currentTime > 0) {
    currentTtsAudio.play();
    isTtsPlaying = true;
    updateTtsUiPlayingState(true);
    updateTtsStatus(`Leyendo párrafo ${currentTtsParagraphIndex + 1}/${currentTtsParagraphs.length}...`);
  } else {
    playParagraphTts(currentTtsParagraphIndex || 0);
  }
}

function stopTts() {
  ttsPlaybackSessionId++;
  if (currentTtsAudio) {
    currentTtsAudio.pause();
    currentTtsAudio = null;
  }
  isTtsPlaying = false;
  clearWordHighlights();
  clearParagraphHighlights();
  updateTtsUiPlayingState(false);
  updateTtsStatus('Clic en cualquier palabra para iniciar');
}

function playFromWord(pIndex, wordText) {
  stopTts();
  playParagraphTts(pIndex, wordText);
}

async function playParagraphTts(pIndex, targetWord = null) {
  if (pIndex < 0 || pIndex >= currentTtsParagraphs.length) {
    stopTts();
    return;
  }

  currentTtsParagraphIndex = pIndex;
  const thisSession = ++ttsPlaybackSessionId;
  const text = currentTtsParagraphs[pIndex];
  if (!text || !text.trim()) {
    playParagraphTts(pIndex + 1);
    return;
  }

  highlightActiveParagraph(pIndex);
  updateTtsStatus(`Generando voz: párrafo ${pIndex + 1}/${currentTtsParagraphs.length}...`);

  const voiceSelect = document.getElementById('tts-voice-select');
  const rateSelect = document.getElementById('tts-rate-select');
  const voice = voiceSelect ? voiceSelect.value : 'es-ES-AlvaroNeural';
  const rate = rateSelect ? rateSelect.value : 'default';

  try {
    const result = await window.wtrApi.ttsSynthesize(text, { voice, rate });
    if (thisSession !== ttsPlaybackSessionId) return;

    if (!result || !result.audioBase64) {
      playParagraphTts(pIndex + 1);
      return;
    }

    if (currentTtsAudio) {
      currentTtsAudio.pause();
      currentTtsAudio = null;
    }

    const audio = new Audio('data:audio/mp3;base64,' + result.audioBase64);
    currentTtsAudio = audio;
    isTtsPlaying = true;
    updateTtsUiPlayingState(true);
    updateTtsStatus(`Leyendo párrafo ${pIndex + 1}/${currentTtsParagraphs.length}...`);

    const wordList = result.words || [];
    const pElement = document.querySelector(`.reader-paragraph[data-pindex="${pIndex}"]`);
    const wordSpans = pElement ? Array.from(pElement.querySelectorAll('.reader-word')) : [];

    audio.ontimeupdate = () => {
      const currentMs = audio.currentTime * 1000;
      const matched = wordList.find(w => currentMs >= w.start && currentMs <= w.end);
      if (matched && pElement) {
        const cleanMatch = matched.part.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '').toLowerCase();
        wordSpans.forEach(span => {
          const cleanSpan = span.textContent.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '').toLowerCase();
          if (cleanSpan === cleanMatch) {
            span.classList.add('active-word');
          } else {
            span.classList.remove('active-word');
          }
        });
      }
    };

    if (targetWord) {
      const cleanTarget = targetWord.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '').toLowerCase();
      const wordMatch = wordList.find(w => w.part.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '').toLowerCase() === cleanTarget);
      if (wordMatch && wordMatch.start) {
        audio.currentTime = Math.max(0, (wordMatch.start / 1000) - 0.05);
      }
    }

    audio.onended = () => {
      clearWordHighlights();
      if (currentTtsParagraphIndex + 1 < currentTtsParagraphs.length) {
        playParagraphTts(currentTtsParagraphIndex + 1);
      } else {
        stopTts();
        updateTtsStatus('Lectura del capítulo finalizada');
      }
    };

    audio.onerror = (err) => {
      console.warn('Error en reproducción:', err);
      playParagraphTts(pIndex + 1);
    };

    await audio.play();
  } catch (err) {
    if (thisSession === ttsPlaybackSessionId) {
      console.error('Error al sintetizar párrafo:', err);
      updateTtsStatus('Error al sintetizar voz');
      stopTts();
    }
  }
}

async function exportCurrentChapterAudio() {
  if (!currentReadingNovel || !currentTtsParagraphs || currentTtsParagraphs.length === 0) {
    alert('No hay párrafos disponibles para exportar audio.');
    return;
  }

  const exportBtn = document.getElementById('tts-export-btn');
  const originalHtml = exportBtn.innerHTML;
  exportBtn.disabled = true;
  exportBtn.innerHTML = `<span>Exportando MP3...</span>`;
  updateTtsStatus('Generando archivo de audio completo...');

  const voiceSelect = document.getElementById('tts-voice-select');
  const rateSelect = document.getElementById('tts-rate-select');
  const voice = voiceSelect ? voiceSelect.value : 'es-ES-AlvaroNeural';
  const rate = rateSelect ? rateSelect.value : 'default';

  try {
    const res = await window.wtrApi.ttsExportChapter({
      slug: currentReadingNovel.slug,
      chapterNo: currentReadingChapterNo,
      title: document.getElementById('reader-chapter-title').textContent,
      paragraphs: currentTtsParagraphs,
      options: { voice, rate }
    });

    updateTtsStatus(`¡Audio exportado! (${res.formattedSize})`);
    alert(`Capítulo exportado exitosamente como audio MP3:\n${res.filePath} (${res.formattedSize})`);
  } catch (err) {
    console.error('Error al exportar audio:', err);
    alert(`Error al exportar audio: ${err.message}`);
    updateTtsStatus('Error al exportar audio');
  } finally {
    exportBtn.disabled = false;
    exportBtn.innerHTML = originalHtml;
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
    const available = (stats && (lang === 'es' ? stats.esChapters : stats.enChapters)) || [];

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
      showFeedback(feedback, 'success', 'Cookies de sesión guardadas con éxito.');
      refreshAuthStatus();
    } catch (err) {
      showFeedback(feedback, 'error', `Error al guardar: ${err.message}`);
    }
  });

  testBtn.addEventListener('click', async () => {
    showFeedback(feedback, 'info', 'Probando conexión con WTR-Lab...');
    const res = await window.wtrApi.testAuth();
    if (res.ok) {
      showFeedback(feedback, 'success', 'Conexión exitosa con WTR-Lab.');
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

  // Configuración de Gemini API Key
  const geminiInput = document.getElementById('gemini-key-input');
  const toggleGeminiBtn = document.getElementById('toggle-gemini-key-btn');
  const saveGeminiBtn = document.getElementById('save-gemini-key-btn');
  const clearGeminiBtn = document.getElementById('clear-gemini-key-btn');
  const geminiFeedback = document.getElementById('gemini-key-feedback');
  const geminiPill = document.getElementById('gemini-key-status-pill');

  async function loadGeminiKeyStatus() {
    try {
      const info = await window.wtrApi.getGeminiKey();
      if (info && info.hasKey) {
        if (geminiInput) geminiInput.value = info.key;
        if (geminiPill) {
          geminiPill.textContent = 'Configurada';
          geminiPill.className = 'badge badge-success';
        }
      } else {
        if (geminiInput) geminiInput.value = '';
        if (geminiPill) {
          geminiPill.textContent = 'Sin Configurar';
          geminiPill.className = 'badge badge-secondary';
        }
      }
    } catch {}
  }

  loadGeminiKeyStatus();

  toggleGeminiBtn?.addEventListener('click', () => {
    if (!geminiInput) return;
    if (geminiInput.type === 'password') {
      geminiInput.type = 'text';
      toggleGeminiBtn.textContent = 'Ocultar';
    } else {
      geminiInput.type = 'password';
      toggleGeminiBtn.textContent = 'Ver';
    }
  });

  saveGeminiBtn?.addEventListener('click', async () => {
    const key = geminiInput ? geminiInput.value.trim() : '';
    if (!key) {
      showFeedback(geminiFeedback, 'error', 'Ingresa una API Key válida.');
      return;
    }
    try {
      await window.wtrApi.saveGeminiKey(key);
      showFeedback(geminiFeedback, 'success', 'API Key de Gemini guardada correctamente.');
      loadGeminiKeyStatus();
    } catch (err) {
      showFeedback(geminiFeedback, 'error', `Error al guardar: ${err.message}`);
    }
  });

  clearGeminiBtn?.addEventListener('click', async () => {
    await window.wtrApi.saveGeminiKey('');
    if (geminiInput) geminiInput.value = '';
    showFeedback(geminiFeedback, 'info', 'API Key de Gemini eliminada.');
    loadGeminiKeyStatus();
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
  div.innerHTML = ICONS.book;
  return div;
};
