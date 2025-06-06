(function () {
    $.level = 0; // ← Add this line to suppress UI alerts on macOS

    var doc        = app.activeDocument,
        actionName = "createandmerge",
        actionSet  = "BesoLUXediting",
        passes     = doc.layers.length - 1;

    var oldDialogs = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;

    try { app.unloadAction(actionSet, ""); } catch (_) {}

    for (var i = 0; i < passes; i++) {
        try {
            app.doAction(actionName, actionSet);
        } catch (err) {
            if (i === passes - 1 && err.toString().indexOf("User cancelled the operation") > -1) {
                // Suppress expected error on macOS as well
            } else {
                alert("Action failed on pass " + (i + 1) + " of " + passes + "\n\n" + err);
                break;
            }
        }
    }

    if (doc.layers.length) {
        doc.layers[0].visible = false;
    }

    app.displayDialogs = oldDialogs;
})();
