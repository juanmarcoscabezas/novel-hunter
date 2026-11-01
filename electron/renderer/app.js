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
  arrowRight: '<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
  arrowLeft: '<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>',
  downloadSm: '<svg class="svg-icon icon-sm" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
  downloadXs: '<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
  playSm: '<svg class="svg-icon icon-sm" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>',
  trash: '<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
  trashSm: '<svg class="svg-icon icon-sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
  chevronRight: '<svg class="svg-icon icon-xs chapter-accordion-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>',
  listSm: '<svg class="svg-icon icon-sm" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
  listXs: '<svg class="svg-icon icon-xs" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
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
let chapterGroupingSize = 20;

// Historial de comandos en la terminal
const commandHistory = [];
let historyIndex = -1;

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSearch();
  initDownloadModal();
  initLibrary();
  initChaptersModal();
  initDeleteChaptersModal();
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
      <div class="novel-card-top" style="cursor: pointer;" title="Explorar esta novela">
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
      <div class="novel-card-actions">
        <button class="btn btn-outline btn-sm btn-explore-toc" title="Ver tabla de contenidos con nombre de capítulos">
          ${ICONS.listSm}
          <span>Tabla de Contenidos</span>
        </button>
        <button class="btn btn-primary btn-sm btn-select-novel" title="Configurar y descargar novela">
          ${ICONS.downloadSm}
          <span>Descargar</span>
        </button>
      </div>
    `;

    card.querySelector('.novel-card-top')?.addEventListener('click', () => {
      openDownloadModal(novel, { expandToc: false });
    });

    card.querySelector('.btn-explore-toc')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openDownloadModal(novel, { expandToc: true });
    });

    card.querySelector('.btn-select-novel').addEventListener('click', (e) => {
      e.stopPropagation();
      openDownloadModal(novel, { expandToc: false });
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
      highlightSelectedTocChapters();
    });
  });

  rangeInput?.addEventListener('input', () => {
    highlightSelectedTocChapters();
  });

  // Controles de la Tabla de Contenidos (TOC)
  const tocSearch = document.getElementById('modal-toc-search');
  const tocClearBtn = document.getElementById('modal-toc-clear-btn');
  const tocSort = document.getElementById('modal-toc-sort');
  const toggleExpandBtn = document.getElementById('toggle-expand-toc-btn');
  const toggleExpandText = document.getElementById('toggle-expand-toc-text');
  const downloadModalCard = modal.querySelector('.download-modal-card');

  if (tocSort) {
    const savedTocSort = localStorage.getItem('toc_sort_order') || 'asc';
    tocSort.value = savedTocSort;
    tocSort.addEventListener('change', () => {
      localStorage.setItem('toc_sort_order', tocSort.value);
      renderModalTableOfContents(currentNovelChapters, tocSearch?.value || '', tocSort.value);
    });
  }

  if (tocSearch) {
    tocSearch.addEventListener('input', () => {
      const q = tocSearch.value.trim();
      if (q) {
        tocClearBtn?.classList.remove('hidden');
      } else {
        tocClearBtn?.classList.add('hidden');
      }
      renderModalTableOfContents(currentNovelChapters, q, tocSort?.value || 'asc');
    });
  }

  if (tocClearBtn) {
    tocClearBtn.addEventListener('click', () => {
      if (tocSearch) tocSearch.value = '';
      tocClearBtn.classList.add('hidden');
      renderModalTableOfContents(currentNovelChapters, '', tocSort?.value || 'asc');
      tocSearch?.focus();
    });
  }

  if (toggleExpandBtn) {
    toggleExpandBtn.addEventListener('click', () => {
      if (!downloadModalCard) return;
      const isExpanded = downloadModalCard.classList.toggle('toc-expanded');
      if (toggleExpandText) {
        toggleExpandText.textContent = isExpanded ? 'Compactar' : 'Expandir';
      }
    });
  }

  const closeModal = () => {
    if (isDownloading) {
      if (!confirm('Hay una descarga en curso. ¿Deseas cerrarla? La descarga continuará en segundo plano.')) {
        return;
      }
    }
    modal.classList.add('hidden');
    downloadModalCard?.classList.remove('toc-expanded');
    if (toggleExpandText) toggleExpandText.textContent = 'Expandir';
    if (tocSearch) tocSearch.value = '';
    if (tocClearBtn) tocClearBtn.classList.add('hidden');
    resetDownloadProgress();

    if (currentChaptersNovel) {
      const langFilter = document.getElementById('chapters-lang-filter');
      const lang = langFilter ? langFilter.value : 'en';
      loadChaptersListForNovel(currentChaptersNovel, lang).catch(() => {});
      updateModalActionButtons(currentChaptersNovel, lang).catch(() => {});
    }
    if (currentReadingNovel) {
      const novelId = currentReadingNovel.raw_id || currentReadingNovel.id;
      window.wtrApi.getDownloadedChapters(novelId, currentReadingLang).then(chapters => {
        if (chapters && chapters.length > 0) {
          currentReadingChaptersList = chapters;
          updateReaderNavButtons();
        }
      }).catch(() => {});
    }
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

async function openDownloadModal(novel, options = null) {
  currentSelectedNovel = novel;
  const modal = document.getElementById('download-modal');
  const downloadModalCard = modal.querySelector('.download-modal-card');
  const toggleExpandText = document.getElementById('toggle-expand-toc-text');
  const tocSearch = document.getElementById('modal-toc-search');
  const tocClearBtn = document.getElementById('modal-toc-clear-btn');

  // Determinar parámetros de opciones
  let suggestedStartChapter = null;
  let expandToc = false;
  let preferredLang = null;
  if (typeof options === 'number') {
    suggestedStartChapter = options;
  } else if (options && typeof options === 'object') {
    suggestedStartChapter = options.suggestedStartChapter || null;
    expandToc = Boolean(options.expandToc);
    preferredLang = options.lang || null;
  }

  const langSelect = document.getElementById('lang-select');
  if (langSelect && preferredLang) {
    langSelect.value = preferredLang;
  }

  document.getElementById('modal-novel-title').textContent = novel.title;
  document.getElementById('modal-novel-author').textContent = novel.author || 'Desconocido';
  document.getElementById('modal-novel-chapters').textContent = novel.chapterCount || novel.total_chapters || 'Cargando...';
  document.getElementById('modal-novel-desc').textContent = novel.description || novel.synopsis || 'Sin sinopsis disponible.';

  const coverImg = document.getElementById('modal-novel-cover');
  const coverUrl = novel.image || novel.cover_url || novel.coverUrl;
  if (coverUrl) {
    coverImg.referrerPolicy = 'no-referrer';
    coverImg.src = coverUrl;
    coverImg.classList.remove('hidden');
  } else {
    coverImg.classList.add('hidden');
  }

  const rangeInput = document.getElementById('chapter-range-input');
  if (rangeInput) {
    if (suggestedStartChapter) {
      const end = suggestedStartChapter + 9;
      rangeInput.value = `${suggestedStartChapter}-${end}`;
    } else if (!rangeInput.value) {
      rangeInput.value = '1-5';
    }
  }

  // Configurar modo de vista inicial
  if (expandToc) {
    downloadModalCard?.classList.add('toc-expanded');
    if (toggleExpandText) toggleExpandText.textContent = 'Compactar';
  } else {
    downloadModalCard?.classList.remove('toc-expanded');
    if (toggleExpandText) toggleExpandText.textContent = 'Expandir';
  }

  // Limpiar estado de búsqueda previa
  if (tocSearch) tocSearch.value = '';
  if (tocClearBtn) tocClearBtn.classList.add('hidden');

  const tocList = document.getElementById('modal-toc-list');
  if (tocList) {
    tocList.innerHTML = `
      <div class="toc-loading-placeholder">
        <span class="btn-loader"></span>
        <span>Cargando tabla de contenidos desde WTR-Lab...</span>
      </div>
    `;
  }

  resetDownloadProgress();
  modal.classList.remove('hidden');

  if (expandToc) {
    setTimeout(() => tocSearch?.focus(), 80);
  }

  // Cargar lista oficial de capítulos desde la API
  document.getElementById('modal-total-avail').textContent = 'Consultando WTR-Lab...';
  try {
    currentNovelChapters = await window.wtrApi.getChapters(novel.rawId || novel.id || novel.raw_id);
    document.getElementById('modal-total-avail').textContent = `${currentNovelChapters.length} capítulos disponibles`;
    document.getElementById('modal-novel-chapters').textContent = currentNovelChapters.length;
    renderModalTableOfContents(currentNovelChapters, '');
  } catch (err) {
    document.getElementById('modal-total-avail').textContent = 'Información no disponible';
    if (tocList) {
      tocList.innerHTML = `
        <div class="toc-empty-state">
          <span>No se pudo cargar la tabla de contenidos (${escapeHtml(err.message || 'Error de red')}).</span>
          <button type="button" id="btn-retry-toc" class="btn btn-outline btn-xs" style="margin-top: 8px;">Reintentar</button>
        </div>
      `;
      document.getElementById('btn-retry-toc')?.addEventListener('click', () => {
        openDownloadModal(novel, options);
      });
    }
  }
}

function renderModalTableOfContents(chapters, filterText = '', sortOrder = null) {
  const container = document.getElementById('modal-toc-list');
  const countBadge = document.getElementById('modal-toc-count');
  const filterStatus = document.getElementById('modal-toc-filter-status');
  const rangeInput = document.getElementById('chapter-range-input');
  const tocSort = document.getElementById('modal-toc-sort');
  const activeSort = sortOrder || tocSort?.value || 'asc';

  if (!container) return;

  const totalCount = Array.isArray(chapters) ? chapters.length : 0;
  if (countBadge) {
    countBadge.textContent = `${totalCount} capítulos`;
  }

  if (!chapters || chapters.length === 0) {
    container.innerHTML = `
      <div class="toc-empty-state">
        <span>No hay capítulos disponibles en este momento.</span>
      </div>
    `;
    return;
  }

  const query = (filterText || '').trim().toLowerCase();
  let filtered = [...chapters];
  if (query) {
    filtered = filtered.filter((ch) => {
      const titleMatch = ch.title && ch.title.toLowerCase().includes(query);
      const rawTitleMatch = ch.rawTitle && ch.rawTitle.toLowerCase().includes(query);
      const orderMatch = String(ch.order) === query || String(ch.order).startsWith(query) || `capítulo ${ch.order}`.includes(query) || `cap ${ch.order}`.includes(query);
      return Boolean(titleMatch || rawTitleMatch || orderMatch);
    });

    if (filterStatus) {
      filterStatus.textContent = `Mostrando ${filtered.length} de ${totalCount} capítulos`;
      filterStatus.classList.remove('hidden');
    }
  } else {
    if (filterStatus) {
      filterStatus.classList.add('hidden');
      filterStatus.textContent = '';
    }
  }

  // Ordenar lista de capítulos
  if (activeSort === 'desc') {
    filtered.sort((a, b) => b.order - a.order);
  } else {
    filtered.sort((a, b) => a.order - b.order);
  }

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="toc-empty-state">
        <span>No se encontraron capítulos que coincidan con "${escapeHtml(filterText)}".</span>
      </div>
    `;
    return;
  }

  // Parsear el rango actual para iluminar capítulos seleccionados
  let currentRangeNumbers = new Set();
  if (rangeInput && rangeInput.value) {
    try {
      const parsed = parseChapterSpec(rangeInput.value, totalCount);
      currentRangeNumbers = new Set(parsed);
    } catch {}
  }

  const fragment = document.createDocumentFragment();

  filtered.forEach((ch) => {
    const item = document.createElement('div');
    item.className = 'toc-chapter-item';
    item.dataset.order = ch.order;

    if (currentRangeNumbers.has(ch.order)) {
      item.classList.add('selected');
    }

    const displayTitle = ch.title || `Capítulo ${ch.order}`;
    const rawTitleHtml = ch.rawTitle && ch.rawTitle !== displayTitle
      ? `<span class="toc-ch-raw" title="${escapeHtml(ch.rawTitle)}">(${escapeHtml(ch.rawTitle)})</span>`
      : '';

    item.innerHTML = `
      <div class="toc-chapter-main">
        <span class="toc-ch-badge">Cap. ${ch.order}</span>
        <span class="toc-ch-title" title="${escapeHtml(displayTitle)}">${escapeHtml(displayTitle)}</span>
        ${rawTitleHtml}
      </div>
      <div class="toc-chapter-actions">
        <button type="button" class="btn btn-outline btn-xs btn-toc-pick" title="Seleccionar capítulo ${ch.order}">
          Seleccionar
        </button>
        <button type="button" class="btn btn-outline btn-xs btn-toc-range-to" title="Definir rango hasta el capítulo ${ch.order}">
          Hasta aquí
        </button>
      </div>
    `;

    const handleSelectSingle = (e) => {
      e.stopPropagation();
      if (rangeInput) {
        rangeInput.value = String(ch.order);
        highlightSelectedTocChapters();
      }
    };

    const handleRangeTo = (e) => {
      e.stopPropagation();
      if (rangeInput) {
        let start = 1;
        const currentVal = rangeInput.value.trim();
        const match = currentVal.match(/^(\d+)/);
        if (match) {
          start = parseInt(match[1], 10);
        }
        if (ch.order >= start) {
          rangeInput.value = `${start}-${ch.order}`;
        } else {
          rangeInput.value = `${ch.order}-${start}`;
        }
        highlightSelectedTocChapters();
      }
    };

    item.addEventListener('click', handleSelectSingle);
    item.querySelector('.btn-toc-pick')?.addEventListener('click', handleSelectSingle);
    item.querySelector('.btn-toc-range-to')?.addEventListener('click', handleRangeTo);

    fragment.appendChild(item);
  });

  container.appendChild(fragment);
}

