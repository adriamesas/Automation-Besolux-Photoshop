function main() {
	// user settings
	var prefs = new Object();
	prefs.nameSeparator = '-';  // character to insert between the layer name and number (default: ' ')
	prefs.topToBottom   = false; // rename layers top to bottom (false) or bottom to top (true)

	// prompt for layer name
	prefs.layerPattern = prompt('Enter the view number:\n');

	// rename layers
	if (prefs.layerPattern) {
		addSuffix(activeDocument, prefs);
	}
}

///////////////////////////////////////////////////////////////////////////////
// addSuffix - rename layers, top to bottom, or bottom to top
///////////////////////////////////////////////////////////////////////////////
function addSuffix(ref, prefs) {
	// declare local variables
	var len = ref.layers.length;

	// rename layers top to bottom
	if (prefs.topToBottom) {
		for (var i = 0; i < len; i++) {
			rename();
		}
	}
	// rename layers bottom to top
	else {
		for (var i = len - 1; i >= 0; i--) {
			rename();
		}
	}

	// rename - rename layer
	function rename() {
		var layer = ref.layers[i];
		var vis = layer.visible;

		// check for groups
		if (layer.typename == 'LayerSet') {
	//		addSuffix(layer, prefs);
	return 0;
		}
		// rename layer
		else {
			layer.name = layer.name + prefs.nameSeparator + prefs.layerPattern;
			if (!vis) {
				layer.visible = false;
			}
			prefs.countFrom++;
		}
	}
}

///////////////////////////////////////////////////////////////////////////////
// isCorrectVersion - check for Adobe Photoshop CS (v8) or higher
///////////////////////////////////////////////////////////////////////////////
function isCorrectVersion() {
	if (parseInt(version, 10) >= 26) {
		return true;
	}
	else {
		alert('This script requires Adobe Photoshop CS or higher.', 'Wrong Version', false);
		return false;
	}
}

///////////////////////////////////////////////////////////////////////////////
// isOpenDocs - ensure at least one document is open
///////////////////////////////////////////////////////////////////////////////
function isOpenDocs() {
	if (documents.length) {
		return true;
	}
	else {
		alert('There are no documents open.', 'No Documents Open', false);
		return false;
	}
}

///////////////////////////////////////////////////////////////////////////////
// showError - display error message if something goes wrong
///////////////////////////////////////////////////////////////////////////////
function showError(err) {
	if (confirm('An unknown error has occurred.\n' +
		'Would you like to see more information?', true, 'Unknown Error')) {
			alert(err + ': on line ' + err.line, 'Script Error', true);
	}
}


///////////////////////////////////////////////////////////////////////////////
// test initial conditions prior to running main function
///////////////////////////////////////////////////////////////////////////////
if (isCorrectVersion() && isOpenDocs()) {
	try {
		main();
	}
	catch(e) {
		if (e.number != 8007) { // don't report error on user cancel
			showError(e);
		}
	}
}