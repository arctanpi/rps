"use strict";

var colours = {
  2: ["#0036EA", "#FF00D8"],
  3: ["#D81B60","#FFC107","#1E88E5"],
  4: ["#B200FF","#FF006E","#FFD800","#0026FF"],
  5: ["#FFFA84","#A584FF","#84D4FF","#FF84DC","#84FF8E"],
  6: ['#FF1717', '#FE9D2A', '#FCE21C', '#188630', '#201EEB', '#A70DFB'],
  7: ['#FFCCCC', '#FFEACC', '#FFFECC', '#C7F5C4', '#C4F0F4', '#C9C4F4', '#F6C6E6'],
}
var xSize = 50;
var ySize = 50;
var colors = 3;
var flipThreshold = 3;  // inclusive
var flipLimit = 8;      // inclusive
var currentGame = {};
var displayVorts = true;
var displayVortLocs = false;
var displayVortPath = false;
var paintDown = false;
var brushColor = false;
var brushSize;
var clipboard = false;


var $ = function (x) {return document.getElementById(x);}
var displayElements = function () {
  displayOrRemoveElements(true, arguments);
}
var removeElements = function (elem) {
  displayOrRemoveElements(false, arguments)
}
var displayOrRemoveElements = function (display, elemList) {
  if (typeof elemList[0] === 'object' && elemList[0].length) {
    elemList = elemList[0];
  }
  for (var i = 0; i < elemList.length; i++) {

    if (typeof elemList[i] === "string") {
      elemList[i] = $(elemList[i])
    }
    if (elemList[i] && typeof elemList[i] === "object") {
      if (display) {
        elemList[i].classList.remove('removed');
      } else {
        elemList[i].classList.add('removed');
      }
    } else {
      console.error('not an element');
    }
  }
}
var destroyElement = function (elem) {
  if (elem && elem.parentNode) {
    elem.parentNode.removeChild(elem);
  }
}
var destroyAllChildrenOfElement = function (elem) {
  var children = elem.childNodes;
  while (children.length !== 0) {
    destroyElement(children[0]);
  }
}

var mod = function (a, n) {
  var r = a+n;
  if (r < 0) {
    return mod(r,n);
  } else {
    return r % n;
  }
}
var getCoords = function (e) {  // from mouse position over canvas
  var rect = e.target.getBoundingClientRect();
  var xCoord = Math.floor((e.clientX - rect.left) / (rect.width / xSize));
  var yCoord = Math.floor((e.clientY - rect.top) / (rect.height / ySize));
  return {x:xCoord, y:yCoord};
}
var getArea = function (centerCoords, width, height, wrap, excludeCenter) {
  var arr = [];
  for (var i = 0; i < width; i++) {
    var x = (centerCoords.x - Math.floor((width-1)/2)) + i;
    if (wrap) {x = mod(x,xSize);}
    if (x >= 0 && x < xSize) {
      for (var j = 0; j < height; j++) {
        var y = (centerCoords.y - Math.floor((height-1)/2)) + j;
        if (wrap) {y = mod(y,ySize);}
        if (y >= 0 && y < ySize) {
          if (!excludeCenter || (centerCoords.x !== x || centerCoords.y !== y)) {
            arr.push([x,y]);
          }
        }
      }
    }
  }
  return arr;
}

var startPaint = function (e) {
  if (brushColor === false) {return;}
  //
  var coords = getCoords(e);
  var area = getArea(coords, brushSize[0], brushSize[1], $('brush-wrap-checkbox').checked);
  if (brushColor === "copy") {
    //
    var i = 0;
    clipboard = [];
    while (area[i]) {
      clipboard.push([]);
      var curX = area[i][0];
      while (area[i] && curX === area[i][0]) {
        var spotColor = currentGame.frames[currentGame.currentFrame][area[i][0]][area[i][1]];
        clipboard[clipboard.length-1].push(spotColor);
        i++;
      }
    }
    refreshClipboardDisplay();
    //
  } else if (brushColor === "paste") {
    //
    applyPaint(area, false);
    //
  } else {
    paintDown = coords;
    applyPaint(area, brushColor);
  }
}
var mouseMove = function (e, cnvsElm) {
  var ctx = cnvsElm.getContext('2d');
  if (paintDown) {
    ctx.clearRect(0, 0, cnvsElm.width, cnvsElm.height);
    var coords = getCoords(e);
    if (coords.x !== paintDown.x || coords.y !== paintDown.y) {
      paintDown = coords;
      applyPaint(getArea(coords, brushSize[0], brushSize[1], $('brush-wrap-checkbox').checked), brushColor);
    }
  } else if (brushColor !== false) {
    ctx.clearRect(0, 0, cnvsElm.width, cnvsElm.height);
    //
    var hoveredUpon = getArea(getCoords(e), brushSize[0], brushSize[1], $('brush-wrap-checkbox').checked);

    var xUnit = cnvsElm.width / xSize;
    var yUnit = cnvsElm.height / ySize;

    for (var i = 0; i < hoveredUpon.length; i++) {
      ctx.beginPath();
      ctx.fillStyle = 'rgb(80, 80, 80, .75)';
      ctx.fillRect(xUnit*hoveredUpon[i][0],yUnit*hoveredUpon[i][1],xUnit,yUnit);
    }
  }
}
var stopPaint = function () {
  paintDown = false;
}
var mouseLeave = function (elem) {
  elem.getContext('2d').clearRect(0, 0, $('overlay-canvas').width, $('overlay-canvas').height);
}

