import { execSync } from "node:child_process";

const port = 5173;

function freePortOnWindows() {
  let output = "";

  try {
    output = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
  } catch {
    return;
  }

  const listeningPids = new Set();

  for (const line of output.split(/\r?\n/)) {
    if (!line.includes("LISTENING")) {
      continue;
    }

    const pid = line.trim().split(/\s+/).at(-1);

    if (pid && pid !== "0") {
      listeningPids.add(pid);
    }
  }

  for (const pid of listeningPids) {
    console.log(`[predev] Stopping stale process ${pid} on port ${port}`);
    execSync(`taskkill /PID ${pid} /F`, { stdio: "inherit" });
  }
}

function freePortOnUnix() {
  try {
    execSync(`lsof -ti:${port} | xargs -r kill -9`, { shell: true, stdio: "ignore" });
  } catch {
    // Port already free.
  }
}

if (process.platform === "win32") {
  freePortOnWindows();
} else {
  freePortOnUnix();
}
