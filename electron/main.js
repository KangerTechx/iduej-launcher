const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const fs = require('fs');
const extractZip = require('extract-zip');

// Logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

const isDev = process.env.NODE_ENV === 'development';
let mainWindow = null;
let loaderWindow = null;

function createLoaderWindow() {
  loaderWindow = new BrowserWindow({
    width: 420,
    height: 325,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    icon: path.join(__dirname, 'resources/icon.ico'),
    webPreferences: { contextIsolation: true, preload: path.join(__dirname, 'preload.js') },
  });
  loaderWindow.loadFile(path.join(__dirname, 'loader.html'));
  loaderWindow.center();
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1280,
    minHeight: 720,
    frame: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'resources/icon.ico'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }
}

// IPC: Minimiser la fenêtre
ipcMain.on('minimize', () => {
    if (mainWindow) mainWindow.minimize();
});

// IPC: Maximiser / Restaurer
ipcMain.on('maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) mainWindow.unmaximize();
        else mainWindow.maximize();
    }
});

// IPC: Fermer la fenêtre
ipcMain.on('close', () => {
    if (mainWindow) mainWindow.close();
});

const MIN_LOADER_TIME = 10000;
const loaderStart = Date.now();

autoUpdater.on('checking-for-update', () => log.info('Checking for updates...'));
autoUpdater.on('update-available', () => { if (loaderWindow) loaderWindow.webContents.send('update-available'); });
autoUpdater.on('update-not-available', () => {
  const elapsed = Date.now() - loaderStart;
  const wait = Math.max(MIN_LOADER_TIME - elapsed, 0);
  setTimeout(() => { if (loaderWindow) { loaderWindow.close(); createMainWindow(); } }, wait);
});

const configPath = path.join(app.getPath('userData'), 'config.json');
function readConfig() { try { if (fs.existsSync(configPath)) return JSON.parse(fs.readFileSync(configPath, 'utf8') || '{}'); } catch (e) { log.error('readConfig', e); } return { paths: {} }; }
function writeConfig(cfg) { try { fs.mkdirSync(path.dirname(configPath), { recursive: true }); fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf8'); return true; } catch (e) { log.error('writeConfig', e); return false; } }

ipcMain.handle('choose-destination', async () => {
  try { const res = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] }); if (res.canceled) return null; return res.filePaths[0]; } catch (e) { log.error('choose-destination', e); return null; }
});
ipcMain.handle('save-install-path', async (event, { gameId, path: p }) => { try { const cfg = readConfig(); if (!cfg.paths) cfg.paths = {}; cfg.paths[gameId] = p; return writeConfig(cfg); } catch (e) { log.error('save-install-path', e); return false; } });
ipcMain.handle('get-install-path', async (event, gameId) => { try { const cfg = readConfig(); return (cfg.paths && cfg.paths[gameId]) ? cfg.paths[gameId] : null; } catch (e) { log.error('get-install-path', e); return null; } });
ipcMain.handle('check-game-installed', async (event, dest, gameType) => {
  try {
    // Check for game-specific markers to confirm installation
    switch (gameType) {
      case 'wow-5.4.8':
        // WoW: check if wow-5.4.8 subfolder exists
        return fs.existsSync(path.join(dest, 'wow-5.4.8'));
      case 'dofus-2.51.4':
        // Dofus: check if dofus-2.51.4 subfolder exists
        return fs.existsSync(path.join(dest, 'dofus-2.51.4'));
      // Exemple pour d'autres jeux plus tard
      // case 'wow-retail':
      //   return fs.existsSync(path.join(dest, '_retail_'));

      default:
        // Par défaut : on vérifie juste si le dossier existe
        return fs.existsSync(dest);
    }
    // Default: just check if dest folder exists
    return fs.existsSync(dest);
  } catch (e) {
    log.error('check-game-installed', e);
    return false;
  }
});

