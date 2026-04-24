const { ipcRenderer } = require("electron");

let alerts = [];
let nextId = 1;

const STYLES = [
  { key: "fullscreen", icon: "⛶", label: "전체화면" },
  { key: "medium", icon: "▣", label: "중간크기" },
  { key: "corner", icon: "◳", label: "구석알림" },
];

// ─── 알림 아이템 렌더링 ───────────────────────────────────
function createAlertItem(alert) {
  const item = document.createElement("div");
  item.className = "alert-item";
  item.dataset.id = alert.id;

  // 상단: 시간 입력 + 삭제 버튼
  const top = document.createElement("div");
  top.className = "alert-item-top";

  const timeRow = document.createElement("div");
  timeRow.className = "alert-time-row";

  const fields = [
    { key: "hours", max: 23, unit: "시간" },
    { key: "minutes", max: 59, unit: "분" },
    { key: "seconds", max: 59, unit: "초" },
  ];

  fields.forEach(({ key, max, unit }) => {
    const wrap = document.createElement("div");
    wrap.className = "time-input-wrap";

    const input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.max = max;
    input.value = alert[key];
    input.dataset.field = key;
    input.addEventListener("change", () => {
      const a = alerts.find((a) => a.id === alert.id);
      if (a) a[key] = Math.min(max, Math.max(0, Number(input.value) || 0));
      input.value = a[key];
    });

    const unitSpan = document.createElement("span");
    unitSpan.className = "time-unit";
    unitSpan.textContent = unit;

    wrap.appendChild(input);
    wrap.appendChild(unitSpan);
    timeRow.appendChild(wrap);
  });

  const label = document.createElement("span");
  label.className = "alert-time-label";
  label.textContent = "전";
  timeRow.appendChild(label);

  const btnRemove = document.createElement("button");
  btnRemove.className = "btn-remove";
  btnRemove.textContent = "✕";
  btnRemove.addEventListener("click", () => {
    alerts = alerts.filter((a) => a.id !== alert.id);
    item.remove();
  });

  top.appendChild(timeRow);
  top.appendChild(btnRemove);

  // 하단: 스타일 선택
  const styleSelector = document.createElement("div");
  styleSelector.className = "style-selector";

  STYLES.forEach(({ key, icon, label: styleLabel }) => {
    const btn = document.createElement("button");
    btn.className = "style-btn" + (alert.style === key ? " active" : "");
    btn.innerHTML = `<span class="icon">${icon}</span>${styleLabel}`;
    btn.addEventListener("click", () => {
      const a = alerts.find((a) => a.id === alert.id);
      if (a) a.style = key;
      styleSelector
        .querySelectorAll(".style-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
    styleSelector.appendChild(btn);
  });

  item.appendChild(top);
  item.appendChild(styleSelector);

  return item;
}

function renderAlerts() {
  const list = document.getElementById("alertList");
  list.innerHTML = "";
  alerts.forEach((alert) => {
    list.appendChild(createAlertItem(alert));
  });
}

// ─── 알림 추가 ────────────────────────────────────────────
document.getElementById("btnAddAlert").addEventListener("click", () => {
  const newAlert = {
    id: nextId++,
    hours: 0,
    minutes: 0,
    seconds: 0,
    style: "fullscreen",
  };
  alerts.push(newAlert);
  const list = document.getElementById("alertList");
  list.appendChild(createAlertItem(newAlert));
});

// ─── 설정 불러오기 ────────────────────────────────────────
ipcRenderer.invoke("get-settings").then((settings) => {
  document.getElementById("leaveHour").value = settings.hour;
  document.getElementById("leaveMin").value = settings.min;
  document.getElementById("overtimeToggle").checked = settings.overtime;

  alerts = settings.customAlerts.map((a) => ({ ...a }));
  nextId = Math.max(0, ...alerts.map((a) => a.id)) + 1;
  renderAlerts();
});

// ─── 저장 ────────────────────────────────────────────────
document.getElementById("btnSave").addEventListener("click", () => {
  const newSettings = {
    hour: Math.min(
      23,
      Math.max(0, Number(document.getElementById("leaveHour").value) || 0),
    ),
    min: Math.min(
      59,
      Math.max(0, Number(document.getElementById("leaveMin").value) || 0),
    ),
    customAlerts: alerts,
    overtime: document.getElementById("overtimeToggle").checked,
  };

  ipcRenderer.send("save-settings", newSettings);

  const feedback = document.getElementById("feedback");
  feedback.classList.add("show");
  setTimeout(() => feedback.classList.remove("show"), 2000);
});

// ─── 닫기 ────────────────────────────────────────────────
document.getElementById("btnClose").addEventListener("click", () => {
  ipcRenderer.send("close-settings");
});
