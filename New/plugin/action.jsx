var actionName = "startautomation";
var actionSet  = "BesoLUXediting";

try {
    app.doAction(actionName, actionSet);
} catch (e) {
    alert("⚠️ Could not run action '" + actionName + "' from set '" + actionSet + "'.\n\n" + e);
}