// INSTALLATION
ipcMain.handle('startInstall', async (event, payload) => {
  // Installation 100% Node.js : téléchargement et extraction
  try {
    const dest = payload.dest;
    const files = payload.files || [];
    let downloadsDir = path.join(dest, 'downloads');
    if (path.basename(dest).toLowerCase() === 'downloads') downloadsDir = dest;
    if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

    const totalFiles = files.length;
    // Téléchargement de chaque fichier
    for (let i = 0; i < totalFiles; i++) {
      const f = files[i];
      const filename = f.name || path.basename(f.url);
      const outPath = path.join(downloadsDir, filename);
      log.info(`[INSTALL] Préparation du téléchargement: ${filename} depuis ${f.url}`);
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
        log.info(`[INSTALL] Fichier déjà présent (${filename}), taille: ${fs.statSync(outPath).size} octets`);
        const overallDone = Math.round(((i + 1) / totalFiles) * 100);
        event.sender.send('install-progress', { phase: 'download', index: i + 1, total: totalFiles, percent: 100, overall: overallDone, filename });
        continue;
      }
      // Téléchargement avec gestion des redirections (max 5)
      await new Promise((resolve, reject) => {
        const downloadWithRedirect = (url, redirectCount = 0) => {
          if (redirectCount > 5) {
            log.error(`[INSTALL] Trop de redirections pour ${filename}`);
            event.sender.send('install-progress', { phase: 'error', index: i + 1, filename, message: 'Trop de redirections' });
            reject(new Error('Trop de redirections'));
            return;
          }
          const httpModule = url.startsWith('https') ? require('https') : require('http');
          httpModule.get(url, (response) => {
            log.info(`[INSTALL] Code HTTP reçu pour ${filename}: ${response.statusCode}`);
            // Gestion des redirections
            if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
              const location = response.headers.location;
              log.info(`[INSTALL] Redirection détectée pour ${filename} vers ${location}`);
              if (!location) {
                log.error(`[INSTALL] Redirection sans location pour ${filename}`);
                event.sender.send('install-progress', { phase: 'error', index: i + 1, filename, message: 'Redirection sans location' });
                reject(new Error('Redirection sans location'));
                return;
              }
              downloadWithRedirect(location, redirectCount + 1);
              return;
            }
            if (response.statusCode !== 200) {
              log.error(`[INSTALL] Erreur HTTP ${response.statusCode} pour ${filename}`);
              event.sender.send('install-progress', { phase: 'error', index: i + 1, filename, message: `HTTP ${response.statusCode}` });
              reject(new Error(`HTTP ${response.statusCode}`));
              return;
            }
            const file = fs.createWriteStream(outPath);
            let downloaded = 0;
            const totalSize = parseInt(response.headers['content-length'] || '0', 10);
            response.on('data', (chunk) => {
              downloaded += chunk.length;
              if (totalSize > 0) {
                const percent = Math.round((downloaded / totalSize) * 100);
                event.sender.send('install-progress', { phase: 'download', index: i + 1, total: totalFiles, percent, filename });
              }
            });
            response.pipe(file);
            file.on('finish', () => {
              file.close(() => {
                log.info(`[INSTALL] Téléchargement terminé pour ${filename}, taille: ${downloaded} octets`);
                // Seul un ZIP trop petit est considéré comme corrompu
                const ext = path.extname(filename).toLowerCase();
                if (ext === '.zip' && downloaded < 1024) {
                  log.error(`[INSTALL] ZIP trop petit ou corrompu (${filename}), taille: ${downloaded} octets`);
                  event.sender.send('install-progress', { phase: 'error', index: i + 1, filename, message: 'ZIP trop petit ou corrompu' });
                  fs.unlink(outPath, () => {});
                  reject(new Error('ZIP trop petit ou corrompu'));
                  return;
                }
                // Envoie 100% à la fin
                event.sender.send('install-progress', { phase: 'download', index: i + 1, total: totalFiles, percent: 100, filename });
                resolve();
              });
            });
          }).on('error', (err) => {
            log.error(`[INSTALL] Erreur réseau pour ${filename}: ${err}`);
            event.sender.send('install-progress', { phase: 'error', index: i + 1, filename, message: String(err) });
            fs.unlink(outPath, () => {});
            reject(err);
          });
        };
        downloadWithRedirect(f.url);
      });
      const overallDone = Math.round(((i + 1) / totalFiles) * 100);
      event.sender.send('install-progress', { phase: 'download', index: i + 1, total: totalFiles, percent: 100, overall: overallDone, filename });
    }

    // Extraction et clean : une étape par fichier ZIP
    for (let i = 0; i < totalFiles; i++) {
      const f = files[i];
      const filename = f.name || path.basename(f.url);
      const outPath = path.join(downloadsDir, filename);
      const ext = path.extname(outPath).toLowerCase();
      const targetPath = i === 0 ? dest : path.join(dest, f.targetRelative || '');
      if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true });

      if (ext === '.zip') {
        // Progression d'extraction pour CE fichier uniquement
        event.sender.send('install-progress', { phase: 'extract', index: i + 1, total: totalFiles, percent: 0, filename, extractedTo: targetPath });
        await new Promise(async (resolve, reject) => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += 20;
            if (progress < 100) {
              event.sender.send('install-progress', { phase: 'extract', index: i + 1, total: totalFiles, percent: progress, filename, extractedTo: targetPath });
            }
          }, 200);
          try {
            await extractZip(outPath, { dir: targetPath });
            fs.unlinkSync(outPath);
            clearInterval(interval);
            event.sender.send('install-progress', { phase: 'extract', index: i + 1, total: totalFiles, percent: 100, filename, extractedTo: targetPath });
            resolve();
          } catch (err) {
            clearInterval(interval);
            reject(err);
          }
        });
      } else {
        const destFile = path.join(targetPath, filename);
        fs.renameSync(outPath, destFile);
        event.sender.send('install-progress', { phase: 'extract', index: i + 1, total: totalFiles, percent: 100, filename, extractedTo: targetPath });
      }
    }

    event.sender.send('install-complete', { success: true, dest });
    return true;
  } catch (err) {
    log.error('Installation failed', err);
    event.sender.send('install-complete', { success: false, error: String(err) });
    return false;
  }
});

// LANCER LE JEU
ipcMain.on('start-game', (event, exePath) => { try { const { spawn } = require('child_process'); const child = spawn(exePath, { detached: true, stdio: 'ignore' }); child.unref(); } catch (e) { log.error('Failed to start game:', e); } });

app.whenReady().then(() => { createLoaderWindow(); if (isDev) setTimeout(() => { if (loaderWindow) { loaderWindow.close(); createMainWindow(); } }, MIN_LOADER_TIME); else autoUpdater.checkForUpdatesAndNotify().catch((e) => log.error('autoUpdater check failed', e)); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow(); }); });

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
