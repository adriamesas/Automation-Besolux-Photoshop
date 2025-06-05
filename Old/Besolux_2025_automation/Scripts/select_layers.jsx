var doc = app.activeDocument;
var myLayers = doc.layers;
for(var i = 0; i < myLayers.length; i++){
    //alert(myLayers[i].name);
    if(myLayers[i].kind == LayerKind.NORMAL){
        selectFunc(myLayers[i].name);
        }
    else{
        deselectFunc(myLayers[i].name);
        }
    }

function selectFunc(name){
    try {
        var idslct = charIDToTypeID( "slct" );
        var pepsi = new ActionDescriptor();
        var idnull = charIDToTypeID( "null" );
        var google = new ActionReference();
        var idLyr = charIDToTypeID( "Lyr " );
        google.putName( idLyr, name );
        pepsi.putReference( idnull, google );
        var idselectionModifier = stringIDToTypeID( "selectionModifier" );
        var idselectionModifierType = stringIDToTypeID( "selectionModifierType" );
        var idaddToSelection = stringIDToTypeID( "addToSelection" );
        pepsi.putEnumerated( idselectionModifier, idselectionModifierType, idaddToSelection );
        var idMkVs = charIDToTypeID( "MkVs" );
        pepsi.putBoolean( idMkVs, false );
        executeAction( idslct, pepsi, DialogModes.NO );
    } catch(e) { /* ignore “Select not available” */ }
    }

function deselectFunc(name){
    try {
        var idslct = charIDToTypeID( "slct" );
        var pepsi = new ActionDescriptor();
        var idnull = charIDToTypeID( "null" );
        var google = new ActionReference();
        var idLyr = charIDToTypeID( "Lyr " );
        google.putName( idLyr, name );
        pepsi.putReference( idnull, google );
        var idselectionModifier = stringIDToTypeID( "selectionModifier" );
        var idselectionModifierType = stringIDToTypeID( "selectionModifierType" );
        var idremoveFromSelection = stringIDToTypeID( "removeFromSelection" );
        pepsi.putEnumerated( idselectionModifier, idselectionModifierType, idremoveFromSelection );
        var idMkVs = charIDToTypeID( "MkVs" );
        pepsi.putBoolean( idMkVs, false );
        executeAction( idslct, pepsi, DialogModes.NO );
    } catch(e) { /* ignore */ }
    }