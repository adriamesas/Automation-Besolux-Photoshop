/*************************************************************************
*  autoRenameFromFilename.jsx – one-click layer renamer                  *
*                                                                        *
*  Expected PSD name pattern:                                            *
*      BRAND_PRODUCT_FABRIC_STYLE_FAMILY-<view#>.psd                     *
*      e.g. MIC_3S_51_F1_NURIA-1.psd                                     *
*                                                                        *
*  Final layer names produced from that example:                         *
*      MIC_3S_51_F1_NURIA1-1                                             *
*      MIC_3S_51_F1_NURIA2-1                                             *
*      …                                                                 *
**************************************************************************/

/* ========== USER SETTINGS (edit if you wish) ========== */
var COUNT_FROM      = 1;    // first layer number
var ZERO_PADDING    = 0;    // 0-no pad, 2→01, 3→001, etc.
var NAME_SEPARATOR  = '';   // between base and number
var SUFFIX_SEPARATOR= '-';  // between number and view suffix
var TOP_TO_BOTTOM   = false;// false = rename bottom→top, true = top→bottom
/* ====================================================== */

function main() {

    /* ---- safety checks ---- */
    if (!isCorrectVersion() || !isOpenDocs()) return;

    /* ---- work out the bits we need from the file-name ---- */
    var info = parseFilename(app.activeDocument.name);          // {base:'MIC_3S_51_F1_NURIA', view:'1'}
    if (!info) {
        alert('File-name does not match expected pattern “…-<digits>.psd”.', 'Cannot parse', true);
        return;
    }

    /* ---- preferences bag passed around helper functions ---- */
    var prefs = {
        basePattern      : info.base,
        viewNumber       : info.view,
        count            : COUNT_FROM,
        zeroPadding      : ZERO_PADDING,
        nameSeparator    : NAME_SEPARATOR,
        suffixSeparator  : SUFFIX_SEPARATOR,
        topToBottom      : TOP_TO_BOTTOM
    };

    /* ---- rename all top-level layers (skipping groups) ---- */
    renameLayers(app.activeDocument, prefs);
}

/* ==================================================================== */
/* --------------------------- Helpers -------------------------------- */
/* ==================================================================== */

function renameLayers(container, prefs) {

    var n = container.layers.length;
    var idxs = prefs.topToBottom ? range(0, n-1, 1) : range(n-1, 0, -1);

    for (var k = 0; k < idxs.length; k++) {
        var i     = idxs[k];
        var layer = container.layers[i];
        var wasVisible = layer.visible;

        if (layer.typename === 'LayerSet') {
            /* ignore groups – comment-out this line if you’d rather recurse
               renameLayers(layer, prefs);   */
            continue;
        }

        layer.name = buildName(prefs);
        prefs.count++;

        /* preserve visibility state */
        if (!wasVisible) layer.visible = false;
    }
}

/* Build “base + sep + number + suffixSep + view” */
function buildName(p) {
    var num = p.count.toString();
    if (p.zeroPadding > 0) {
        num = ('0000000000' + num).slice(-p.zeroPadding);
    }
    var name = p.basePattern + p.nameSeparator + num;
    if (p.viewNumber !== '') {
        name += p.suffixSeparator + p.viewNumber;
    }
    return name;
}

/* Extract “…-digits” just before extension */
function parseFilename(fname) {
    /* strip extension */
    var stem = fname.replace(/\.[^.]+$/,'');          // MIC_3S_51_F1_NURIA-1
    var m    = stem.match(/^(.*)-(\d+)$/);            // [0]=whole, [1]=base, [2]=view#
    if (!m) return null;
    return { base: m[1], view: m[2] };
}

/* Small utilities */
function range(start, end, step) {
    var out = [];
    for (var v = start; step>0 ? v <= end : v >= end; v += step) out.push(v);
    return out;
}

function isCorrectVersion() {
    if (parseInt(version,10) >= 26) return true;
    alert('This script needs Photoshop 26.0 or newer.','Wrong Version',true);
    return false;
}
function isOpenDocs() {
    if (documents.length) return true;
    alert('No documents open.','Nothing to do',true);
    return false;
}

/* ==================================================================== */
/* ------------------------- run it! ---------------------------------- */
/* ==================================================================== */
try { main(); }
catch (e) {
    if (e.number !== 8007)   // ignore “User cancelled”
        alert(e + '\non line: ' + e.line, 'Script Error', true);
}
