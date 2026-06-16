/*:
 * @plugindesc R3D Visual Stage character display for RPG Maker MV.
 * @author R3D Visual Stage
 *
 * @param Default Character Path
 * @type string
 * @default r3d/models/r3d-validation-character.glb
 * @desc GLB/glTF asset path relative to the RPG Maker MV project root.
 *
 * @param Auto Show Character
 * @type boolean
 * @default true
 * @desc Show the character display after the plugin initializes.
 *
 * @param Character Display Width
 * @type number
 * @min 160
 * @default 280
 * @desc Right-side character display width in MV canvas pixels before browser scaling.
 *
 * @param Target FPS
 * @type number
 * @min 1
 * @max 60
 * @default 30
 * @desc Maximum Three.js render rate for the character display.
 *
 * @param Max Pixel Ratio
 * @type number
 * @decimals 2
 * @min 0.5
 * @default 1.5
 * @desc Pixel ratio cap used by the transparent character display renderer.
 *
 * @param File Logging
 * @type boolean
 * @default false
 * @desc Write diagnostics to a local log file when running in RPG Maker MV playtest/NW.js.
 *
 * @param Log File Path
 * @type string
 * @default r3d-logs/R3DVisualStage.log
 * @desc Local log path relative to the RPG Maker MV project root.
 *
 * @param Timestamp Log File
 * @type boolean
 * @default false
 * @desc Add a startup timestamp to the log file name so each playtest run writes a separate file.
 *
 * @help
 * R3D Visual Stage
 *
 * This plugin renders a transparent, right-side Three.js character display
 * while RPG Maker MV's 2D
 * tilemap remains authoritative for movement, events, collision, menus, and
 * game state.
 *
 * Plugin commands:
 *
 *   R3DStage Character Show
 *   R3DStage Character Hide
 *   R3DStage Character Load r3d/models/r3d-validation-character.glb
 *   R3DStage Character Play Idle
 *   R3DStage Character Play Wave
 *
 * The plugin also listens for the MV "ok" input and attempts to play Wave
 * when that clip exists in the loaded GLB. Missing clips and failed model loads
 * are reported to the browser console without stopping the MV game loop.
 *
 * During RPG Maker MV playtest, set File Logging to true to write diagnostics
 * under the MV project root. Enable Timestamp Log File to keep one separate log
 * per playtest run. The file logger only runs in NW.js and is skipped for
 * normal browser Web deployment.
 */
