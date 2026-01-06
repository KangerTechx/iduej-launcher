const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

// --- Logging auto-update ---
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

const isDev = process.env.NODE_ENV === "development";

let mainWindow;
let loaderWindow;

// --- Fenêtre loader ---
function createLoaderWindow() {
  loaderWindow = new BrowserWindow({
    width: 420,
    height: 325,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  loaderWindow.loadFile(path.join(__dirname, "loader.html"));
  loaderWindow.center();
}

// --- Fenêtre principale ---
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1280,
    minHeight: 720,
    frame: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "resources/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../out/index.html"));
  }
}

// --- AutoUpdater propre ---
function setupAutoUpdater() {
  if (isDev) {
    log.info("Mode dev : auto-updater désactivé");
    // En dev, on garde le loader minimum 10s puis ouvre l'app
    setTimeout(() => {
      if (loaderWindow) {
        loaderWindow.close();
        createMainWindow();
      }
    }, 10000);
    return;
  }

  const MIN_LOADER_TIME = 10000;
  const loaderStart = Date.now();

  autoUpdater.on("checking-for-update", () => log.info("Vérification des updates..."));
  autoUpdater.on("update-available", (info) => {
    log.info(`Update disponible: ${info.version}`);
    if (loaderWindow) loaderWindow.webContents.send("update-available");
  });
  autoUpdater.on("update-not-available", () => {
    log.info("Pas de nouvelle version.");
    const remaining = Math.max(MIN_LOADER_TIME - (Date.now() - loaderStart), 0);
    setTimeout(() => {
      if (loaderWindow) {
        loaderWindow.close();
        createMainWindow();
      }
    }, remaining);
  });
  autoUpdater.on("download-progress", (progress) => {
    if (loaderWindow) loaderWindow.webContents.send(
      "download-progress",
      Math.round(progress.percent)
    );
  });
  autoUpdater.on("update-downloaded", () => {
    log.info("Update téléchargée, redémarrage...");
    autoUpdater.quitAndInstall();
  });
  autoUpdater.on("error", (err) => log.error("Erreur auto-update:", err));

  autoUpdater.checkForUpdates();
}

// --- App ready ---
app.whenReady().then(() => {
  createLoaderWindow();
  setupAutoUpdater();
});


   // IPC: Minimiser la fenêtre
  ipcMain.on('minimize', () => {
    if (mainWindow) {
      mainWindow.minimize() // Minimise la fenêtre
    }
  })

  // IPC: Maximiser ou restaurer la fenêtre
  ipcMain.on('maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize() // Restaurer la fenêtre si elle est maximisée
      } else {
        mainWindow.maximize() // Maximise la fenêtre
      }
    }
  })

  // IPC: Fermer la fenêtre
  ipcMain.on('close', () => {
    if (mainWindow) {
      mainWindow.close() // Ferme la fenêtre
    }
  })

// --- Fermeture ---
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
