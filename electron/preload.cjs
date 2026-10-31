const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wtrApi', {
  // Búsqueda y capítulos
  searchNovels: (query) => ipcRenderer.invoke('novel:search', query),
  getChapters: (rawId) => ipcRenderer.invoke('novel:getChapters', rawId),

  // Descargas
  downloadChapters: (payload) => ipcRenderer.invoke('novel:download', payload),
  cancelDownload: () => ipcRenderer.invoke('novel:cancelDownload'),

  // Biblioteca SQLite
  getLibrary: () => ipcRenderer.invoke('library:list'),
  getStorageStats: () => ipcRenderer.invoke('library:getStorageStats'),
  getNovelStats: (slug) => ipcRenderer.invoke('library:getNovelStats', slug),
  getLastRead: () => ipcRenderer.invoke('library:getLastRead'),
  updateProgress: (novelId, chapterNo, lang) => ipcRenderer.invoke('library:updateProgress', novelId, chapterNo, lang),
  getDownloadedChapters: (novelId, lang) => ipcRenderer.invoke('library:getChapters', novelId, lang),
  readChapter: (novelId, chapterNo, lang) => ipcRenderer.invoke('library:readChapter', novelId, chapterNo, lang),
  exportLibrary: (payload) => ipcRenderer.invoke('library:export', payload),

  // Autenticación y configuración
  getAuth: () => ipcRenderer.invoke('auth:get'),
  saveAuth: (cookie) => ipcRenderer.invoke('auth:save', cookie),
  clearAuth: () => ipcRenderer.invoke('auth:clear'),
  testAuth: () => ipcRenderer.invoke('auth:test'),

  // Sistema de archivos
  openFolder: (target) => ipcRenderer.invoke('shell:openFolder', target),

  // Terminal / Consola interactiva
  execCli: (command) => ipcRenderer.invoke('cli:exec', command),

  // Suscripción a eventos en tiempo real
  onProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('download:progress', handler);
    return () => ipcRenderer.removeListener('download:progress', handler);
  },
  onCliOutput: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('cli:output', handler);
    return () => ipcRenderer.removeListener('cli:output', handler);
  }
});

// Hot-reload en vivo para estilos CSS sin reiniciar la página
ipcRenderer.on('hot-reload:css', () => {
  const links = document.querySelectorAll('link[rel="stylesheet"]');
  links.forEach((link) => {
    const rawHref = link.getAttribute('href') || '';
    const cleanHref = rawHref.split('?')[0];
    link.setAttribute('href', `${cleanHref}?v=${Date.now()}`);
  });
});
