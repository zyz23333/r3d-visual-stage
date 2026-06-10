import { spawn } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const configPath = resolve('.r3d-local.json');
const scriptDir = dirname(fileURLToPath(import.meta.url));
const httpServerBin = resolve(scriptDir, '../node_modules/http-server/bin/http-server');

const mvProjectPath = await resolveMvProjectPath();
await assertMvProject(mvProjectPath);

const host = process.env.HOST || '127.0.0.1';
const port = process.env.PORT || '8080';

console.log(`Serving MV project from ${mvProjectPath}`);
console.log(`Open http://${host}:${port}/`);

const child = spawn(
  process.execPath,
  [httpServerBin, mvProjectPath, '-a', host, '-p', port, '-c-1'],
  {
    stdio: 'inherit',
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }

  process.exit(code ?? 0);
});

process.on('SIGINT', stopHttpServer);
process.on('SIGTERM', stopHttpServer);

function stopHttpServer() {
  child.kill();
}

async function resolveMvProjectPath() {
  const localConfig = await readOptionalJson(configPath);
  if (typeof localConfig?.mvProjectPath === 'string' && localConfig.mvProjectPath.trim()) {
    return resolve(localConfig.mvProjectPath);
  }

  throw new Error(
    'Missing mvProjectPath. Create .r3d-local.json with { "mvProjectPath": "D:/path/to/project" }.',
  );
}

async function assertMvProject(mvProjectPath) {
  if (!(await pathExists(resolve(mvProjectPath, 'Game.rpgproject')))) {
    throw new Error(`MV project path does not contain Game.rpgproject: ${mvProjectPath}`);
  }

  if (!(await pathExists(resolve(mvProjectPath, 'index.html')))) {
    throw new Error(`MV project path does not contain index.html: ${mvProjectPath}`);
  }
}

async function readOptionalJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return undefined;
    }

    throw error;
  }
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
