const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const waitOn = require('wait-on');
const kill = require('tree-kill');

const projectRoot = path.resolve(__dirname, '..');
const backendRoot = path.resolve(projectRoot, '..', '..', 'backend');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const isOpenMode = process.argv.includes('--open');
const defaultWebPort = Number(process.env.E2E_WEB_PORT || 8081);

const childProcesses = [];

const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    const markAvailable = () => {
      socket.destroy();
      resolve(true);
    };

    const markUnavailable = () => {
      socket.destroy();
      resolve(false);
    };

    socket.setTimeout(500);

    socket.once('connect', markUnavailable);
    socket.once('timeout', markAvailable);
    socket.once('error', (error) => {
      if (error && error.code === 'ECONNREFUSED') {
        markAvailable();
        return;
      }

      markUnavailable();
    });

    socket.connect(port, '127.0.0.1');
  });
};

const findAvailablePort = async (startingPort) => {
  let currentPort = startingPort;

  while (!(await isPortAvailable(currentPort))) {
    currentPort += 1;
  }

  return currentPort;
};

const prefixOutput = (stream, label) => {
  stream.on('data', (chunk) => {
    process.stdout.write(`[${label}] ${chunk}`);
  });
};

const spawnProcess = (cwd, args, label, extraEnv = {}) => {
  const command = process.platform === 'win32' ? 'cmd.exe' : npmCommand;
  const commandArgs = process.platform === 'win32' ? ['/d', '/s', '/c', [npmCommand, ...args].join(' ')] : args;

  const child = spawn(command, commandArgs, {
    cwd,
    env: {
      ...process.env,
      CI: '1',
      EXPO_NO_TELEMETRY: '1',
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  prefixOutput(child.stdout, label);
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${label}] ${chunk}`);
  });

  childProcesses.push(child);
  return child;
};

const killProcess = (child) => {
  return new Promise((resolve) => {
    if (!child || child.killed || child.exitCode !== null) {
      resolve();
      return;
    }

    kill(child.pid, 'SIGTERM', () => resolve());
  });
};

const shutdown = async () => {
  await Promise.all(childProcesses.map((child) => killProcess(child)));
};

const run = () => {
  const cypressBaseUrl = process.env.CYPRESS_BASE_URL;

  return new Promise((resolve, reject) => {
    const args = isOpenMode ? ['exec', 'cypress', 'open'] : ['exec', 'cypress', 'run'];
    const child = spawnProcess(projectRoot, args, 'cypress', {
      CYPRESS_BASE_URL: cypressBaseUrl,
    });

    child.on('exit', (code) => {
      if (code === 0 || (isOpenMode && code === null)) {
        resolve();
        return;
      }

      reject(new Error(`Cypress exited with code ${code}`));
    });

    child.on('error', reject);
  });
};

process.on('SIGINT', async () => {
  await shutdown();
  process.exit(130);
});

process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(143);
});

(async () => {
  try {
    const webPort = await findAvailablePort(defaultWebPort);
    const webUrl = `http://127.0.0.1:${webPort}`;

    spawnProcess(backendRoot, ['run', 'start'], 'backend', {
      NODE_ENV: 'test',
      DB_SYNC_MODE: process.env.DB_SYNC_MODE || 'alter',
    });
    process.env.CYPRESS_BASE_URL = webUrl;
    spawnProcess(projectRoot, ['exec', '--', 'expo', 'start', '--web', '--port', String(webPort)], 'frontend');

    await waitOn({
      resources: ['http://127.0.0.1:3000/health', webUrl],
      timeout: 180000,
      interval: 1000,
      validateStatus: (status) => status >= 200 && status < 500,
    });

    await run();
    await shutdown();
  } catch (error) {
    await shutdown();
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
})();