var applyPaint = function (coordList, color) {
  var grid = currentGame.frames[currentGame.currentFrame];
  if (color !== false) {
    for (var i = 0; i < coordList.length; i++) {
      grid[coordList[i][0]][coordList[i][1]] = color;
    }
  } else {
    var ref = {}
    for (var i = 0; i < coordList.length; i++) {
      ref[coordList[i]] = true;
    }
    for (var i = 0; i < clipboard.length; i++) {
      var x = mod(coordList[0][0]+i, xSize);
      for (var j = 0; j < clipboard[i].length; j++) {
        var y = mod(coordList[0][1]+j, ySize);
        if (ref[x+","+y]) {
          grid[x][y] = clipboard[i][j];
        }
      }
    }
  }
  initGame(grid);
}

var importClipboard = function () {
  clipboard = JSON.parse($('clipboard-input').value);
  refreshClipboardDisplay();
}
var refreshClipboardDisplay = function () {
  displayElements('pasteBrushBtn', 'clipboard-wrapper', 'clipboard-button-wrapper');

  $('clipboard-input').value = JSON.stringify(clipboard);
  //
  if (true) {

  }
  $('clipboard-canvas').width = Math.min(($('main-canvas').getBoundingClientRect().width / xSize) * clipboard.length, 420);
  $('clipboard-canvas').height = Math.min(($('main-canvas').getBoundingClientRect().height / ySize)* clipboard[0].length, 420);
  drawGrid($('clipboard-canvas'), clipboard, getVortsAndString(clipboard).vorts, true);
}

var changeBrushSize = function (dir) {
  if (dir === "x") {
    brushSize[0] = $('brush-size-input-x').value;
    brushSize[1] = $('brush-size-input-y').value;
  } else if (dir === 'y') {
    brushSize[0] = $('brush-size-input-x').value;
    brushSize[1] = $('brush-size-input-y').value;
  } else {
    brushSize = [$("brush-size-input").value, $("brush-size-input").value];
  }
}
changeBrushSize();
var selectPaint = function (color, btn) {
  stopContinuousPlay();
  deselectPaint();
  brushColor = color;
  displayElements('overlay-canvas')
  btn.classList.add('selected');
  if (color === "paste") {
    brushSize[0] = clipboard.length;
    brushSize[1] = clipboard[0].length;
    $('brush-size-input').disabled = true;
    $('brush-size-input-x').disabled = true;
    $('brush-size-input-y').disabled = true;
  }
}
var deselectPaint = function () {
  brushColor = false;
  $('brush-size-input').disabled = false;
  $('brush-size-input-x').disabled = false;
  $('brush-size-input-y').disabled = false;
  removeElements('overlay-canvas');
  var buttons = $("color-container").childNodes;
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove('selected');
  }
  $('copyBrushBtn').classList.remove('selected');
  $('pasteBrushBtn').classList.remove('selected');
}
var setPaintContainer = function () {
  destroyAllChildrenOfElement($("color-container"));
  for (var i = 0; i < colours[colors].length; i++) {
    var colorButton = document.createElement("button");
    colorButton.setAttribute('class', 'color-button');
    colorButton.style.background = colours[colors][i];
    (function (index, btn) {
      colorButton.onclick = function () {
        selectPaint(index, btn);
      }
      colorButton.ondblclick = function () {
        console.log(btn, 'make this pop open a thing to change the paint color');
      }
    })(i, colorButton);
    $("color-container").appendChild(colorButton);
  }
}

var rotateGrid = function (isClipboard) {  // clockwise, 1/4 turn
  if (isClipboard) {
    var oldG = clipboard;
  } else {
    var oldG = currentGame.frames[currentGame.currentFrame];
  }
  var newG = [];

  for (var i = 0; i < oldG[0].length; i++) {
    newG.push([]);
  }

  for (var i = 0; i < oldG.length; i++) {
    for (var j = 0; j < oldG[i].length; j++) {
      newG[(oldG[i].length-1) -j][i] = oldG[i][j];
    }
  }

  if (isClipboard) {
    clipboard = newG;
    refreshClipboardDisplay();
  } else {
    initGame(newG);
  }
}
var reflectGrid = function (isClipboard) {  // left/right
  if (isClipboard) {
    var oldG = clipboard;
  } else {
    var oldG = currentGame.frames[currentGame.currentFrame];
  }
  var newG = [];

  for (var i = 0; i < oldG.length; i++) {
    newG.push([]);
  }

  for (var i = 0; i < oldG.length; i++) {
    for (var j = 0; j < oldG[i].length; j++) {
      newG[(oldG.length-1) -i][j] = oldG[i][j];
    }
  }

  if (isClipboard) {
    clipboard = newG;
    refreshClipboardDisplay();
  } else {
    initGame(newG);
  }
}
var translateGrid = function (delX, delY, isClipboard) {
  if (isClipboard) {
    var oldG = clipboard;
  } else {
    var oldG = currentGame.frames[currentGame.currentFrame];
  }
  var newG = [];

  for (var i = 0; i < oldG.length; i++) {
    newG.push([]);
  }

  for (var i = 0; i < oldG.length; i++) {
    for (var j = 0; j < oldG[i].length; j++) {
      newG[mod(i+delX, oldG.length)][mod(j+delY, oldG[i].length)] = oldG[i][j];
    }
  }

  if (isClipboard) {
    clipboard = newG;
    refreshClipboardDisplay();
  } else {
    initGame(newG);
  }
}
var colorRotateGrid = function (isClipboard) {
  if (isClipboard) {
    var grid = clipboard;
  } else {
    var grid = currentGame.frames[currentGame.currentFrame];
  }

  for (var i = 0; i < grid.length; i++) {
    for (var j = 0; j < grid[i].length; j++) {
      grid[i][j] = mod(grid[i][j] + 1, colors);
    }
  }

  if (isClipboard) {
    clipboard = grid;
    refreshClipboardDisplay();
  } else {
    initGame(grid);
  }
}

