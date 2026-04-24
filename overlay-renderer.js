const { ipcRenderer } = require("electron");

ipcRenderer.on("update-state", (event, data) => {
  const body = document.body;
  const box = document.getElementById("box");
  const timerHour = document.getElementById("timer-hour");
  const timerMin = document.getElementById("timer-min");
  const timerSec = document.getElementById("timer-sec");
  const title = document.getElementById("title");
  const totalSec = data.totalSec;
  const style = data.style || "fullscreen";

  // body 클래스 초기화
  body.className = "";
  body.classList.add(`style-${style}`);
  if (data.type === "overtime") body.classList.add("overtime");

  // corner 슬라이드업 애니메이션 재실행
  // if (style === "corner") {
  //   box.style.animation = "none";
  //   box.offsetHeight; // reflow
  //   box.style.animation = "";
  // }

  title.textContent = data.message;

  // 타이머 초기화
  timerHour.style.display = "none";
  timerMin.style.display = "none";
  timerSec.style.display = "none";

  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  if (h > 0) {
    timerHour.querySelector(".unit-number").textContent = h;
    timerHour.style.display = "inline-flex";
  }
  if (m > 0 || h > 0) {
    timerMin.querySelector(".unit-number").textContent = m;
    timerMin.style.display = "inline-flex";
  }
  timerSec.querySelector(".unit-number").textContent = s;
  timerSec.style.display = "inline-flex";
});

window.addEventListener("load", function () {
  const btn = document.getElementById("btnOverlayClose");

  btn.addEventListener("mouseenter", () => {
    ipcRenderer.send("set-ignore-mouse", false);
  });
  btn.addEventListener("mouseleave", () => {
    ipcRenderer.send("set-ignore-mouse", true);
  });
  btn.addEventListener("click", () => {
    ipcRenderer.send("hide-overlay");
  });
});
