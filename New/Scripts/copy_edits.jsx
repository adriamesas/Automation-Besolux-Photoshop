/**
 * Step 2 – Copy edited template groups to sibling PSDs
 * ---------------------------------------------------
 * Fix 2025-06-09h – auto-close targets
 *   ▸ Target documents are now **saved and closed** immediately after the
 *     collapse/hide cleanup (no more manual closing).
 *   ▸ The template collapses at the end and stays open.
 *
 * Run from the edited template PSD as before.
 * ------------------------------------------------------------------------- */

app.bringToFront();

function main() {
    if (!app.documents.length) {
        alert("Open the edited template PSD first, then run this script.");
        return;
    }

    var templateDoc = app.activeDocument;
    if (!templateDoc.saved) {
        alert("Please save the template PSD before running the script.");
        return;
    }

    var folder = templateDoc.path;            // Folder object

    //--------------------------------------
    // 1 – Collect editable groups (top-to-bottom order)
    //--------------------------------------
    var groups = [];
    for (var i = 0; i < templateDoc.layerSets.length; i++) {
        var grp = templateDoc.layerSets[i];
        if (grp.name !== "BASE") groups.push(grp);
    }
    if (!groups.length) {
        alert("No edited groups found – everything is named ‘BASE’. Aborting.");
        return;
    }

    //--------------------------------------
    // 2 – Collect sibling PSD files
    //--------------------------------------
    var psdFiles = folder.getFiles("*.psd");
    if (psdFiles.length < 2) {
        alert("No other .psd files found in the folder. Nothing to copy to.");
        return;
    }

    //--------------------------------------
    // 3 – Prep environment
    //--------------------------------------
    var originalUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    //--------------------------------------
    // 4 – Iterate through every sibling PSD
    //--------------------------------------
    for (var f = 0; f < psdFiles.length; f++) {
        // Skip template itself
        if (psdFiles[f].fsName === templateDoc.fullName.fsName) continue;

        var targetDoc = app.open(psdFiles[f]);
        try {
            // Track pasted groups so we can hide them afterward
            var pastedGroups = [];

            // Copy each edited group – reverse order to keep stacking intact
            for (var g = groups.length - 1; g >= 0; g--) {
                app.activeDocument = templateDoc; // source must be frontmost
                var newGroup = groups[g].duplicate(targetDoc, ElementPlacement.PLACEATBEGINNING);
                pastedGroups.push(newGroup);
            }

            // Bring target frontmost again for post-paste housekeeping
            app.activeDocument = targetDoc;

            // 4a – Collapse all layer groups in the Layers panel
            executeAction(stringIDToTypeID('collapseAllGroupsEvent'));

            // 4b – Hide all newly-pasted groups (user can toggle later)
            for (var h = 0; h < pastedGroups.length; h++) {
                pastedGroups[h].visible = false;
            }

            // Save changes
            targetDoc.save();
        } catch (err) {
            alert("Error while processing " + psdFiles[f].name + "\n" + err.message);
        } finally {
            // ✅ Close the target after saving so workspace stays clean
            targetDoc.close(SaveOptions.SAVECHANGES);
        }
    }

    //--------------------------------------
    // 5 – Collapse groups in the template itself
    //--------------------------------------
    app.activeDocument = templateDoc;
    executeAction(stringIDToTypeID('collapseAllGroupsEvent'));

    // Restore prefs
    app.preferences.rulerUnits = originalUnits;

    alert("Step 2 complete! Groups copied, collapsed, hidden, and all target files saved & closed (" + (psdFiles.length - 1) + " total). Template collapsed and remains open.");
}

main();