
var canvas = document.getElementById('gameZone');
var ctx = canvas.getContext('2d');

var colours = ["#D81B60","#FFC107","#1E88E5"];
var gridSize = 50
// cS = cellSize
var cS = canvas.height / gridSize

var speed = 100;
var stopped = true;


//


// given x and y in the N x N grid, returns the adjacent
// coordinates. wraps around, hence the need for N
// why does javascript require this (x+N) % N nonsense?
// who can say. whatever. let's hope it does what I think it does
function adjacentTo(x,y,N) {
  return [ [(x-1+N) % N, (y-1+N) % N],
           [(x+N) % N, (y-1+N) % N],
           [(x+1+N) % N, (y-1+N) % N],
           [(x-1+N) % N, (y+N) % N],
           [(x+1+N) % N, (y+N) % N],
           [(x-1+N) % N, (y+1+N) % N],
           [(x+N) % N, (y+1+N) % N],
           [(x+1+N) % N, (y+1+N) % N]

         ]
}


// gives the cells required for tracking vortices
function vortNb(x,y,N) {
  return [ [(x-1+N) % N, (y-1+N) % N],
           [(x+N) % N, (y-1+N) % N],
           [(x-1+N) % N, (y+N) % N],
           [(x+N) % N, (y+N) % N]

         ]
}


function compareGrids(g1,g2) {
  var same = true
  for (var i = 0; i < g1.length; i++) {
    for (var j = 0; j < g1.length; j++) {
      if (g1[i][j] != g2[i][j]) {
        same = false
        break
      }
    }
    if (!same) {
      break
    }
  }
  return same
}

function isVort(grid,x,y) {
  var neb = vortNb(x,y,grid.length)
  var vort = []
  for (var i = 0; i < 4; i++) {
    vort.push(grid[neb[i][0]][neb[i][1]])
  }
  if (vort.includes(0) && vort.includes(1) && vort.includes(2)) {
    return true
  }
  return false
}

function randomGrid(size){
  var grid = []
  for (var i = 0; i < size; i++){
    var new_row = []
    for (var j = 0; j < size; j++){
      new_row.push(Math.floor(Math.random()*3))
    }
    grid.push(new_row)
  }
  return grid;
}

