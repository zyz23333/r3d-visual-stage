import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const MAIN_PLUGIN_NAME = 'R3DVisualStage';
const TEST_PLUGIN_NAME = 'R3DVisualStageManualTest';
const INVALID_SCENE_NAME = 'r3d-invalid-scene.r3dscene.json';

const mvProjectPath = await resolveMvProjectPath();
await assertMvProject(mvProjectPath);
await installManualTestPlugin(mvProjectPath);
await enableManualTestPlugin(mvProjectPath);

console.log(`Installed ${TEST_PLUGIN_NAME} in ${mvProjectPath}`);

async function resolveMvProjectPath() {
  const localConfig = await readOptionalJson(resolve('.r3d-local.json'));
  if (typeof localConfig?.mvProjectPath === 'string' && localConfig.mvProjectPath.trim()) {
    return resolve(localConfig.mvProjectPath);
  }

  throw new Error(
    'Missing mvProjectPath. Create .r3d-local.json with { "mvProjectPath": "D:/path/to/project" }.',
  );
}

async function assertMvProject(projectPath) {
  if (!(await pathExists(resolve(projectPath, 'Game.rpgproject')))) {
    throw new Error(`MV project path does not contain Game.rpgproject: ${projectPath}`);
  }

  if (!(await pathExists(resolve(projectPath, 'js/plugins.js')))) {
    throw new Error(`MV project path does not contain js/plugins.js: ${projectPath}`);
  }
}

async function installManualTestPlugin(projectPath) {
  const pluginTargetDir = resolve(projectPath, 'js/plugins');
  const invalidSceneTargetDir = resolve(projectPath, 'r3d/scenes');

  await mkdir(pluginTargetDir, { recursive: true });
  await mkdir(invalidSceneTargetDir, { recursive: true });
  await writeFile(
    resolve(pluginTargetDir, `${TEST_PLUGIN_NAME}.js`),
    manualTestPluginSource(),
    'utf8',
  );
  await writeFile(
    resolve(invalidSceneTargetDir, INVALID_SCENE_NAME),
    `${JSON.stringify(invalidSceneDefinition(), null, 2)}\n`,
    'utf8',
  );
}

async function enableManualTestPlugin(projectPath) {
  const pluginsPath = resolve(projectPath, 'js/plugins.js');
  const source = await readFile(pluginsPath, 'utf8');
  const plugins = parseMvPlugins(source);
  const mainPluginIndex = plugins.findIndex((plugin) => plugin?.name === MAIN_PLUGIN_NAME);
  const testPluginEntry = {
    name: TEST_PLUGIN_NAME,
    status: true,
    description: 'R3D Visual Stage manual MV playtest checklist.',
    parameters: {},
  };
  const existingTestPluginIndex = plugins.findIndex((plugin) => plugin?.name === TEST_PLUGIN_NAME);

  if (mainPluginIndex < 0) {
    throw new Error(
      `${MAIN_PLUGIN_NAME} is not enabled in js/plugins.js. Run npm run enable:mv-test-host first.`,
    );
  }

  if (existingTestPluginIndex >= 0) {
    plugins[existingTestPluginIndex] = {
      ...plugins[existingTestPluginIndex],
      ...testPluginEntry,
      status: true,
    };
  } else {
    plugins.splice(mainPluginIndex + 1, 0, testPluginEntry);
  }

  await writeFile(pluginsPath, formatMvPlugins(plugins), 'utf8');
}

function invalidSceneDefinition() {
  return {
    schemaVersion: 999,
    id: 'r3d-invalid-scene',
    cameras: [],
    activeCamera: 'missing',
  };
}

