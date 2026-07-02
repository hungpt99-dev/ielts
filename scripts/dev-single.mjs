import { spawn, execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const PORT = 5173;
const LOCK_FILE = resolve(".vite-dev.pid");
const isWindows = process.platform === "win32";
const killOnly = process.argv.includes("--kill-only");

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function killPid(pid) {
  if (!pid || Number.isNaN(pid)) return;

  try {
    if (isWindows) {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
    } else {
      process.kill(pid, "SIGTERM");

      setTimeout(() => {
        if (isProcessAlive(pid)) {
          try {
            process.kill(pid, "SIGKILL");
          } catch {}
        }
      }, 1000);
    }
  } catch {}
}

function killPreviousProjectVite() {
  if (!existsSync(LOCK_FILE)) return;

  const pid = Number(readFileSync(LOCK_FILE, "utf8").trim());

  if (pid && isProcessAlive(pid)) {
    console.log(`Stopping previous IELTS Journey Vite process: ${pid}`);
    killPid(pid);
  }

  try {
    rmSync(LOCK_FILE, { force: true });
  } catch {}
}

function killPort(port) {
  try {
    if (isWindows) {
      const output = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"]
      });

      const pids = new Set();

      for (const line of output.split("\n")) {
        if (!line.includes("LISTENING")) continue;

        const parts = line.trim().split(/\s+/);
        const pid = Number(parts.at(-1));

        if (pid) pids.add(pid);
      }

      for (const pid of pids) {
        console.log(`Killing process using port ${port}: ${pid}`);
        killPid(pid);
      }
    } else {
      const output = execSync(`lsof -ti tcp:${port}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"]
      });

      const pids = output
        .split("\n")
        .map((value) => Number(value.trim()))
        .filter(Boolean);

      for (const pid of pids) {
        console.log(`Killing process using port ${port}: ${pid}`);
        killPid(pid);
      }
    }
  } catch {}
}

function startVite() {
  console.log(`Starting Vite on http://127.0.0.1:${PORT}`);

  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"],
    {
      stdio: "inherit",
      shell: isWindows
    }
  );

  writeFileSync(LOCK_FILE, String(child.pid));

  const cleanup = () => {
    try {
      rmSync(LOCK_FILE, { force: true });
    } catch {}
  };

  child.on("exit", (code) => {
    cleanup();
    process.exit(code ?? 0);
  });

  process.on("SIGINT", () => {
    killPid(child.pid);
    cleanup();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    killPid(child.pid);
    cleanup();
    process.exit(0);
  });
}

killPreviousProjectVite();
killPort(PORT);

if (killOnly) {
  console.log("Vite dev server stopped.");
  process.exit(0);
}

startVite();
