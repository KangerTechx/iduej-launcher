const { contextBridge } = require("electron");
const { autoUpdater } = require("electron-updater");

contextBridge.exposeInMainWorld("electronAPI", {
  checkForUpdates: () => {
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', () => {
      console.log('Nouvelle version disponible !');
    });

    autoUpdater.on('update-downloaded', () => {
      console.log('Mise à jour téléchargée, redémarrage...');
      autoUpdater.quitAndInstall();
    });
  }
});