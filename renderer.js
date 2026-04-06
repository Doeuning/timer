const { ipcRenderer } = require("electron");
const fitty = require("fitty");

ipcRenderer.on("update-state", (event, data) => {
  const box = document.getElementById("box");
  const timer = document.getElementById("timer");
  const timerHour = document.getElementById("timer-hour");
  const timerMin = document.getElementById("timer-min");
  const timerSec = document.getElementById("timer-sec");
  const title = document.getElementById("title");
  const totalSec =
    data.type === "overtime" ? Math.abs(data.totalSec) : data.totalSec;

  // 타이머 초기화
  timerHour.style.display = "none";
  timerMin.style.display = "none";
  timerSec.style.display = "none";

  // 클래스 초기화
  timer.classList.remove("warning", "error");

  // 메시지 업데이트
  title.textContent = data.message;

  // 퇴근 10분 전
  if (data.type === "tenMin") {
    return;
  }

  // 퇴근 30초 전
  if (data.type === "thirtySec") {
    box.classList.add("warning");
  }

  // 초과근무
  if (data.type === "overtime") {
    box.classList.add("overtime");
  }

  // 시간 계산
  let hour = `${Math.floor(totalSec / 3600)}`;
  let min = `${Math.floor((totalSec % 3600) / 60)}`;
  let sec = `${totalSec % 60}`;

  // 시간 표시
  if (hour > 0) {
    timerHour.querySelector(".unit-number").textContent = hour;
    timerHour.style.display = "inline";
  }

  if (min > 0 || hour > 0) {
    timerMin.querySelector(".unit-number").textContent = min;
    timerMin.style.display = "inline";
  }

  timerSec.querySelector(".unit-number").textContent = sec;
  timerSec.style.display = "inline";
});

window.addEventListener("load", function () {
  // const btnClose = document.getElementById("btnClose");

  fitty("#timer");

  // btnClose.addEventListener("click", () => {
  //   ipcRenderer.send("quit-app");
  // });
});
