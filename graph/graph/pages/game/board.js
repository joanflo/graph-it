
// cell types
var CELL_EMPTY = 0;
var CELL_DOT = 1;
var CELL_BACKGROUND_DOT = 2;
var CELL_PIPE = 3;
var CELL_BACKGROUND_PIPE = 4;

// cell codes = {0, 1, ..., max_pipes}

// pipe orientation
var NORTH = 0;
var SOUTH = 1;
var EAST = 2;
var WEST = 3;
var NORTH_EAST = 4;
var NORTH_WEST = 5;
var SOUTH_EAST = 6;
var SOUTH_WEST = 7;
var NORTH_SOUTH = 8;
var EAST_WEST = 9;



/* ============================================================
=========================== BUILDER ===========================
============================================================ */


function Board(level) {

    // level size
    this.n = level.size.i;
    this.m = level.size.j;

    // board matrix (CELL_EMPTY by default)
    this.boardMatrix = new Array(this.n);
    for (var i = 0; i < this.n; i++) {
        this.boardMatrix[i] = new Array(this.m);
        for (var j = 0; j < this.m; j++) {
            this.setCell(CELL_EMPTY, null, i, j);
        }
    }
    // adding dots position to board matrix
    var dots = level.dots;
    for (var i = 0; i < dots.length; i++) {
        this.setCell(CELL_DOT, dots[i].pair, dots[i].position.i, dots[i].position.j);
    }

    // number of dot pairs = maximum number of pipes
    this.dotsPairsNumber = dots.length / 2;

    // colors & images (index corresponds to pair number)
    this.dotColors = ["#E51400", "#F0A30A", "#00A000", "#1FAEFF", "#DA46DA"];
    this.backgroundImages = this.loadBackgroundImages();

    // canvas
    var gameBoard = document.getElementById("board");
    this.canvasCtx = gameBoard.getContext("2d");
    this.boardWidth = gameBoard.clientWidth;
    this.boardHeight = gameBoard.clientHeight;
    this.cellWidth = this.boardWidth / this.n;
    this.cellHeight = this.boardHeight / this.m;

    // pipes related variables
    this.isDrawingPipe = false;
    this.currentCellCode;
    this.oldCellPos;
    this.pipes = new Array(this.dotsPairsNumber);
    for (var i = 0; i < this.dotsPairsNumber; i++) {
        this.pipes[i] = null;
    }

    // draw initial board
    this.drawBoard();
}




/* ============================================================
========================== FUNCTIONS ==========================
============================================================ */


Board.prototype.update = function (x, y, evtType) {
    var cellPos = this.localizeCell(x, y);

    switch (evtType) {
        case "MSPointerMove":

            if (this.isDrawingPipe && !this.isSamePosition(this.oldCellPos, cellPos)) {
                this.oldCellPos = cellPos;

                var cell = this.getCell(cellPos[0], cellPos[1]);
                switch (cell.type) {
                    case CELL_EMPTY:
                        this.updatePipe(this.currentCellCode, cellPos[0], cellPos[1]);
                        this.setCell(CELL_PIPE, this.currentCellCode, cellPos[0], cellPos[1]);
                        break;

                    case CELL_DOT:
                        if (cell.code == this.currentCellCode) { // same dot code (pipe completed)
                            this.updatePipe(cell.code, cellPos[0], cellPos[1]);
                            this.setCell(CELL_BACKGROUND_DOT, this.currentCellCode, cellPos[0], cellPos[1]);
                        }
                        break;

                    case CELL_BACKGROUND_DOT:
                        if (cell.code == this.currentCellCode) { // same dot code
                            this.updatePipe(cell.code, cellPos[0], cellPos[1]);
                        }
                        break;

                    case CELL_PIPE:
                        this.updatePipe(this.currentCellCode, cellPos[0], cellPos[1]);
                        this.setCell(CELL_PIPE, this.currentCellCode, cellPos[0], cellPos[1]);
                        if (cell.code != this.currentCellCode) { // deleting another pipe
                            this.deletePipe(cell.code, cellPos[0], cellPos[1]);
                        }
                        break;

                    case CELL_BACKGROUND_PIPE:
                        this.updatePipe(this.currentCellCode, cellPos[0], cellPos[1]);
                        this.setCell(CELL_PIPE, this.currentCellCode, cellPos[0], cellPos[1]);
                        if (cell.code != this.currentCellCode) { // deleting another pipe
                            this.deletePipe(cell.code, cellPos[0], cellPos[1]);
                        }
                        break;
                }
            }

            break;
        case "MSPointerDown":
            this.oldCellPos = cellPos;

            if (this.isDrawingPipe) {
                // pipe finished
                this.isDrawingPipe = false;
                this.currentCellCode = null;
                //this.pipes[this.currentCellCode] = null;

            } else {
                // pipe started
                this.isDrawingPipe = true;


                var cell = this.getCell(cellPos[0], cellPos[1]);
                switch (cell.type) {
                    case CELL_EMPTY:
                        // null
                        break;

                    case CELL_DOT:
                        this.currentCellCode = cell.code;
                        this.updatePipe(cell.code, cellPos[0], cellPos[1]);
                        this.setCell(CELL_BACKGROUND_DOT, cell.code, cellPos[0], cellPos[1]);
                        break;

                    case CELL_BACKGROUND_DOT:
                        this.currentCellCode = cell.code;
                        this.updatePipe(cell.code, cellPos[0], cellPos[1]);
                        break;

                    case CELL_PIPE:
                        this.currentCellCode = cell.code;
                        this.updatePipe(cell.code, cellPos[0], cellPos[1]);
                        this.setCell(CELL_BACKGROUND_PIPE, cell.code, cellPos[0], cellPos[1]);
                        break;

                    case CELL_BACKGROUND_PIPE:
                        this.currentCellCode = cell.code;
                        this.updatePipe(cell.code, cellPos[0], cellPos[1]);
                        break;
                }
            }


            break;
        case "MSPointerUp":
            // null
            break;
    }

    this.drawBoard();
};


