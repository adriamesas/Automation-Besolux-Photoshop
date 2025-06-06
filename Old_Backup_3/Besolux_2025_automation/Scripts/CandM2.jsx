/*  Exact-pass JSX for Photoshop 26.7
    Mirrors legacy behaviour ─ 2025-06-03
--------------------------------------------------*/
(function () {

    // macOS suppression fix
    $.level = 0;

    var doc        = app.activeDocument,
        actionName = "createandmerge",
        actionSet  = "BesoLUXediting",
        passes     = doc.layers.length - 1;     // ← same loop-count as legacy

    var oldDialogs = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;

    // Drop any duplicate copies of the ActionSet (26.7 quirk)
    try { app.unloadAction(actionSet, ""); } catch (_) {}

    /* -------- run the Action the original fixed number of times -------- */
    for (var i = 0; i < passes; i++) {
        try {
            app.doAction(actionName, actionSet);
        } catch (err) {
            // Check if it's the last pass AND the error is "User cancelled the operation"
            if (i === passes - 1 && err.toString().indexOf("User cancelled the operation") > -1) {
                // This is the expected error on the final pass,
                // assume the main part of the action for this pass completed.
                // Suppress the error and allow the script to continue.
            } else {
                // For any other error, or errors on other passes, show the alert and bail
                alert("Action failed on pass " + (i + 1) + " of " + passes + "\n\n" + err);
                break;                               // bail out like the old version would
            }
        }
    }

    /* -------- hide the layer that is now index 0 (same as legacy) ------ */
    if (doc.layers.length) {
        doc.layers[0].visible = false;
    }

    app.displayDialogs = oldDialogs;             // restore UI mode
})();