function highlightSelectedTocChapters() {
  const rangeInput = document.getElementById('chapter-range-input');
  const items = document.querySelectorAll('.toc-chapter-item');
  if (!rangeInput || !items.length) return;

  let currentRangeNumbers = new Set();
  const rawSpec = rangeInput.value.trim();
  if (rawSpec) {
    try {
      const parsed = parseChapterSpec(rawSpec, currentNovelChapters.length || 1000);
      currentRangeNumbers = new Set(parsed);
    } catch {}
  }

  items.forEach((item) => {
    const order = parseInt(item.dataset.order, 10);
    if (currentRangeNumbers.has(order)) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
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
      document.getElementById('reader-modal')?.classList.add('hidden');
      document.getElementById('chapters-modal')?.classList.add('hidden');
      resetDownloadProgress();
      const libTabBtn = document.querySelector('[data-tab="tab-library"]');
      if (libTabBtn) libTabBtn.click();
    });

    // Recargar biblioteca SQLite
    loadLibrary();

    // Si el modal de capítulos de esta novela está abierto, refrescar lista y botones
    if (currentChaptersNovel && (currentChaptersNovel.raw_id === payload.novel.raw_id || currentChaptersNovel.id === payload.novel.id || currentChaptersNovel.slug === payload.novel.slug)) {
      const langFilter = document.getElementById('chapters-lang-filter');
      const lang = langFilter ? langFilter.value : (payload.lang || 'en');
      await loadChaptersListForNovel(currentChaptersNovel, lang);
      await updateModalActionButtons(currentChaptersNovel, lang);
    }

    // Si el lector está abierto para esta novela, actualizar la lista de capítulos y botones
    if (currentReadingNovel && (currentReadingNovel.raw_id === payload.novel.raw_id || currentReadingNovel.id === payload.novel.id || currentReadingNovel.slug === payload.novel.slug)) {
      const novelId = currentReadingNovel.raw_id || currentReadingNovel.id;
      const chapters = await window.wtrApi.getDownloadedChapters(novelId, currentReadingLang);
      if (chapters && chapters.length > 0) {
        currentReadingChaptersList = chapters;
        updateReaderNavButtons();
      }
    }
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
let cachedLibraryNovels = [];

function initLibrary() {
  const refreshBtn = document.getElementById('refresh-library-btn');
  const filterInput = document.getElementById('library-filter-input');
  const langFilter = document.getElementById('library-lang-filter');
  const sortSelect = document.getElementById('library-sort-select');

  refreshBtn.addEventListener('click', loadLibrary);

  if (sortSelect) {
    const savedSort = localStorage.getItem('library_sort_order') || 'last_read';
    sortSelect.value = savedSort;
    sortSelect.addEventListener('change', () => {
      localStorage.setItem('library_sort_order', sortSelect.value);
      applyLibraryFiltersAndSort();
    });
  }

  if (langFilter) {
    const savedLang = localStorage.getItem('library_lang_filter') || 'all';
    langFilter.value = savedLang;
    langFilter.addEventListener('change', () => {
      localStorage.setItem('library_lang_filter', langFilter.value);
      applyLibraryFiltersAndSort();
    });
  }

  filterInput?.addEventListener('input', () => {
    applyLibraryFiltersAndSort();
  });

  initExportModal();
}

function applyLibraryFiltersAndSort() {
  const filterInput = document.getElementById('library-filter-input');
  const langFilter = document.getElementById('library-lang-filter');
  const sortSelect = document.getElementById('library-sort-select');

  const filterText = (filterInput?.value || '').toLowerCase().trim();
  const selectedLang = langFilter?.value || 'all';
  const selectedSort = sortSelect?.value || 'last_read';

  let list = [...cachedLibraryNovels];

  // 1. Filtrar por búsqueda de texto
  if (filterText) {
    list = list.filter((item) => {
      const title = (item.title || '').toLowerCase();
      const author = (item.author || '').toLowerCase();
      return title.includes(filterText) || author.includes(filterText);
    });
  }

  // 2. Filtrar por idioma
  if (selectedLang !== 'all') {
    list = list.filter((item) => {
      const langs = (item.languages || '').split(',').map(l => l.trim().toLowerCase());
      return langs.includes(selectedLang.toLowerCase());
    });
  }

  // 3. Ordenar
  list.sort((a, b) => {
    switch (selectedSort) {
      case 'title_asc':
        return (a.title || '').localeCompare(b.title || '');
      case 'title_desc':
        return (b.title || '').localeCompare(a.title || '');
      case 'chapters_desc':
        return (b.downloaded_chapters || 0) - (a.downloaded_chapters || 0);
      case 'chapters_asc':
        return (a.downloaded_chapters || 0) - (b.downloaded_chapters || 0);
      case 'author_asc':
        return (a.author || 'zzz').localeCompare(b.author || 'zzz');
      case 'progress_desc': {
        const progA = (a.downloaded_chapters || 0) / (a.total_chapters || 1);
        const progB = (b.downloaded_chapters || 0) / (b.total_chapters || 1);
        return progB - progA;
      }
      case 'last_read':
      default: {
        const timeA = a.last_read_at ? new Date(a.last_read_at).getTime() : 0;
        const timeB = b.last_read_at ? new Date(b.last_read_at).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return (b.downloaded_chapters || 0) - (a.downloaded_chapters || 0);
      }
    }
  });

  renderLibraryGrid(list);
}

function renderLibraryGrid(list) {
  const grid = document.getElementById('library-novel-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (list.length === 0) {
    if (cachedLibraryNovels.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.bookXl}</div>
          <h3>Tu biblioteca está vacía</h3>
          <p>Usa la pestaña "Buscador & Descarga" para buscar y guardar tus novelas en tu biblioteca local.</p>
        </div>
      `;
    } else {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.search}</div>
          <h3>Sin coincidencias</h3>
          <p>No se encontraron novelas con los filtros y ordenamiento seleccionados.</p>
        </div>
      `;
    }
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
}

async function loadLibrary() {
  const totalNovelsEl = document.getElementById('lib-total-novels');
  const totalChaptersEl = document.getElementById('lib-total-chapters');
  const storageSizeEl = document.getElementById('lib-storage-size');
  const sortSelect = document.getElementById('library-sort-select');

  try {
    const sortBy = sortSelect?.value || localStorage.getItem('library_sort_order') || 'last_read';
    const list = await window.wtrApi.getLibrary(sortBy);
    cachedLibraryNovels = list || [];

    if (window.wtrApi.getStorageStats && storageSizeEl) {
      try {
        const storage = await window.wtrApi.getStorageStats();
        storageSizeEl.textContent = storage?.formatted || '0 KB';
      } catch {
        storageSizeEl.textContent = '0 KB';
      }
    }

    if (totalNovelsEl) totalNovelsEl.textContent = cachedLibraryNovels.length;
    const totalChapters = cachedLibraryNovels.reduce((acc, item) => acc + (item.downloaded_chapters || 0), 0);
    if (totalChaptersEl) totalChaptersEl.textContent = totalChapters;

    applyLibraryFiltersAndSort();
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
  const moreBtn = document.getElementById('detail-more-btn');
  const moreDropdown = document.getElementById('detail-more-dropdown');

  const closeModal = () => {
    stopTts();
    modal.classList.add('hidden');
    moreDropdown?.classList.add('hidden');
    loadLibrary();
  };
  closeBtn?.addEventListener('click', closeModal);
  closeBottomBtn?.addEventListener('click', closeModal);

  moreBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    moreDropdown?.classList.toggle('hidden');
  });

  moreDropdown?.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      moreDropdown.classList.add('hidden');
    });
  });

  document.addEventListener('click', (e) => {
    if (moreDropdown && !moreDropdown.classList.contains('hidden')) {
      if (!moreDropdown.contains(e.target) && e.target !== moreBtn && !moreBtn?.contains(e.target)) {
        moreDropdown.classList.add('hidden');
      }
    }
  });

  const continueBtn = document.getElementById('detail-continue-btn');
  const downloadNextBtn = document.getElementById('detail-download-next-btn');
  const downloadMoreBtn = document.getElementById('detail-download-more-btn');
  const exportBtn = document.getElementById('detail-export-btn');
  const openFolderBtn = document.getElementById('detail-open-folder-btn');
  const translateBtn = document.getElementById('detail-translate-btn');
  const deleteChaptersBtn = document.getElementById('detail-delete-chapters-btn');
  const deleteNovelBtn = document.getElementById('detail-delete-novel-btn');

  deleteChaptersBtn?.addEventListener('click', () => {
    if (currentChaptersNovel) {
      openDeleteChaptersModal(currentChaptersNovel);
    }
  });

  deleteNovelBtn?.addEventListener('click', async () => {
    if (!currentChaptersNovel) return;
    const confirmMsg = `¿Estás seguro de que deseas eliminar permanentemente la novela "${currentChaptersNovel.title}" y todos sus capítulos descargados? Esta acción no se puede deshacer.`;
    if (confirm(confirmMsg)) {
      deleteNovelBtn.disabled = true;
      try {
        const res = await window.wtrApi.deleteNovel(currentChaptersNovel.raw_id || currentChaptersNovel.id);
        if (res && res.success) {
          showFeedback(`Novela "${currentChaptersNovel.title}" eliminada con éxito.`, 'info');
          closeModal();
          await loadLibrary();
        } else {
          alert(res?.error || 'No se pudo eliminar la novela.');
        }
      } catch (err) {
        alert(`Error al eliminar novela: ${err.message}`);
      } finally {
        deleteNovelBtn.disabled = false;
      }
    }
  });

  continueBtn?.addEventListener('click', async () => {
    if (!currentChaptersNovel) return;
    const novelId = currentChaptersNovel.raw_id || currentChaptersNovel.id;
    const progress = await window.wtrApi.getReadingProgress(novelId);
    let targetChNo = progress?.last_read_chapter_no;
    let targetLang = progress?.last_read_language || langFilter.value || 'en';

    let chapters = await window.wtrApi.getDownloadedChapters(novelId, targetLang);
    if (!chapters || chapters.length === 0) {
      const altLang = targetLang === 'es' ? 'en' : 'es';
      const altChapters = await window.wtrApi.getDownloadedChapters(novelId, altLang);
      if (altChapters && altChapters.length > 0) {
        targetLang = altLang;
        chapters = altChapters;
      }
    }

    if (!chapters || chapters.length === 0) {
      alert('No hay capítulos disponibles para leer. Por favor descarga capítulos primero.');
      return;
    }

    currentReadingChaptersList = chapters;
    if (!targetChNo || !chapters.some(c => c.chapter_no === targetChNo)) {
      targetChNo = chapters[0].chapter_no;
    }

    openReaderModal(currentChaptersNovel, targetChNo, targetLang);
  });

  downloadNextBtn?.addEventListener('click', async () => {
    if (!currentChaptersNovel) return;
    const novelId = currentChaptersNovel.raw_id || currentChaptersNovel.id;
    const lang = langFilter.value;
    const downloadedNums = await window.wtrApi.getDownloadedChapterNumbers(novelId, lang);
    const nextCh = downloadedNums.length > 0 ? (Math.max(...downloadedNums) + 1) : 1;

    const originalContent = downloadNextBtn.innerHTML;
    downloadNextBtn.disabled = true;
    downloadNextBtn.innerHTML = `<span class="spinner-sm"></span> <span>Descargando Cap. ${nextCh}...</span>`;

    try {
      const res = await window.wtrApi.downloadChapters({
        novel: currentChaptersNovel,
        chapterNumbers: [nextCh],
        lang,
        merge: false,
        pdf: false
      });

      if (res && res.successCount > 0) {
        await loadChaptersListForNovel(currentChaptersNovel, lang);
        await updateModalActionButtons(currentChaptersNovel, lang);
        loadLibrary();
      } else {
        alert(res?.cancelled ? 'Descarga cancelada.' : `No se pudo descargar el Capítulo ${nextCh}.`);
      }
    } catch (err) {
      alert(`Error al descargar Capítulo ${nextCh}: ${err.message}`);
    } finally {
      downloadNextBtn.disabled = false;
      downloadNextBtn.innerHTML = originalContent;
      await updateModalActionButtons(currentChaptersNovel, lang);
    }
  });

  downloadMoreBtn?.addEventListener('click', async () => {
    if (!currentChaptersNovel) return;
    const novelId = currentChaptersNovel.raw_id || currentChaptersNovel.id;
    const lang = langFilter.value;
    const downloadedNums = await window.wtrApi.getDownloadedChapterNumbers(novelId, lang);
    const nextCh = downloadedNums.length > 0 ? (Math.max(...downloadedNums) + 1) : 1;
    openDownloadModal(currentChaptersNovel, { suggestedStartChapter: nextCh, lang });
  });

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
        await updateModalActionButtons(currentChaptersNovel, 'es');
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

  const sortSelect = document.getElementById('chapters-sort-select');
  if (sortSelect) {
    const savedSort = localStorage.getItem('chapters_sort_order') || 'asc';
    sortSelect.value = savedSort;
    sortSelect.addEventListener('change', async () => {
      localStorage.setItem('chapters_sort_order', sortSelect.value);
      if (currentChaptersNovel) {
        await loadChaptersListForNovel(currentChaptersNovel, langFilter.value);
      }
    });
  }

  langFilter?.addEventListener('change', async () => {
    if (currentChaptersNovel) {
      await loadChaptersListForNovel(currentChaptersNovel, langFilter.value);
      await updateModalActionButtons(currentChaptersNovel, langFilter.value);
    }
  });
}

