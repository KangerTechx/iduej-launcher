const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Recevoir l'event "update-available" depuis le main process
  onUpdateAvailable: (callback) => ipcRenderer.on("update-available", callback),

  // Recevoir la progression du téléchargement
  onDownloadProgress: (callback) =>
    ipcRenderer.on("download-progress", (event, percent) => callback(percent)),

  // Optionnel : notifier le renderer que le loader peut se fermer
  onUpdateNotAvailable: (callback) => ipcRenderer.on("update-not-available", callback),
});