var getVortsAndString = function (grid) {
  // returns both grid data crunched down to a string like 0120210, and an array of vortices
  var gridStr = "";
  var vorts = [];

  for (var i = 0; i < grid.length; i++){
    for (var j = 0; j < grid[i].length; j++) {
      gridStr += grid[i][j]
      if (colors === 3 || colors === 4) {
        if (isVort(grid,i,j)) {
          vorts.push([i,j])
        }
      }
    }
  }
  return {vorts:vorts, gridStr: gridStr}
}

var isVort = function (grid,x,y) {
  var ref = {};
  for (var i = 0; i < colors; i++) {
    ref[i] = false;
  }

  var adjValues = vortNb(grid, x, y, grid.length, grid[0].length);
  for (var i = 0; i < adjValues.length; i++) {
    ref[adjValues[i]] = true;
  }

  var isVortex = true;
  for (var i = 0; i < colors; i++) {
    if (ref[i] === false) {
      isVortex = false;
      break;
    }
  }

  return isVortex;
}

var vortNb = function (grid, x,y,xMax,yMax) {      // returns values of cells around potential vortex
  return [ grid[mod(x-1, xMax)][mod(y-1, yMax)],
           grid[mod(x, xMax)][mod(y-1, yMax)],
           grid[mod(x-1, xMax)][mod(y, yMax)],
           grid[mod(x, xMax)][mod(y, yMax)]
         ]
}

var nextGrid = function (grid) {
  var new_grid = [];

  for (var i = 0; i < grid.length; i++){
    var new_row = [];
    for (var j = 0; j < grid[i].length; j++){
      new_row.push(updateCell(grid,i,j));
    }
    new_grid.push(new_row)
  }

  return new_grid
}

var updateCell = function (grid,i,j) {
  // updates cells according to the rule:
  // let n be the color state of a cell
  // let x be the number of neighbours of color n+1 a cell has
  // a cell of n flips to n+1 iff 'flipThreshold' >= x >= flipLimit

  var neighbours = getArea({x:i, y:j}, 3, 3, true, true);
  var val = grid[i][j];
  var val_enemy = mod(val+1, colors);
  var count = 0;
  for (var i = 0; i < 8; i++) {
    if (grid[neighbours[i][0]][neighbours[i][1]] === val_enemy) {
      count += 1;
    }
  }

  if (count >= flipThreshold && count <= flipLimit) {
    var new_val = val_enemy
  } else {
    var new_val = val
  }
  return new_val
}

var drawMainGrid = function () {
  drawGrid($('main-canvas'), currentGame.frames[currentGame.currentFrame], currentGame.vorts[currentGame.currentFrame]);
}

var drawGrid = function (cnvsElm, grid, vorts, isClipBoardCanvas) {
  var ctx = cnvsElm.getContext('2d');

  var xUnit = cnvsElm.width / grid.length;
  var yUnit = cnvsElm.height / grid[0].length;
  //
  for (var i = 0; i < grid.length; i++) {
    for (var j = 0; j < grid[i].length; j++) {
      ctx.beginPath();
    	ctx.fillStyle = colours[colors][grid[i][j]];
    	ctx.fillRect(xUnit*i,yUnit*j,xUnit,yUnit);
    }
  }
  if (vorts) {
    if (displayVorts) {
      var radius = Math.min(xUnit, yUnit)/3.5;
      for (var i = 0; i < vorts.length; i++) {
        if (!isClipBoardCanvas) {
          drawVortex(xUnit*vorts[i][0], yUnit*vorts[i][1], radius);
        } else {
          if (vorts[i][0] !== 0 && vorts[i][1] !== 0) {
            drawVortex(xUnit*vorts[i][0], yUnit*vorts[i][1], radius, isClipBoardCanvas);
          }
        }
        if (!isClipBoardCanvas) {
          // draw a second(and possibly 3rd or 4th) vortex to represent vortices that fall on the wrapped edges
          if (vorts[i][0] == 0) {
            drawVortex(cnvsElm.width, yUnit*vorts[i][1], radius);
          }
          if (vorts[i][1] == 0) {
            drawVortex(xUnit*vorts[i][0], cnvsElm.height, radius);
          }
          if (vorts[i][1] == 0 && vorts[i][0] == 0) {
            drawVortex(cnvsElm.width, cnvsElm.height, radius);
          }
        }
      }
    }
    if (displayVortPath) {
      var previousVorts = currentGame.vorts[currentGame.currentFrame-1];
      if (previousVorts && previousVorts.length) {
        var vortCtx = $('vortex-canvas').getContext('2d');
        vortCtx.lineWidth = Math.min(xUnit, yUnit)/10;
        for (var i = 0; i < vorts.length; i++) {
          var x0 = vorts[i][0];
          var y0 = vorts[i][1];
          var areaList = getArea({x:x0, y:y0}, 3, 3, true, true);
          var ref = {}
          for (var j = 0; j < areaList.length; j++) {
            ref[areaList[j]] = true;
          }
          for (var j = 0; j < previousVorts.length; j++) {
            if (ref[previousVorts[j]]) {
              var x1 = previousVorts[j][0];
              var y1 = previousVorts[j][1];
              // draw the boy's path
              if (Math.abs(x0-x1) > 2) {x0 = xSize; x1 = xSize-1;}
              if (Math.abs(y0-y1) > 2) {y0 = ySize; y1 = ySize-1;}
              vortCtx.beginPath();
              vortCtx.moveTo(x1*xUnit, y1*yUnit);
              vortCtx.lineTo(x0*xUnit, y0*yUnit);
              vortCtx.stroke();
            }
          }
        }
      }
    }
  }
}