Board.prototype.updatePipe = function (pair, i, j) {
    var pipe = this.pipes[pair];
    if (pipe == null) {
        pipe = new Array();
    }

    var position = [i, j];
    // checking previous conditions before push new position
    if (this.indexOfObject(pipe, position) == -1 &&  // not existing yet
        this.areContiguousPositions(pipe[pipe.length - 1], position)) { // contiguous positions
        pipe.push(position);
    }

    this.pipes[pair] = pipe;
};


Board.prototype.deletePipe = function (pair, i, j) {
    var pipe = this.pipes[pair];

    // deleting pipe positions cutted by another pipe
    var position = [i, j];
    var index = this.indexOfObject(pipe, position);
    var posNum = pipe.length;
    for (var x = index; x < posNum; x++) {
        if (x != index) {
            var posAux = pipe[index];
            this.setCell(CELL_EMPTY, pair, posAux[0], posAux[1]);
        }
        pipe.splice(index, 1);
    }

    /*
    // checking if all pipe positions are contiguous (assuming that are in order)
    if (pipe.length >= 2) { // otherwise contiguous particular case
        for (var x = 1; x < pipe.length; x++) {
            if (!this.areContiguousPositions(pipe[x - 1], pipe[x])) {
                pipe.splice(x, 1);
                x--;
            }
        }
    }
    */

    // empty pipe?
    if (pipe.length == 0) {
        pipe = null;
    }

    this.pipes[pair] = pipe;
};


Board.prototype.areContiguousPositions = function (pos1, pos2) {
    if (pos1 == undefined) {
        return true;
    }

    var x1 = pos1[0];
    var y1 = pos1[1];
    var x2 = pos2[0];
    var y2 = pos2[1];

    if (x2 == x1 && y2 == y1 + 1) { // North
        return true;
    } else if (x2 == x1 && y2 == y1 - 1) { // South
        return true;
    } else if (x2 == x1 + 1 && y2 == y1) { // West
        return true;
    } else if (x2 == x1 - 1 && y2 == y1) { // East
        return true;
    } else {
        return false;
    }
};


