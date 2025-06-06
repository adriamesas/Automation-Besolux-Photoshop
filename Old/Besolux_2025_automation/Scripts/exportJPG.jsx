/************************************************************************
*  exportSelectedLayersToJPG.jsx   (focus-switch fix)                   *
************************************************************************/

app.bringToFront();

/* ===== editable user settings ====================================== */
var JPEG_QUALITY      = 12;      // 0-12 (12 = max)
var TRIM_TRANSPARENT  = true;
/* =================================================================== */

function main() {

    if (!isCorrectVersion() || !isOpenDocs()) return;

    var doc = app.activeDocument;
    if (!doc.saved) {
        alert('Please save the PSD first so I know where to create the “JPG” folder.','Save the document',true);
        return;
    }

    var selectedIdx = getSelectedLayerIndices();
    if (selectedIdx.length === 0) {
        alert('No layers are selected. Highlight one or more layers and run again.','Nothing selected',true);
        return;
    }

    /* output folder -------------------------------------------------- */
    var outFolder = new Folder(doc.path + '/JPG');
    if (!outFolder.exists) outFolder.create();

    var jpegOpts = new JPEGSaveOptions();
    jpegOpts.quality           = JPEG_QUALITY;
    jpegOpts.embedColorProfile = true;
    jpegOpts.formatOptions     = FormatOptions.STANDARDBASELINE;

    /* remember the user’s units */
    var oldUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    /* loop over selected layers ------------------------------------- */
    var exported = 0;
    for (var i = 0; i < selectedIdx.length; i++) {
        var layer = activateLayerByIndex(selectedIdx[i]);      // makes it active
        exportSingleLayer(layer, outFolder, jpegOpts);
        exported++;
    }

    /* restore */
    app.preferences.rulerUnits = oldUnits;
    alert('Exported ' + exported + ' JPG file' + (exported>1?'s':'') +
          ' to:\n' + outFolder.fsName, 'Done');
}

/* ===== export one layer =========================================== */
function exportSingleLayer(layer, destFolder, jpegOpts) {

    var src        = app.activeDocument;
    var dupDocName = layer.name;

    /* map the current mode to a NewDocumentMode that Photoshop accepts */
    var newMode = mapDocumentMode(src.mode);
    var initFill = (newMode === NewDocumentMode.RGB || newMode === NewDocumentMode.GRAYSCALE)
                   ? DocumentFill.TRANSPARENT
                   : DocumentFill.WHITE;

    var dupDoc = app.documents.add(
                    src.width, src.height, src.resolution,
                    dupDocName, newMode, initFill);

    app.activeDocument = src;                 // ← NEW: make source frontmost
    layer.duplicate(dupDoc, ElementPlacement.PLACEATBEGINNING);
    app.activeDocument = dupDoc;              // ← NEW: continue work in copy

    if (TRIM_TRANSPARENT && initFill === DocumentFill.TRANSPARENT)
        dupDoc.trim(TrimType.TRANSPARENT, true, true, true, true);

    dupDoc.flatten();

    var outfile = new File(destFolder.fsName + '/' +
                           safeName(layer.name) + '.jpg');

    dupDoc.saveAs(outfile, jpegOpts, true, Extension.LOWERCASE);
    dupDoc.close(SaveOptions.DONOTSAVECHANGES);
}

/* ===== utilities =================================================== */

/* convert DocumentMode → NewDocumentMode, fall back to RGB */
function mapDocumentMode(dm) {
    switch (dm) {
        case DocumentMode.RGB       : return NewDocumentMode.RGB;
        case DocumentMode.CMYK      : return NewDocumentMode.CMYK;
        case DocumentMode.GRAYSCALE : return NewDocumentMode.GRAYSCALE;
        case DocumentMode.BITMAP    : return NewDocumentMode.BITMAP;
        case DocumentMode.LAB       : return NewDocumentMode.LAB;
        default                     : return NewDocumentMode.RGB;
    }
}

/* get Action-Manager indices of selected layers */
function getSelectedLayerIndices() {
    var sel = [];
    var ref = new ActionReference();
    ref.putProperty(stringIDToTypeID('property'), stringIDToTypeID('targetLayers'));
    ref.putEnumerated(stringIDToTypeID('document'),
                      stringIDToTypeID('ordinal'),
                      stringIDToTypeID('targetEnum'));
    var desc = executeActionGet(ref);
    if (desc.hasKey(stringIDToTypeID('targetLayers'))) {
        var list = desc.getList(stringIDToTypeID('targetLayers'));
        for (var i = 0; i < list.count; i++) {
            sel.push(list.getReference(i).getIndex());
        }
    }
    return sel;
}

/* activate a layer via its index, return the DOM layer */
function activateLayerByIndex(idx) {
    var ref = new ActionReference();
    ref.putIndex(charIDToTypeID('Lyr '), idx);
    var desc = new ActionDescriptor();
    desc.putReference(charIDToTypeID('null'), ref);
    desc.putBoolean(charIDToTypeID('MkVs'), false);
    executeAction(charIDToTypeID('slct'), desc, DialogModes.NO);
    return app.activeDocument.activeLayer;
}

/* replace illegal filename chars */
function safeName(s) {
    return s.replace(/[\/\\:\*\?"<>\|]/g, '_');
}

function isCorrectVersion() {
    if (parseInt(version,10) >= 26) return true;
    alert('This script requires Photoshop 26.0 or newer.','Wrong Version',true);
    return false;
}
function isOpenDocs() {
    if (app.documents.length) return true;
    alert('There are no documents open.','Nothing to do',true);
    return false;
}

/* ================= run it ========================================= */
try { main(); }
catch (e) {
    if (e.number !== 8007)
        alert(e + '\non line: ' + e.line, 'Script Error', true);
}
