"use strict";

var canvas = document.getElementById('gameZone');
var ctx = canvas.getContext('2d');

var colours = ["#D81B60","#FFC107","#1E88E5"];
var xSize = 50;
var ySize = 50;
var currentGame = {};
var displayVortLocs = false;
var displayVorts = true;



function getVortsAndString(grid) {
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
  var neb = vortNb(x,y)
  var vort = []
  for (var i = 0; i < 4; i++) {
    vort.push(grid[neb[i][0]][neb[i][1]])
  }
  if (vort.includes(0) && vort.includes(1) && vort.includes(2)) {
    return true
  }
  return false
}

function vortNb(x,y) {      // outputs the cells required for tracking vortices
  return [ [(x-1+xSize) % xSize, (y-1+ySize) % ySize],
           [(x+xSize) % xSize, (y-1+ySize) % ySize],
           [(x-1+xSize) % xSize, (y+ySize) % ySize],
           [(x+xSize) % xSize, (y+ySize) % ySize]
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
    //console.log(grid[ac[0]][ac[1]] )
    if (grid[ac[0]][ac[1]] == val_enemy) {
      count += 1
      //console.log(count)
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

function drawGrid(){
  var xUnit = canvas.width / xSize;
  var yUnit = canvas.height / ySize;
  //
  var grid = currentGame.frames[currentGame.currentFrame];
  for (var i = 0; i < grid.length; i++){
    for (var j = 0; j < grid[i].length; j++) {
      ctx.beginPath();
    	ctx.fillStyle = colours[grid[i][j]];
    	ctx.fillRect(xUnit*i,yUnit*j,xUnit,yUnit);
    }
  }
  if (displayVorts) {
    var vorts = currentGame.vorts[currentGame.currentFrame];
    for (var i = 0; i < vorts.length; i++) {
      drawVortex(xUnit*vorts[i][0], yUnit*vorts[i][1]);
      // draws vortices on the edges of the window
      if (vorts[i][0] == 0 || vorts[i][0] == xSize) {
        drawVortex(canvas.width-vorts[i][0], yUnit*vorts[i][1]);
      }
      if (vorts[i][1] == 0 || vorts[i][1] == ySize) {
        drawVortex(xUnit*vorts[i][0], canvas.height-vorts[i][1]);
      }
    }
  }
}

var drawVortex = function (x, y) {
  ctx.fillStyle = "#000000"
  ctx.beginPath();
  ctx.arc(x, y, (canvas.width / Math.max(xSize, ySize))/3, 0, 2 * Math.PI);
  ctx.fill();
}

var refreshDisplay = function () {
  if (displayVortLocs) {
    document.getElementById('vortLocs').innerHTML = vortString(currentGame.vorts[currentGame.currentFrame])
  }
  document.getElementById('vortNum').innerHTML = "# vortices: " + currentGame.vorts[currentGame.currentFrame].length.toString();
  document.getElementById('frameCount').innerHTML = currentGame.currentFrame;
  drawGrid();
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
    document.getElementById('vortLocs').innerHTML = vortString(currentGame.vorts[currentGame.currentFrame]);
    document.getElementById("vortLocs").style.display = "block"
    displayVortLocsButton.innerHTML = "hide vort coords"
  } else {
    document.getElementById("vortLocs").style.display = "none"
    displayVortLocsButton.innerHTML = "show vort coords"
  }
}

function toggleDisplayVorts() {
  displayVorts = !displayVorts;

  drawGrid();

  if (displayVorts) {
    displayVortsButton.innerHTML = "hide vorts"
  } else {
    displayVortsButton.innerHTML = "show vorts"
  }
}



// THIS makes the world go around
function forwardOneStep(){
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
      game.finalFrame = game.currentFrame;
      game.loopLength = (game.frames.length - 1) - game.book[next.gridStr];
      game.loopStart = game.frames.length - game.loopLength - 1;
      game.currentFrame = game.loopStart;
      document.getElementById("timeTillLoop").innerHTML = "iterations until loop: " + game.loopStart;
      document.getElementById("loopFound").innerHTML = "loop length: " + game.loopLength.toString()
      document.getElementById("timeTillLoop").style.display = "block"
      document.getElementById("loopFound").style.display = "block"
    } else {
      game.book[next.gridStr] = game.frames.length-1;
    }
  }
  if (game.loopLength === -1) {
  }
  //
  refreshDisplay();
}


// this makes the world go rounder keep going
var continuousPlay = function (delay) {    // delay in mS between frame updates
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

var stopContinuousPlay = function () {
  clearTimeout(currentGame.timer);
}


var goToFrame = function () {
  stopContinuousPlay();
  var frame = Number(document.getElementById('frame-input').value);
  if (!Number.isInteger(frame) || frame < 0 || frame > currentGame.frames.length) {
    alert("no!")
  } else {
    currentGame.currentFrame = frame;
    //
    refreshDisplay();
  }
}

var initGame = function (grid) {
  stopContinuousPlay();

  var obj = getVortsAndString(grid);
  currentGame.vorts = [obj.vorts];

  currentGame.frames = [grid];
  currentGame.book = {};
  currentGame.book[obj.gridStr] = 0;
  currentGame.loopLength = -1;
  currentGame.currentFrame = 0;

  refreshDisplay();

  document.getElementById("loopFound").style.display = "none";
  document.getElementById("timeTillLoop").style.display = "none";
}

function getCustomLevel() {
  stopContinuousPlay();

  var grid = currentGame.frames[currentGame.currentFrame];

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
  str += "]"
  document.getElementById('customLevelInput').value = str;
}

function setCustomLevel() {
  var gridStr = JSON.parse(document.getElementById('customLevelInput').value);
  xSize = gridStr.length;
  ySize = gridStr[0].length;
  document.getElementById('x-input').value = xSize;
  document.getElementById('y-input').value = ySize;
  initGame(gridStr);
}

function makeCurrentGridRandom(){
  initGame(generateRandomGrid(xSize,ySize));
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
  var xDim = Number(document.getElementById('x-input').value);
  var yDim = Number(document.getElementById('y-input').value);
  if (!Number.isInteger(xDim) || xDim < 3 || !Number.isInteger(yDim) || yDim < 3) {
    alert("no!")
  } else {
    xSize = xDim;
    ySize = yDim;
    makeCurrentGridRandom();
  }
}

makeCurrentGridRandom();
//