Board.prototype.getPipeOrientation = function (pair, i, j) {
    var pipe = this.pipes[pair];

    var currentPos = [i, j];
    var index = this.indexOfObject(pipe, currentPos);
    if (index > 0) { // not a single cell pipe

        var previousPos = pipe[index - 1];
        var nextPos = pipe[index + 1];
        if (nextPos == undefined) {

            if (currentPos[0] > previousPos[0]) { // x1 > x2
                return WEST;
            } else if (currentPos[0] < previousPos[0]) { // x1 < x2
                return EAST;
            } else { // x1 = x2
                if (currentPos[1] > previousPos[1]) { // y1 > y2
                    return NORTH;
                } else if (currentPos[1] < previousPos[1]) { // y1 < y2
                    return SOUTH;
                }
            }

        } else {
            
            if (currentPos[0] > previousPos[0]) { // x1 > x2

                if (nextPos[0] > currentPos[0]) { // x3 > x1
                    return EAST_WEST;
                } else { // x3 = x1 (never x3 < x1)
                    if (nextPos[1] > currentPos[1]) { // y3 > y1
                        return SOUTH_WEST;
                    } else if (nextPos[1] < currentPos[1]) { // y3 < y1
                        return NORTH_WEST;
                    }
                }

            } else if (currentPos[0] < previousPos[0]) { // x1 < x2

                if (nextPos[0] < currentPos[0]) { // x3 < x1
                    return EAST_WEST;
                } else { // x3 = x1 (never x3 > x1)
                    if (nextPos[1] > currentPos[1]) { // y3 > y1
                        return SOUTH_EAST;
                    } else if (nextPos[1] < currentPos[1]) { // y3 < y1
                        return NORTH_EAST;
                    }
                }

            } else { // x1 = x2
                if (currentPos[1] > previousPos[1]) { // y1 > y2

                    if (nextPos[1] > currentPos[1]) { // y3 > y1
                        return NORTH_SOUTH;
                    } else { // y3 = y1 (never y3 < y1)
                        if (nextPos[0] > currentPos[0]) { // x3 > x1
                            return NORTH_EAST;
                        } else if (nextPos[0] < currentPos[0]) { // x3 < x1
                            return NORTH_WEST;
                        }
                    }

                } else if (currentPos[1] < previousPos[1]) { // y1 < y2

                    if (nextPos[1] < currentPos[1]) { // y3 < y1
                        return NORTH_SOUTH;
                    } else { // y3 = y1 (never y3 > y1)
                        if (nextPos[0] > currentPos[0]) { // x3 > x1
                            return SOUTH_EAST;
                        } else if (nextPos[0] < currentPos[0]) { // x3 < x1
                            return SOUTH_WEST;
                        }
                    }

                }
            }

        }
    } else { // dot pipe

    }
};


Board.prototype.drawBoard = function () {
    // clear board
    this.canvasCtx.fillStyle = '#000000';
    this.canvasCtx.fillRect(0, 0, this.boardWidth, this.boardHeight);

    // draw board lines
    this.canvasCtx.fillStyle = '#F96400';
    for (var i = 0; i <= this.n; i++) { // horitzontal
        this.drawLine(0, (i * this.cellHeight) - 2, this.boardWidth, 4);
    }
    for (var j = 0; j <= this.m; j++) { // vertical
        this.drawLine((j * this.cellWidth) - 2, 0, 4, this.boardHeight);
    }

    // draw board matrix
    for (var i = 0; i < this.n; i++) {
        for (var j = 0; j < this.m; j++) {
            var cell = this.getCell(i, j);
            this.drawCell(cell.type, cell.code, i, j);
        }
    }
};


Board.prototype.drawCell = function (cellType, cellCode, i, j) {
    switch (cellType) {
        case CELL_EMPTY:
            // nothing to draw
            break;
        case CELL_DOT:
            this.drawDot(cellCode, i, j);
            break;
        case CELL_BACKGROUND_DOT:
            this.drawBackground(cellCode, i, j);
            this.drawDot(cellCode, i, j);
            break;
        case CELL_PIPE:
            this.drawPipe(cellCode, i, j);
            break;
        case CELL_BACKGROUND_PIPE:
            this.drawBackground(cellCode, i, j);
            this.drawPipe(cellCode, i, j);
            break;
    }
};





/* ============================================================
===================== AUXILIARY FUNCTIONS =====================
============================================================ */


// shape drawing functions

Board.prototype.drawLine = function (x1, y1, x2, y2) {
    this.canvasCtx.fillRect(x1, y1, x2, y2);
};

Board.prototype.drawDot = function (pair, i, j) {
    this.canvasCtx.fillStyle = this.dotColors[pair];
    this.canvasCtx.beginPath();
    var centerX = (i * this.cellWidth) + (this.cellWidth / 2);
    var centerY = (j * this.cellHeight) + (this.cellHeight / 2);
    var radio = (this.cellHeight / 2) * 0.7;
    this.canvasCtx.arc(centerX, centerY, radio, 0, 2 * Math.PI);
    this.canvasCtx.fill();
};

Board.prototype.drawBackground = function (pair, i, j) {
    var image = this.backgroundImages[pair];
    var initX = i * this.cellWidth;
    var initY = j * this.cellHeight;
    this.canvasCtx.drawImage(image, initX, initY, this.cellWidth, this.cellHeight);
};

