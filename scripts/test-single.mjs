import { spawn, execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const DEV_PORT = 5173;
const DEV_LOCK_FILE = resolve(".vite-dev.pid");
const isWindows = process.platform === "win32";

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
  if (!existsSync(DEV_LOCK_FILE)) return;

  const pid = Number(readFileSync(DEV_LOCK_FILE, "utf8").trim());

  if (pid && isProcessAlive(pid)) {
    console.log(`Stopping previous IELTS Journey Vite dev process before tests: ${pid}`);
    killPid(pid);
  }

  try {
    rmSync(DEV_LOCK_FILE, { force: true });
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
        console.log(`Killing process using dev port ${port}: ${pid}`);
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
        console.log(`Killing process using dev port ${port}: ${pid}`);
        killPid(pid);
      }
    }
  } catch {}
}

function runVitestOnce() {
  console.log("Running Vitest once with limited workers...");

  const child = spawn(
    "pnpm",
    [
      "exec",
      "vitest",
      "run",
      "--config",
      "vitest.config.ts",
      "--maxWorkers=1",
      "--minWorkers=1"
    ],
    {
      stdio: "inherit",
      shell: isWindows,
      env: {
        ...process.env,
        CI: "true",
        NODE_ENV: "test",
        VITEST: "true"
      }
    }
  );

  child.on("exit", (code) => {
    killPort(DEV_PORT);
    process.exit(code ?? 0);
  });

  process.on("SIGINT", () => {
    killPid(child.pid);
    killPort(DEV_PORT);
    process.exit(130);
  });

  process.on("SIGTERM", () => {
    killPid(child.pid);
    killPort(DEV_PORT);
    process.exit(143);
  });
}

killPreviousProjectVite();
killPort(DEV_PORT);
runVitestOnce();
