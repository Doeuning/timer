const { ipcRenderer } = require("electron");

let targetTime = { hour: 18, min: 0, sec: 0, ms: 0 };

ipcRenderer.on("set-time", (event, data) => {
  targetTime = data;
});

// 현재시각 표시 타이머
// function startTimer(el) {
//   setInterval(() => {
//     if (!el) return;
//     const curr = new Date();
//     const utc = curr.getTime() + curr.getTimezoneOffset() * 60 * 1000;
//     const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
//     const kr_curr = new Date(utc + KR_TIME_DIFF);
//     const timeStr = kr_curr.toLocaleTimeString("en-GB", { hour12: true });

//     el.textContent = timeStr;
//   }, 1000);
// }

function startTimer(el) {
  const title = document.getElementById("title");
  setInterval(() => {
    if (!el) return;

    const now = new Date();

    const target = new Date();

    target.setHours(
      targetTime.hour,
      targetTime.min,
      targetTime.sec,
      targetTime.ms,
    );

    let diff = target - now;
    const totalSec = Math.floor(diff / 1000);

    el.textContent = `${totalSec}초 전`;

    if (totalSec <= 10 && totalSec >= 0) {
      el.classList.add("warning");
      return;
    } else if (totalSec < 0) {
      // overtime
      const overtime = Math.abs(diff);
      const h = Math.floor(overtime / (1000 * 60 * 60));
      const m = Math.floor((overtime / (1000 * 60)) % 60);
      const s = Math.floor((overtime / 1000) % 60);
      el.classList.remove("warning");
      el.classList.add("error");
      title.textContent = "초과근무";
      el.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}시간 중`;
      return;
    }

    // 현재시각 표시 타이머
    // const h = Math.floor(diff / (1000 * 60 * 60));
    // const m = Math.floor((diff / (1000 * 60)) % 60);
    // const s = Math.floor((diff / 1000) % 60);
    // el.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, 1000);
}

window.addEventListener("load", function () {
  const timer = document.getElementById("timer");
  // const btnClose = document.getElementById("btnClose");
  if (timer) {
    startTimer(timer);
  }
  // btnClose.addEventListener("click", () => {
  //   ipcRenderer.send("quit-app");
  // });
});
