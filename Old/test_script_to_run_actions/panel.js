/*  BLUVEL Runner — Ps 26.7 / UXP 8.1 ready  ------------------------

    ❶ Loads every .atn file in ./actions exactly once per session.
    ❷ Finds ACTION_NAME inside ACTION_SET and plays it         .
    ❸ Uses Action.play() when available (Ps ≥ 23.0); falls back
       to batchPlay for safety on older builds.

    Put the .atn files next to manifest.json in an “actions” folder:
       my-plugin/
       ├─ manifest.json
       ├─ index.html
       ├─ panel.js
       └─ actions/
            └─ BLUVEL.atn
------------------------------------------------------------------ */

const {action, core, app} = require("photoshop");
const fs = require("uxp").storage.localFileSystem;

/* -- customise only if you rename your action set ---------------- */
const ACTION_SET  = "BesoLUXediting";
const ACTION_NAME = "startautomation";
/* ---------------------------------------------------------------- */

async function loadLocalATN() {
  const pluginFolder = await fs.getPluginFolder().catch(() => null);
  if (!pluginFolder) return;

  const actionsFolder = await pluginFolder.getEntry("actions").catch(() => null);
  if (!actionsFolder) return;

  // what sets are already visible?
  const loaded = app.actionTree.map(s => s.name);

  for (const entry of await actionsFolder.getEntries()) {
    if (!entry.isFile || !entry.name.toLowerCase().endsWith(".atn")) continue;
    const guess = entry.name.replace(/\.atn$/i, "");
    if (loaded.includes(guess)) continue;

    await core.executeAsModal(async () => {
      // Ps 25.3+ exposes app.loadActionFile()
      if (typeof app.loadActionFile === "function") {
        await app.loadActionFile(entry);
      } else {
        // fallback for ≤ 25.x
        await action.batchPlay([{
          _obj : "load",
          "null": { _path: entry.nativePath, _kind: "local" },
          _options: { dialogOptions: "dontDisplay" }
        }], {modalBehavior: "fail"});
      }
    }, {commandName: `Load ${entry.name}`});
  }
}

async function playAction() {
  const targetSet = (app.actionTree || []).find(s => s.name === ACTION_SET);
  if (!targetSet) {
    await showAlert(`Action Set “${ACTION_SET}” not found.`);
    return;
  }
  const targetAction = targetSet.actions.find(a => a.name === ACTION_NAME);
  if (!targetAction) {
    await showAlert(`Action “${ACTION_NAME}” not found in “${ACTION_SET}”.`);
    return;
  }

  await core.executeAsModal(async () => {
    if (typeof targetAction.play === "function") {
      // Preferred DOM method (Ps 23.0+)
      await targetAction.play();                          // ✔️ simple!
    } else {
      // Back-compat: low-level descriptor
      await action.batchPlay([{
        _obj: "play",
        _target: [
          {_ref: "action",    _name: ACTION_NAME},
          {_ref: "actionSet", _name: ACTION_SET }
        ],
        _options: {dialogOptions: "dontDisplay"}
      }], {modalBehavior: "fail"});
    }
  }, {commandName: `Play ${ACTION_NAME}`});
}

async function showAlert(msg) {
  const dlg = document.createElement("dialog");
  dlg.textContent = msg;
  dlg.addEventListener("close", () => dlg.remove());
  document.body.appendChild(dlg);
  await dlg.showModal();
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadLocalATN();
  document.getElementById("runBtn")
          ?.addEventListener("click", () => playAction().catch(console.error));
});
