const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  screen,
} = require("electron/main");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const fs = require("fs");

let mainWindow;
let settingsWindow;
let tray;
let isShown = false;
let currentStyle = "";
let manuallyHidden = false; // 닫기 버튼으로 숨긴 경우

// ─── 설정 파일 ───────────────────────────────────────────
const settingsPath = path.join(app.getPath("userData"), "settings.json");

function loadSettings() {
  if (fs.existsSync(settingsPath)) {
    try {
      const saved = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      // 구버전 포맷 대응 (customAlerts 없으면 기본값으로)
      if (!saved.customAlerts) {
        saved.customAlerts = [
          { id: 1, hours: 0, minutes: 10, seconds: 0, style: "fullscreen" },
          { id: 2, hours: 0, minutes: 0, seconds: 30, style: "medium" },
        ];
      }
      if (saved.overtime === undefined) saved.overtime = true;
      return saved;
    } catch (e) {
      console.error("설정 파일 읽기 실패:", e);
    }
  }
  return {
    hour: 18,
    min: 0,
    customAlerts: [
      { id: 1, hours: 0, minutes: 10, seconds: 0, style: "fullscreen" },
      { id: 2, hours: 0, minutes: 0, seconds: 30, style: "medium" },
    ],
    overtime: true,
  };
}

function saveSettings(data) {
  fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
}

let settings = loadSettings();

// ─── 오버레이 창 ──────────────────────────────────────────
const createOverlay = () => {
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
    icon: path.join(__dirname, "icon.ico"),
  });

  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.loadFile("overlay.html");
};

// ─── 윈도우 스타일 적용 ───────────────────────────────────
function applyWindowStyle(style) {
  if (style === currentStyle) return;
  currentStyle = style;

  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  switch (style) {
    case "fullscreen":
      mainWindow.setFullScreen(true);
      break;
    case "medium":
      mainWindow.setFullScreen(false);
      mainWindow.setSize(620, 200);
      mainWindow.center();
      break;
    case "corner":
      mainWindow.setFullScreen(false);
      mainWindow.setSize(320, 110);
      mainWindow.setPosition(sw - 350, sh - 126);
      break;
  }
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
}

// ─── 설정 창 ─────────────────────────────────────────────
function openSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 460,
    height: 580,
    resizable: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, "icon.ico"),
  });

  settingsWindow.loadFile("settings.html");
  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

// ─── 트레이 ──────────────────────────────────────────────
function createTray() {
  try {
    tray = new Tray(path.join(__dirname, "icon.ico"));
    tray.setToolTip("퇴근런 타이머");

    const contextMenu = Menu.buildFromTemplate([
      { label: "설정", click: openSettingsWindow },
      { type: "separator" },
      { label: "종료", click: () => app.quit() },
    ]);

    tray.on("click", openSettingsWindow);
    tray.setContextMenu(contextMenu);
  } catch (e) {
    console.error("트레이 생성 실패:", e);
  }
}

// ─── 상태 계산 ────────────────────────────────────────────
function getActiveAlert(diff) {
  if (diff < 0) return null;

  const customAlerts = settings.customAlerts || [];
  let active = null;
  let smallest = Infinity;

  for (const alert of customAlerts) {
    const alertMs =
      (alert.hours * 3600 + alert.minutes * 60 + alert.seconds) * 1000;
    if (diff <= alertMs && alertMs < smallest) {
      smallest = alertMs;
      active = alert;
    }
  }

  return active;
}

function showWindow(style) {
  applyWindowStyle(style);
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
    currentStyle = "";
  }
}

function sendState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const now = new Date();
  const target = new Date();
  target.setHours(settings.hour, settings.min, 0, 0);

  const diff = target - now;
  const totalSec = Math.floor(Math.abs(diff) / 1000);
  const activeAlert = getActiveAlert(diff);

  // 초과근무
  if (diff < 0 && settings.overtime) {
    manuallyHidden = false; // 초과근무는 항상 표시
    mainWindow.webContents.send("update-state", {
      type: "overtime",
      message: "초과근무 중 🥱",
      totalSec,
      style: "fullscreen",
    });
    showWindow("fullscreen");
    return;
  }

  // 커스텀 알림 범위 — 수동으로 닫았으면 같은 알림 구간에서는 안 보임
  if (activeAlert) {
    if (manuallyHidden) return;

    mainWindow.webContents.send("update-state", {
      type: "alert",
      message: "퇴근까지 남은 시간 🏃",
      totalSec,
      style: activeAlert.style,
    });
    showWindow(activeAlert.style);
    return;
  }

  // 알림 구간 벗어나면 수동 숨김 초기화
  manuallyHidden = false;
  hideWindow();
}

function checkTimeAndShow() {
  setInterval(sendState, 1000);
}

// ─── IPC ─────────────────────────────────────────────────
ipcMain.handle("get-settings", () => settings);

ipcMain.on("save-settings", (event, newSettings) => {
  settings = newSettings;
  saveSettings(settings);
});

ipcMain.on("close-settings", () => {
  if (settingsWindow) settingsWindow.close();
});

// 오버레이 닫기 버튼
ipcMain.on("hide-overlay", () => {
  manuallyHidden = true;
  hideWindow();
});

// 닫기 버튼 hover시 마우스 이벤트 토글
ipcMain.on("set-ignore-mouse", (event, ignore) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

ipcMain.on("quit-app", () => app.quit());

// ─── 앱 초기화 ────────────────────────────────────────────
app.whenReady().then(() => {
  app.setLoginItemSettings({ openAtLogin: true, openAsHidden: true });
  createOverlay();
  createTray();
  checkTimeAndShow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createOverlay();
  });

  autoUpdater.on("update-downloaded", () => autoUpdater.quitAndInstall());
  autoUpdater.checkForUpdatesAndNotify();
});

app.on("window-all-closed", () => {
  // 트레이 앱 — 창 닫혀도 종료 안 함
});
