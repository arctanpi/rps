"use strict";

var colours = ["#D81B60","#FFC107","#1E88E5"];
var xSize = 50;
var ySize = 50;
var currentGame = {};
var displayVortLocs = false;
var displayVorts = true;
var paintDown = false;
var brushColor = false;
var brushSize;
var clipboard = false;


var $ = function (x) {return document.getElementById(x);}

var getCoords = function (e) {  // from mouse position over canvas
  var rect = e.target.getBoundingClientRect();
  var xCoord = Math.floor((e.clientX - rect.left) / (rect.width / xSize));
  var yCoord = Math.floor((e.clientY - rect.top) / (rect.height / ySize));
  return {x:xCoord, y:yCoord};
}
var getArea = function (centerCoords, width, height, wrap) {
  var arr = [];
  for (var i = 0; i < width; i++) {
    var x = (centerCoords.x - Math.floor((width-1)/2)) + i;
    if (wrap) {x = (x+xSize) % xSize}
    if (x >= 0 && x < xSize) {
      for (var j = 0; j < height; j++) {
        var y = (centerCoords.y - Math.floor((height-1)/2)) + j;
        if (wrap) {y = (y+ySize) % ySize}
        if (y >= 0 && y < ySize) {
          arr.push([x,y]);
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
      var x = coordList[0][0]+i;
      x = (x+xSize) % xSize;
      for (var j = 0; j < clipboard[i].length; j++) {
        var y = coordList[0][1]+j;
        y = (y+ySize) % ySize;
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
  $('pasteBrushBtn').classList.remove('removed');
  $('clipboard-wrapper').classList.remove('removed');
  $('clipboard-input').value = JSON.stringify(clipboard);
  //
  $('clipboard-canvas').width = ($('main-canvas').getBoundingClientRect().width / xSize) * clipboard.length
  $('clipboard-canvas').height = ($('main-canvas').getBoundingClientRect().height / ySize)* clipboard[0].length;
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
  $('overlay-canvas').classList.remove('removed');
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
  $('overlay-canvas').classList.add('removed');
  var buttons = $("color-container").childNodes;
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove('selected');
  }
  $('copyBrushBtn').classList.remove('selected');
  $('pasteBrushBtn').classList.remove('selected');
}
var setPaintContainer = function () {
  for (var i = 0; i < colours.length; i++) {
    var colorButton = document.createElement("button");
    colorButton.setAttribute('class', 'color-button');
    colorButton.style.background = colours[i];
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
setPaintContainer();

function getVortsAndString(grid) {
  // returns both crunched grid data down to a string like 0120210, and an array of vortices
  var gridStr = "";
  var vorts = [];

  for (var i = 0; i < grid.length; i++){
    for (var j = 0; j < grid[i].length; j++) {
      gridStr += grid[i][j]
      if (isVort(grid,i,j)) {
        vorts.push([i,j])
      }
    }
  }
  return {vorts:vorts, gridStr: gridStr}
}

function isVort(grid,x,y) {
  var neb = vortNb(x,y, grid.length,grid[0].length)
  var vort = []
  for (var i = 0; i < neb.length; i++) {
    vort.push(grid[neb[i][0]][neb[i][1]]);
  }
  if (vort.includes(0) && vort.includes(1) && vort.includes(2)) {
    return true
  }
  return false
}

function vortNb(x,y,xMax,yMax) {      // outputs the cells required for tracking vortices
  return [ [(x-1+xMax) % xMax, (y-1+yMax) % yMax],
           [(x+xMax) % xMax, (y-1+yMax) % yMax],
           [(x-1+xMax) % xMax, (y+yMax) % yMax],
           [(x+xMax) % xMax, (y+yMax) % yMax]
         ]
}

function nextGrid(grid){
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

function updateCell(grid,i,j){
  // given the grid and the coords given by i and j, updates each
  // cell according to the rule
  // a 0 becomes a 1 if it has 3 or more 1 neighbours
  // a 1 becomes a 2 if it has 3 or more 2 neighbours
  // a 2 becomes a 0 if it has 3 or more 0 neighbours
  var adj = adjacentTo(i,j);
  var val = grid[i][j];
  // not sure if I really need to do the +4 thing here but w/e
  var val_enemy = (val+4) % 3;
  var count = 0;
  for (var i = 0; i < 8; i++) {
    var ac = adj[i]
    if (grid[ac[0]][ac[1]] == val_enemy) {
      count += 1
    }
  }

  // checks if we have at least 3 neighbours of the enemy type
  if (count > 2) {
    var new_val = val_enemy
  } else {
    var new_val = val
  }
  return new_val
}

function adjacentTo(x,y) {
  // given x and y in the N x N grid, returns the adjacent
  // coordinates. wraps around, hence the need for N
  // why does javascript require this (x+N) % N nonsense?
  // who can say. whatever. let's hope it does what I think it does
  return [ [(x-1+xSize) % xSize, (y-1+ySize) % ySize],
           [(x+xSize) % xSize, (y-1+ySize) % ySize],
           [(x+1+xSize) % xSize, (y-1+ySize) % ySize],
           [(x-1+xSize) % xSize, (y+ySize) % ySize],
           [(x+1+xSize) % xSize, (y+ySize) % ySize],
           [(x-1+xSize) % xSize, (y+1+ySize) % ySize],
           [(x+xSize) % xSize, (y+1+ySize) % ySize],
           [(x+1+xSize) % xSize, (y+1+ySize) % ySize]

         ]
       }

var drawMainGrid = function () {
  drawGrid($('main-canvas'), currentGame.frames[currentGame.currentFrame], currentGame.vorts[currentGame.currentFrame]);
}

function drawGrid(cnvsElm, grid, vorts, doNotDisplayEdgeVorts) {
  var ctx = cnvsElm.getContext('2d');

  var xUnit = cnvsElm.width / grid.length;
  var yUnit = cnvsElm.height / grid[0].length;
  //
  for (var i = 0; i < grid.length; i++){
    for (var j = 0; j < grid[i].length; j++) {
      ctx.beginPath();
    	ctx.fillStyle = colours[grid[i][j]];
    	ctx.fillRect(xUnit*i,yUnit*j,xUnit,yUnit);
    }
  }
  if (displayVorts && vorts) {
    var radius = Math.min(xUnit, yUnit)/3.5;
    for (var i = 0; i < vorts.length; i++) {
      if (!doNotDisplayEdgeVorts) {
        drawVortex(ctx, xUnit*vorts[i][0], yUnit*vorts[i][1], radius);
      } else {
        if (vorts[i][0] !== 0 && vorts[i][1] !== 0) {
          drawVortex(ctx, xUnit*vorts[i][0], yUnit*vorts[i][1], radius);
        }
      }
      if (!doNotDisplayEdgeVorts) {
        // draw a second(and possibly 3rd or 4th) vortex to represent vortices that fall on the wrapped edges
        if (vorts[i][0] == 0) {
          drawVortex(ctx, cnvsElm.width, yUnit*vorts[i][1], radius);
        }
        if (vorts[i][1] == 0) {
          drawVortex(ctx, xUnit*vorts[i][0], cnvsElm.height, radius);
        }
        if (vorts[i][1] == 0 && vorts[i][0] == 0) {
          drawVortex(ctx, cnvsElm.width, cnvsElm.height, radius);
        }
      }
    }
  }
}

var drawVortex = function (ctx, x, y, radius) {
  ctx.fillStyle = "#000000"
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
}

var refreshDisplay = function () {
  if (displayVortLocs) {
    $('vortLocs').innerHTML = vortString(currentGame.vorts[currentGame.currentFrame]);
  }
  $('vortNum').innerHTML = "# vortices: " + currentGame.vorts[currentGame.currentFrame].length.toString();
  $('frameCount').innerHTML = currentGame.currentFrame;
  drawMainGrid();
}


// returns a string with all the vortex coordinates that can
// be nicely displayed in the HTML
function vortString(vortList) {
  var vortStr = "";
  for (var i = 0; i < vortList.length; i++) {
    vortStr += "[" + vortList[i][0].toString() + "," + vortList[i][1].toString() + "]"
    if (i != vortList.length-1) {
      vortStr += ", "
    }
  }
  return vortStr
}

function toggleDisplayVortLocs() {
  displayVortLocs = !displayVortLocs
  if (displayVortLocs) {
    $('vortLocs').innerHTML = vortString(currentGame.vorts[currentGame.currentFrame]);
    $("vortLocs").classList.remove('removed');
    displayVortLocsButton.innerHTML = "hide vort coords"
  } else {
    $("vortLocs").classList.add('removed');
    displayVortLocsButton.innerHTML = "show vort coords"
  }
}

function toggleDisplayVorts() {
  displayVorts = !displayVorts;

  drawMainGrid();
  drawGrid($('clipboard-canvas'), clipboard, true);

  if (displayVorts) {
    displayVortsButton.innerHTML = "hide vorts"
  } else {
    displayVortsButton.innerHTML = "show vorts"
  }
}



// THIS makes the world go around
function forwardOneStep(nonVisual){
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
        $("loopFound").innerHTML = "loop length: " + game.loopLength.toString()
        $("timeTillLoop").classList.remove('removed');
        $("loopFound").classList.remove('removed');
      }
    } else {
      game.book[next.gridStr] = game.frames.length-1;
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
    if (currentGame.timer) {
      forwardOneStep(nonVisual);
      continuousPlay(delay, nonVisual);
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
  currentGame.timer = false;
}


var goToFrame = function () {
  stopContinuousPlay();
  var frame = Number($('frame-input').value);
  if (!Number.isInteger(frame) || frame < 0 || frame > currentGame.frames.length) {
    alert("no!");
  } else {
    currentGame.currentFrame = frame;
    //
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

    $("loopFound").classList.add('removed');
    $("timeTillLoop").classList.add('removed');
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

function getCustomLevel() {
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
  var highBaseString = compressString(lowBaseString, 3);

  var url = window.location.href;
  url = url.slice(0, url.indexOf('#'))
  $('grid-link').value = url + "#" + xSize + "x" + ySize + "." + highBaseString;
  selectFullInputContents($('grid-link'));
}

var selectFullInputContents = function (elem) {
  elem.focus();
  elem.setSelectionRange(0, -1);
}

function setCustomLevel(input) {  // input is an array(of arrays) of griddata, defaults to GUI input field if not given
  if (!input) { input = JSON.parse($('customLevelInput').value) }

  var gridObj = input;
  xSize = gridObj.length;
  ySize = gridObj[0].length;
  $('x-input').value = xSize;
  $('y-input').value = ySize;
  initGame(gridObj);
}

function makeCurrentGridRandom(nonVisual){
  initGame(generateRandomGrid(xSize,ySize), nonVisual);
}

function generateRandomGrid(x,y){
  var grid = []
  for (var i = 0; i < x; i++){
    var new_row = []
    for (var j = 0; j < y; j++){
      new_row.push(Math.floor(Math.random()*3))
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


var bulkRunner = function (quota, arr, stats, timeOfLastBreath) {
  if (quota === undefined) {        // init
    quota = Number($('bulk-input').value);
    arr = [];
    stats = {
      startTime: new Date(),
      totalLoopLength: 0,
      totalTicksTilLoop: 0,
      totalFinalVortexCount: 0,
    };
    timeOfLastBreath = new Date();
    timeOfLastBreath -= 201;  // to force a breath on the first go through
    $('bulk-heading').innerHTML = "<br><br>PROCESSING "+quota+" RANDOM "+xSize+"x"+ySize+" GRIDS<br>";
    $('bulk-heading').classList.remove('removed');
    $('bulk-status').innerHTML = "** running game #1 **"
    $('bulk-status').classList.remove('removed');
    $('not-bulk').classList.add('removed');
  }

  if (quota === 0) {               // done
    var now = new Date();
    var secs = (Math.floor(now - stats.startTime))/1000;
    var secs = arr.length + " games were run in " +secs+" seconds";
    //
    var avgs = "mean ticks til loop: "+((Math.round((stats.totalTicksTilLoop/arr.length)*100))/100)+"<br>"
    avgs += "mean loop length: "+((Math.round((stats.totalLoopLength/arr.length)*100))/100)+"<br>"
    avgs += "mean final vortex count: "+((Math.round((stats.totalFinalVortexCount/arr.length)*100))/100)+"<br>"
    //
    $('bulk-status').innerHTML = "**DING**<br>"+secs+"<br>"+avgs+"open your console for more";
    console.log(arr);
    $('bulk-heading').classList.add('removed');
    $('not-bulk').classList.remove('removed');
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
  currentGame.timer = true;
  continuousPlay(0, function (results) {
    arr.push(results);
    stats.totalTicksTilLoop += results.tilLoop;
    stats.totalLoopLength += results.loopLength;
    stats.totalFinalVortexCount += results.finalVortexCount;
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
      var gridString = url.substr(dotLoc+1);

    } else {
      var yDim = Number(url);

    }
    if (Number.isInteger(xDim) && Number.isInteger(yDim) && xDim > 0 && yDim > 0) {
      xSize = xDim;
      ySize = yDim;
    }
    if (gridString) {
      // assume base 3(and 729) for now, later put options for other versions of automata
      var base3GridString = deCompressString(gridString, 3);

      var grid = [];
      for (var i = 0; i < xSize; i++) {
        grid.push(base3GridString.substr(i*yDim, yDim).split(''));
      }

      setCustomLevel(grid)
      return;
    }
  }
  $('x-input').value = xSize;
  $('y-input').value = ySize;
  makeCurrentGridRandom();
}

// init on page load
loadFromAddressBarOnPageLoad();