var drawVortex = function (x, y, radius, isClipBoardCanvas) {
  if (isClipBoardCanvas) {
    var ctx = $('clipboard-canvas').getContext('2d');
  } else {
    var ctx = $('main-canvas').getContext('2d');
  }
  ctx.fillStyle = "#000000"
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
}

var refreshDisplay = function () {
  if (displayVortLocs) {
    $('vortLocs').innerHTML = formatVortListIntoString(currentGame.vorts[currentGame.currentFrame]);
  }
  $('vortNum').innerHTML = "# vortices: " + currentGame.vorts[currentGame.currentFrame].length.toString();
  $('frameCount').innerHTML = currentGame.currentFrame;
  drawMainGrid();
}

var formatVortListIntoString = function (vortList) {
  return JSON.stringify(vortList).slice(1,-1);
}

var toggleDisplayVortLocs = function () {
  displayVortLocs = !displayVortLocs;
  if (displayVortLocs) {
    $('vortLocs').innerHTML = formatVortListIntoString(currentGame.vorts[currentGame.currentFrame]);
    displayElements("vortLocs");
    displayVortLocsButton.innerHTML = "hide vort coords";
  } else {
    removeElements("vortLocs");
    displayVortLocsButton.innerHTML = "show vort coords";
  }
}

var toggleDisplayVorts = function () {
  displayVorts = !displayVorts;

  drawMainGrid();
  if (clipboard) {
    drawGrid($('clipboard-canvas'), clipboard, getVortsAndString(clipboard).vorts, true);
  }

  if (displayVorts) {
    displayVortsButton.innerHTML = "hide vorts";
  } else {
    displayVortsButton.innerHTML = "show vorts";
  }
}

var toggleDisplayVortPath = function () {
  displayVortPath = !displayVortPath;

  clearVortPaths();

  if (displayVortPath) {
    $('displayVortPathButton').innerHTML = "hide vort path";
  } else {
    $('displayVortPathButton').innerHTML = "show vort path";
  }
}
var clearVortPaths = function () {
  $('vortex-canvas').getContext('2d').clearRect(0, 0, $('vortex-canvas').width, $('vortex-canvas').height);
}

// THIS makes the world go around
var forwardOneStep = function (nonVisual){
  var game = currentGame;
  game.currentFrame++;
  if (game.frames[game.currentFrame]) {   // we already have data for this frame
    if (game.currentFrame >= game.finalFrame) {
      game.currentFrame = game.loopStart;
    }
  } else {
    var newGrid = nextGrid(game.frames[game.frames.length-1]);
    game.frames.push(newGrid);
    var next = getVortsAndString(newGrid);
    game.vorts.push(next.vorts);

    if (game.book[next.gridStr] !== undefined) {  // we have seen this page before
      stopContinuousPlay();
      //alert('you loop!');
      //
      game.finalFrame = game.currentFrame;
      game.loopLength = (game.frames.length - 1) - game.book[next.gridStr];
      game.loopStart = game.frames.length - game.loopLength - 1;
      //
      if (nonVisual) {
        return nonVisual({
          tilLoop: game.loopStart,
          loopLength: game.loopLength,
          finalVortexCount: next.vorts.length,
          startingGrid: exportGridToJsonString(game.frames[0]),
        });
      } else {
        game.currentFrame = game.loopStart;
        $("timeTillLoop").innerHTML = "iterations until loop: " + game.loopStart;
        $("loopFound").innerHTML = "loop length: " + game.loopLength.toString();
        displayElements("timeTillLoop", "loopFound");
      }
    } else {
      game.book[next.gridStr] = game.frames.length-1;
      if (nonVisual) {
        continuousPlay(0, nonVisual);
      }
    }
  }
  //
  if (!nonVisual) {
    refreshDisplay();
  }
}

// this makes the world go rounder keep going
var continuousPlay = function (delay, nonVisual) {    // delay in mS between frame updates
  if (nonVisual) {
    if (currentGame.currentFrame > 15000) {
      return nonVisual({
        tilLoop: currentGame.currentFrame,
        loopLength: -1,
        didNotFinish: true,
        startingGrid: exportGridToJsonString(currentGame.frames[0]),
      });
    } else if ((currentGame.currentFrame+1) % 1000 === 0) {
      // take a breath every 1k frames, should prevent stack overflows on very long grids when bulk running
      (function (nonVisual) {
        setTimeout(function () {
          forwardOneStep(nonVisual);
        }, 0);
      })(nonVisual);
    } else {
      forwardOneStep(nonVisual);
    }
  } else {
    // unschedule the next scheduled step, in case we are here via button press and not on schedule
    clearTimeout(currentGame.timer);
    // schedule the next step
    currentGame.timer = setTimeout(function () {
      continuousPlay(delay);
    }, delay);
    // actually take a step
    forwardOneStep();
    // taking a step has to come after scheduling the following step so that the step can cancel the next one if need be
  }
}

var stopContinuousPlay = function () {
  clearTimeout(currentGame.timer);
}

var goToFrame = function () {
  stopContinuousPlay();
  var frame = Number($('frame-input').value);
  if (!Number.isInteger(frame) || frame < 0 || frame > currentGame.frames.length) {
    alert("no!");
  } else {
    currentGame.currentFrame = frame;
    //
    clearVortPaths();
    refreshDisplay();
  }
}

