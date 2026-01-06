const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");

// --- Logging pour auto-update ---
const log = require("electron-log");
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

// --- Détection environnement ---
const isDev = process.env.NODE_ENV === "development";

let mainWindow;
let loaderWindow;

// --- Créer la fenêtre loader (splash screen) ---
function createLoaderWindow() {
  loaderWindow = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"), // optionnel si tu veux ipcRenderer
    },
  });

  loaderWindow.loadFile(path.join(__dirname, "loader.html"));
  loaderWindow.center();
}

// --- Créer la fenêtre principale (Next.js) ---
function createMainWindow() {
  mainWindow = new BrowserWindow({
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
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../out/index.html"));
  }
}

// --- Setup autoUpdater ---
function setupAutoUpdater() {
  autoUpdater.on("checking-for-update", () => log.info("Vérification des updates..."));
  autoUpdater.on("update-available", (info) => log.info(`Update disponible: ${info.version}`));
  autoUpdater.on("update-not-available", () => {
    log.info("Pas de nouvelle version.");
    if (loaderWindow) {
      loaderWindow.close();
      createMainWindow();
    }
  });
  autoUpdater.on("download-progress", (progress) => {
    if (loaderWindow) {
      loaderWindow.webContents.send("download-progress", Math.round(progress.percent));
    }
  });

  // Update téléchargé
  autoUpdater.on("update-downloaded", (info) => {
    // Install automatique
     autoUpdater.quitAndInstall();

    // Avec popup pour l'utilisateur :
    /*
    const choice = dialog.showMessageBoxSync(loaderWindow, {
      type: "question",
      buttons: ["Redémarrer maintenant", "Plus tard"],
      defaultId: 0,
      cancelId: 1,
      title: "Mise à jour disponible",
      message: `Une nouvelle version (${info.version}) a été téléchargée. Voulez-vous redémarrer pour l’installer ?`,
    });

    if (choice === 0) {
      autoUpdater.quitAndInstall();
    }
    */
  });

  autoUpdater.on("checking-for-update", () => log.info("Vérification des updates..."));
  autoUpdater.on("update-available", (info) => log.info(`Update disponible: ${info.version}`));
  autoUpdater.on("update-not-available", (info) => {
    log.info("Pas de nouvelle version.");
    // Pas de maj → fermer le loader et ouvrir la fenêtre principale
    if (loaderWindow) {
      loaderWindow.close();
      createMainWindow();
    }
  });
  autoUpdater.on("error", (err) => log.error("Erreur auto-update:", err));
}

// --- App ready ---
app.whenReady().then(() => {
  createLoaderWindow();
  setupAutoUpdater();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
