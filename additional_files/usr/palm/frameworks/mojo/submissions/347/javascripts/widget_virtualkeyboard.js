/* oskb */
Mojo.Widget.VirtualKeyboard=Class.create({

HI_COLUMNS:10,

/* oskb */
initialize:function(){
this.VIRT_KB_MEDIA_PATH='/media/internal/virtual-keyboard/';
this.VIRT_KB_THEMES_PATH=this.VIRT_KB_MEDIA_PATH + '.themes/';
this.VIRT_KB_SOUNDS_PATH=this.VIRT_KB_MEDIA_PATH + '.sounds/';
this.VIRT_KB_OPEN=0;
this.VIRT_KB_FILTERING_STATE=1;
this.VIRT_KB_CLOSED=2;
this.VIRT_KB_EMPTY=3;

this.SHIFT_OFF=0;
this.SHIFT_ONCE=1;
this.SHIFT_LOCK=2;

this.FUNC_OFF=0;
this.FUNC_ONCE=1;
this.FUNC_LOCK=2;

this.state=this.VIRT_KB_OPEN;
this.shiftState=this.SHIFT_OFF;
this.funcState=this.FUNC_OFF;

this.dragEnabled=false;
this.scrollEnabled=false;
this.templateSuffix="";
this.layout="portrait";
this.textCase="lowercase";
this.charList=[];
this.localizedTable=Mojo.Locale.kbCharacters;
this.localizedTableFull=Mojo.Locale.kbCharactersFull;

this.target=undefined;
this.metaCount=0;
},


/* oskb */
setup:function(){
var model=this.controller.model;

var options = Mojo.parseJSON(palmGetResource(this.VIRT_KB_MEDIA_PATH + '/kb_config.json'));

if (options) {
  this.theme=options.theme;
  this.haptic=options.haptic;
  this.clickFile=options.clickFile;
  this.installed_themes=options.installed_themes;
}

this.funcIdx=20;
this.dragIdx=30;
this.shiftIdx=31;
this.symIdx=35;
this.themeIdx=36;

//this.controller.exposeMethods(['close','isOpen']);
if(this.controller.attributes.target){
this.target=this.controller.get(this.controller.attributes.target);
}else if(model.selectionTarget){
this.target=this.controller.get(model.selectionTarget);
}
this.divPrefix=Mojo.View.makeUniqueId();
//this.currCode=this.controller.model.character;
//if(this.currCode!==undefined){
//this.chorded=true;
//}

if(this.renderWidget(this.controller.model.character)){
this.maybeSetDiv=this.maybeSetDiv.bind(this);
this.generateKeyElement=this.generateKeyElement.bind(this);

this.handleMouseOver=this.handleMouseOver.bindAsEventListener(this);
this.handleMouseUp=this.handleMouseUp.bindAsEventListener(this);
this.handleMouseDown=this.handleMouseDown.bindAsEventListener(this);
this.handleDragStart=this.handleDragStart.bindAsEventListener(this);
this.handleDragEnd=this.handleDragEnd.bindAsEventListener(this);
this.handleDragging=this.handleDragging.bindAsEventListener(this);
this.handleKeyEvent=this.handleKeyEvent.bind(this);
this.handleKeyUpEvent=this.handleKeyUpEvent.bind(this);
this.handleTapEvent=this.handleTapEvent.bind(this);
this.handleFocusChange=this.handleFocusChange.bind(this);
this.handleOrientation=this.handleOrientation.bindAsEventListener(this);
this.controller.listen(this.controller.document,"keydown",this.handleKeyEvent,true);
this.controller.listen(this.controller.document,"keyup",this.handleKeyUpEvent,true);
this.controller.listen(this.controller.document,Mojo.Event.orientationChange,this.handleOrientation,true);
this.controller.listen(this.controller.document,Mojo.Event.dragStart,this.handleDragStart,true);
this.controller.listen(this.controller.document,Mojo.Event.dragEnd,this.handleDragEnd,true);
this.controller.listen(this.controller.document,Mojo.Event.dragging,this.handleDragging,true);
this.controller.listen(this.controller.document,'mouseover',this.handleMouseOver,true);
this.controller.listen(this.controller.document,'mouseup',this.handleMouseUp,true);
this.controller.listen(this.controller.document,'mousedown',this.handleMouseDown,true);
this.controller.listen(this.controller.document,Mojo.Event.tap,this.handleTapEvent,true);
this.controller.listen(this.controller.document,"DOMFocusIn",this.handleFocusChange,true);

//if(this.chorded){

//this.state=this.VIRT_KB_FILTERING_STATE;
//}else{
this.enterOpenState();
//}
/*
this.controller.scene.pushContainer(this.controller.element,this.controller.scene.submenuContainerLayer,
{cancelFunc:this._emptyAndClose.bind(this)});
this.controller.scene.pushCommander(this);
*/
}
},


/* oskb */
cleanup:function(){


this.charPicker=undefined;
this.selectedIndex=undefined;
this.state=this.VIRT_KB_CLOSED;
this.cleanupEventListeners();
},





/* oskb */
cleanupEventListeners:function(){
this.controller.stopListening(this.target,"keydown",this.handleKeyEvent,true);
this.controller.stopListening(this.target,"keyup",this.handleKeyUpEvent,true);
this.controller.stopListening(this.controller.document,Mojo.Event.orientationChange,this.handleOrientation,true);
this.controller.stopListening(this.controller.document,Mojo.Event.dragStart,this.handleDragStart,true);
this.controller.stopListening(this.controller.document,Mojo.Event.dragEnd,this.handleDragEnd,true);
this.controller.stopListening(this.controller.document,Mojo.Event.dragging,this.handleDragging,true);
this.controller.stopListening(this.controller.document,'mouseover',this.handleMouseOver,true);
this.controller.stopListening(this.controller.document,'mouseup',this.handleMouseUp,true);
this.controller.stopListening(this.controller.document,'mousedown',this.handleMouseDown,true);
this.controller.stopListening(this.controller.document,Mojo.Event.tap,this.handleTapEvent,true);
this.controller.stopListening(this.controller.document,"DOMFocusIn",this.handleFocusChange,true);
},


/* oskb */
generateKeyElement:function(img,html,output,index){
  var newElement;

  newElement = this.makeImg(img, output||" ", index);

  if (!newElement) {
    newElement=this.controller.document.createElement('span');
    newElement.innerHTML=html || output;
    newElement.setAttribute("name",index);
    if (html) {
      newElement.innerHTML="--";
    }
  }

  return newElement;
},

/* oskb */
makeImg:function(img,alt,idx){
if (!img) {
  return null;
}

alt=alt||" ";

var e = new Image();
var newImg;
e.src=this.VIRT_KB_THEMES_PATH + this.theme + "/" + img;

newImg=this.controller.document.createElement('img');
newImg.addClassName('kb-img');
newImg.src=this.VIRT_KB_THEMES_PATH + this.theme + "/" + img;
newImg.alt=alt;
newImg.name=idx;
return newImg;
/*
return "<img name='" + idx + "' class='kb-img' src='"+this.VIRT_KB_THEMES_PATH + this.theme + "/" + img + "' alt='" + alt + "'>";
*/
},

/* oskb */
getKeyAttribute:function(t,index,orientation,mode,attr,charList){
  if (!t)
    return undefined;

  if (t[orientation]&&t[orientation][mode]&&t[orientation][mode][attr]!==undefined)
    return t[orientation][mode][attr];

  if (t[orientation]&&t[orientation]['normal']&&t[orientation]['normal'][attr]!==undefined)
    return t[orientation]['normal'][attr];

  if (t['portrait']&&t['portrait'][mode]&&t['portrait'][mode][attr]!==undefined)
    return t['portrait'][mode][attr];

  if (t['portrait']&&t['portrait']['normal']&&t['portrait']['normal'][attr]!==undefined)
    return t['portrait']['normal'][attr];

  if (charList[index][orientation]&&charList[index][orientation][mode]&&charList[index][orientation][mode][attr]!==undefined)
    return charList[index][orientation][mode][attr];

  if (charList[index][orientation]&&charList[index][orientation]['normal']&&charList[index][orientation]['normal'][attr]!==undefined)
    return charList[index][orientation]['normal'][attr];

  if (charList[index]['portrait']&&charList[index]['portrait'][mode]&&charList[index]['portrait'][mode][attr]!==undefined)
    return charList[index]['portrait'][mode][attr];

  if (charList[index]['portrait']&&charList[index]['portrait']['normal']&&charList[index]['portrait']['normal'][attr]!==undefined)
    return charList[index]['portrait']['normal'][attr];

  return undefined;
},

/* oskb */
maybeSetDiv:function(index,keyCode){
  if (keyCode === Mojo.Char.altKey) {
    this.funcIdx = index;
  }
  if (keyCode === Mojo.Char.shift) {
    this.shiftIdx = index;
  }
  if (keyCode === Mojo.Char.sym) {
    this.symIdx = index;
  }
  if (keyCode === 1) {
    this.dragIdx = index;
  }
  if (keyCode === 2) {
    this.themeIdx = index;
  }
},

/* oskb */
updateList:function(o,m){
  var keyDesc;
  var defKeyDesc;
  var display;
  var index;
  var data = {};
  var that=this;
  var orientation = o;
  var mode = m;
  var themeObject=this.themeObject||this.localizedTableFull;
  var newWidth
  var c;
  var div;
  var span;
  var tag;
  var keyCode;
  var background;
  var modes=["normal","function","shift"];
  var that = this;
  var i;
  var length;

  if (this.scrollEnabled)
    length = this.charList.length;
  else
    length = 40;

  for (i=0; i<length; i++) {
    c=that.charList[i];
    div=that.charDivs[i];
    span=c[mode]&&c[mode].span||c.normal.span||1;
    keyCode=c[mode]&&c[mode].keyCode||c.normal.keyCode;
    background=c[mode]&&c[mode].background||c.normal.background;
    that.maybeSetDiv(c.index,keyCode);
    newWidth = span * 10 + "%";

    tag = that.charList[i].normal.div.tagName;
    if (that.charList[i][mode]&&that.charList[i][mode].div) {
      modes.each(function(m){
        if (that.charList[i][m] && that.charList[i][m].div) {
          that.charList[i][m].div.hide();
        }
      });
      that.charList[i][mode].div.show();
    }

    div.setStyle({"background":background||""});
    if (tag && tag === "IMG") {
      div.removeClassName("kb-text");
    }
    else {
      div.addClassName("kb-text");
    }
    div.setStyle({"width":newWidth});
  }

  this.mode=mode;

  if (this.scrollEnabled)
    this.toggleKey(this.symIdx,"lock");
},

/* oskb */
loadTheme:function(){
var themeTable = palmGetResource(this.VIRT_KB_THEMES_PATH + this.theme + '/theme_config.json');
var themeObject;

if (themeTable) {
  this.themeObject = Mojo.parseJSON(themeTable);
}

var that=this;
var orientations=["portrait","landscape"];
var modes=["normal","function","shift"];
var index;
var data;
var t;
var i=0;
var x=0;
var display;
var output;
var img;
var html;
var keydiv;
var keyCode;
var background;
var span;
var normal;
var func;
var shift;
var layout;
this.themeList=[];

if (!this.themeObject) {
  return;
}

  i=0;
  that.defaultList.each(function(c){
    that.testDivs[i].innerHTML="";
    t=that.themeObject[x];
    if (t&&(t.index>=i)&&(t.index<that.defaultList.length)&&(i===t.index)){
      x++;
      if (t[that.layout])
        layout=that.layout;
      else
        layout='portrait';
      if (t[layout]&&t[layout]['normal']) {
        keyCode=t[layout]['normal'].keyCode;
        output=t[layout]['normal'].output;
        display=t[layout]['normal'].display;
        background=t[layout]['normal'].background;
        span=t[layout]['normal'].span;
      }
      normal = {
        keyCode:keyCode || c.normal.keyCode,
        output:output || c.normal.output,
        div:that.generateKeyElement(display&&display.img,display&&display.html,output,i) || c.normal.div,
        ondiv:display&&display.onimg&&that.generateKeyElement(display.onimg,display.html,output,i),
        lockdiv:display&&display.lockimg&&that.generateKeyElement(display.lockimg,display.html,output,i),
        background:background || "",
        span:span || c.normal.span
      }
      if (t[layout]['function']) {
        display=t[layout]['function'].display||{img:null,html:null};
        func = {
          keyCode:t[layout]['function'].keyCode,
          output:t[layout]['function'].output,
          div:that.generateKeyElement(display.img,display.html,t[layout]['function'].output,i),
          background:t[layout]['function'].background,
          span:t[layout]['function'].span
        };
      }
      else if (c['function']) {
        func = {
          output:c['function'].output
        };
      }
      else {
        func = null;
      }
      if (t[layout]['shift']) {
        display=t[layout]['shift'].display||{img:null,html:null};
        shift = {
          keyCode:t[layout]['shift'].keyCode,
          output:t[layout]['shift'].output,
          div:that.generateKeyElement(display.img,display.html,t[layout]['shift'].output,i),
          background:t[layout]['shift'].background,
          span:t[layout]['shift'].span
        };
      }
      else if (c['shift']) {
        shift = {
          output:c['shift'].output
        };
      }
      else {
        shift = null;
      }
    }
    else {
      normal=c.normal;
      func=c['function'];
      shift=c['shift'];
    }

    data = {
      index:i,
      normal:normal,
      'function':func,
      shift:shift
    }
    that.themeList.push(data);
    data.normal.div.hide();
    data.normal.div.id="normal-"+i;
    that.testDivs[i].insert(data.normal.div);
    if (data.normal.ondiv) {
      data.normal.ondiv.hide();
      data.normal.ondiv.id="on-"+i;
      that.testDivs[i].insert(data.normal.ondiv);
    }
    if (data.normal.lockdiv) {
      data.normal.lockdiv.hide();
      data.normal.lockdiv.id="lock-"+i;
      that.testDivs[i].insert(data.normal.lockdiv);
    }
    if (data['function']&&data['function'].div) {
      data['function'].div.hide();
      data['function'].div.id="function-"+i;
      that.testDivs[i].insert(data['function'].div);
    }
    if (data['shift']&&data['shift'].div) {
      data['shift'].div.hide();
      data['shift'].div.id="shift-"+i;
      that.testDivs[i].insert(data['shift'].div);
    }
    i++;
  });
this.charList=this.themeList;
},

/* oskb */
loadTable:function(chr){
var data;
var i=0;
var that=this;
var table;
var keyDesc;
var display;
var html;
var normal;
var func;
var shift;

this.themeList={};
this.defaultList=[];
table=this.localizedTableFull;

table.each(function(c){
  keyDesc=c.portrait.normal;  
  display=keyDesc.display;
  html=display&&display.html;
  normal = {
    keyCode:c.portrait.normal.keyCode,
    output:c.portrait.normal.output,
    div:that.generateKeyElement(null,html,c.portrait.normal.output,i),
    background:c.portrait.normal.background,
    span:c.portrait.normal.span
  };
  if (c.portrait['function']) {
    func = {
      keyCode:c.portrait['function'].keyCode,
      output:c.portrait['function'].output,
      div:that.generateKeyElement(null,html,c.portrait['function'].output,i),
      background:c.portrait['function'].background,
      span:c.portrait['function'].span
    };
  }
  else {
    func = null;
  }
  if (c.portrait['shift']) {
    shift = {
      keyCode:c.portrait['shift'].keyCode,
      output:c.portrait['shift'].output,
      div:that.generateKeyElement(null,html,c.portrait['shift'].output,i),
      background:c.portrait['shift'].background,
      span:c.portrait['shift'].span
    };
  }
  else {
    shift = null;
  }

  data={
    index:i,
    normal:normal,
    'function':func,
    shift:shift,
    keyhtml:html||keyDesc.output,
    subclass:"kb-text"
  };
  that.defaultList.push(data);
  i++;
});
this.charList=this.defaultList;
},

/* oskb */
_setPopupPositions:function(picker){
var top='';
var cursorPos=Mojo.View.getCursorPosition(this.controller.window);
var viewDims=Mojo.View.getViewportDimensions(this.controller.document);
var pickerDims=Mojo.View.getDimensions(picker);
var targetOffset=Mojo.View.viewportOffset(this.target);

/*
console.log("char picker dims = " + Object.toJSON(Mojo.View.getDimensions(this.charPicker)));
console.log("target dims = " + Object.toJSON(Mojo.View.getDimensions(this.target)));
console.log("target style " + this.target.style);
console.log("target top " + this.target.style.top);
console.log("target offsettop " + this.target.offsetTop);
console.log("viewport offset " + Object.toJSON(Mojo.View.viewportOffset(this.target)));

console.log("cursor pos = " + cursorPos.x + ", " + cursorPos.y);
console.log("viewDims = " + viewDims.width + " X " + viewDims.height);
console.log("pickerDimes = " + pickerDims.width + " X " + pickerDims.height);
console.log("pickerDims = " + Object.toJSON(pickerDims));
*/

this.maxVert = top = viewDims.height - pickerDims.height;
if (targetOffset && (targetOffset.top >= top) && (targetOffset.top >= pickerDims.height)) {
  top=targetOffset.top - pickerDims.height;
}
else if (cursorPos && (cursorPos.y >= top) && (cursorPos.y >= pickerDims.height)) {
  top=cursorPos.y - pickerDims.height;
}
top+='px';

Mojo.Log.error("top " + top);
picker.setStyle({'top':top,'left':'0px'});
},


/* oskb */
translateToRow:function(results){

var finished=false;
var result;
var newOffset=0;
var transformedResults=[];

while(!finished){
result={};


result.characters=Mojo.View.render({collection:results.slice(newOffset,newOffset+this.HI_COLUMNS),attributes:{divPrefix:this.divPrefix},template:this.itemTemplate});
newOffset+=this.HI_COLUMNS;
transformedResults.push(result);
if(newOffset>=results.length){
finished=true;
}
}
return transformedResults;
},


  /* oskb */
renderWidget:function(chr){
var data;
var charContent;
var charContentModel;
var pickerContent;
var parent;

this.loadTable(chr);
if(this.charList&&this.charList.length>0){

charContentModel={
divPrefix:this.divPrefix
};

this.templateSuffix = "";
this.layout="portrait";

if (this.controller.stageController) {
  var orientation = this.controller.stageController.getWindowOrientation();
  if (orientation === "left" || orientation === "right") {
    this.templateSuffix = '-ls';
    this.layout="landscape";
  }
}

this.itemTemplate=Mojo.Widget.getSystemTemplatePath('/kbselector/char'+this.templateSuffix),
this.itemsModel={items:this.translateToRow(this.charList)};
this.charPicker=undefined;
pickerContent=Mojo.View.render({object:charContentModel,template:Mojo.Widget.getSystemTemplatePath('/kbselector/charselector'+this.templateSuffix)});

/* NOTE: Our parent must be the scene element in order to use the
 *       Dragger class, with our own drop container so as to not
 *       disrupt the scene's other drop containers.  
parent=Mojo.View.getScrollerForElement(this.target);
if(!parent){
parent=this.controller.scene.sceneElement;
}
*/
parent=this.controller.scene.sceneElement;
if(this.controller.element.parentNode!==parent){
this.controller.reparent(parent);
}
this.controller.element.innerHTML=pickerContent;
/* If we are not set to scroll (i.e. symbol button not pressed), remove 
 * the scroller widget before instantiating */
if (!this.scrollEnabled) {
  this.controller.get(this.divPrefix+"-char-selector").removeAttribute("x-mojo-element");
}
else {
  this.controller.get(this.divPrefix+"-char-selector").addClassName("text-grids");
}

this.charPicker=this.controller.get(this.divPrefix+'-kb-char-selector-div');
this.keyboard=this.controller.get(this.divPrefix+'-char-selector');

this.controller.scene.setupWidget('char-list',
{itemTemplate:Mojo.Widget.getSystemTemplatePath('kbselector/char-selector-row'+this.templateSuffix),renderLimit:30},this.itemsModel);
this.controller.instantiateChildWidgets(this.charPicker);

var that=this;
var data;
this.charDivs=[];
this.testDivs=[];
this.charList.each(function(c){
  data=that.controller.get(that.divPrefix+"-"+c.index);
  that.charDivs.push(data);
  that.testDivs.push(data.descendants()[0]);
});

/* Adjust the width based on the span number */
for (var i=0; i<40; i++) {
  if (this.charList[i]['normal'].span) {
    var newWidth = this.charList[i]['normal'].span * 10 + "%";
    this._getMatching(this.charPicker,i).setStyle({"width":newWidth});
  }
}
this.controller.scene.showWidgetContainer(this.charPicker);
this._setPopupPositions(this.charPicker);

this.selectedIndex=0;
if (this.scrollEnabled) {
  this.controller.get(this.divPrefix+"-char-selector").mojo.revealElement(this.controller.get(this.divPrefix+"-50"));
}

this.loadTheme();
/*
for (var i=0; i<40; i++) {
  this.testDivs[i].innerHTML="";
  if (this.charList[i]['normal']&&this.charList[i]['normal'].div){
    this.charList[i]['normal'].div.hide();
    this.charList[i]['normal'].div.id="normal-"+i;
    this.testDivs[i].insert(this.charList[i]['normal'].div);
  }
  if (this.charList[i]['function']&&this.charList[i]['function'].div){
    this.charList[i]['function'].div.hide();
    this.charList[i]['function'].div.id="function-"+i;
    this.testDivs[i].insert(this.charList[i]['function'].div);
  }
  if (this.charList[i]['shift']&&this.charList[i]['shift'].div){
    this.charList[i]['shift'].div.hide();
    this.charList[i]['shift'].div.id="shift-"+i;
    this.testDivs[i].insert(this.charList[i]['shift'].div);
  }
}
*/

this.updateList(this.layout,"normal");
if(this._selectedIdxElem()){
this.perLine=Math.floor(Element.getWidth(this.charPicker)/Element.getWidth(this._selectedIdxElem()));
}else{
this.perLine=0;
}
return true;
}else{
if(!this.chorded){
this.exitSelector();
return false;
}else{
return true;
}
}
},


/* oskb */
enterOpenState:function(){

this.state=this.VIRT_KB_OPEN;
},


/* oskb */
_maybeRemoveCharpicker:function(){
if(this.charPicker){
if(this.charPicker.parentNode){
Element.remove(this.charPicker);
}
this.charPicker=undefined;
}
},


/* oskb */
enterFilteringState:function(keyCode){

this.state=this.VIRT_KB_FILTERING_STATE;

if(this.currCode!==keyCode){
this.currCode=keyCode;

this._maybeRemoveCharpicker();
this.renderWidget(this.currCode);
}else{

this.advance();
}
},


/* oskb */
handleModelChanged:function(model,what){
Element.show(this.charPicker);
if(Mojo.Char.isValid(this.controller.model.character)){
this.enterFilteringState(this.controller.model.character);
}
},


/* oskb */
_emptyAndClose:function(){
this.state=this.VIRT_KB_EMPTY;
this.close();
},


/* oskb */
close:function(){

if(this.state===this.VIRT_KB_FILTERING_STATE||this.state===this.VIRT_KB_OPEN){
this.exitSelector(this.getEntered());
return;
}

this._safeRemove();
},


/* oskb */
isOpen:function(){
return this.state!==this.VIRT_KB_CLOSED;
},

/* oskb */
isSpecialChar:function(keyCode){
  return(Mojo.Char.isEnterKey(keyCode) || Mojo.Char.isDeleteKey(keyCode) || keyCode === Mojo.Char.spaceBar);
},

/* oskb */
isSupported:function(keyCode){
  return true;
},

/* oskb */
toggleKey:function(index,mode){
  var div = this.charDivs[index];
  var c = this.charList[index];

  if (!div)
    return;

  switch (mode) {
    case "off":
      if (c.normal.ondiv)
        c.normal.ondiv.hide();
      if (c.normal.lockdiv)
        c.normal.lockdiv.hide();
      c.normal.div.show();
      div.removeClassName("kb-char-on");
      div.removeClassName("kb-char-lock");
      break;
    case "on":
      if (c.normal.ondiv) {
        c.normal.div.hide();
        if (c.normal.lockdiv)
          c.normal.lockdiv.hide();
        c.normal.ondiv.show();
      }
      else {
        div.addClassName("kb-char-on");
      }
      break;
    case "lock":
      if (c.normal.lockdiv) {
        c.normal.div.hide();
        if (c.normal.ondiv)
          c.normal.ondiv.hide();
        c.normal.lockdiv.show();
      }
      else {
        div.addClassName("kb-char-lock");
      }
      break;
  }
},

/* oskb */
handleShift:function(){
if (this.shiftState === this.SHIFT_OFF) {
  this.shiftState = this.SHIFT_ONCE;
  this.updateList(this.layout,"shift");
  this.toggleKey(this.shiftIdx,'on');
}
else if (this.shiftState === this.SHIFT_ONCE) {
  this.shiftState = this.SHIFT_LOCK;
  this.toggleKey(this.shiftIdx,'lock');
  return;
}
else {
  this.shiftState = this.SHIFT_OFF;
  this.updateList(this.layout,"normal");
  this.toggleKey(this.shiftIdx,"off");
}
},

/* oskb */
handleFunc:function(){
if (this.funcState === this.FUNC_OFF) {
  this.funcState = this.FUNC_ONCE;
  this.updateList(this.layout,"function");
  this.toggleKey(this.funcIdx,'on');
}
else if (this.funcState === this.FUNC_ONCE) {
  this.funcState = this.FUNC_LOCK;
  this.toggleKey(this.funcIdx,'lock');
  return;
}
else {
  this.funcState = this.FUNC_OFF;
  this.updateList(this.layout,"normal");
  this.toggleKey(this.funcIdx,"off");
}
},

/* oskb */
popupChoose:function(value){
  if (value) {
    this.theme=value;
    this.loadTheme();
    this.funcState=this.FUNC_OFF;
    this.shiftState=this.SHIFT_OFF;
    this.updateList(this.layout,"normal");
    this.toggleKey(this.funcIdx,"off");
    this.toggleKey(this.shiftIdx,"off");
    this.toggleKey(this.symIdx,"off");
    this.toggleKey(this.dragIdx,"off");
    this.toggleKey(this.themeIdx,"off");
  }
},

/* oskb */
selectorChoiceToMenuItem:function(choice){
choice=Mojo.Model.decorate(choice);
choice.command=choice.value;
return choice;
},

/* oskb */
autoCorrect:function(delim){
  var dict = palmGetResource("/etc/palm/autoreplace/" + window.PalmSystem.locale + "/text-edit-autoreplace");
  var prefix;
  var word;

  var curText = this.target.value;
  var newText = curText;

  var tmpTxt = curText.match(/^(.*)[\s]{1}(.*)$/);

  if (!tmpTxt)
  {
    prefix = "";
    word = curText;
  }
  else
  {
    prefix = tmpTxt[1] + ' ';
    word = tmpTxt[2];
  }

  if (word && !this.isAutoCorrectDelim(word))
  {
    var regEx = new RegExp("\\b" + word + "[|](.*)\\n");

    tmpTxt = dict.match(regEx);
    if (tmpTxt)
    {
      newText = prefix + tmpTxt[1];
    }
  }

  return newText;
},

/* oskb */
isAutoCorrectDelim:function(letter){
return false;
var delims = " ,.'\";:?!-";

return (letter && (delims.indexOf(letter) >= 0));
},

/* oskb */
sendKey:function(chr, keydown, callback){
var keyCode=chr[this.mode]&&chr[this.mode].keyCode || chr['normal'].keyCode;
if (callback)
  this.mojoKeyInsert(chr);
  return;
 if (!keyCode || !Mojo.VKBCode[keyCode])
   return;
var request = new Mojo.Service.Request('palm://org.webosinternals.keyboss', {
  method: 'emulateKey',
  parameters: {
    code: Mojo.VKBCode[keyCode],
    keydown: keydown
  },
  onSuccess: function(){Mojo.Log.info("SUCCESS")},
  onFailure: function(payload){Mojo.Log.info("error " + payload.errorText)}
  });
return request;
},

/* oskb */
mojoKeyInsert:function(chr){
var letter;
var keyCode;
var characterVal,selection;
var tagName=this.target.tagName;
var selectionStart,selectionEnd;
var isWebView=false;

if(this.target.mojo&&this.target.mojo.insertStringAtCursor){
isWebView=true;
}

if(chr){
letter=chr[this.mode]&&chr[this.mode].output || chr['normal'].output || "";
keyCode=chr[this.mode]&&chr[this.mode].keyCode || chr['normal'].keyCode;

selection=this.controller.window.getSelection();

/* eg:ac
if (this.isAutoCorrectDelim(letter)) {
	this.correctedText = this.target.value + letter;
	this.target.value = this.autoCorrect(letter);
	if (this.correctedText == this.target.value) {
		this.correctedText = false;
	}
}
*/

if (keyCode === 1 && !this.scrollEnabled) {
  this.dragEnabled = true;
  this.toggleKey(this.dragIdx,'on');
  return;
}
else if (keyCode === 2) {
  if (!this.themeSelector) {
    this.themeSelector=this.controller.scene.popupSubmenu({
    onChoose:this.popupChoose.bind(this),
    placeNear:this.charDivs[this.themeIdx],
    popupClass:'palm-list-selector-popup',
    items:this.installed_themes.map(this.selectorChoiceToMenuItem)
  });
  }
  return;
}
else if (Mojo.Char.isDeleteKey(keyCode)) {
	if (this.correctedText) {
		this.target.value = this.correctedText;
	}
	else {
  	this.controller.document.execCommand("Delete");
	}
}
else if (keyCode === Mojo.Char.altKey) {
  if (this.shiftState !== this.SHIFT_OFF) {
    this.shiftState = this.SHIFT_OFF;
    this.toggleKey(this.shiftIdx,"off");
  }
  this.handleFunc();
  return;
}
else if (keyCode === Mojo.Char.shift) {
  if (this.funcState !== this.FUNC_OFF) {
    this.funcState = this.FUNC_OFF;
    this.toggleKey(this.funcIdx,"off");
  }
  this.handleShift();
  return;
}
else if (this.isSymKey(keyCode)) {
  /* TODO: is this really the only way to dynamically start/stop scrolling? */
  this.scrollEnabled = !this.scrollEnabled;
  this.renderWidget();
  if (this.scrollEnabled) {
    this.toggleKey(this.symIdx,"lock");
  }
  else {
    this.toggleKey(this.symIdx,"off");
  }
  
  return;
}
else if (!this.isSupported(keyCode)) {
  console.log("Char keycode " + keyCode + " not supported (yet)");
  return;
}
else if(selection&&selection.rangeCount>0&&selection.getRangeAt(0)){
this.controller.document.execCommand("insertText",true,letter);
}else if(isWebView&&letter!==null&&letter!==undefined){
this.target.mojo.insertStringAtCursor(letter);
}

/* eg:ac
if (!this.isAutoCorrectDelim(letter)) {
	this.correctedText = false;
}
*/

if (this.isSpecialChar(keyCode)) {
  Mojo.Event.send(this.target,'keydown',{keyCode:keyCode});
  Mojo.Event.send(this.target,'keyup',{keyCode:keyCode});
}
else if(this.target.mojo&&this.target.mojo.setText){
selectionStart=this.target.selectionStart;
selectionEnd=this.target.selectionEnd;
this.target.mojo.setText(this.target.value||this.target.mojo.value);
this.target.selectionStart=selectionStart;
this.target.selectionEnd=selectionEnd;
}


}else{
this.cleanupEventListeners();
this._safeRemove();
this.state=this.VIRT_KB_CLOSED;
}

if(!isWebView){
this.target.focus();
}

if (chr && this.shiftState === this.SHIFT_ONCE && keyCode !== Mojo.Char.shift){
  this.shiftState = this.SHIFT_OFF;
  this.updateList(this.layout,"normal");
  this.toggleKey(this.shiftIdx,"off");
}
if (chr && this.funcState === this.FUNC_ONCE && keyCode !== Mojo.Char.altKey){
  this.funcState = this.FUNC_OFF;
  this.updateList(this.layout,"normal");
  this.toggleKey(this.funcIdx,"off");
}
},

/* oskb */
exitSelector:function(chr){
  if (chr) {
    var blah = this.sendKey(chr, true, this.mojoKeyInsert);
    var foo = this.sendKey(chr, false, null);
  }
  else {
    this.mojoKeyInsert(chr);
  }
},

/* oskb */
_safeRemove:function(){
this.controller.scene.removeContainer(this.controller.element);
if(this.controller.element&&this.controller.element.parentNode){
Element.remove(this.controller.element);
}
},


/* oskb */
_insertChar:function(origValue,letter,start,end){
var value='';
if(origValue){
value=origValue.substring(0,start);
value+=letter;
value+=origValue.substring(end,origValue.length);
}else{
value=letter;
}
return value;
},


/* oskb */
advance:function(){
var old=this._selectedIdxElem();
var newElm;

if(this.selectedIndex+1>this.charList.length-1){
this.selectedIndex=0;
}else{
this.selectedIndex++;
}

/* oskb */
newElm=this._selectedIdxElem();
this._updateSelected(old,newElm);
},


/* oskb */
retreat:function(){
var old,newElm;

old=this._selectedIdxElem();
if(this.selectedIndex===0){
this.selectedIndex=this.charList.length-1;
}else{
this.selectedIndex=this.selectedIndex-1;
}
newElm=this._selectedIdxElem();
this._updateSelected(old,newElm);
},


/* oskb */
_getMatching:function(element,query){
if(!element){
return;
}
return element.querySelector("[name='"+query+"']");
},


/* oskb */
_updateSelected:function(oldSelection,newSelection){
var node;
if(oldSelection){
node=this._getMatching(oldSelection,oldSelection.getAttribute("name"));
if(node){
node.removeClassName("selected-char");
}
}
if(newSelection){
node=this._getMatching(newSelection,newSelection.getAttribute("name"));
if(node){
node.addClassName("selected-char");
}
}
},



/* oskb */
moveDown:function(){
var old,newElm;
if(this.selectedIndex+this.perLine<this.charList.length){
old=this._selectedIdxElement();
this.selectedIndex=this.selectedIndex+this.perLine;
newElm=this._selectedIdxElement();
this._updateSelected(old,newElm);
}
},


/* oskb */
moveUp:function(){
var old,newElm;
if(this.selectedIndex-this.perLine>=0){
old=this._selectedIdxElem();
this.selectedIndex=this.selectedIndex-this.perLine;
newElm=this._selectedIdxElem();
this._updatedSelected(old,newElm);
}
},


/* oskb */
updatePosition:function(key){
switch(key){
case Mojo.Char.leftArrow:
this.retreat();
break;
case Mojo.Char.upArrow:
this.moveUp();
break;
case Mojo.Char.rightArrow:
this.advance();
break;
case Mojo.Char.downArrow:
this.moveDown();
break;
default:
break;
}

if(this.charPicker){
this.controller.get(this.divPrefix+'-char-selector').mojo.revealElement(this._selectedIdxElem());
}
},



/* oskb */
handleKeyUpEvent:function(event){
if (event.keyCode === Mojo.Char.metaKey) {
  event.stop();
}
 return;
//if (event.keyCode === Mojo.Char.metaKey) {
 // console.log("leave");
  //this.exitSelector();
//}
},


/* oskb */
show:function(target){
  Mojo.Log.error("show " + target);
  Mojo.Log.error("textfield");
  this.charPicker.show();
  this.hidden = false;  
  this._setPopupPositions(this.charPicker);
},

/* oskb */
hide:function(){
  this.charPicker.hide();
  this.hidden = true;  
},

/* oskb */
handleKeyEvent:function(event){
  if (event.keyCode === Mojo.Char.metaKey) {
    event.stop();
    Mojo.Log.error("metaCount " + this.metaCount);
    this.metaCount++;
    if (this.metaCount === 1) {
      this.metaTimer=window.setTimeout(function(){this.metaCount=0;}.bind(this), 600);
    }
    else if (this.metaCount === 2) {
      if (this.hidden) {
        this.show(event.target);
      }
      else {
        this.hide();
      }
    }
  }
},

/* oskb */
maybeChangeLayout:function(){
  var orientation = this.controller.stageController.getWindowOrientation();
  switch (this.layout) {
    case "portrait":
      if (orientation==="left" || orientation==="right") {
        this.renderWidget();
      }
    break;
    case "landscape":
      if (orientation==="up" || orientation==="down") {
        this.renderWidget();
      }
    break;
  }
},

/* oskb */
playClick:function(){
var request = new Mojo.Service.Request('palm://com.palm.crotest', {
    method: 'PlaySound',
    parameters: {"file":this.VIRT_KB_SOUNDS_PATH + this.clickFile}
    });
},

/* oskb */
vibrate:function(){ 
var request2 = new Mojo.Service.Request('palm://com.palm.vibrate', {
    method: 'vibrate',
    parameters: {"period": 0, "duration": this.haptic}
    });
},

/* oskb */
handleOrientation:function(event){
/*TODO: I'm not sure why, but every change I get two events, back to back.
 *      For now just ignore the 2nd orient event */
if (this.ignoreSecond) {
  this.ignoreSecond=false;
  return;
}
else {
  this.ignoreSecond=true;
  this.maybeChangeLayout();
}
},

/* oskb */
handleMouseDown:function(event){
if (this.scrollEnabled || this.dragEnabled) {
  return;
}

if (this.isInKeyboard(event.target)) {
  event.stop();
  this.stopScroll=true;
  if (this.haptic > 0 && this.haptic <= 100) {
    this.vibrate();
  }

  var name = event.target.getAttribute('name');
  Mojo.Log.info("key " + name);
  /*
  if (!name || name === 'undefined') {
    name = event.target.parentNode.getAttribute('name');
  }
  */

  this.preview=this.charDivs[name];
  if (this.preview) {
    this.preview.addClassName("kb-selected-char");
  }
}
},

/* oskb */
handleMouseOver:function(event){
if (this.scrollEnabled || this.dragEnabled) {
  return;
}

if (this.preview && (this.preview !== event.target)) {
  this.preview.removeClassName("kb-selected-char");
  this.preview=undefined;
}

if (this.isInKeyboard(event.target)) {
  event.stop();
  this.stopScroll=true;
  var name = event.target.getAttribute('name');
  /*
  if (!name || name === 'undefined') {
    name = event.target.parentNode.getAttribute('name');
  }
  */

  this.preview=this.charDivs[name];
  /*
  this.preview=this.controller.get(this.divPrefix+"-"+name);
  */
  if (this.preview) {
    this.preview.addClassName("kb-selected-char");
  }
}
},

/* oskb */
handleMouseUp:function(event){
this.stopScroll=false;
if (this.scrollEnabled || this.dragEnabled) {
  return;
}

if (this.isInKeyboard(event.target)) {
  event.stop();
  if (this.clickFile) {
    this.playClick();
  }

  if (this.preview) {
    this.preview.removeClassName.bind(this.preview).defer("kb-selected-char");
    this.preview=undefined;
  }

  if (this.state === this.VIRT_KB_OPEN){
    this.exitSelector(this.getSelected(event.target));
  }
}

if (this.themeSelector)
  this.themeSelector=undefined;
},

/* oskb */
handleFocusChange:function(event){
  Mojo.Log.error("FOCUS CHANGE TO " + event.target);
  this.target=event.target;
  if (!Mojo.View.isTextField(event.target))
    this.hide();
},

/* oskb */
handleTapEvent:function(event){
if (!this.scrollEnabled) {
  return;
}

if (this.state === this.VIRT_KB_OPEN){
  if (this.isInKeyboard(event.target)) {
    event.stop();
    var name = event.target.getAttribute('name');
    /*
    if (!name || name === 'undefined') {
      name = event.target.parentNode.getAttribute('name');
    }
    */

    this.preview=this.charDivs[name];
    /*
    this.preview=this.controller.get(this.divPrefix+"-"+name);
    */
    if (this.preview) {
      this.preview.addClassName("kb-selected-char");
    }
    this.exitSelector(this.charList[name]);
    if (this.preview) {
      this.preview.removeClassName.bind(this.preview).defer("kb-selected-char");
    }
  }
}

if (this.themeSelector)
  this.themeSelector=undefined;
},

/* oskb */
handleDragStart:function(event){
if (this.dragEnabled && !this.scrollEnabled && this.isInKeyboard(event.target)) {
  /* Set the keyboard absolutely positioned inside the charpicker, and then set the charpicker to be fixed 
   * to the entire viewport so it can be used as the drop container */
  this.keyboard.setStyle({"position":"absolute","top":this.charPicker.offsetTop+'px'});
  this.charPicker.setStyle({"position":"fixed","width":"100%","height":"100%","left":"0px","top":"0px"});

  Mojo.Drag.setupDropContainer(this.charPicker,this);
  Mojo.Drag.startDragging(this.controller.scene,this.keyboard,event.down,
  {
    preventHorizontal:true,
    preventDropReset:true,
    draggingClass: "kb-drag",
    maxVerticalPixel: this.maxVert,
    minVerticalPixel: 0
  });
  event.stop();
}
else if (this.stopScroll) {
  event.stop();
}
},

/* oskb */
handleDragging:function(event){
  if (this.stopScroll) {
    event.stop();
  }
},

/* oskb */
handleDragEnd:function(event){
if (this.dragEnabled && !this.scrollEnabled) {
  /* Done dragging, so set the charpicker that was being used as the drop container back down
   * to the actual keyboard size, and set the keyboard back to fit exactly inside *
   * TODO: Store keyboard size from css rather than hard-coded here */
  this.charPicker.setStyle({"width":"320px","height":"264px","top":this.keyboard.offsetTop+'px'});
  this.keyboard.setStyle({"top":"0px"});
  this.dragEnabled = false;
  this.toggleKey(this.dragIdx,"off");
}
else if (this.stopScroll) {
  event.stop();
}
},

/* oskb */
dragDrop:function() {
// Dummy function to avoid error/warnings from Dragger           
},

/* oskb */
getEntered:function(){
return this.charList[this.selectedIndex];
},

/* oskb */
getSelected:function(target){
var chr=target.getAttribute('name');

return this.charList[chr];
},






/* oskb */
isDirectionalKey:function(key){
if(key==Mojo.Char.leftArrow||key==Mojo.Char.upArrow||key==Mojo.Char.rightArrow||key==Mojo.Char.downArrow){
return true;
}
return false;
},


/* oskb */
isInCharPicker:function(target){
if(!this.charPicker){
return;
}
if(target.id==this.charPicker.id||Element.up(target,'div#'+this.charPicker.id)){
return true;
}
return false;
},

/* oskb */
isInKeyboard:function(target){
if(!this.keyboard){
return;
}
if(Element.up(target,'div#'+this.keyboard.id)){
return true;
}
return false;
},


/* oskb */
isSymKey:function(keyCode){
return keyCode===Mojo.Char.sym;
},


/* oskb */
_selectedIdxElem:function(){
return this.charDivs[this.selectedIndex];
                   /*
return this.controller.get(this.divPrefix+"-"+this.selectedIndex);
*/
},


/* oskb */
handleCommand:function(commandEvent){
if(commandEvent.type===Mojo.Event.back&&(this.state!==this.VIRT_KB_CLOSED&&this.state!==this.VIRT_KB_EMPTY)){
this.exitSelector();
Event.stop(commandEvent);
}
}
});