var initGame = function (grid, nonVisual) {
  stopContinuousPlay();

  var obj = getVortsAndString(grid);
  currentGame.vorts = [obj.vorts];

  currentGame.frames = [grid];
  currentGame.book = {};
  currentGame.book[obj.gridStr] = 0;
  currentGame.loopLength = -1;
  currentGame.currentFrame = 0;

  if (!nonVisual) {
    refreshDisplay();
    clearVortPaths();
    $('x-input').value = xSize;
    $('y-input').value = ySize;
    $('threshold-input').value = flipThreshold;
    $('limit-input').value = flipLimit;
    $('colors-input').value = colors;
    removeElements("loopFound", "timeTillLoop");
  }
}

var exportGridToJsonString = function (grid) {
  var str = "[";
  for (var i = 0; i < grid.length; i++) {
    str += "["
    for (var j = 0; j < grid[i].length; j++) {
      if (j != grid[i].length-1) {
        str+= grid[i][j].toString() + ","
      } else {
        str+= grid[i][j].toString()
      }
    }
    if (i != grid.length-1) {
      str += "], \r\n"
    } else {
      str += "]"
    }

  }
  str += "]";
  return str;
}

var getCustomLevel = function () {
  stopContinuousPlay();

  var grid = currentGame.frames[currentGame.currentFrame];
  var jsonString = exportGridToJsonString(grid);
  $('customLevelInput').value = jsonString;
  selectFullInputContents($('customLevelInput'));
}

var getGridLink = function () {
  stopContinuousPlay();
  var grid = currentGame.frames[currentGame.currentFrame];
  var lowBaseString = grid.flat().join('');
  var highBaseString = compressString(lowBaseString, colors);

  var url = window.location.href;
  var hashLoc = url.indexOf('#');
  if (hashLoc !== -1) {
    url = url.slice(0, url.indexOf('#'));
  }
  $('grid-link').value = url + "#" + xSize + "x" + ySize + "." + colors + "." + flipThreshold + "." + flipLimit + "." + highBaseString;
  selectFullInputContents($('grid-link'));
}

var selectFullInputContents = function (elem) {
  elem.focus();
  elem.setSelectionRange(0, -1);
}

var setCustomLevel = function (input) {  // input is an array(of arrays) of griddata, defaults to GUI input field if not given
  if (!input) { input = JSON.parse($('customLevelInput').value) }

  var gridObj = input;
  xSize = gridObj.length;
  ySize = gridObj[0].length;
  initGame(gridObj);
}

var makeCurrentGridRandom = function (nonVisual){
  initGame(generateRandomGrid(xSize,ySize), nonVisual);
}

var generateRandomGrid = function (x,y){
  var grid = []
  for (var i = 0; i < x; i++){
    var new_row = []
    for (var j = 0; j < y; j++){
      new_row.push(Math.floor(Math.random()*colors))
    }
    grid.push(new_row)
  }
  return grid;
}

var changeBoardDimensions = function () {
  var xDim = Number($('x-input').value);
  var yDim = Number($('y-input').value);
  if (!Number.isInteger(xDim) || xDim < 1 || !Number.isInteger(yDim) || yDim < 1) {
    alert("no!")
  } else {
    xSize = xDim;
    ySize = yDim;
    makeCurrentGridRandom();
  }
}
var setNumberOfColors = function () {
  var colorNum = Number($('colors-input').value);
  if (!Number.isInteger(colorNum) || colorNum < 2 || colorNum > 7) {
    alert("no!")
  } else {
    colors = colorNum;
    makeCurrentGridRandom();
    setPaintContainer();
    setVortBox();
  }
}
var setFlipConditions = function () {
  var thresh = Number($('threshold-input').value);
  var lim = Number($('limit-input').value);
  if (!Number.isInteger(thresh) || thresh < 1 || !Number.isInteger(lim) || lim < 1) {
    alert("no!")
  } else {
    flipThreshold = thresh;
    flipLimit = lim;
    initGame(currentGame.frames[currentGame.currentFrame]);
  }
}

var setVortBox = function () {
  if (colors === 3 || colors === 4) {
    displayElements('vort-box');
    displayVorts = true;
  } else {
    removeElements('vort-box');
    displayVorts = false;
  }
}

