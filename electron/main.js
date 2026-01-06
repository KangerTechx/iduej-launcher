const {app, BrowserWindow} = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");

const isDev = process.env.NODE_ENV === "development";

function createWindow(){
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 1280, // Largeur minimale de la fenêtre
        minHeight: 720, // Hauteur minimale de la fenêtre
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'resources/icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        }
    });

    if(isDev) {
        win.loadURL("http://localhost:3000")
    } else {
        win.loadFile(path.join(__dirname, "../out/index.html"));
    }

    //autoUpdater.checkForUpdatesAndNotify();
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if(process.platform !=="darwin") app.quit()
})