async function updateModalActionButtons(novelItem, lang) {
  if (!novelItem) return;
  const novelId = novelItem.raw_id || novelItem.id;
  const progress = await window.wtrApi.getReadingProgress(novelId);
  const continueBtn = document.getElementById('detail-continue-btn');
  const continueBtnText = document.getElementById('detail-continue-btn-text');
  const downloadNextBtn = document.getElementById('detail-download-next-btn');
  const downloadNextText = document.getElementById('detail-download-next-text');

  const downloadedNums = await window.wtrApi.getDownloadedChapterNumbers(novelId, lang);
  const nextCh = downloadedNums.length > 0 ? (Math.max(...downloadedNums) + 1) : 1;

  if (downloadNextText) {
    downloadNextText.textContent = `Descargar Sig. (Cap. ${nextCh})`;
  }
  if (downloadNextBtn) {
    downloadNextBtn.title = `Descargar el Capítulo ${nextCh} en [${lang.toUpperCase()}]`;
  }

  if (continueBtn && continueBtnText) {
    if (progress && progress.last_read_chapter_no) {
      continueBtnText.textContent = `Seguir Leyendo (Cap. ${progress.last_read_chapter_no})`;
      continueBtn.title = `Retomar lectura desde el Capítulo ${progress.last_read_chapter_no} (${(progress.last_read_language || lang).toUpperCase()})`;
      continueBtn.classList.remove('hidden');
    } else if (downloadedNums.length > 0) {
      continueBtnText.textContent = `Comenzar Lectura (Cap. ${downloadedNums[0]})`;
      continueBtn.title = `Comenzar a leer desde el primer capítulo disponible`;
      continueBtn.classList.remove('hidden');
    } else {
      continueBtnText.textContent = 'Seguir Leyendo';
      continueBtn.title = 'No hay capítulos descargados todavía';
    }
  }
}

