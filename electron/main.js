const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const https = require('https');
const fs = require('fs');
const AdmZip = require('adm-zip');
const extractZip = require('extract-zip');
const unzipper = require('unzipper');

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
  if (isDev) mainWindow.loadURL('http://localhost:3000');
  else mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
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
    if (gameType === 'wow-5.4.8') {
      // WoW: check if wow-5.4.8 subfolder exists
      return fs.existsSync(path.join(dest, 'wow-5.4.8'));
    }
    // Default: just check if dest folder exists
    return fs.existsSync(dest);
  } catch (e) {
    log.error('check-game-installed', e);
    return false;
  }
});

// start-install: two-phase (download all -> extract/move)
ipcMain.on('start-install', async (event, payload) => {
  try {
    const dest = payload.dest;
    const files = payload.files || [];
    let downloadsDir = path.join(dest, 'downloads');
    if (path.basename(dest).toLowerCase() === 'downloads') downloadsDir = dest;
    if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

    const totalFiles = files.length;
    const isGoogleDrive = (u) => /drive.google.com|docs.google.com|drive.usercontent.google.com/.test(u);

    const downloadOne = (f, i) => new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const filename = f.name || path.basename(f.url);
      const outPath = path.join(downloadsDir, filename);
      const tempPath = outPath + '.tmp';

      // ============================================================
      // ✅ GOOGLE DRIVE → UTILISER LE DOWNLOADER HTTPS ROBUSTE
      // (gdown bypassed due to Python runtime issues)
      // ============================================================
      if (isGoogleDrive(f.url)) {
        try { fs.unlinkSync(outPath); } catch (e) { }
        try { fs.unlinkSync(tempPath); } catch (e) { }

        log.info(`Google Drive file detected, using HTTPS downloader: ${filename}`);
        // fall through to HTTPS downloader below
      }

      // ============================================================
      // 🌐 DOWNLOAD NORMAL (CODE ORIGINAL CONSERVÉ)
      // ============================================================
      if (fs.existsSync(outPath) && !fs.existsSync(tempPath)) {
        try { fs.renameSync(outPath, tempPath); } catch (e) { }
      }

      const start = fs.existsSync(tempPath) ? fs.statSync(tempPath).size : 0;
      const gdriveCookies = [];

      // Extract complete file ID from original URL BEFORE following redirects
      let gdriveFileId = null;
      if (isGoogleDrive(f.url)) {
        const m1 = f.url.match(/\/d\/([^\/\?&]+)/);
        const m2 = f.url.match(/id=([^&\?]+)/);
        gdriveFileId = m1 ? m1[1] : (m2 ? m2[1] : null);
        if (gdriveFileId) {
          log.debug(`[${filename}] Extracted complete fileId from original URL: ${gdriveFileId}`);
        }
      }

      const doRequest = (url, headers = {}, redirectsLeft = 5) => {
        const reqHeaders = Object.assign({}, headers);
        if (start > 0) reqHeaders['Range'] = `bytes=${start}-`;

        // Add User-Agent for Google Drive
        if (isGoogleDrive(url)) {
          reqHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
          // Add cookies if we collected any from previous responses
          if (gdriveCookies.length > 0) {
            reqHeaders['Cookie'] = gdriveCookies.join('; ');
          }
        }

        const req = https.get(url, { headers: reqHeaders }, (res) => {
          log.debug(`[${filename}] HTTP ${res.statusCode}, content-type: ${(res.headers['content-type'] || 'none').substring(0, 50)}`);

          if (
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location &&
            redirectsLeft > 0
          ) {
            log.debug(`[${filename}] Redirect to: ${res.headers.location.substring(0, 80)}`);
            const next = res.headers.location.startsWith('http')
              ? res.headers.location
              : new URL(res.headers.location, url).toString();
            return doRequest(next, headers, redirectsLeft - 1);
          }

          const contentType = (res.headers['content-type'] || '').toLowerCase();
          log.debug(`[${filename}] Content-Type check: isGoogleDrive=${isGoogleDrive(url)}, isHTML=${contentType.includes('text/html')}`);

          // Handle Google Drive confirmation page
          if (isGoogleDrive(url) && contentType.includes('text/html')) {
            log.info(`[${filename}] Detected Google Drive HTML page (virus warning or confirmation)`);

            // Prevent infinite loops
            if (redirectsLeft <= 0) {
              log.error(`[${filename}] Max redirects reached, cannot bypass Google Drive warning`);
              return reject(new Error(`Google Drive: Unable to bypass virus warning for ${filename} after multiple attempts`));
            }

            let body = '';
            res.setEncoding('utf8');

            res.on('data', (c) => body += c);
            res.on('end', () => {
              log.debug(`[${filename}] HTML body received, length: ${body.length}`);

              // Write full HTML to a temp file for debugging
              const debugPath = path.join(require('os').tmpdir(), `gdrive-${filename}.html`);
              fs.writeFileSync(debugPath, body, 'utf8');
              log.info(`[${filename}] Full HTML written to: ${debugPath}`);

              const setCookies = res.headers['set-cookie'] || [];
              for (const c of setCookies) {
                gdriveCookies.push(c.split(';')[0]);
              }
              log.debug(`[${filename}] Set-Cookie headers: ${setCookies.length}, total cookies: ${gdriveCookies.length}`);

              // Use the file ID extracted from original URL to bypass virus warning
              if (!gdriveFileId) {
                log.error(`[${filename}] No file ID from original URL: ${f.url}`);
                return reject(new Error(`Google Drive: fileId not found for ${filename}`));
              }

              // Try simple &confirm=t bypass first (works for some virus warnings)
              const nextUrl = `https://drive.usercontent.google.com/download?id=${gdriveFileId}&confirm=t`;
              log.info(`[${filename}] Attempting virus warning bypass with confirm=t: ${nextUrl}`);
              return doRequest(nextUrl, {}, redirectsLeft - 1);
            });
            return;
          }

          if (!(res.statusCode === 200 || res.statusCode === 206)) {
            return reject(new Error(`HTTP ${res.statusCode}`));
          }

          const total = parseInt(res.headers['content-length'] || '0', 10) + start;
          let received = start;

          const fileStream = fs.createWriteStream(tempPath, {
            flags: start > 0 ? 'a' : 'w'
          });

          res.on('data', (chunk) => {
            received += chunk.length;

            const filePercent = total
              ? Math.min(100, Math.round((received / total) * 100))
              : 0;

            const overall = Math.round(
              ((i + filePercent / 100) / totalFiles) * 100
            );

            event.sender.send('install-progress', {
              phase: 'download',
              index: i + 1,
              total: totalFiles,
              percent: filePercent,
              overall,
              filename
            });
          });

          res.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close(() => {
              try {
                fs.renameSync(tempPath, outPath);
                resolve();
              } catch (e) {
                reject(e);
              }
            });
          });

          res.on('error', reject);
        });

        req.on('error', reject);
      };

      doRequest(f.url);
    });




    for (let i = 0; i < totalFiles; i++) {
      const f = files[i]; const filename = f.name || path.basename(f.url); const outPath = path.join(downloadsDir, filename);
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) { const overallDone = Math.round(((i + 1) / totalFiles) * 100); event.sender.send('install-progress', { phase: 'download', index: i + 1, total: totalFiles, percent: 100, overall: overallDone, filename }); continue; }
      await downloadOne(f, i);
    }

    for (let i = 0; i < totalFiles; i++) {
      const f = files[i]; const filename = f.name || path.basename(f.url); const outPath = path.join(downloadsDir, filename); const ext = path.extname(outPath).toLowerCase(); const targetPath = i === 0 ? dest : path.join(dest, f.targetRelative || ''); if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true });
      if (ext === '.zip') {
        const overallStart = Math.round((i / totalFiles) * 100);
        event.sender.send('install-progress', { phase: 'extract', index: i + 1, total: totalFiles, percent: 0, overall: overallStart, filename });

        // Validate ZIP header
        const fd = fs.openSync(outPath, 'r');
        const header = Buffer.alloc(4);
        fs.readSync(fd, header, 0, 4, 0);
        fs.closeSync(fd);

        const isValidZip = header[0] === 0x50 && header[1] === 0x4b && (header[2] === 0x03 || header[2] === 0x05 || header[2] === 0x07) && (header[3] === 0x04 || header[3] === 0x06 || header[3] === 0x08);
        if (!isValidZip) {
          const size = fs.statSync(outPath).size;
          const headerStr = header.toString('hex');
          log.error(`Invalid ZIP header for ${filename}: size=${size}, header=${headerStr}`);
          // Check if it's HTML (corrupted by Google Drive confirmation page)
          let sample = '';
          if (size < 1000) {
            const buf = Buffer.alloc(Math.min(size, 500));
            const fd2 = fs.openSync(outPath, 'r');
            fs.readSync(fd2, buf, 0, buf.length, 0);
            fs.closeSync(fd2);
            sample = buf.toString('utf8', 0, buf.length).substring(0, 200);
          }
          throw new Error(`Invalid ZIP header for ${filename}${sample ? ' (possibly HTML): ' + sample.substring(0, 100) : ''}`);
        }

        // Use streaming extraction for large files (>500MB), adm-zip (per-entry) for smaller files
        const fileSize = fs.statSync(outPath).size;
        const useStreaming = fileSize > 500 * 1024 * 1024;

        if (useStreaming) {
          log.info(`[${filename}] File size ${fileSize} bytes, using streaming extraction (unzipper)`);
          try {
            const d = await unzipper.Open.file(outPath);
            const fileEntries = d.files.filter(en => en.type === 'File');
            const totalEntries = fileEntries.length || 1;
            let extractedEntries = 0;

            for (const entry of fileEntries) {
              const entryPath = path.join(targetPath, entry.path);
              fs.mkdirSync(path.dirname(entryPath), { recursive: true });

              await new Promise((res, rej) => {
                const rs = entry.stream();
                const ws = fs.createWriteStream(entryPath);
                rs.pipe(ws);
                ws.on('finish', () => {
                  extractedEntries += 1;
                  const filePercent = Math.min(100, Math.round((extractedEntries / totalEntries) * 100));
                  const overall = Math.round(((i + filePercent / 100) / totalFiles) * 100);
                  event.sender.send('install-progress', { phase: 'extract', index: i + 1, total: totalFiles, percent: filePercent, overall, filename, extractedTo: targetPath });
                  res();
                });
                ws.on('error', rej);
                rs.on('error', rej);
              });
            }
          } catch (e) {
            log.error(`Streaming extraction failed for ${filename}`, e);
            throw e;
          }
        } else {
          // Use adm-zip but extract entries one by one to report progress
          const zip = new AdmZip(outPath);
          const entries = zip.getEntries().filter(en => !en.isDirectory);
          const totalEntries = entries.length || 1;
          let doneEntries = 0;
          for (const en of entries) {
            const entryName = en.entryName;
            const destFile = path.join(targetPath, entryName);
            fs.mkdirSync(path.dirname(destFile), { recursive: true });
            fs.writeFileSync(destFile, en.getData());
            doneEntries += 1;
            const filePercent = Math.min(100, Math.round((doneEntries / totalEntries) * 100));
            const overall = Math.round(((i + filePercent / 100) / totalFiles) * 100);
            event.sender.send('install-progress', { phase: 'extract', index: i + 1, total: totalFiles, percent: filePercent, overall, filename, extractedTo: targetPath });
          }
        }

        fs.unlinkSync(outPath);
        const overallDone = Math.round(((i + 1) / totalFiles) * 100);
        event.sender.send('install-progress', { phase: 'extract', index: i + 1, total: totalFiles, percent: 100, overall: overallDone, filename, extractedTo: targetPath });
        event.sender.send('install-progress', { phase: 'clean', index: i + 1, total: totalFiles, percent: 100, overall: overallDone, filename });
      } else {
        const destFile = path.join(targetPath, filename); fs.renameSync(outPath, destFile); const overallDone = Math.round(((i + 1) / totalFiles) * 100); event.sender.send('install-progress', { phase: 'extract', index: i + 1, total: totalFiles, percent: 100, overall: overallDone, filename, extractedTo: targetPath });
      }
    }

    event.sender.send('install-complete', { success: true, dest });
  } catch (err) { log.error('Installation failed', err); event.sender.send('install-complete', { success: false, error: String(err) }); }
});

ipcMain.on('start-game', (event, exePath) => { try { const { spawn } = require('child_process'); const child = spawn(exePath, { detached: true, stdio: 'ignore' }); child.unref(); } catch (e) { log.error('Failed to start game:', e); } });

app.whenReady().then(() => { createLoaderWindow(); if (isDev) setTimeout(() => { if (loaderWindow) { loaderWindow.close(); createMainWindow(); } }, MIN_LOADER_TIME); else autoUpdater.checkForUpdatesAndNotify().catch((e) => log.error('autoUpdater check failed', e)); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow(); }); });

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