Mojo.VKBCode = [
  0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0
  ];


Mojo.VKBCode[Mojo.Char.q] = 16;
Mojo.VKBCode[Mojo.Char.w] = 17;
Mojo.VKBCode[Mojo.Char.e] = 18; Mojo.VKBCode[Mojo.Char.one] = 18;
Mojo.VKBCode[Mojo.Char.r] = 19; Mojo.VKBCode[Mojo.Char.two] = 19;
Mojo.VKBCode[Mojo.Char.t] = 20; Mojo.VKBCode[Mojo.Char.three] = 20;
Mojo.VKBCode[Mojo.Char.y] = 21;
Mojo.VKBCode[Mojo.Char.u] = 22;
Mojo.VKBCode[Mojo.Char.i] = 23;
Mojo.VKBCode[Mojo.Char.o] = 24;
Mojo.VKBCode[Mojo.Char.p] = 25;

Mojo.VKBCode[Mojo.Char.a] = 30;
Mojo.VKBCode[Mojo.Char.s] = 31;
Mojo.VKBCode[Mojo.Char.d] = 32; Mojo.VKBCode[Mojo.Char.four] = 32;
Mojo.VKBCode[Mojo.Char.f] = 33; Mojo.VKBCode[Mojo.Char.five] = 33;
Mojo.VKBCode[Mojo.Char.g] = 34; Mojo.VKBCode[Mojo.Char.six] = 34;
Mojo.VKBCode[Mojo.Char.h] = 35;
Mojo.VKBCode[Mojo.Char.j] = 36;
Mojo.VKBCode[Mojo.Char.k] = 37;
Mojo.VKBCode[Mojo.Char.l] = 38;
Mojo.VKBCode[Mojo.Char.backspace] = 14;

Mojo.VKBCode[Mojo.Char.altKey] = 100;
Mojo.VKBCode[Mojo.Char.z] = 44;
Mojo.VKBCode[Mojo.Char.x] = 45; Mojo.VKBCode[Mojo.Char.seven] = 45;
Mojo.VKBCode[Mojo.Char.c] = 46; Mojo.VKBCode[Mojo.Char.eight] = 46;
Mojo.VKBCode[Mojo.Char.v] = 47; Mojo.VKBCode[Mojo.Char.nine] = 47;
Mojo.VKBCode[Mojo.Char.b] = 48;
Mojo.VKBCode[Mojo.Char.n] = 49;
Mojo.VKBCode[Mojo.Char.m] = 50;
Mojo.VKBCode[Mojo.Char.comma] = 51;
Mojo.VKBCode[Mojo.Char.enter] = 28;

Mojo.VKBCode[Mojo.Char.shift] = 42;
 Mojo.VKBCode[Mojo.Char.zero] = 11;
Mojo.VKBCode[Mojo.Char.spaceBar] = 57;
Mojo.VKBCode[Mojo.Char.period] = 52;
Mojo.VKBCode[Mojo.Char.sym] = 246;