async function openChaptersModal(novelItem) {
  currentChaptersNovel = novelItem;
  const modal = document.getElementById('chapters-modal');
  const moreDropdown = document.getElementById('detail-more-dropdown');
  moreDropdown?.classList.add('hidden');
  document.getElementById('chapters-modal-title').textContent = novelItem.title;
  document.getElementById('chapters-novel-author').textContent = novelItem.author || 'Desconocido';
  document.getElementById('chapters-novel-total').textContent = `${novelItem.total_chapters || '?'} en WTR-Lab`;

  const coverImg = document.getElementById('chapters-novel-cover');
  const coverUrl = novelItem.cover_url || novelItem.coverUrl || novelItem.image;
  if (coverUrl) {
    coverImg.referrerPolicy = 'no-referrer';
    coverImg.src = coverUrl;
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

  const sortSelect = document.getElementById('chapters-sort-select');
  if (sortSelect) {
    sortSelect.value = localStorage.getItem('chapters_sort_order') || 'asc';
  }

  await loadChaptersListForNovel(novelItem, langFilter.value);
  await updateModalActionButtons(novelItem, langFilter.value);
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

  // Ordenar capítulos según selector de orden
  const sortSelect = document.getElementById('chapters-sort-select');
  const sortOrder = sortSelect?.value || localStorage.getItem('chapters_sort_order') || 'asc';
  if (sortOrder === 'desc') {
    chapters.sort((a, b) => b.chapter_no - a.chapter_no);
  } else {
    chapters.sort((a, b) => a.chapter_no - b.chapter_no);
  }

  // Asegurar tamaño de paginación/agrupación configurado
  if (!chapterGroupingSize || chapterGroupingSize <= 0) {
    try {
      const groupInfo = await window.wtrApi.getChapterGrouping();
      const parsed = (groupInfo && groupInfo.chapterGrouping) ? parseInt(groupInfo.chapterGrouping, 10) : 20;
      chapterGroupingSize = (!isNaN(parsed) && parsed > 0) ? parsed : 20;
    } catch {
      chapterGroupingSize = 20;
    }
  }
  const groupSize = chapterGroupingSize > 0 ? chapterGroupingSize : 20;

  // Dividir capítulos en bloques de acuerdo a la configuración
  const chunks = [];
  for (let i = 0; i < chapters.length; i += groupSize) {
    chunks.push(chapters.slice(i, i + groupSize));
  }

  // Determinar qué bloque debe estar abierto inicialmente (último capítulo leído o el primero)
  let activeChunkIndex = 0;
  const lastReadNo = novelItem.last_read_chapter_no;
  if (lastReadNo) {
    const foundIdx = chunks.findIndex(chunk => chunk.some(ch => ch.chapter_no === lastReadNo));
    if (foundIdx !== -1) {
      activeChunkIndex = foundIdx;
    }
  }

  // Barra de herramientas: resumen de grupos y botones expandir/colapsar todos
  const toolbar = document.createElement('div');
  toolbar.className = 'chapters-accordion-toolbar';
  toolbar.innerHTML = `
    <div class="chapters-accordion-summary">
      <span>${ICONS.bookOpenSm}</span>
      <span>${chapters.length} ${chapters.length === 1 ? 'capítulo' : 'capítulos'} en ${chunks.length} ${chunks.length === 1 ? 'grupo' : 'grupos'} (${groupSize} por acordeón)</span>
    </div>
    <div class="chapters-accordion-actions">
      <button type="button" class="btn btn-outline btn-xs" id="accordion-expand-all" title="Desplegar todos los acordeones">Expandir todos</button>
      <button type="button" class="btn btn-outline btn-xs" id="accordion-collapse-all" title="Plegar todos los acordeones">Colapsar todos</button>
    </div>
  `;
  container.appendChild(toolbar);

  toolbar.querySelector('#accordion-expand-all').addEventListener('click', () => {
    container.querySelectorAll('.chapter-accordion').forEach(acc => {
      acc.classList.add('open');
      const hdr = acc.querySelector('.chapter-accordion-header');
      if (hdr) hdr.setAttribute('aria-expanded', 'true');
    });
  });

  toolbar.querySelector('#accordion-collapse-all').addEventListener('click', () => {
    container.querySelectorAll('.chapter-accordion').forEach(acc => {
      acc.classList.remove('open');
      const hdr = acc.querySelector('.chapter-accordion-header');
      if (hdr) hdr.setAttribute('aria-expanded', 'false');
    });
  });

  // Renderizar cada bloque en su respectivo acordeón
  chunks.forEach((chunk, chunkIndex) => {
    const startNo = chunk[0].chapter_no;
    const endNo = chunk[chunk.length - 1].chapter_no;
    const rangeLabel = startNo === endNo
      ? `Capítulo ${startNo}`
      : `Capítulos ${startNo} – ${endNo}`;

    const isInitiallyOpen = (chunkIndex === activeChunkIndex);

    const accordion = document.createElement('div');
    accordion.className = `chapter-accordion ${isInitiallyOpen ? 'open' : ''}`;
    accordion.setAttribute('data-group-index', chunkIndex);

    const header = document.createElement('div');
    header.className = 'chapter-accordion-header';
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', isInitiallyOpen ? 'true' : 'false');

    header.innerHTML = `
      <div class="chapter-accordion-title">
        <span class="chapter-accordion-arrow">${ICONS.chevronRight}</span>
        <span>${rangeLabel}</span>
      </div>
      <div class="chapter-accordion-badge">
        <span class="badge badge-secondary">${chunk.length} ${chunk.length === 1 ? 'capítulo' : 'capítulos'}</span>
      </div>
    `;

    const toggleAccordion = () => {
      const isOpen = accordion.classList.toggle('open');
      header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    };

    header.addEventListener('click', toggleAccordion);
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleAccordion();
      }
    });

    const body = document.createElement('div');
    body.className = 'chapter-accordion-body';

    chunk.forEach((ch) => {
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
          <button class="btn btn-outline-danger btn-sm btn-delete-ch" title="Borrar este capítulo">
            ${ICONS.trash} <span>Borrar</span>
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

      const deleteChBtn = itemEl.querySelector('.btn-delete-ch');
      deleteChBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        const confirmMsg = `¿Eliminar el Capítulo ${ch.chapter_no} (${lang.toUpperCase()}) de "${novelItem.title}"?`;
        if (confirm(confirmMsg)) {
          deleteChBtn.disabled = true;
          try {
            const res = await window.wtrApi.deleteChapters(novelItem.raw_id || novelItem.id, [ch.chapter_no], { language: lang });
            if (res && res.success) {
              showFeedback(`Capítulo ${ch.chapter_no} eliminado correctamente.`, 'info');
              await loadChaptersListForNovel(novelItem, lang);
              await updateModalActionButtons(novelItem, lang);
              loadLibrary();
            } else {
              alert(res?.error || 'No se pudo eliminar el capítulo.');
              deleteChBtn.disabled = false;
            }
          } catch (err) {
            alert(`Error al eliminar capítulo: ${err.message}`);
            deleteChBtn.disabled = false;
          }
        }
      });

      body.appendChild(itemEl);
    });

    accordion.appendChild(header);
    accordion.appendChild(body);
    container.appendChild(accordion);
  });
}

