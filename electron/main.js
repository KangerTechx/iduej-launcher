const { app, BrowserWindow } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

const isDev = process.env.NODE_ENV === "development";

let mainWindow;
let loaderWindow;

function createLoaderWindow() {
  loaderWindow = new BrowserWindow({
    width: 400,
    height: 300,
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

function setupAutoUpdater() {
  const MIN_LOADER_TIME = 10000;
  const loaderStart = Date.now();

  autoUpdater.on("checking-for-update", () => log.info("Vérification des updates..."));
  autoUpdater.on("update-available", () => {
    log.info("Update disponible !");
    if (loaderWindow) loaderWindow.webContents.send("update-available");
  });
  autoUpdater.on("update-not-available", () => {
    log.info("Pas de nouvelle version.");
    // attendre 10s minimum
    const remaining = Math.max(MIN_LOADER_TIME - (Date.now() - loaderStart), 0);
    setTimeout(() => {
      if (loaderWindow) {
        loaderWindow.close();
        createMainWindow();
      }
    }, remaining);
  });
  autoUpdater.on("download-progress", (progress) => {
    if (loaderWindow) loaderWindow.webContents.send("download-progress", Math.round(progress.percent));
  });
  autoUpdater.on("update-downloaded", () => {
    autoUpdater.quitAndInstall(); // fermeture et installation automatique
  });
  autoUpdater.on("error", (err) => log.error("Erreur auto-update:", err));

  autoUpdater.checkForUpdates();
}

app.whenReady().then(() => {
  createLoaderWindow();
  setupAutoUpdater();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
