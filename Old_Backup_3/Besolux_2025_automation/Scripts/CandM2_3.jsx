(function () {
    var doc        = app.activeDocument,
        actionName = "createandmerge",
        actionSet  = "BesoLUXediting",
        passes     = doc.layers.length - 1;

    var oldDialogs = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;

    try { app.unloadAction(actionSet, ""); } catch (_) {}

    var isMac = $.os.indexOf("Mac") !== -1;
    var psVersion = parseFloat(app.version); // 26.7 = 26.7

    for (var i = 0; i < passes; i++) {
        try {
            app.doAction(actionName, actionSet);
        } catch (err) {
            var isLastPass = (i === passes - 1);
            var isCancelErr = err.toString().indexOf("User cancelled the operation") > -1;

            if (isLastPass && isCancelErr) {
                if (isMac && psVersion === 26.7) {
                    // Suppress macOS Photoshop 26.7 annoying alert manually
                    // Do nothing — we expected this error.
                    continue;
                }
                // For all platforms — expected cancel on last pass → ignore
            } else {
                // For all other errors or passes → show alert
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
