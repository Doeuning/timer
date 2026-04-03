const { ipcRenderer } = require("electron");
const fitty = require("fitty");

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

function startTimer() {
  const timer = document.getElementById("timer");
  const timerHour = document.getElementById("timer-hour");
  const timerMin = document.getElementById("timer-min");
  const timerSec = document.getElementById("timer-sec");
  const title = document.getElementById("title");

  if (!timer) return;
  setInterval(() => {
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
    let hour = `${Math.floor(totalSec / 3600)}`;
    let min = `${Math.floor((totalSec % 3600) / 60)}`;
    let sec = `${totalSec % 60}`;
    title.textContent = "퇴근까지 남은 시간";
    // let ms = `${diff % 1000}ms`;

    if (hour > 0) {
      timerHour.querySelector(".unit-number").textContent = hour;
      timerHour.style.display = "inline";
    }

    if (min > 0) {
      timerMin.querySelector(".unit-number").textContent = min;
      timerMin.style.display = "inline";
    }

    if (sec >= 0) {
      timerSec.querySelector(".unit-number").textContent = sec;
      timerSec.style.display = "inline";
    }

    if (totalSec >= 0 && totalSec <= 10) {
      timer.classList.add("warning");
      return;
    } else if (totalSec < 0) {
      // overtime
      const overtime = Math.abs(diff);
      const h = Math.floor(overtime / (1000 * 60 * 60));
      const m = Math.floor((overtime / (1000 * 60)) % 60);
      const s = Math.floor((overtime / 1000) % 60);
      timer.classList.remove("warning");
      timer.classList.add("error");
      title.textContent = "초과근무 시간";

      if (h > 0) {
        timerHour.querySelector(".unit-number").textContent = h;
        timerHour.style.display = "inline";
      }
      if (m > 0) {
        timerMin.querySelector(".unit-number").textContent = m;
        timerMin.style.display = "inline";
      }
      if (s >= 0) {
        timerSec.querySelector(".unit-number").textContent = s;
        timerSec.style.display = "inline";
      }
      return;
    }

    // 현재시각 표시 타이머
    // const h = Math.floor(diff / (1000 * 60 * 60));
    // const m = Math.floor((diff / (1000 * 60)) % 60);
    // const s = Math.floor((diff / 1000) % 60);
    // el.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, 50);
}

window.addEventListener("load", function () {
  // const btnClose = document.getElementById("btnClose");

  startTimer();
  fitty("#timer");

  // btnClose.addEventListener("click", () => {
  //   ipcRenderer.send("quit-app");
  // });
});
