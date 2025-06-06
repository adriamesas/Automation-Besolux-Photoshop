(function () {

    /* ---------- helpers ---------- */
    function isUserCancel(err)
    {
        /*  Known “User cancelled / canceled” codes
            8007  – Photoshop internal
           -128    – macOS Apple-event userCanceledErr
        */
        var n = Number(err);
        if (!isNaN(n) && (n === 8007 || n === -128)) { return true; }

        /*  Fallback to text check – covers any
            language as long as the word “cancel”
            survives in the string.               */
        var msg = err.toString().toLowerCase();
        return (
               msg.indexOf("cancelled the operation")  > -1   // Windows EN-GB
            || msg.indexOf("canceled the operation")   > -1   // macOS EN-US
            || (msg.indexOf("cancel") > -1 && msg.indexOf("operation") > -1)
        );
    }

    /* ---------- main ---------- */
    var doc        = app.activeDocument,
        actionName = "createandmerge",
        actionSet  = "BesoLUXediting",
        passes     = doc.layers.length - 1;          // same loop count as legacy

    var oldDialogs = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;            // silence normal UI

    /* Remove duplicate action set (26.7 quirk) */
    try { app.unloadAction(actionSet, ""); } catch (_) {}

    for (var i = 0; i < passes; i++)
    {
        try {
            app.doAction(actionName, actionSet);
        }
        catch (err)
        {
            var lastPass = (i === passes - 1);

            if (lastPass && isUserCancel(err)) {
                /* Expected “user-cancel” on final pass → ignore completely. */
                continue;
            }

            /* Any other error, or errors on earlier passes, are real. */
            alert(
                "Action failed on pass " + (i + 1) + " of " + passes +
                "\n\n" + err
            );
            break;
        }
    }

    /* Hide the layer that is now index 0 (legacy behaviour) */
    if (doc.layers.length) { doc.layers[0].visible = false; }

    app.displayDialogs = oldDialogs;   // restore original UI mode
})();