function manualTestPluginSource() {
  return String.raw`/*:
 * @plugindesc Manual checklist for R3D Visual Stage MV playtest verification.
 * @author R3D Visual Stage
 *
 * @help
 * Shows a small playtest checklist panel.
 *
 * Keyboard:
 *   N - run current step and move focus to manual verification
 *   P - mark current step passed
 *   F - mark current step failed
 *   R - rerun current step
 *   [ / ] - previous / next step
 *   H - hide or show the checklist panel
 *
 * This plugin is for local RPG Maker MV test hosts only.
 */
(function () {
  'use strict';

  var DEFAULT_SCENE_PATH = 'r3d/scenes/r3d-validation-scene.r3dscene.json';
  var INVALID_SCENE_PATH = 'r3d/scenes/r3d-invalid-scene.r3dscene.json';
  var PANEL_ID = 'r3d-manual-test-panel';
  var BODY_ID = 'r3d-manual-test-body';
  var LOG_ID = 'r3d-manual-test-log';
  var MAX_Z_INDEX = '2147483647';
  var BOOTSTRAP_RETRY_LIMIT = 60;
  var STATUS_PENDING = 'pending';
  var STATUS_RUNNING = 'running';
  var STATUS_VERIFY = 'verify';
  var STATUS_PASSED = 'passed';
  var STATUS_FAILED = 'failed';

  var currentStepIndex = 0;
  var panelHidden = false;
  var statuses = [];
  var logLines = [];
  var steps = [
    {
      title: 'Default startup',
      expected:
        'The right-side Visual Stage is visible and shows the validation 3D Character Display.',
      run: function (done) {
        var ready = Boolean(window.R3DVisualStage && window.R3DVisualStage.scene);
        done(ready, ready ? 'Scene API is available.' : 'window.R3DVisualStage.scene is missing.');
      },
    },
    {
      title: 'Plugin Command: Play character Wave',
      expected: 'The validation character plays the Wave animation and MV input remains responsive.',
      run: function (done) {
        runPluginCommand(['Scene', 'Play', 'character', 'Wave']);
        wait(done, true, 'Executed R3DStage Scene Play character Wave.');
      },
    },
    {
      title: 'Plugin Command: Hide',
      expected: 'The Visual Stage canvas disappears without freezing MV gameplay.',
      run: function (done) {
        runPluginCommand(['Scene', 'Hide']);
        wait(done, true, 'Executed R3DStage Scene Hide.');
      },
    },
    {
      title: 'Plugin Command: Show',
      expected: 'The same active scene appears again without reloading the map.',
      run: function (done) {
        runPluginCommand(['Scene', 'Show']);
        wait(done, true, 'Executed R3DStage Scene Show.');
      },
    },
    {
      title: 'Plugin Command: Camera wide',
      expected: 'The active Presentation Camera switches to a visibly wider view.',
      run: function (done) {
        runPluginCommand(['Scene', 'Camera', 'wide']);
        wait(done, true, 'Executed R3DStage Scene Camera wide.');
      },
    },
    {
      title: 'Plugin Command: Camera portrait',
      expected: 'The active Presentation Camera switches back to the closer portrait view.',
      run: function (done) {
        runPluginCommand(['Scene', 'Camera', 'portrait']);
        wait(done, true, 'Executed R3DStage Scene Camera portrait.');
      },
    },
    {
      title: 'Plugin Command: Invalid load preservation',
      expected:
        'A validation error is logged, and the current scene/camera remains visible and usable.',
      run: function (done) {
        runPluginCommand(['Scene', 'Load', INVALID_SCENE_PATH]);
        wait(done, true, 'Executed R3DStage Scene Load ' + INVALID_SCENE_PATH + '.');
      },
    },
    {
      title: 'Plugin Command: Reload default scene',
      expected: 'The validation character reloads and remains visible on the right side.',
      run: function (done) {
        runPluginCommand(['Scene', 'Load', DEFAULT_SCENE_PATH]);
        wait(done, true, 'Executed R3DStage Scene Load ' + DEFAULT_SCENE_PATH + '.');
      },
    },
    {
      title: 'Pointer pass-through',
      expected:
        'Click and move on the MV map. Pointer input should reach MV except where this test panel sits.',
      run: function (done) {
        done(true, 'No command executed. Verify pointer behavior manually.');
      },
    },
    {
      title: 'Resize alignment',
      expected: 'Resize the playtest/browser window. The Visual Stage stays aligned to the MV canvas.',
      run: function (done) {
        done(true, 'No command executed. Verify resize behavior manually.');
      },
    },
    {
      title: 'File logging',
      expected:
        'In MV playtest/NW.js, r3d-logs contains startup, scene load, promotion, layout, and render diagnostics.',
      run: function (done) {
        done(true, 'No command executed. Inspect the latest r3d-logs file after playtest.');
      },
    },
  ];

  for (var i = 0; i < steps.length; i += 1) {
    statuses.push(STATUS_PENDING);
  }

  function wait(done, result, message) {
    window.setTimeout(function () {
      done(result, message);
    }, 700);
  }

  function runPluginCommand(args) {
    if (!window.Game_Interpreter) {
      throw new Error('Game_Interpreter is unavailable.');
    }

    var interpreter = new window.Game_Interpreter();
    interpreter.pluginCommand('R3DStage', args);
  }

  function createPanel() {
    if (document.getElementById(PANEL_ID)) {
      return;
    }

    if (!document.body) {
      return;
    }

    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.position = 'fixed';
    panel.style.left = '8px';
    panel.style.top = '8px';
    panel.style.width = '360px';
    panel.style.maxHeight = 'calc(100vh - 16px)';
    panel.style.overflow = 'auto';
    panel.style.padding = '10px';
    panel.style.zIndex = MAX_Z_INDEX;
    panel.style.pointerEvents = 'auto';
    panel.style.background = 'rgba(12, 16, 24, 0.92)';
    panel.style.color = '#f5f7fb';
    panel.style.border = '1px solid rgba(255, 255, 255, 0.24)';
    panel.style.borderRadius = '6px';
    panel.style.font = '12px/1.4 Arial, sans-serif';
    panel.style.boxShadow = '0 8px 28px rgba(0, 0, 0, 0.35)';

    panel.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
      '<strong>R3D MV Manual Test</strong>' +
      '<button data-r3d-action="hide" title="Hide panel (H)">Hide</button>' +
      '</div>' +
      '<div style="margin:6px 0;color:#b9c1d6;">N run · P pass · F fail · R rerun · [ ] move · H hide/show</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">' +
      '<button data-r3d-action="run">Run</button>' +
      '<button data-r3d-action="pass">Pass</button>' +
      '<button data-r3d-action="fail">Fail</button>' +
      '<button data-r3d-action="prev">Prev</button>' +
      '<button data-r3d-action="next">Next</button>' +
      '<button data-r3d-action="reset">Reset</button>' +
      '</div>' +
      '<div id="' +
      BODY_ID +
      '"></div>' +
      '<pre id="' +
      LOG_ID +
      '" style="white-space:pre-wrap;max-height:120px;overflow:auto;margin:8px 0 0;color:#cbd5e1;background:rgba(255,255,255,0.06);padding:6px;border-radius:4px;"></pre>';

    panel.addEventListener('click', onPanelClick);
    document.body.appendChild(panel);
    render();
  }

  function ensurePanelMounted() {
    if (panelHidden) {
      if (!document.getElementById('r3d-manual-test-show')) {
        addFloatingShowButton();
      }

      return;
    }

    if (!document.getElementById(PANEL_ID)) {
      createPanel();
      return;
    }

    var panel = document.getElementById(PANEL_ID);
    if (panel) {
      panel.style.display = 'block';
      panel.style.zIndex = MAX_Z_INDEX;
    }
  }

  function installSceneManagerHook() {
    if (!window.SceneManager || !window.SceneManager.updateMain) {
      return false;
    }

    if (window.SceneManager.__r3dManualTestHooked) {
      return true;
    }

    var originalUpdateMain = window.SceneManager.updateMain;
    window.SceneManager.updateMain = function () {
      var result = originalUpdateMain.apply(this, arguments);
      ensurePanelMounted();
      return result;
    };
    window.SceneManager.__r3dManualTestHooked = true;
    return true;
  }

  function bootstrap(attempt) {
    ensurePanelMounted();

    if (installSceneManagerHook()) {
      return;
    }

    if (attempt < BOOTSTRAP_RETRY_LIMIT) {
      window.setTimeout(function () {
        bootstrap(attempt + 1);
      }, 167);
    }
  }

  function onPanelClick(event) {
    var target = event.target;
    if (!target || !target.getAttribute) {
      return;
    }

    var action = target.getAttribute('data-r3d-action');
    if (action === 'run') runCurrentStep();
    if (action === 'pass') markCurrentStep(STATUS_PASSED);
    if (action === 'fail') markCurrentStep(STATUS_FAILED);
    if (action === 'prev') moveStep(-1);
    if (action === 'next') moveStep(1);
    if (action === 'reset') resetSteps();
    if (action === 'hide') togglePanel();
  }

  function runCurrentStep() {
    var step = steps[currentStepIndex];
    statuses[currentStepIndex] = STATUS_RUNNING;
    addLog('Running: ' + step.title);
    render();

    try {
      step.run(function (success, message) {
        statuses[currentStepIndex] = success ? STATUS_VERIFY : STATUS_FAILED;
        addLog((success ? 'Verify: ' : 'Failed: ') + message);
        render();
      });
    } catch (error) {
      statuses[currentStepIndex] = STATUS_FAILED;
      addLog('Error: ' + formatError(error));
      render();
    }
  }

  function markCurrentStep(status) {
    statuses[currentStepIndex] = status;
    addLog((status === STATUS_PASSED ? 'Passed: ' : 'Failed: ') + steps[currentStepIndex].title);

    if (status === STATUS_PASSED && currentStepIndex < steps.length - 1) {
      currentStepIndex += 1;
    }

    render();
  }

  function moveStep(delta) {
    currentStepIndex = Math.max(0, Math.min(steps.length - 1, currentStepIndex + delta));
    render();
  }

  function resetSteps() {
    for (var i = 0; i < statuses.length; i += 1) {
      statuses[i] = STATUS_PENDING;
    }

    currentStepIndex = 0;
    logLines = [];
    render();
  }

  function togglePanel() {
    panelHidden = !panelHidden;
    var panel = document.getElementById(PANEL_ID);

    if (panel) {
      panel.style.display = panelHidden ? 'none' : 'block';
    }

    if (panelHidden) {
      addFloatingShowButton();
    } else {
      removeFloatingShowButton();
    }
  }

  function addFloatingShowButton() {
    if (document.getElementById('r3d-manual-test-show')) {
      return;
    }

    var button = document.createElement('button');
    button.id = 'r3d-manual-test-show';
    button.textContent = 'R3D Test';
    button.title = 'Show R3D manual test panel (H)';
    button.style.position = 'fixed';
    button.style.left = '8px';
    button.style.top = '8px';
    button.style.zIndex = MAX_Z_INDEX;
    button.style.pointerEvents = 'auto';
    button.addEventListener('click', togglePanel);
    document.body.appendChild(button);
  }

  function removeFloatingShowButton() {
    var button = document.getElementById('r3d-manual-test-show');
    if (button && button.parentNode) {
      button.parentNode.removeChild(button);
    }
  }

  function render() {
    var body = document.getElementById(BODY_ID);
    var log = document.getElementById(LOG_ID);

    if (!body || !log) {
      return;
    }

    var html = '';
    for (var i = 0; i < steps.length; i += 1) {
      var active = i === currentStepIndex;
      html +=
        '<div style="' +
        stepStyle(statuses[i], active) +
        '">' +
        '<div><strong>' +
        (i + 1) +
        '. ' +
        escapeHtml(steps[i].title) +
        '</strong> <span style="color:' +
        statusColor(statuses[i]) +
        ';">[' +
        statuses[i] +
        ']</span></div>' +
        '<div style="color:#cbd5e1;">' +
        escapeHtml(steps[i].expected) +
        '</div>' +
        '</div>';
    }

    body.innerHTML = html;
    log.textContent = logLines.slice(-8).join('\n');
  }

  function stepStyle(status, active) {
    var border = active ? '#93c5fd' : 'rgba(255,255,255,0.14)';
    var background = active ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.04)';

    if (status === STATUS_PASSED) background = 'rgba(22,163,74,0.18)';
    if (status === STATUS_FAILED) background = 'rgba(220,38,38,0.18)';
    if (status === STATUS_RUNNING) background = 'rgba(234,179,8,0.18)';

    return (
      'border:1px solid ' +
      border +
      ';background:' +
      background +
      ';border-radius:4px;padding:6px;margin-bottom:5px;'
    );
  }

  function statusColor(status) {
    if (status === STATUS_PASSED) return '#86efac';
    if (status === STATUS_FAILED) return '#fca5a5';
    if (status === STATUS_RUNNING) return '#fde68a';
    if (status === STATUS_VERIFY) return '#93c5fd';
    return '#cbd5e1';
  }

  function addLog(message) {
    logLines.push(new Date().toLocaleTimeString() + ' ' + message);
    render();
  }

  function formatError(error) {
    if (error && error.stack) {
      return error.stack;
    }

    if (error && error.message) {
      return error.message;
    }

    return String(error);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.addEventListener('keydown', function (event) {
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    var key = event.key;
    if (key === 'n' || key === 'N') runCurrentStep();
    if (key === 'p' || key === 'P') markCurrentStep(STATUS_PASSED);
    if (key === 'f' || key === 'F') markCurrentStep(STATUS_FAILED);
    if (key === 'r' || key === 'R') runCurrentStep();
    if (key === '[') moveStep(-1);
    if (key === ']') moveStep(1);
    if (key === 'h' || key === 'H') togglePanel();
  });

  window.R3DVisualStageManualTest = {
    run: runCurrentStep,
    pass: function () {
      markCurrentStep(STATUS_PASSED);
    },
    fail: function () {
      markCurrentStep(STATUS_FAILED);
    },
    reset: resetSteps,
    show: function () {
      if (panelHidden) {
        togglePanel();
      }
    },
    hide: function () {
      if (!panelHidden) {
        togglePanel();
      }
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bootstrap(0);
    });
  } else {
    bootstrap(0);
  }
})();
`;
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

function parseMvPlugins(source) {
  const start = source.indexOf('[');
  const end = source.lastIndexOf(']');
  if (start < 0 || end < start) {
    throw new Error('Could not find the MV $plugins array in js/plugins.js.');
  }

  return JSON.parse(source.slice(start, end + 1));
}

function formatMvPlugins(plugins) {
  const body = plugins.map((plugin) => JSON.stringify(plugin)).join(',\n');
  return `// Generated by RPG Maker.\n// Do not edit this file directly.\nvar $plugins =\n[\n${body}\n];\n`;
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
