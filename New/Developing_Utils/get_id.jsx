// Script to log Action Set names/IDs and Action names/IDs to a text file on the Desktop

(function() {
    if (typeof $ == 'undefined') {
        $ = {};
    }

    $._ADBE_LIBACTIONS = {
        countActionSets: function() {
            var i = 0;
            while (true) {
                var ref = new ActionReference();
                ref.putIndex(charIDToTypeID("ASet"), i + 1);
                try {
                    var desc = executeActionGet(ref);
                    i++;
                } catch (e) {
                    break;
                }
            }
            return i;
        },

        getActionSetInfo: function(idx) {
            var ref = new ActionReference();
            ref.putIndex(charIDToTypeID("ASet"), idx + 1);
            var desc = executeActionGet(ref);
            var info = {};
            info.name = desc.getString(charIDToTypeID("Nm  "));
            info.count = desc.getInteger(charIDToTypeID("NmbC"));
            info.ID = desc.getInteger(stringIDToTypeID("ID")); // Get the Set ID
            return info;
        },

        getActionInfo: function(setIdx, actIdx) {
            var ref = new ActionReference();
            ref.putIndex(charIDToTypeID("Actn"), actIdx + 1);
            ref.putIndex(charIDToTypeID("ASet"), setIdx + 1);
            var desc = executeActionGet(ref);
            var info = {};
            info.name = desc.getString(charIDToTypeID("Nm  "));
            info.ID = desc.getInteger(stringIDToTypeID("ID")); // Get the Action ID
            return info;
        }
    };

    var log = "Photoshop Actions and Sets IDs:\n\n";
    var numActionSets = $._ADBE_LIBACTIONS.countActionSets();

    for (var i = 0; i < numActionSets; i++) {
        var actionSetInfo = $._ADBE_LIBACTIONS.getActionSetInfo(i);
        log += "Set Name: \"" + actionSetInfo.name + "\", Set ID: " + actionSetInfo.ID + "\n";
        
        for (var j = 0; j < actionSetInfo.count; j++) {
            var actionInfo = $._ADBE_LIBACTIONS.getActionInfo(i, j);
            log += "  Action Name: \"" + actionInfo.name + "\", Action ID: " + actionInfo.ID + "\n";
        }
        log += "\n";
    }

    var desktop = Folder.desktop;
    var logFile = new File(desktop + "/Photoshop_Action_IDs.txt");
    logFile.open("w");
    logFile.write(log);
    logFile.close();

    alert("Action IDs logged to Photoshop_Action_IDs.txt on your Desktop.");

})();