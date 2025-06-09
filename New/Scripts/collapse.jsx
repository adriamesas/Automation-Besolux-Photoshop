var doc = app.activeDocument;            // current document
executeAction(stringIDToTypeID('collapseAllGroupsEvent'));  // collapse every group
doc.activeLayer.visible = false;         // keep current layer hidden
// doc.activeLayer.visible = true; // uncomment to make the current layer visible again