/* ==========================================================================
   4c. MODAL DE LECTURA (READER VIEW)
   ========================================================================== */
function initReaderModal() {
  const modal = document.getElementById('reader-modal');
  const closeBtn = document.getElementById('close-reader-modal-btn');
  const closeBottomBtn = document.getElementById('close-reader-bottom-btn');
  const decFontBtn = document.getElementById('reader-font-decrease');
  const incFontBtn = document.getElementById('reader-font-increase');
  const translateBtn = document.getElementById('reader-translate-btn');
  const translateLabel = document.getElementById('reader-translate-label');
  const readerDeleteBtn = document.getElementById('reader-delete-btn');
  const downloadMoreBtn = document.getElementById('reader-download-more-btn');

  const closeModal = () => {
    stopTts();
    modal.classList.add('hidden');
    loadLibrary();
  };
  closeBtn?.addEventListener('click', closeModal);
  closeBottomBtn?.addEventListener('click', closeModal);

  readerDeleteBtn?.addEventListener('click', async () => {
    if (!currentReadingNovel || !currentReadingChapterNo) return;
    const confirmMsg = `¿Eliminar el Capítulo ${currentReadingChapterNo} (${currentReadingLang.toUpperCase()}) de "${currentReadingNovel.title}"?`;
    if (confirm(confirmMsg)) {
      readerDeleteBtn.disabled = true;
      try {
        const novelId = currentReadingNovel.raw_id || currentReadingNovel.id;
        const res = await window.wtrApi.deleteChapters(novelId, [currentReadingChapterNo], { language: currentReadingLang });
        if (res && res.success) {
          showFeedback(`Capítulo ${currentReadingChapterNo} eliminado.`, 'info');
          const remaining = await window.wtrApi.getDownloadedChapters(novelId, currentReadingLang);
          if (remaining && remaining.length > 0) {
            currentReadingChaptersList = remaining;
            const next = remaining.find(c => c.chapter_no > currentReadingChapterNo) || remaining[remaining.length - 1];
            await openReaderModal(currentReadingNovel, next.chapter_no, currentReadingLang);
          } else {
            closeModal();
          }
          await loadLibrary();
        } else {
          alert(res?.error || 'No se pudo eliminar el capítulo.');
        }
      } catch (err) {
        alert(`Error al eliminar capítulo: ${err.message}`);
      } finally {
        readerDeleteBtn.disabled = false;
      }
    }
  });

  downloadMoreBtn?.addEventListener('click', async () => {
    if (!currentReadingNovel) return;
    const novelId = currentReadingNovel.raw_id || currentReadingNovel.id;
    const downloadedNums = await window.wtrApi.getDownloadedChapterNumbers(novelId, currentReadingLang);
    const nextCh = downloadedNums.length > 0 ? (Math.max(...downloadedNums) + 1) : (currentReadingChapterNo + 1);
    openDownloadModal(currentReadingNovel, { suggestedStartChapter: nextCh, lang: currentReadingLang });
  });

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
}

