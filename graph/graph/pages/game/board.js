
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
    for (var x = 0; x < dots.length; x++) {
        this.setCell(CELL_DOT, dots[x].pair, dots[x].position.i, dots[x].position.j);
    }

    // number of dot pairs = maximum number of pipes
    this.dotsPairsNumber = dots.length / 2;

    // colors & images (index corresponds to pair number)
    this.dotColors = ["#E51400", "#F0A30A", "#00A000", "#1FAEFF", "#DA46DA", "#647687", "#8C0020", "#FF0089", "#163D0C", "#300073", "#FFFFFF", "#F56600", "#825A2C", "#310E43", "#BDB76B"];
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
    this.oldCellCode = -1;
    this.oldCellPos;
    this.pipes = new Array(this.dotsPairsNumber);
    for (var i = 0; i < this.dotsPairsNumber; i++) {
        this.pipes[i] = null;
    }

    // markers
    this.moves = 0;

    // draw initial board
    this.drawBoard();
}



/* ============================================================
========================== FUNCTIONS ==========================
============================================================ */

Board.prototype.update = function (x, y, evtType) {
    var cellPos = this.localizeCell(x, y);
    var i = cellPos[0];
    var j = cellPos[1];
    var cellPos = [i, j];
    var cell = this.getCell(i, j);

    // is current cell contiguous (4-connect) to the last cell?
    if (this.areContiguousCells(this.oldCellPos, cellPos)) {
        //this.oldCellPos = [i, j];
    } else {
        //this.isDrawingPipe = false;
        //return;
    }

    switch (evtType) {
        case "MSPointerMove":
            if (this.isDrawingPipe && !this.isSamePosition(this.oldCellPos, cellPos)) {
                this.oldCellPos = cellPos;

                switch (cell.type) {
                    case CELL_EMPTY:
                        // adding new pipe, no checkings required
                        this.updatePipeOnEmpty(this.currentCellCode, i, j);
                        break;
                    case CELL_DOT:
                        // we're over a dot with the same or different cell code
                        this.updatePipeOnDot(this.currentCellCode, i, j);
                        break;
                    case CELL_BACKGROUND_DOT:
                        // we're over a different point of another pair
                        this.updatePipeOnDot(this.currentCellCode, i, j);
                        this.oldCellPos = undefined;
                        break;
                    case CELL_PIPE:
                        // breaking a no finished different pipe or coming back in the current pipe
                        this.updatePipeOnPipe(this.currentCellCode, i, j);
                        break;
                    case CELL_BACKGROUND_PIPE:
                        // breaking a completed pipe (no current pipe)
                        this.updatePipeOnPipe(this.currentCellCode, i, j);
                        break;
                }
            }
            break;

        case "MSPointerDown":
            this.currentCellCode = cell.code;
            this.oldCellPos = cellPos;

            switch (cell.type) {
                case CELL_EMPTY:
                    this.isDrawingPipe = false;
                    break;
                case CELL_DOT:
                case CELL_BACKGROUND_DOT:
                    // starting new pipe
                    this.startPipe(cell.code, i, j);
                    this.isDrawingPipe = true;
                    break;
                case CELL_PIPE:
                case CELL_BACKGROUND_PIPE:
                    // continuing pipe
                    this.continuePipe(cell.code, i, j);
                    this.isDrawingPipe = true;
                    break;
            }
            break;

        case "MSPointerUp":
            if (this.isDrawingPipe) {
                switch (cell.type) {
                    case CELL_DOT:
                    case CELL_BACKGROUND_DOT:
                        // check if pipe is completed. If it is, fill his background.
                        this.completePipe(cell.code);
                        break;
                }
                if (this.currentCellCode != this.oldCellCode) {
                    this.oldCellCode = this.currentCellCode;
                    this.moves++;
                }
            }
            this.currentCellCode = undefined;
            this.oldCellPos = undefined;
            this.isDrawingPipe = false;
            break;
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
            this.drawPipe(cellCode, i, j);
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



// pipe functions

Board.prototype.startPipe = function (cellCode, i, j) {
    var pipe = this.pipes[cellCode];
    if (pipe != null) {
        var firstPos = pipe[0];
        this.deletePipe(cellCode, firstPos[0], firstPos[1]);
    }

    pipe = new Array();
    var pos = [i, j];

    // adding first position
    pipe.push(pos);
    this.setCell(CELL_BACKGROUND_DOT, cellCode, i, j);

    this.pipes[cellCode] = pipe;
};

Board.prototype.continuePipe = function (cellCode, i, j) {
    var pipe = this.pipes[cellCode];
    var pos = [i, j];

    var index = this.indexOfObject(pipe, pos);
    if (!this.isLastPosition(pipe, index)) {
        // deleting all positions from 'pos'
        this.deletePipe(cellCode, i, j);    // TODO: pipe = this.... necessari?
        // setting all previous positions before 'pos'
        var firstPos = pipe[0];
        this.setCell(CELL_BACKGROUND_DOT, cellCode, firstPos[0], firstPos[1]);
        for (var x = 1; x < index - 1; x++) {
            var posAux = pipe[x];
            this.setCell(CELL_PIPE, cellCode, posAux[0], posAux[1]);
        }
        // adding new position
        pipe.push(pos);
        this.setCell(CELL_PIPE, cellCode, i, j);
    }

    this.pipes[cellCode] = pipe;
};

Board.prototype.deletePipe = function (cellCode, i, j) {
    var pipe = this.pipes[cellCode];
    var pos = [i, j];

    // deleting all positions from 'index'
    var index = this.indexOfObject(pipe, pos);
    if (index != -1) {
        var length = pipe.length;
        for (var x = index; x < length; x++) {
            var posAux = pipe[index];
            var cellAux = this.getCell(posAux[0], posAux[1]);
            switch (cellAux.type) {
                case CELL_PIPE:
                case CELL_BACKGROUND_PIPE:
                    this.setCell(CELL_EMPTY, cellCode, posAux[0], posAux[1]);
                    break;
                case CELL_DOT:
                case CELL_BACKGROUND_DOT:
                    this.setCell(CELL_DOT, cellCode, posAux[0], posAux[1]);
                    break;
            }
            pipe.splice(index, 1);
        }

        this.pipes[cellCode] = pipe;
    }
};

Board.prototype.completePipe = function (cellCode) {
    var pipe = this.pipes[cellCode];
    if (pipe.length == 1) {
        return;
    }

    var firstPos = pipe[0];
    var lastPos = pipe[pipe.length - 1];

    var firstCell = this.getCell(firstPos[0], firstPos[1]);
    var lastCell = this.getCell(lastPos[0], lastPos[1]);

    // check if pipe is completed
    if ((firstCell.type == CELL_DOT || firstCell.type == CELL_BACKGROUND_DOT)
        && (lastCell.type == CELL_DOT || lastCell.type == CELL_BACKGROUND_DOT)) {
        // complete pipe filling his background
        this.setCell(CELL_BACKGROUND_DOT, cellCode, firstPos[0], firstPos[1]); // initial dot
        for (var x = 1; x < pipe.length - 1; x++) { // intermediate pipes
            var posAux = pipe[x];
            this.setCell(CELL_BACKGROUND_PIPE, cellCode, posAux[0], posAux[1]); // final dot
        }
        this.setCell(CELL_BACKGROUND_DOT, cellCode, lastPos[0], lastPos[1]); // final dot

        // sound
        listenSound(PIPE_COMPLETED_SOUND);
    }
};

Board.prototype.updatePipeOnEmpty = function (cellCode, i, j) {
    this.setCell(CELL_PIPE, cellCode, i, j);
    this.pipes[cellCode].push([i, j]);
};

Board.prototype.updatePipeOnDot = function (cellCode, i, j) {
    var cell = this.getCell(i, j);
    if (cell.code == cellCode) {
        // over a dot with the same cell code
        var pipe = this.pipes[cellCode];
        var pos = [i, j];
        var index = this.indexOfObject(pipe, pos);
        if (this.isFirstPosition(index)) {
            // over initial dot (we're come back)
            if (pipe.length > 0) {
                this.deletePipe(cellCode, i, j);
                pipe = null;
                this.oldCellPos = undefined;
                this.isDrawingPipe = false;
            }
        } else {
            // over final dot
            this.setCell(CELL_BACKGROUND_DOT, cellCode, i, j);
            pipe.push(pos);
        }
        this.pipes[cellCode] = pipe;

    } else {
        // over a dot with different cell code
        this.oldCellPos = undefined;
        this.isDrawingPipe = false;
    }
};

Board.prototype.updatePipeOnPipe = function (cellCode, i, j) {
    var pipe = this.pipes[cellCode];

    // case:
    // 1.- over a pipe with the same cell code: we're coming back in the current pipe
    // 2.- over a pipe with different cell code: breaking a no finished different pipe
    // 3.- breaking a completed pipe (no current pipe)
    var cell = this.getCell(i, j);
    if (cell.code != cellCode && cell.type == CELL_BACKGROUND_PIPE) { // 3.-
        listenSound(PIPE_BROKEN_SOUND);
    } else { // 1.- and 2.-
        listenSound(PIPE_BACK_SOUND);
    }
    this.deletePipe(cell.code, i, j);
    // adding new pipe
    this.setCell(CELL_PIPE, cellCode, i, j);
    pipe.push([i, j]);

    this.pipes[cellCode] = pipe;
};

Board.prototype.getPipeOrientation = function (pair, i, j) {
    var pipe = this.pipes[pair];

    var currentPos = [i, j];
    var index = this.indexOfObject(pipe, currentPos);
    if (index > 0) { // not a single cell pipe

        if (index == 1) {
            this.drawPipe(pair, pipe[0][0], pipe[0][1]);
        }

        var previousPos = pipe[index - 1];
        var nextPos = pipe[index + 1];
        if (nextPos == undefined) {

            return this.compareRelativePositions(currentPos, previousPos);
            /*
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
            */
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

        if (pipe.length > 1) {
            return this.compareRelativePositions(pipe[0], pipe[1]);
        }

    }
};

Board.prototype.setPipe = function (pipe, cellCode) {

};



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

Board.prototype.getGameInfo = function () {
    var gameInfo = new Object();

    // filled %
    var filledCells = 0;
    for (var i = 0; i < this.n; i++) {
        for (var j = 0; j < this.m; j++) {
            var cell = this.getCell(i, j);
            switch (cell.type) {
                case CELL_BACKGROUND_DOT:
                case CELL_PIPE:
                case CELL_BACKGROUND_PIPE:
                    filledCells++;
                    break;
            }
        }
    }

    // completed pipes
    var completedPipes = 0;
    for (var i = 0; i < this.pipes.length; i++) {
        var pipe = this.pipes[i];
        if (pipe != null && pipe.length > 1) {
            var pos = pipe[0];
            var firstCell = this.getCell(pos[0], pos[1]);
            pos = pipe[pipe.length - 1];
            var lastCell = this.getCell(pos[0], pos[1]);
            if (firstCell.type == lastCell.type && !(this.isDrawingPipe && this.currentCellCode == i)) {
                completedPipes++;
            }
        }
    }

    gameInfo.flows = completedPipes;
    gameInfo.fill = Math.round((100 * filledCells) / (this.n * this.m));
    gameInfo.moves = this.moves;

    return gameInfo;
}

Board.prototype.compareRelativePositions = function (pos1, pos2) {
    if (pos1[0] > pos2[0]) { // x1 > x2
        return WEST;
    } else if (pos1[0] < pos2[0]) { // x1 < x2
        return EAST;
    } else { // x1 = x2
        if (pos1[1] > pos2[1]) { // y1 > y2
            return NORTH;
        } else if (pos1[1] < pos2[1]) { // y1 < y2
            return SOUTH;
        }
    }
};

Board.prototype.areContiguousCells = function (pos1, pos2) {
    if (pos1 == undefined || pos2 == undefined) {
        return false;
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

Board.prototype.isLastPosition = function (pipe, index) {
    return (pipe.length - 1) == index;
};

Board.prototype.isFirstPosition = function (index) {
    return 0 == index;
};