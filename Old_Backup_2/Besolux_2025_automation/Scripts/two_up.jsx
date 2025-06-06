var doc = app.activeDocument; //references current document
var index = 0;
for(var i = 0; i < doc.layers.length; i++){
  if(doc.activeLayer.name === doc.layers[i].name){
    index = i - 2;
    if(index < 0)
      index = 0;
    break;
  }
}
doc.activeLayer = doc.layers[index]; 
doc.activeLayer.visible = false; //keeps layer invisible