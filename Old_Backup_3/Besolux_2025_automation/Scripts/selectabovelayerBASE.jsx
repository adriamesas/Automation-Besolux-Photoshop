function selectLayerAbove(layerName) {
    var doc = app.activeDocument;
    var baseLayer = doc.layers.getByName(layerName);

    // Find the index of BASE in the layers list
    for (var i = 0; i < doc.layers.length; i++) {
        if (doc.layers[i].name === layerName) {
            // Check if there's a layer above
            if (i > 0) {
                doc.activeLayer = doc.layers[i - 1];
            } else {
                alert("No layer above BASE.");
            }
            break;
        }
    }
}

selectLayerAbove("BASE");