Board.prototype.drawPipe = function (pair, i, j) {
    this.canvasCtx.fillStyle = this.dotColors[pair];

    // center circle
    this.canvasCtx.beginPath();
    var centerX = (i * this.cellWidth) + (this.cellWidth / 2);
    var centerY = (j * this.cellHeight) + (this.cellHeight / 2);
    var radio = (this.cellHeight / 2) * 0.4;

    // path orientation
    var orientation = this.getPipeOrientation(pair, i, j);
    switch (orientation) {
        case NORTH:
            this.drawNorth(radio, i, j);
            break;

        case SOUTH:
            this.drawSouth(radio, i, j);
            break;

        case EAST:
            this.drawEast(radio, i, j);
            break;

        case WEST:
            this.drawWest(radio, i, j);
            break;

        case NORTH_EAST:
            this.drawNorth(radio, i, j);
            this.drawEast(radio, i, j);
            break;

        case NORTH_WEST:
            this.drawNorth(radio, i, j);
            this.drawWest(radio, i, j);
            break;

        case SOUTH_EAST:
            this.drawSouth(radio, i, j);
            this.drawEast(radio, i, j);
            break;

        case SOUTH_WEST:
            this.drawSouth(radio, i, j);
            this.drawWest(radio, i, j);
            break;

        case NORTH_SOUTH:
            this.drawNorth(radio, i, j);
            this.drawSouth(radio, i, j);
            break;

        case EAST_WEST:
            this.drawEast(radio, i, j);
            this.drawWest(radio, i, j);
            break;
    }

    if (orientation != undefined) {
        this.canvasCtx.arc(centerX, centerY, radio, 0, 2 * Math.PI);
        this.canvasCtx.fill();
    } else {
        this.setCell(CELL_EMPTY, pair, i, j);
    }
};

Board.prototype.drawNorth = function (radio, i, j) {
    var x1 = (i * this.cellWidth) + (this.cellWidth - (radio * 2)) / 2;
    var y1 = j * this.cellHeight;
    var x2 = radio * 2;
    var y2 = this.cellHeight / 2;
    this.canvasCtx.fillRect(x1, y1 - 1, x2, y2 + 1);
};

Board.prototype.drawSouth = function (radio, i, j) {
    var x1 = (i * this.cellWidth) + (this.cellWidth - (radio * 2)) / 2;
    var y1 = j * this.cellHeight + this.cellHeight / 2;
    var x2 = radio * 2;
    var y2 = this.cellHeight / 2;
    this.canvasCtx.fillRect(x1, y1, x2, y2 + 1);
};

Board.prototype.drawEast = function (radio, i, j) {
    var x1 = (i * this.cellWidth) + (this.cellWidth / 2);
    var y1 = (j * this.cellHeight) + (this.cellHeight - (radio * 2)) / 2;
    var x2 = this.cellWidth / 2;
    var y2 = radio * 2;
    this.canvasCtx.fillRect(x1, y1, x2 + 1, y2);
};

Board.prototype.drawWest = function (radio, i, j) {
    var x1 = i * this.cellWidth;
    var y1 = (j * this.cellHeight) + (this.cellHeight - (radio * 2)) / 2;
    var x2 = this.cellWidth / 2;
    var y2 = radio * 2;
    this.canvasCtx.fillRect(x1 - 1, y1, x2 + 1, y2);
};



// cell functions

Board.prototype.localizeCell = function (x, y) {
    var i = Math.floor(x / this.cellWidth);
    var j = Math.floor(y / this.cellWidth);
    return [i, j];
};

Board.prototype.setCell = function (cellType, cellCode, i, j) {
    var cell = new Object();
    cell.type = cellType;
    cell.code = cellCode;
    this.boardMatrix[i][j] = cell;
};

Board.prototype.getCell = function (i, j) {
    return this.boardMatrix[i][j];
};



// other functions

Board.prototype.loadBackgroundImages = function () {
    var bgImages = new Array(this.dotsPairsNumber);
    for (var i = 0; i < this.dotsPairsNumber; i++) {
        bgImages[i] = loadImage("game/bg" + i + ".png");
    }
    return bgImages;
};

Board.prototype.isSamePosition = function (cellPos1, cellPos2) {
    return (cellPos1[0] == cellPos2[0]) && (cellPos1[1] == cellPos2[1]);
};

Board.prototype.indexOfObject = function (vector, element) {
    var i = 0;
    var found = false;
    while (i < vector.length && !found) {
        if (this.isSamePosition(vector[i], element)) {
            found = true;
        } else {
            i++;
        }
    }
    if (found) {
        return i;
    } else {
        return -1;
    }
};
