import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const configPath = resolve('.r3d-local.json');
const pluginSource = resolve('dist/R3DVisualStage.js');
const sourceMapSource = resolve('dist/R3DVisualStage.js.map');
const modelSource = resolve('public/models/r3d-validation-character.glb');

let config;
try {
  config = JSON.parse(await readFile(configPath, 'utf8'));
} catch (error) {
  console.error(
    'Missing .r3d-local.json. Create it from docs/r3d-character-display.md before running copy:mv.',
  );
  throw error;
}

if (!config.mvProjectPath || typeof config.mvProjectPath !== 'string') {
  throw new Error('.r3d-local.json must contain a string mvProjectPath.');
}

const mvProjectPath = resolve(config.mvProjectPath);
const pluginTargetDir = resolve(mvProjectPath, 'js/plugins');
const modelTargetDir = resolve(mvProjectPath, 'models');

await mkdir(pluginTargetDir, { recursive: true });
await mkdir(modelTargetDir, { recursive: true });
await copyFile(pluginSource, resolve(pluginTargetDir, 'R3DVisualStage.js'));
await copyOptional(sourceMapSource, resolve(pluginTargetDir, 'R3DVisualStage.js.map'));
await copyFile(modelSource, resolve(modelTargetDir, 'r3d-validation-character.glb'));

console.log(`Copied R3D Visual Stage plugin and validation character into ${mvProjectPath}`);

async function copyOptional(source, target) {
  try {
    await copyFile(source, target);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}
