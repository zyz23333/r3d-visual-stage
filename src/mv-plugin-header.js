/*:
 * @plugindesc R3D Visual Stage presentation scene runtime for RPG Maker MV.
 * @author R3D Visual Stage
 *
 * @param Default Scene Path
 * @type string
 * @default r3d/scenes/r3d-validation-scene.r3dscene.json
 * @desc R3D Scene File path relative to the RPG Maker MV project root.
 *
 * @param Auto Show Scene
 * @type boolean
 * @default true
 * @desc Load and show the default Presentation Scene after the plugin initializes.
 *
 * @param Stage Placement
 * @type select
 * @option right
 * @default right
 * @desc Visual Stage placement. This version supports right-side placement only.
 *
 * @param Stage Width
 * @type number
 * @min 160
 * @max 1024
 * @default 280
 * @desc Right-side Visual Stage width in MV canvas pixels before browser scaling.
 *
 * @param Target FPS
 * @type number
 * @min 1
 * @max 60
 * @default 30
 * @desc Maximum Three.js render rate for the Visual Stage.
 *
 * @param Max Pixel Ratio
 * @type number
 * @decimals 2
 * @min 0.5
 * @max 4
 * @default 1.5
 * @desc Pixel ratio cap used by the transparent Visual Stage renderer.
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
 * This plugin renders transparent, right-side Three.js Presentation Scenes
 * while RPG Maker MV's 2D tilemap remains authoritative for movement, events,
 * collision, menus, and game state.
 *
 * R3D Scene Files are strict JSON files with the .r3dscene.json extension.
 * Paths are relative to the RPG Maker MV project root. The default validation
 * scene is:
 *
 *   r3d/scenes/r3d-validation-scene.r3dscene.json
 *
 * Plugin commands:
 *
 *   R3DStage Scene Load r3d/scenes/r3d-validation-scene.r3dscene.json
 *   R3DStage Scene Show
 *   R3DStage Scene Hide
 *   R3DStage Scene Camera portrait
 *   R3DStage Scene Play character Wave
 *
 * Successful scene loads automatically show the Visual Stage. Failed loads,
 * missing cameras, missing models, and missing animation clips are reported to
 * the browser console without stopping the MV game loop.
 *
 * During RPG Maker MV playtest, set File Logging to true to write diagnostics
 * under the MV project root. Enable Timestamp Log File to keep one separate log
 * per playtest run. The file logger only runs in NW.js and is skipped for
 * normal browser Web deployment.
 */
