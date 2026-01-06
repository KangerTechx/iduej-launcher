const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");

// --- Logging pour auto-update ---
const log = require("electron-log");
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

// --- Détection environnement ---
const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1280,
    minHeight: 720,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "resources/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:3000");
  } else {
    win.loadFile(path.join(__dirname, "../out/index.html"));
  }

  // --- Auto-update ---
  autoUpdater.checkForUpdates();

  // Quand une update est disponible et téléchargée
  autoUpdater.on("update-downloaded", (info) => {
    const choice = dialog.showMessageBoxSync(win, {
      type: "question",
      buttons: ["Redémarrer maintenant", "Plus tard"],
      defaultId: 0,
      cancelId: 1,
      title: "Mise à jour disponible",
      message: `Une nouvelle version (${info.version}) a été téléchargée. Voulez-vous redémarrer pour l’installer ?`,
    });

    if (choice === 0) {
      // Ferme l'app et installe la mise à jour
      autoUpdater.quitAndInstall();
    }
  });

  // Optional: logs pour debug
  autoUpdater.on("checking-for-update", () => log.info("Vérification des updates..."));
  autoUpdater.on("update-available", (info) => log.info(`Update disponible: ${info.version}`));
  autoUpdater.on("update-not-available", (info) => log.info("Pas de nouvelle version."));
  autoUpdater.on("error", (err) => log.error("Erreur auto-update:", err));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
