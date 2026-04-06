const { app, BrowserWindow, ipcMain } = require("electron/main");
const { autoUpdater } = require("electron-updater");

let mainWindow;
let isShown = false;
let hour = 14,
  min = 7,
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

function getState(diff) {
  // 10분 10초 전
  if (diff <= 610000 && diff > 600000) {
    return { diff: diff, type: "tenMin", message: "퇴근 10분 전입니다 😎" };
  }

  // 30초 전 ~ 퇴근 전까지
  if (diff <= 30000 && diff > 0) {
    return { diff: diff, type: "thirtySec", message: "퇴근까지 남은 시간 🏃" };
  }

  // 퇴근시간 후
  if (diff < 0) {
    return {
      diff: Math.floor(diff / 1000),
      type: "overtime",
      message: "초과근무 중 🥱",
    };
  }

  // 그 외
  return { diff: null, type: "hidden", message: "" };
}

function sendState() {
  const now = new Date();

  const target = new Date();
  target.setHours(hour, min, sec, ms);

  let diff = target - now;

  const totalSec = Math.floor(diff / 1000);
  const state = getState(diff);

  mainWindow.webContents.send("update-state", {
    ...state,
    totalSec,
  });

  if (state.type === "hidden") {
    hideWindow();
  } else if (state.type === "tenMin" && !isShown) {
    showWindow();
    setTimeout(hideWindow, 10000);
  } else {
    showWindow();
  }
}

function checkTimeAndShow() {
  setInterval(() => {
    sendState();
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
