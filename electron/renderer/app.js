// WTR-Lab Novel Downloader - Frontend Application Logic

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
      <div style="display: flex; gap: 8px; margin-top: 10px;">
        <button id="dl-view-library-btn" class="btn btn-primary btn-xs">
          📖 Ver en Mi Biblioteca
        </button>
        <button id="dl-open-folder-btn" class="btn btn-outline btn-xs">
          📂 Abrir carpeta en Explorador
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
      card.setAttribute('data-title', (item.title || '').toLowerCase());
      card.setAttribute('data-author', (item.author || '').toLowerCase());

      const coverHtml = item.cover_url
        ? `<img src="${escapeHtml(item.cover_url)}" alt="Cover" class="novel-card-cover" onerror="this.onerror=null;this.replaceWith(createPlaceholderCover())">`
        : `<div class="novel-card-cover-placeholder">📖</div>`;

      const langBadges = (item.languages || 'ninguno')
        .split(',')
        .map(l => `<span class="badge badge-primary">${escapeHtml(l.trim().toUpperCase())}</span>`)
        .join(' ');

      card.innerHTML = `
        <div class="novel-card-top">
          ${coverHtml}
          <div class="novel-card-info">
            <h3 class="novel-card-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h3>
            <span class="novel-card-author">👤 ${escapeHtml(item.author || 'Desconocido')}</span>
            <span class="novel-card-chapters">📑 Guardados: <strong>${item.downloaded_chapters}</strong> / ${item.total_chapters || '?'}</span>
            <div class="novel-card-meta-chips">
              ${langBadges}
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-primary btn-sm btn-view-chapters" style="flex: 1 1 100%;">
            📑 Ver Capítulos (${item.downloaded_chapters})
          </button>
          <button class="btn btn-outline btn-sm btn-offline-export" style="flex: 1;" title="Exportar TXT/PDF">
            ⚡ Exportar
          </button>
          <button class="btn btn-outline btn-sm btn-open-folder" title="Abrir carpeta">
            📂
          </button>
        </div>
      `;

      card.querySelector('.btn-view-chapters').addEventListener('click', () => {
        openChaptersModal(item);
      });

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

/* ==========================================================================
   4b. MODAL DE CAPÍTULOS DE LA NOVELA
   ========================================================================== */
function initChaptersModal() {
  const modal = document.getElementById('chapters-modal');
  const closeBtn = document.getElementById('close-chapters-modal-btn');
  const closeBottomBtn = document.getElementById('close-chapters-bottom-btn');
  const langFilter = document.getElementById('chapters-lang-filter');

  const closeModal = () => modal.classList.add('hidden');
  closeBtn?.addEventListener('click', closeModal);
  closeBottomBtn?.addEventListener('click', closeModal);

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

    itemEl.innerHTML = `
      <div class="chapter-item-left">
        <span class="chapter-item-title">Capítulo ${ch.chapter_no}: ${escapeHtml(displayTitle)}</span>
        <div class="chapter-item-meta">
          <span>⚙️ ${escapeHtml(ch.model || 'Gemini AI')}</span>
          <span>📝 ${(ch.char_length || 0).toLocaleString()} caracteres</span>
          <span>🌐 ${ch.language.toUpperCase()}</span>
        </div>
      </div>
      <button class="btn btn-primary btn-sm btn-read-ch">
        📖 Leer
      </button>
    `;

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

  const closeModal = () => modal.classList.add('hidden');
  closeBtn?.addEventListener('click', closeModal);
  closeBottomBtn?.addEventListener('click', closeModal);

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
    const chapterData = await window.wtrApi.readChapter(novelItem.raw_id || novelItem.id, chapterNo, lang);
    if (!chapterData) {
      titleEl.textContent = `Capítulo ${chapterNo} no encontrado`;
      articleEl.innerHTML = `<div style="color: #f87171; text-align: center; padding: 40px;">No se encontró el capítulo ${chapterNo} en la base de datos.</div>`;
      return;
    }

    titleEl.textContent = chapterData.title || `Capítulo ${chapterNo}`;
    modelBadge.textContent = chapterData.model || 'Gemini AI';
    paragraphsInfo.textContent = `${chapterData.paragraphs?.length || 0} párrafos (${lang.toUpperCase()})`;

    articleEl.innerHTML = '';
    (chapterData.paragraphs || []).forEach((pText) => {
      const p = document.createElement('p');
      p.textContent = pText;
      articleEl.appendChild(p);
    });

    document.querySelector('.reader-body')?.scrollTo({ top: 0, behavior: 'instant' });
    updateReaderNavButtons();
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