// given the grid and the coords given by i and j, updates each
// cell according to the rule
// a 0 becomes a 1 if it has 3 or more 1 neighbours
// a 1 becomes a 2 if it has 3 or more 2 neighbours
// a 2 becomes a 0 if it has 3 or more 0 neighbours
function updateCell(grid,i,j){
  adj = adjacentTo(i,j,grid.length)
  val = grid[i][j]
  // not sure if I really need to do the +4 thing here but w/e
  var val_enemy = (val+4) % 3
  var count = 0
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


function getVorts(grid) {
  var vorts = []
  for (var i = 0; i < gridSize; i++){
    for (var j =0; j < gridSize; j++) {
      if (isVort(grid,i,j)) {
        vorts.push([i,j])
      }
    }
  }
  return vorts
}


function nextGrid(game){
  var size = game.grid.length
  var new_grid = []
  for (var i = 0; i < size; i++){
    var new_row = []
    for (var j = 0; j < size; j++){
      new_row.push(updateCell(game.grid,i,j))
    }
    new_grid.push(new_row)
  }

  game.grid = new_grid
  game.vorts = getVorts(new_grid)
  return game

}



function drawGrid(game){
  var grid = game.grid
  var len = grid.length
  for (var i = 0; i < len; i++){
    for (var j =0; j < len; j++) {
      ctx.beginPath();
    	ctx.fillStyle = colours[grid[i][j]];
    	ctx.fillRect(cS*i,cS*j,cS,cS);
    }
  }
  vorts = game.vorts
  if (game.displayVorts) {
    for (var i = 0; i < vorts.length; i++) {
      ctx.fillStyle = "#000000"
      ctx.beginPath();
      ctx.arc(cS*vorts[i][0], cS*vorts[i][1], cS/3, 0, 2 * Math.PI);
      ctx.fill();

      // draws vortices on the edges of the window
      if (vorts[i][0] == 0 || vorts[i][0] == gridSize) {
        ctx.beginPath();
        ctx.arc(500-vorts[i][0], cS*vorts[i][1], cS/3, 0, 2 * Math.PI);
        ctx.fill();
      }
      if (vorts[i][1] == 0 || vorts[i][1] == gridSize) {
        ctx.beginPath();
        ctx.arc(cS*vorts[i][0], 500-vorts[i][1], cS/3, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }
  return game
}

// returns a string with all the vortex coordinates that can
// be nicely displayed in the HTML
function vortString(vortList) {
  vortStr = "";
  for (var i = 0; i < vortList.length; i++) {
    vortStr += "[" + vortList[i][0].toString() + "," + vortList[i][1].toString() + "]"
    if (i != vortList.length-1) {
      vortStr += ", "
    }
  }
  return vortStr
}


function makeCurrentGridRandom(){

  currentGame.grid = randomGrid(gridSize)

  currentGame.vorts = getVorts(currentGame.grid)
  vortNum.innerHTML = "# vortices: " + currentGame.vorts.length.toString()

  currentGame.frames = [currentGame.grid]
  currentGame.loopFound = false
  currentGame.loopLength = -1
  document.getElementById("loopFound").style.display = "none"
  document.getElementById("timeTillLoop").style.display = "none"

  vortLocs.innerHTML = vortString(currentGame.vorts)

  drawGrid(currentGame)
  play(currentGame,0)
}


function forwardOneStep(game){
  game.grid = nextGrid(game).grid
  game.frames.push(game.grid)
  vortNum.innerHTML = "# vortices: " + game.vorts.length.toString();

  vortLocs.innerHTML = vortString(game.vorts)
  drawGrid(game)

  if (!game.loopFound) {
    for (var i = 0; i < game.frames.length-1; i++) {
      if (compareGrids(game.grid,game.frames[i])) {
        document.getElementById("loopFound").style.display = "block"
        game.loopFound = true
        game.loopLength = game.frames.length - i - 1
        loopFound.innerHTML = "loop length: " + game.loopLength.toString()

        document.getElementById("timeTillLoop").style.display = "block"
        timeTillLoop.innerHTML = "time until loop: " + (game.frames.length - game.loopLength - 1).toString()
      }
    }
  }


  return game
}


function toggleDisplayVortLocs(game) {
  game.displayVortLocs = !game.displayVortLocs
  if (game.displayVortLocs) {
    document.getElementById("vortLocs").style.display = "block"
    displayVortLocsButton.innerHTML = "hide vort coords"
  } else {
    document.getElementById("vortLocs").style.display = "none"
    displayVortLocsButton.innerHTML = "show vort coords"
  }
}


// this makes the world go around
var play = function(game,speed) {
  clearTimeout(game.time);
  if (speed == 0) {
    return ;
  } else {
    var delay = speed;
    game = forwardOneStep(game)
    game.time = setTimeout(function () {
      play(game,speed);
    }, delay);
  }
}



// this stops the world going round
function stopForward(){
  clearTimeout(gameClock)
}


function toggleDisplayVorts(game) {
  game.displayVorts = !game.displayVorts
  drawGrid(game)
  if (game.displayVorts) {
    displayVortsButton.innerHTML = "hide vorts"
  } else {
    displayVortsButton.innerHTML = "show vorts"
  }
}


// setting up the game variables

var currentGame = {};
currentGame.displayVorts = true;

currentGame.grid = randomGrid(gridSize)

currentGame.vorts = getVorts(currentGame.grid)
currentGame.displayVortLocs = false;
vortLocs.innerHTML = vortString(currentGame.vorts)
vortNum.innerHTML = "# vortices: " + currentGame.vorts.length.toString()

currentGame.frames = [currentGame.grid]
currentGame.loopFound = false
currentGame.loopLength = -1

drawGrid(currentGame)



function getCustomLevel() {
  str = "[";
  for (var i = 0; i < gridSize; i++) {
    str += "["
    for (var j = 0; j < gridSize; j++) {
      if (j != gridSize-1) {
        str+= currentGame.grid[i][j].toString() + ","
      } else {
        str+= currentGame.grid[i][j].toString()
      }
    }
    if (i != gridSize-1) {
      str += "], \r\n"
    } else {
      str += "]"
    }

  }
  str += "]"
  document.getElementById('customLevelInput').value = str;
}



function setCustomLevel() {
  var newGame = {};
  newGame.displayVorts = currentGame.displayVorts;

  gridStr = document.getElementById('customLevelInput').value
  newGame.grid = JSON.parse(gridStr)

  newGame.vorts = getVorts(newGame.grid)
  vortNum.innerHTML = "# vortices: " + newGame.vorts.length.toString()

  newGame.frames = [newGame.grid]
  newGame.loopFound = false
  newGame.loopLength = -1

  drawGrid(newGame)

  document.getElementById("loopFound").style.display = "none"
  document.getElementById("timeTillLoop").style.display = "none"

  currentGame = newGame
  play(currentGame,0)
}


//
