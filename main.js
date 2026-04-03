const { app, BrowserWindow, ipcMain } = require("electron/main");
const { autoUpdater } = require("electron-updater");

let mainWindow;
let isShown = false;
let hour = 18,
  min = 0,
  sec = 0,
  ms = 0;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    fullscreen: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: "icon.ico",
  });

  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.loadFile("index.html");

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("set-time", {
      hour,
      min,
      sec,
      ms,
    });
  });
};

function initAutoUpdater() {
  autoUpdater.on("update-available", () => {
    console.log("업데이트 있음");
  });

  autoUpdater.on("update-downloaded", () => {
    autoUpdater.quitAndInstall();
  });
  // 업데이트 체크
  autoUpdater.checkForUpdatesAndNotify();
}

function showWindow() {
  mainWindow.show();
  mainWindow.focus();
  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.setVisibleOnAllWorkspaces(true);
  isShown = true;
}
function hideWindow() {
  if (mainWindow) {
    mainWindow.hide();
    isShown = false;
  }
}

function checkTimeAndShow() {
  setInterval(() => {
    const now = new Date();

    const target = new Date();
    target.setHours(hour, min, sec, ms); // 퇴근 시간

    const diff = target - now;
    // 1초 1000
    // 10초 10000
    // 1분 60 * 1000
    // 10분 600 * 1000
    // 1시간 3600 * 1000

    // 10분 10초 전
    if (diff <= 611000 && diff > 609000 && !isShown) {
      showWindow();
      setTimeout(() => {
        hideWindow();
      }, 10000);
    }

    // 30초 전 ~ 퇴근 전까지
    if (diff <= 30000 && diff > 0 && !isShown) {
      showWindow();
    }
  }, 1000);
}

app.whenReady().then(() => {
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true,
  });

  createWindow();
  checkTimeAndShow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  initAutoUpdater();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("quit-app", () => {
  app.quit();
});
