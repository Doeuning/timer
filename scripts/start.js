// VS Code 통합 터미널 등에서 ELECTRON_RUN_AS_NODE=1이 상속되면
// electron.exe가 일반 Node로 동작해 앱이 뜨지 않는 문제를 방지
delete process.env.ELECTRON_RUN_AS_NODE;

const { spawn } = require("child_process");
const electronPath = require("electron");

const child = spawn(electronPath, ["."], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
