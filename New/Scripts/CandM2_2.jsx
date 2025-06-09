/*  Exact-pass JSX for Photoshop 26.7
    Mirrors legacy behaviour ─ 2025-06-03
--------------------------------------------------*/
(function () {
    var doc        = app.activeDocument,
        actionName = "createandmerge",
        actionSet  = "BesoLUXediting",
        passes     = doc.layers.length - 1;      // same loop-count as legacy

    var oldDialogs = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;

    // Drop any duplicate copies of the ActionSet (26.7 quirk)
    try { app.unloadAction(actionSet, ""); } catch (_) {}

    /* -------- run the Action the original fixed number of times -------- */
    for (var i = 0; i < passes; i++) {
        try {
            app.doAction(actionName, actionSet);
        } catch (err) {
            /* Photoshop throws error-number 8007—and/or the text
               “User cancelled the operation”—when there’s nothing left
               to merge.  Ignore that one, alert on anything else. */
            var benign =  (err.number === 8007) ||
                          (/User cancelled/i.test(err.message));

            if (!benign) {
                alert("Action failed on pass " + (i + 1) + " of " + passes +
                      "\n\n" + err);
                break;                         // bail on genuine errors
            }
            // else: do nothing and continue looping
        }
    }

    /* -------- hide the layer that is now index 0 (same as legacy) ------ */
    if (doc.layers.length) {
        doc.layers[0].visible = false;
    }

    app.displayDialogs = oldDialogs;
})();
