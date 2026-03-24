const { ipcRenderer } = require("electron");

function startTimer(el) {
  setInterval(() => {
    if (!el) return;
    const curr = new Date();
    const utc = curr.getTime() + curr.getTimezoneOffset() * 60 * 1000;
    const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
    const kr_curr = new Date(utc + KR_TIME_DIFF);
    const timeStr = kr_curr.toLocaleTimeString("en-GB", { hour12: true });

    el.textContent = timeStr;
  }, 1000);
}

window.addEventListener("load", function () {
  const timer = document.getElementById("timer");
  const btnClose = document.getElementById("btnClose");
  if (timer) {
    startTimer(timer);
  }
  btnClose.addEventListener("click", () => {
    ipcRenderer.send("quit-app");
  });
});
