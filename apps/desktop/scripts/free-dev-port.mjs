import { execSync } from "node:child_process";

const devPorts = [5173, 47821];

function freePortOnWindows(port) {
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

function freePortOnUnix(port) {
  try {
    execSync(`lsof -ti:${port} | xargs -r kill -9`, { shell: true, stdio: "ignore" });
  } catch {
    // Port already free.
  }
}

for (const port of devPorts) {
  if (process.platform === "win32") {
    freePortOnWindows(port);
  } else {
    freePortOnUnix(port);
  }
}
