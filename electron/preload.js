const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Recevoir l'event "update-available" depuis le main process
  onUpdateAvailable: (callback) => ipcRenderer.on("update-available", callback),

  // Recevoir la progression du téléchargement
  onDownloadProgress: (callback) =>
    ipcRenderer.on("download-progress", (event, percent) => callback(percent)),

  // Optionnel : notifier le renderer que le loader peut se fermer
  onUpdateNotAvailable: (callback) => ipcRenderer.on("update-not-available", callback),
  // Choisir un dossier de destination (ouvre un dialog natif)
  chooseDirectory: () => ipcRenderer.invoke('choose-destination'),

  // Démarrer le processus d'installation : { dest, files: [{url, name, targetRelative}] }
  startInstall: (payload) => ipcRenderer.send('start-install', payload),

  // Recevoir la progression d'installation pour chaque fichier
  onInstallProgress: (callback) => ipcRenderer.on('install-progress', (event, data) => callback(data)),

  // Install complete
  onInstallComplete: (callback) => ipcRenderer.on('install-complete', (event, data) => callback(data)),
  // Lancer l'exécutable du jeu
  startGame: (exePath) => ipcRenderer.send('start-game', exePath),
  // Persistance du chemin d'installation (per-game)
  saveInstallPath: (gameId, p) => ipcRenderer.invoke('save-install-path', { gameId, path: p }),
  getInstallPath: (gameId) => ipcRenderer.invoke('get-install-path', gameId),
  checkGameInstalled: (dest, gameType) => ipcRenderer.invoke('check-game-installed', dest, gameType),
});

contextBridge.exposeInMainWorld('ipc', {
  send: (channel, data) => {
    const validChannels = ['minimize', 'maximize', 'close'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  }
});