var bulkRunner = function (quota, arr, stats, timeOfLastBreath) {
  if (quota === undefined) {        // init
    quota = Number($('bulk-input').value);
    arr = [];
    stats = {
      startTime: new Date(),
      totalLoopLength: 0,
      totalTicksTilLoop: 0,
      totalFinalVortexCount: 0,
      didNotFinish: [],
    };
    timeOfLastBreath = new Date();
    timeOfLastBreath -= 201;  // to force a breath on the first go through
    $('bulk-heading').innerHTML = "<br><br>PROCESSING "+quota+" RANDOM "+xSize+"x"+ySize+" GRIDS<br>";
    $('bulk-status').innerHTML = "** running game #1 **"
    displayElements('bulk-report','bulk-heading', 'bulk-status');
    removeElements('not-bulk', 'bulk-dismiss', 'bulk-actions');
  }

  if (quota === 0) {               // done
    var now = new Date();
    var secs = (Math.floor(now - stats.startTime))/1000;
    var secs = arr.length + " " + xSize+"x"+ySize+" games were run in " +secs+" seconds";
    //
    var dnf = "";
    if (stats.didNotFinish.length) {
      dnf = "did not finish games: "+stats.didNotFinish+"<br>";
    }
    var avgs = "mean ticks til loop: "+((Math.round((stats.totalTicksTilLoop/arr.length)*100))/100)+"<br>"
    avgs += "mean loop length: "+((Math.round((stats.totalLoopLength/arr.length)*100))/100)+"<br>"
    avgs += "mean final vortex count: "+((Math.round((stats.totalFinalVortexCount/arr.length)*100))/100)+"<br>"
    //
    $('downloadButton').onclick = function () { downloadJson(arr); }
    $('toConsoleButton').onclick = function () { console.log(arr); }

    $('bulk-status').innerHTML = "**DING**<br>"+secs+"<br>"+dnf+avgs;
    removeElements('bulk-heading');
    displayElements('not-bulk', 'bulk-dismiss', 'bulk-actions');
    if (document.hidden) {
      alert("dinner's ready!");
    }
  } else {                      // keep going
    var now = new Date();
    var timeSinceLastBreath = now - timeOfLastBreath;
    if (timeSinceLastBreath > 200) {
      setTimeout(function () {
        runner(quota, arr, stats, now);
      }, 0);
      // the "delay 0 time hack" allows the DOM to update so you can see progress
      // and allows the CPU to catch up thus preventing stack overflows
      // but does slow the code down a bit, especially when the tab is in the background, because browser throttling
    } else {
      runner(quota, arr, stats, timeOfLastBreath);
    }
  }
}
var runner = function (quota, arr, stats, timeOfLastBreath) {
  makeCurrentGridRandom(true);
  continuousPlay(0, function (results) {
    arr.push(results);
    if (results.didNotFinish) {
      stats.didNotFinish.push(arr.length-1);
    } else {
      stats.totalFinalVortexCount += results.finalVortexCount;
      stats.totalLoopLength += results.loopLength;
    }
    stats.totalTicksTilLoop += results.tilLoop;
    var now = new Date();
    var secs = (Math.floor(((now - stats.startTime)/arr.length)))/1000;
    $('bulk-status').innerHTML = "** running game #"+(arr.length+1)+" **<br>currently averaging "+secs+" seconds to run each game";
    bulkRunner(quota-1, arr, stats, timeOfLastBreath);
  });
}

var baseRef = {
  valuableString: `ԆɕηıŠҭˀřʷԑőʡɋɌϭιŃș˱ǭʴϥέуеһɢжǲǰȲʝΔхǯϸþȈɶϰӖҗǿȣø§ΎʉŐʺҔѵӋͶӚƴĻӶïǕˬ÷ϛɊûρѣƸÚȸήкΩԅȫĚѸΧӯɰҞϡ˳өΙʸðɯʹǏԥЈŰκĉĶËӷԌο˅ʒϣԃҚħɆƒʠȥ˪ұѻϚͺťвėůґķʯɝЮ¢ϘЯ˨ǸјǈȴˇӸœǫЉĥѧ³ƌԧɠКåƕǉąžĮТˉȎаЬΜǛΊǔǄȀϿχ¡ǩ˾Ѿĩϊ΄ϵІāϢӧϯӳˎōΟɃűĄĔƙʻĖіˮƫÛǖȻǊȊԈɚБӏļβǥŻŽУЀÂПԉǽѼȚφѽłĜͲ£ѫǙɲ˻Ъ;ƖäÄěΤŭƟțҏНΝЄŪɫ®ŅѴɭʊƽǻЗǾīΪɬŸϐȋӠωЂɿ˧˺ǺʂʗȍɛÿˆϪƊÎÈʼɗĢÔñ˴ǓưÒѭҲƗçʇЩʽϱԇʥ˷ԘѕƾәɘҁΈԤʑȘĭμϠȼҡÉζҸӭʟȜŜȠϺЍѦҰîӄľСµЋƛƿƚØϽàόŌϻҴǪĵȳ¯ëȃŞʮчÏɄƓũÙɍŧцŨɅʜɥʐ²úǷĴƢԒˠΦћΆɇȄʛȟǁʲ»ϾʁǤȺƀӅʬΚӁɈǍǡēϜӕƜ¸ɁэˣʆƠӨƪҝęʌȔɳЎ˂ɺȦˢГʹƨ¦Ӏ˯ҩʔəЛӒӫɸɨʱҪǨǎǮˍҋ¾ƺŔӐљӽд˔°ǐΠĿʚѶ˝±ԢĈâŖĪĳĲʦӬˡȇҌɖƈǋѹЃ«˜ʄФЊεϏЅčɩƯъϗϟνǴÃĀɎɴƐΘʋϔĘқɔƻԦŴʃĐҒȭπáȧƧɧɣƅ×ѰƝӪϦѡèˈʅƘԎӘσЫ˘Ɓʕн¼ԞŋҘӉϞ˚˰ŘϙҦӟпюɒΓҎʰϼÆÑŗҊÌΗ˗ҹ˭М©лǚŊӺɀϴɐȗȝƞăǳɹȑŦмįȹЏ˶ƵŕѮƳʫѝИ˽ԁςşѯϒȢ˓ːȱÕƼȾãӦΉшӇĨďʙͿ¨íВԏӴ¤˫ƭͻĆαýȩŶңɏΑɵɽƹўԀӻʪđĒҷʏЦöɑʵʳԜʍϩԓӎА˵ѤѠõѩˊЁ˦ǱΣԨʖ϶ΒƦȓĦŤʤӵӔѺ˕υͽӰҀӣƣΰиҖ˃ĬȉɓˑРҺӌÀȪ¥Дќ˖Ďԗ˙Ýȡ¿żԂǂԙϋƥ˥бΡύүƉŀϫҕӿӑΌѐġϓрȕгƔίҐņǇΕɟХǒԡӍƇϳźϕʓ¹ȮȷĕĺяҧȖſƆūԍњԛϤйƲˏˤͳğùÐŲҤҳɦÊÇƎώǣȤЖƱΖθĊЌƩΨÖ˩ӼéóзͷЕЙǟӹҬƏŏӝţғсÜć˛ǶӊɻńʎӤêÞϝČƬÓʭϧҶђӓŎӂоªҼЧȯΞγɱɼǠӥƍ˹ҮʣƄȰщͼʘ˸ǜʀǬҫҿԖӮƂʨƑȒȵŇßϲȐԣ·ѨǆÁȅӛňȁҽӈҟԝӢԄѱάƶѳǵΐ΅ĽϹɜċƋԔ˲ԊŮҠŵϮьΏƷɞģºʾ¬ОĞӞŷψȌӃѢǗԐʶ˼фŬѷǧȆЭ·ǀɮɾԠʢӜǅʧτϖǢȨȏϷџыšȂơȽɤ҉Ġҥϑĸŝʩ͵ѪÍĤʈƮͱȬԟλŉòƤЇǌӆɷǘϬĹæтҙˁǑӗĂҵśŚǃÅ½˿ȶǹξʞѲӾ˄Ң¶ǞδİǦӱӲҍѬѓɉǝ˒ҾɪҜΥŒҨɡŢΛȞƃôѿϨёȿԚŹӡìʿԕŁĝüԋєΫǼųѥɂї`,
}