async function downloadAndOpenReaderChapter(targetChapterNo, batchCount = 1) {
  if (!currentReadingNovel) return;
  const novelId = currentReadingNovel.raw_id || currentReadingNovel.id;
  const lang = currentReadingLang || 'en';
  const chapterNumbers = [];
  for (let i = 0; i < batchCount; i++) {
    chapterNumbers.push(targetChapterNo + i);
  }

  const nextBtn = document.getElementById('reader-next-btn');
  const prevNextHtml = nextBtn ? nextBtn.innerHTML : '';
  if (nextBtn) {
    nextBtn.disabled = true;
    nextBtn.innerHTML = `<span class="spinner-sm"></span> <span>Descargando...</span>`;
  }

  const endProgress = document.querySelector('.reader-end-progress');
  const endStatus = document.querySelector('.reader-end-status');
  if (endProgress) endProgress.classList.remove('hidden');
  if (endStatus) {
    endStatus.textContent = batchCount > 1
      ? `Descargando ${batchCount} capítulos (${chapterNumbers[0]}-${chapterNumbers[chapterNumbers.length - 1]})...`
      : `Descargando Capítulo ${targetChapterNo}...`;
  }

  try {
    const res = await window.wtrApi.downloadChapters({
      novel: currentReadingNovel,
      chapterNumbers,
      lang,
      merge: false,
      pdf: false
    });

    if (res && res.successCount > 0) {
      const updatedChapters = await window.wtrApi.getDownloadedChapters(novelId, lang);
      currentReadingChaptersList = updatedChapters || [];
      loadLibrary();
      await openReaderModal(currentReadingNovel, targetChapterNo, lang);
    } else {
      alert(res?.cancelled ? 'Descarga cancelada.' : `No se pudo descargar el Capítulo ${targetChapterNo}.`);
      if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.innerHTML = prevNextHtml;
      }
    }
  } catch (err) {
    alert(`Error al descargar: ${err.message}`);
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.innerHTML = prevNextHtml;
    }
  } finally {
    if (endProgress) endProgress.classList.add('hidden');
  }
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
    const rawParagraphs = chapterData.paragraphs || [];
    currentTtsParagraphs = rawParagraphs
      .map(p => (typeof p === 'string' ? p.replace(/\s+/g, ' ').trim() : ''))
      .filter(p => p.length > 0);
    currentTtsParagraphIndex = 0;
    paragraphsInfo.textContent = `${currentTtsParagraphs.length} párrafos (${lang.toUpperCase()})`;

    // Seleccionar automáticamente una voz adecuada al idioma del capítulo
    const voiceSelect = document.getElementById('tts-voice-select');
    if (voiceSelect && voiceSelect.options.length > 0) {
      const savedVoice = localStorage.getItem(`preferred_voice_${lang}`);
      const optionsArray = Array.from(voiceSelect.options);
      if (savedVoice && optionsArray.some(o => o.value === savedVoice)) {
        voiceSelect.value = savedVoice;
      } else if (lang === 'es') {
        const esVoice = optionsArray.find(o => o.value.startsWith('es-'));
        if (esVoice) voiceSelect.value = esVoice.value;
      } else {
        const enVoice = optionsArray.find(o => o.value.startsWith('en-'));
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

    // Tarjeta o barra interactiva al final del capítulo
    const idx = currentReadingChaptersList.findIndex(c => c.chapter_no === chapterNo);
    const hasNext = (idx !== -1 && idx < currentReadingChaptersList.length - 1);
    const nextChapterNo = chapterNo + 1;

    if (hasNext) {
      const nextCh = currentReadingChaptersList[idx + 1];
      const endNav = document.createElement('div');
      endNav.className = 'reader-chapter-end-nav';
      endNav.innerHTML = `
        <div>
          <span style="color: var(--text-muted); font-size: 13px;">Fin del Capítulo ${chapterNo}</span>
          <div style="font-weight: 600; color: var(--text-main); font-size: 15px;">Siguiente: Capítulo ${nextCh.chapter_no} - ${escapeHtml(nextCh.title || '')}</div>
        </div>
        <button class="btn btn-primary btn-sm btn-jump-next">
          <span>Leer Siguiente</span>
          ${ICONS.arrowRight}
        </button>
      `;
      endNav.querySelector('.btn-jump-next')?.addEventListener('click', () => {
        openReaderModal(novelItem, nextCh.chapter_no, lang);
      });
      articleEl.appendChild(endNav);
    } else {
      const endBox = document.createElement('div');
      endBox.className = 'reader-chapter-end-box';
      endBox.innerHTML = `
        <div class="reader-end-header">
          <h4>${ICONS.bookOpenSm} Fin del Capítulo ${chapterNo}</h4>
          <p>Has alcanzado el último capítulo descargado en tu biblioteca.</p>
        </div>
        <div class="reader-end-actions">
          <button class="btn btn-primary btn-end-dl-next">
            ${ICONS.downloadSm} <span>Descargar y leer Capítulo ${nextChapterNo}</span>
          </button>
          <button class="btn btn-outline btn-end-dl-batch">
            ${ICONS.downloadSm} <span>Descargar siguientes 5 capítulos (${nextChapterNo}-${nextChapterNo + 4})</span>
          </button>
        </div>
        <div class="reader-end-progress hidden">
          <span class="spinner-sm"></span> <span class="reader-end-status">Descargando...</span>
        </div>
      `;
      endBox.querySelector('.btn-end-dl-next')?.addEventListener('click', () => {
        downloadAndOpenReaderChapter(nextChapterNo, 1);
      });
      endBox.querySelector('.btn-end-dl-batch')?.addEventListener('click', () => {
        downloadAndOpenReaderChapter(nextChapterNo, 5);
      });
      articleEl.appendChild(endBox);
    }

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

  // Botón Anterior
  if (idx > 0) {
    const prevCh = currentReadingChaptersList[idx - 1];
    prevBtn.disabled = false;
    prevBtn.style.opacity = '1';
    prevBtn.title = `Ir al Capítulo ${prevCh.chapter_no}`;
    prevBtn.onclick = () => {
      openReaderModal(currentReadingNovel, prevCh.chapter_no, currentReadingLang);
    };
  } else {
    prevBtn.disabled = true;
    prevBtn.style.opacity = '0.4';
    prevBtn.onclick = null;
    prevBtn.title = 'No hay capítulos anteriores descargados';
  }

  // Botón Siguiente: Si existe el siguiente descargado, navega; si no, ofrece descargarlo y leerlo
  if (idx !== -1 && idx < currentReadingChaptersList.length - 1) {
    const nextCh = currentReadingChaptersList[idx + 1];
    nextBtn.className = 'btn btn-outline btn-sm';
    nextBtn.disabled = false;
    nextBtn.style.opacity = '1';
    nextBtn.title = `Ir al Capítulo ${nextCh.chapter_no}`;
    nextBtn.innerHTML = `<span>Siguiente</span>${ICONS.arrowRight}`;
    nextBtn.onclick = () => {
      openReaderModal(currentReadingNovel, nextCh.chapter_no, currentReadingLang);
    };
  } else {
    const nextChapterNo = currentReadingChapterNo + 1;
    nextBtn.className = 'btn btn-primary btn-sm';
    nextBtn.disabled = false;
    nextBtn.style.opacity = '1';
    nextBtn.title = `Descargar y leer Capítulo ${nextChapterNo}`;
    nextBtn.innerHTML = `${ICONS.downloadSm} <span>Descargar Sig. (Cap. ${nextChapterNo})</span>`;
    nextBtn.onclick = () => {
      downloadAndOpenReaderChapter(nextChapterNo, 1);
    };
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
const ttsPrefetchCache = new Map();

function getTtsCacheKey(pIndex, voice, rate) {
  return `${pIndex}__${voice}__${rate}`;
}

function prefetchParagraphTts(pIndex, voice, rate) {
  if (pIndex < 0 || pIndex >= currentTtsParagraphs.length) return;
  const text = currentTtsParagraphs[pIndex];
  if (!text || !text.trim()) return;
  const key = getTtsCacheKey(pIndex, voice, rate);
  if (!ttsPrefetchCache.has(key)) {
    const promise = window.wtrApi.ttsSynthesize(text, { voice, rate })
      .catch((err) => {
        console.warn('Error en prefetch de TTS:', err);
        ttsPrefetchCache.delete(key);
        return null;
      });
    ttsPrefetchCache.set(key, promise);
  }
}

async function initTtsControls() {
  const playBtn = document.getElementById('tts-play-btn');
  const stopBtn = document.getElementById('tts-stop-btn');
  const exportBtn = document.getElementById('tts-export-btn');
  const voiceSelect = document.getElementById('tts-voice-select');
  const rateSelect = document.getElementById('tts-rate-select');

  try {
    const voices = await window.wtrApi.ttsGetVoices();
    if (voiceSelect && voices && voices.length > 0) {
      voiceSelect.innerHTML = '';

      const groups = [
        { label: 'Colombia', filter: (v) => v.lang === 'es-CO' || v.id === 'es-ES-XimenaNeural' },
        { label: 'Español - Mujeres', filter: (v) => v.lang.startsWith('es-') && v.gender === 'Mujer' && v.lang !== 'es-CO' && v.id !== 'es-ES-XimenaNeural' },
        { label: 'Español - Hombres', filter: (v) => v.lang.startsWith('es-') && v.gender === 'Hombre' && v.lang !== 'es-CO' },
        { label: 'Inglés', filter: (v) => v.lang.startsWith('en-') }
      ];

      const addedIds = new Set();
      groups.forEach((g) => {
        const groupVoices = voices.filter(v => g.filter(v) && !addedIds.has(v.id));
        if (groupVoices.length > 0) {
          const optGroup = document.createElement('optgroup');
          optGroup.label = g.label;
          groupVoices.forEach((v) => {
            addedIds.add(v.id);
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = `${v.flag} ${v.name} (${v.gender} - ${v.desc})`;
            optGroup.appendChild(opt);
          });
          voiceSelect.appendChild(optGroup);
        }
      });

      const remaining = voices.filter(v => !addedIds.has(v.id));
      if (remaining.length > 0) {
        remaining.forEach((v) => {
          const opt = document.createElement('option');
          opt.value = v.id;
          opt.textContent = `${v.flag} ${v.name} (${v.gender} - ${v.desc})`;
          voiceSelect.appendChild(opt);
        });
      }

      const savedEsVoice = localStorage.getItem('preferred_voice_es');
      if (savedEsVoice && Array.from(voiceSelect.options).some(o => o.value === savedEsVoice)) {
        voiceSelect.value = savedEsVoice;
      }
    }
  } catch (err) {
    console.warn('Error al cargar voces naturales:', err);
  }

  voiceSelect?.addEventListener('change', () => {
    const val = voiceSelect.value;
    if (val) {
      const langKey = val.startsWith('en-') ? 'en' : 'es';
      localStorage.setItem(`preferred_voice_${langKey}`, val);
    }
  });

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

  rateSelect?.addEventListener('change', () => {
    ttsPrefetchCache.clear();
    if (isTtsPlaying) {
      playParagraphTts(currentTtsParagraphIndex);
    }
  });

  voiceSelect?.addEventListener('change', () => {
    ttsPrefetchCache.clear();
    if (isTtsPlaying) {
      playParagraphTts(currentTtsParagraphIndex);
    }
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
  ttsPrefetchCache.clear();
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
  const voice = voiceSelect ? voiceSelect.value : 'es-CO-SalomeNeural';
  const rate = rateSelect ? rateSelect.value : 'default';

  try {
    const cacheKey = getTtsCacheKey(pIndex, voice, rate);
    let result = null;
    if (ttsPrefetchCache.has(cacheKey)) {
      result = await ttsPrefetchCache.get(cacheKey);
      ttsPrefetchCache.delete(cacheKey);
    }

    if (!result || !result.audioBase64) {
      result = await window.wtrApi.ttsSynthesize(text, { voice, rate });
    }

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

    // Precargar inmediatamente el siguiente párrafo en segundo plano para eliminar la pausa de red
    if (pIndex + 1 < currentTtsParagraphs.length) {
      prefetchParagraphTts(pIndex + 1, voice, rate);
    }

    // Limpiar entradas antiguas de caché
    for (const [k] of ttsPrefetchCache) {
      const idx = parseInt(k.split('__')[0], 10);
      if (idx < pIndex) ttsPrefetchCache.delete(k);
    }

    const wordList = result.words || [];
    const pElement = document.querySelector(`.reader-paragraph[data-pindex="${pIndex}"]`);
    const wordSpans = pElement ? Array.from(pElement.querySelectorAll('.reader-word')) : [];

    let hasAdvanced = false;
    const advanceToNext = () => {
      if (hasAdvanced || thisSession !== ttsPlaybackSessionId) return;
      hasAdvanced = true;
      audio.ontimeupdate = null;
      audio.onended = null;
      audio.onerror = null;
      try { audio.pause(); } catch {}
      clearWordHighlights();
      if (currentTtsParagraphIndex + 1 < currentTtsParagraphs.length) {
        playParagraphTts(currentTtsParagraphIndex + 1);
      } else {
        stopTts();
        updateTtsStatus('Lectura del capítulo finalizada');
      }
    };

    audio.ontimeupdate = () => {
      if (hasAdvanced || thisSession !== ttsPlaybackSessionId) return;
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

      // Reducir la pausa final cortando el silencio sobrante del MP3 (~800ms) generado por EdgeTTS
      const lastWord = wordList.length > 0 ? wordList[wordList.length - 1] : null;
      if (lastWord && lastWord.end && currentMs >= (lastWord.end + 80)) {
        advanceToNext();
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
      advanceToNext();
    };

    audio.onerror = (err) => {
      console.warn('Error en reproducción:', err);
      advanceToNext();
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
  const voice = voiceSelect ? voiceSelect.value : 'es-CO-SalomeNeural';
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
   4e. MODAL DE BORRADO DE CAPÍTULOS
   ========================================================================== */
let currentDeleteChaptersNovel = null;

function initDeleteChaptersModal() {
  const modal = document.getElementById('delete-chapters-modal');
  const closeBtn = document.getElementById('close-delete-chapters-modal-btn');
  const cancelBtn = document.getElementById('cancel-delete-chapters-btn');
  const confirmBtn = document.getElementById('confirm-delete-chapters-btn');

  const closeModal = () => modal.classList.add('hidden');
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  confirmBtn?.addEventListener('click', async () => {
    if (!currentDeleteChaptersNovel) return;

    const rangeInput = document.getElementById('delete-range-input').value.trim();
    const lang = document.getElementById('delete-lang-select').value;
    const deleteFiles = document.getElementById('delete-files-checkbox').checked;

    const novelId = currentDeleteChaptersNovel.raw_id || currentDeleteChaptersNovel.id;
    const stats = await window.wtrApi.getNovelStats(currentDeleteChaptersNovel.slug);
    
    // Capítulos disponibles según el idioma seleccionado
    let available = [];
    if (lang === 'es') {
      available = stats?.esChapters || [];
    } else if (lang === 'en') {
      available = stats?.enChapters || [];
    } else {
      const allSet = new Set([...(stats?.enChapters || []), ...(stats?.esChapters || [])]);
      available = Array.from(allSet).sort((a, b) => a - b);
    }

    if (available.length === 0) {
      alert('No hay capítulos disponibles para borrar con el filtro seleccionado.');
      return;
    }

    const chapterNumbers = rangeInput.toLowerCase() === 'all'
      ? available
      : parseChapterSpec(rangeInput, Math.max(...available)).filter(n => available.includes(n));

    if (chapterNumbers.length === 0) {
      alert('Ninguno de los capítulos especificados coincide con los capítulos guardados.');
      return;
    }

    const msg = `¿Confirmas que deseas borrar ${chapterNumbers.length} capítulo(s) de "${currentDeleteChaptersNovel.title}" (${lang === 'all' ? 'todos los idiomas' : lang.toUpperCase()})?`;
    if (!confirm(msg)) return;

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Borrando...';

    try {
      const res = await window.wtrApi.deleteChapters(novelId, chapterNumbers, {
        language: lang === 'all' ? null : lang,
        deleteFiles
      });

      if (res && res.success) {
        showFeedback(`Se borraron ${res.deletedCount || chapterNumbers.length} capítulos correctamente.`, 'info');
        closeModal();
        if (currentChaptersNovel) {
          const currentFilterLang = document.getElementById('chapters-lang-filter')?.value || 'en';
          await loadChaptersListForNovel(currentChaptersNovel, currentFilterLang);
          await updateModalActionButtons(currentChaptersNovel, currentFilterLang);
        }
        await loadLibrary();
      } else {
        alert(res?.error || 'No se pudieron borrar los capítulos.');
      }
    } catch (err) {
      alert(`Error al borrar capítulos: ${err.message}`);
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Borrar Capítulos';
    }
  });
}

async function openDeleteChaptersModal(novelItem) {
  currentDeleteChaptersNovel = novelItem;
  const modal = document.getElementById('delete-chapters-modal');
  document.getElementById('delete-chapters-modal-title').textContent = `Borrar Capítulos - ${novelItem.title}`;
  
  const stats = await window.wtrApi.getNovelStats(novelItem.slug);
  const hint = document.getElementById('delete-avail-hint');
  hint.textContent = `Capítulos guardados: EN (${stats?.enChapters?.length || 0}), ES (${stats?.esChapters?.length || 0})`;

  document.getElementById('delete-range-input').value = 'all';
  
  // Sincronizar idioma con el filtro actual del modal de capítulos si existe
  const langFilter = document.getElementById('chapters-lang-filter');
  const deleteLangSelect = document.getElementById('delete-lang-select');
  if (langFilter && deleteLangSelect) {
    deleteLangSelect.value = langFilter.value || 'all';
  }

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

  // Configuración de Paginación y Acordeón de Capítulos
  const chapterGroupInput = document.getElementById('chapter-group-size-input');
  const saveChapterGroupBtn = document.getElementById('save-chapter-group-btn');
  const resetChapterGroupBtn = document.getElementById('reset-chapter-group-btn');
  const chapterGroupPill = document.getElementById('chapter-group-status-pill');
  const chapterGroupFeedback = document.getElementById('chapter-group-feedback');
  const groupSizeChips = document.querySelectorAll('.group-size-chip');

  async function loadChapterGroupingStatus() {
    try {
      const res = await window.wtrApi.getChapterGrouping();
      const size = (res && res.chapterGrouping) ? parseInt(res.chapterGrouping, 10) : 20;
      chapterGroupingSize = (!isNaN(size) && size > 0) ? size : 20;
      if (chapterGroupInput) chapterGroupInput.value = chapterGroupingSize;
      if (chapterGroupPill) chapterGroupPill.textContent = `${chapterGroupingSize} por grupo`;
    } catch {}
  }

  loadChapterGroupingStatus();

  groupSizeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const size = chip.getAttribute('data-size');
      if (chapterGroupInput && size) {
        chapterGroupInput.value = size;
      }
    });
  });

  saveChapterGroupBtn?.addEventListener('click', async () => {
    const rawVal = chapterGroupInput ? chapterGroupInput.value.trim() : '';
    const num = parseInt(rawVal, 10);
    if (isNaN(num) || num <= 0) {
      showFeedback(chapterGroupFeedback, 'error', 'Ingresa un valor numérico positivo mayor a 0 (ej: 10, 20, 50).');
      return;
    }

    try {
      const res = await window.wtrApi.saveChapterGrouping(num);
      chapterGroupingSize = (res && res.chapterGrouping) ? res.chapterGrouping : num;
      if (chapterGroupInput) chapterGroupInput.value = chapterGroupingSize;
      if (chapterGroupPill) chapterGroupPill.textContent = `${chapterGroupingSize} por grupo`;
      showFeedback(chapterGroupFeedback, 'success', `Configuración guardada: Capítulos agrupados de ${chapterGroupingSize} en ${chapterGroupingSize}.`);

      // Refrescar modal de capítulos si está visible actualmente
      const chaptersModal = document.getElementById('chapters-modal');
      if (chaptersModal && !chaptersModal.classList.contains('hidden') && currentChaptersNovel) {
        const langFilter = document.getElementById('chapters-lang-filter');
        loadChaptersListForNovel(currentChaptersNovel, langFilter ? langFilter.value : 'en');
      }
    } catch (err) {
      showFeedback(chapterGroupFeedback, 'error', `Error al guardar: ${err.message}`);
    }
  });

  resetChapterGroupBtn?.addEventListener('click', async () => {
    try {
      const res = await window.wtrApi.saveChapterGrouping(20);
      chapterGroupingSize = (res && res.chapterGrouping) ? res.chapterGrouping : 20;
      if (chapterGroupInput) chapterGroupInput.value = 20;
      if (chapterGroupPill) chapterGroupPill.textContent = '20 por grupo';
      showFeedback(chapterGroupFeedback, 'info', 'Restablecido al valor por defecto (20 por grupo).');

      const chaptersModal = document.getElementById('chapters-modal');
      if (chaptersModal && !chaptersModal.classList.contains('hidden') && currentChaptersNovel) {
        const langFilter = document.getElementById('chapters-lang-filter');
        loadChaptersListForNovel(currentChaptersNovel, langFilter ? langFilter.value : 'en');
      }
    } catch (err) {
      showFeedback(chapterGroupFeedback, 'error', `Error al restablecer: ${err.message}`);
    }
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

function showFeedback(el, type = 'info', msg = '') {
  if (typeof el === 'string') {
    msg = el;
    type = typeof type === 'string' ? type : 'info';
    el = document.getElementById('search-feedback') || document.querySelector('.feedback-banner');
  }
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