var compressString = function (string, curBase) {
  var x = getBigBaseAndRatio(curBase);
  var newBase = x[0];
  var ratio = x[1];

  var newString = '';
  while (string !== '') {
    // grab the next X characters of the string of small base
    var snip = string.substr(0, ratio);
    while (snip.length !== ratio) {
      snip += "0";
    }
    // trim the string
    string = string.substr(ratio);

    var dec = convertToDecimal(snip, curBase);
    // convert to bigBase
    var char = baseRef.valuableString[dec];

    newString += char;
  }
  return newString;
}
var convertToDecimal = function (string, curBase) {
  var arr = string.split('');
  var number = 0;
  for (var i = 0; i < arr.length; i++) {
    number += (Math.pow(curBase, i) * Number(arr[(arr.length -1)-i]));
  }
  return number;
}
var deCompressString = function (string, targetBase) {
  var x = getBigBaseAndRatio(targetBase);
  var oldBase = x[0];
  var ratio = x[1];
  createBaseRef(oldBase);

  var newString = '';

  while (string !== '') {
    // look up the value of the current leading char
    var dec = baseRef[oldBase][string[0]];

    var bit = convertFromDecimal(dec, targetBase);
    while (bit.length < ratio) {
      bit = "0"+bit;
    }
    newString += bit;

    // trim the string
    string = string.substr(1);
  }
  return newString;
}
var convertFromDecimal = function (number, targetBase) {
  var string = '';
  while (number >= targetBase) {
    string = String(number % targetBase)+string;
    number = Math.floor(number/targetBase);
  }
  string = (number % targetBase)+string;

  return string;
}
var getBigBaseAndRatio = function (smallBase) {
  var multiple = smallBase;
  var iterations = 1;
  while (multiple*smallBase < 1024) {
    multiple = smallBase*multiple;
    iterations++;
  }
  return [multiple, iterations];
}
var createBaseRef = function (base) {
  if (!baseRef[base]) {
    baseRef[base] = {};

    for (var i = 0; i < base; i++) {
      baseRef[base][baseRef.valuableString[i]] = i;
    }
  }
}

var loadFromAddressBarOnPageLoad = function () {
  var url = decodeURI(window.location.hash).substr(1);

  var xLoc = url.indexOf("x");
  if (xLoc !== -1) {
    var xDim = Number(url.substr(0, xLoc));
    url = url.substr(xLoc+1)

    var dotLoc = url.indexOf(".");
    if (dotLoc !== -1) {
      var yDim = Number(url.substr(0, dotLoc));
      url = url.substr(dotLoc+1);
      dotLoc = url.indexOf(".");

      // colors
      if (dotLoc !== -1) {
        var cols = Number(url.substr(0, dotLoc));
        url = url.substr(dotLoc+1);
        dotLoc = url.indexOf(".");

        // flipThreshold
        if (dotLoc !== -1) {
          var flipT = Number(url.substr(0, dotLoc));
          url = url.substr(dotLoc+1);
          dotLoc = url.indexOf(".");

          // flipLimit
          if (dotLoc !== -1) {
            var flipL = Number(url.substr(0, dotLoc));

            var gridString = url.substr(dotLoc+1);
          }
        }
      }
    } else {
      var yDim = Number(url);
    }

    if (Number.isInteger(xDim) && xDim > 0) {xSize = xDim;}
    if (Number.isInteger(yDim) && yDim > 0) {ySize = yDim;}
    if (cols && Number.isInteger(cols) && cols >= 0) {colors = cols;}
    if (flipT && Number.isInteger(flipT) && flipT >= 0) {flipThreshold = flipT;}
    if (flipL && Number.isInteger(flipL) && flipL >= 0) {flipLimit = flipL;}

    if (gridString) {

      var expandedGridString = deCompressString(gridString, colors);

      var grid = [];
      for (var i = 0; i < xSize; i++) {
        var arr = expandedGridString.substr(i*yDim, yDim).split('');
        for (var j = 0; j < arr.length; j++) {
          arr[j] = Number(arr[j]);
        }
        grid.push(arr);
      }

      setCustomLevel(grid);
      return;
    }
  }
  makeCurrentGridRandom();
}

// init on page load
loadFromAddressBarOnPageLoad();
setPaintContainer();
setVortBox();

var downloadJson = function (dataObject) {
  var dataString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataObject));
  //
  var date = new Date();
  var date = date.getFullYear() +"-"+ date.getMonth()+1 +"-"+ date.getDate() +"-"+ date.getHours() +":"+ date.getMinutes() +":"+ date.getSeconds();
  var filename = "rps-data-" + date+".json";
  //
  downloadFile(filename, dataString);
}
var downloadImageOfCurrentBoard = function () {
  var date = new Date();
  var date = date.getFullYear() +"-"+ date.getMonth()+1 +"-"+ date.getDate() +"-"+ date.getHours() +":"+ date.getMinutes() +":"+ date.getSeconds();
  var filename = "rps-" + date;
  //
  $('secret-canvas').getContext('2d').drawImage($('main-canvas'), 0,0);
  $('secret-canvas').getContext('2d').drawImage($('vortex-canvas'), 0,0);
  var data = $('secret-canvas').toDataURL();
  //
  downloadFile(filename, data);
}
var downloadFile = function (filename, data) {
  var tempLink = document.createElement("a");
  tempLink.download = filename;
  //
  tempLink.href = data;
  tempLink.click();
  //
  destroyElement(tempLink);
}


///// vortex graph stuff

// given the colours around a vertex, the type of boundary one wishes to follow
// and the direction one came into the vertex from, gives the direction to go in
// to keep following the boundary.
var followBoundary = function(nbColors, boundary, prev_dir) {

  var col_to_dir = [ [0,1], [2,3], [0,2], [1,3] ]
  var dirs = [ [0,-1], [0,1], [-1,0], [1,0] ]

  i
  for (var i = 0; i < 4; i++) {
    var t1 = (nbColors[col_to_dir[i][0]] == boundary[0] && nbColors[col_to_dir[i][1]] == boundary[1])
    var t2 = (nbColors[col_to_dir[i][1]] == boundary[0] && nbColors[col_to_dir[i][0]] == boundary[1])
    if ( (t1 || t2 ) && (dirs[i][0] != -prev_dir[0] || dirs[i][1] != -prev_dir[1])) {
      return dirs[i]
    }
  }
}

// checks if we're wrapping round the torus boundary between pos1 and pos2
// this should keep lines from being drawn across the grid most of the time
var torusHop = function(pos1,pos2,xSize,ySize) {

  var hopi = false
  if (Math.abs(pos1[0]-pos2[0]) == xSize-1 ) {
    hopi = true;
  }

  var hopj = false
  if (Math.abs(pos1[1]-pos2[1]) == ySize-1 ) {
    hopj = true;
  }

  return [hopi,hopj]


}

// checks for membership in the list of vortices
var vortListCheck = function(list,pos) {
  var contains = false
  var ind = -1
  for (var i = 0; i < list.length; i++) {
    if (list[i][0] == pos[0] && list[i][1] == pos[1]) {
      contains = true;
      ind = i
      break;
    }
  }
  return [contains, ind]
}


// prints the vortex graph to the console
// everything is a var because it wasn't working
var getVortexGraph = function() {

  var frame_num = $("vortGraphFrame").value
  $('frame-input').value = frame_num
  goToFrame()
  var canv = $("main-canvas");
  var ctx = canv.getContext('2d');

  ctx.fillStyle = "#000000"
  ctx.beginPath();

  var bounds = [[0,1],[1,2],[2,0]]

  var graph = []
  var numVorts = currentGame.vorts[frame_num]['length']

  // we iterate over the list of vortices
  for (var k = 0; k < numVorts; k++) {

    var edges = []
    // we check where each of the vortices three edges go
    for (var b = 0; b < 3; b++) {

      var boundary = bounds[b]
      var coord_list = [currentGame.vorts[frame_num][k]]
      var direction = [0,0]

      // the drawing stuff could probably be bifurcated into its own function
      ctx.moveTo(coord_list[0][0]*canv.width/xSize, coord_list[0][1]*canv.height/ySize);


      var i = 0;

      // don't like using the while loop but it shouldn't cause any problems
      // all this does is keep following the given boundary until it reaches another vortex
      // then adds that to the graph
      while (i != -1) {

        var nebs = vortNb(coord_list[i][0],coord_list[i][1],xSize,ySize)
        var neb_colors = []
        for (var j = 0; j < nebs.length; j++) {
          neb_colors.push(currentGame.frames[frame_num][nebs[j][0]][nebs[j][1]]);
        }

        var direction = followBoundary(neb_colors,boundary,direction)

        coord_list.push([ mod(coord_list[i][0]+direction[0], xSize), mod(coord_list[i][1]+direction[1], ySize)])

        var hops = torusHop(coord_list[i],coord_list[i+1],xSize,ySize)

        // this bit doesn't work all the time and I don't know why
        // it's supposed to stop ctx line drawing from happening when there's
        // a path that wraps around the grid
        if (hops[0] || hops[1]) {
          ctx.stroke();
          var new_pos = coord_list[i]

          if (hops[0]) {
            if (new_pos[0] == 0) {
              new_pos[0] = xSize
            } else {
              new_pos[0] = 0
            }
          }
          if (hops[1]) {
            if (new_pos[1] == 0) {
              new_pos[1] = ySize
            } else {
              new_pos[1] = 0
            }
          }
          ctx.moveTo(coord_list[i][0]*canv.width/xSize, coord_list[i][1]*canv.height/ySize);
          ctx.lineTo(new_pos[0]*canv.width/xSize, new_pos[1]*canv.height/ySize);
        }

        ctx.lineTo(coord_list[i+1][0]*canv.width/xSize, coord_list[i+1][1]*canv.height/ySize);

        var vlc = vortListCheck(currentGame.vorts[frame_num],coord_list[i+1])

        if (vlc[0]) {
          break;
        }
        i++;
      }

      ctx.stroke();

      edges.push(vlc[1])



    }


    graph.push(edges)


  }

  console.log(graph)
}




///
