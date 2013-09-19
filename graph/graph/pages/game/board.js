
// ============ cell codes ============
var CELL_EMPTY = -1;
// dot = {0, 0, ..., dots.length - 1}
// dot_with_background = {dots.length , dots.length + 1, ..., dots.length*2 - 1}
// pipe = {dots.length*2 , dots.length*2 + 1, ..., dots.length *3 - 1}

// ====================================


/* Builder */
function Board(level) {

    this.n = level.size.i;
    this.m = level.size.j;

    this.boardMatrix = new Array(this.n);
    for (var i = 0; i < this.n; i++) {
        this.boardMatrix[i] = new Array(this.m);
        for (var j = 0; j < this.m; j++) {
            this.setCell(CELL_EMPTY, i, j);
        }
    }

    var dots = level.dots;
    this.dotsPairsNumber = dots.length / 2;
    for (var i = 0; i < dots.length; i++) {
        this.setCell(dots[i].pair, dots[i].position.i, dots[i].position.j);
    }

    this.dotColors = ["#E51400", "#F0A30A", "#00A000", "#1FAEFF", "#DA46DA"];
    this.dotBgImages = this.loadBackgroundImages();

    var gameBoard = document.getElementById("board");
    this.canvasCtx = gameBoard.getContext("2d");

    this.boardWidth = gameBoard.clientWidth;
    this.boardHeight = gameBoard.clientHeight;

    this.cellWidth = this.boardWidth / this.n;
    this.cellHeight = this.boardHeight / this.m;

    this.drawBoard();

    this.oldCell;
    this.pointerDown = false;
    this.currentDot = CELL_EMPTY;
}


Board.prototype.update = function (x, y, evtType) {
    var cell = this.localizeCell(x, y);

    switch (evtType) {
        case "MSPointerMove":
            if (this.pointerDown && this.oldCell != cell) {
                this.oldCell = cell;

                // user drawing a pipe
                cellCode = this.getCell(cell.i, cell.j);
                cellCode = parseInt(cellCode);
                if (cellCode == CELL_EMPTY || cellCode == this.currentDot) {
                    this.setCell(cellCode + this.dotsPairsNumber * 2, cell.i, cell.j); // convenction
                }
            }
            break;
        case "MSPointerDown":
            cellCode = this.getCell(cell.i, cell.j);
            cellCode = parseInt(cellCode);
            if (this.isDot(cellCode)) {
                this.currentDot = cellCode;

                // adding background
                this.setCell(cellCode + this.dotsPairsNumber, cell.i, cell.j); // convenction
            }
            this.pointerDown = true;
            break;
        case "MSPointerUp":
            this.pointerDown = false;
            this.currentDot = CELL_EMPTY;
            break;
    }

    this.drawBoard();
};


Board.prototype.drawBoard = function () {
    this.clearBoard();

    this.drawBoardLines();

    // draw board matrix
    for (var i = 0; i < this.n; i++) {
        for (var j = 0; j < this.m; j++) {
            var cell = this.getCell(i, j);
            this.drawCell(cell, i, j);
        }
    }
};


Board.prototype.clearBoard = function () {
    this.canvasCtx.fillStyle = '#000000';
    this.canvasCtx.fillRect(0, 0, this.boardWidth, this.boardHeight);
};


Board.prototype.drawBoardLines = function () {
    this.canvasCtx.fillStyle = '#F96400';
    for (var i = 0; i <= this.n; i++) { // horitzontal
        this.drawLine(0, (i * this.cellHeight) - 2, this.boardWidth, 4);
    }
    for (var j = 0; j <= this.m; j++) { // vertical
        this.drawLine((j * this.cellWidth) - 2, 0, 4, this.boardHeight);
    }
};


Board.prototype.drawLine = function (x1, y1, x2, y2) {
    this.canvasCtx.fillRect(x1, y1, x2, y2);
};


Board.prototype.drawCell = function (cellCode, i, j) {
    if (cellCode == CELL_EMPTY) {
        // null

    } else if (this.isDot(cellCode)) {
        this.drawDot(cellCode, i, j);

    } else if (this.isBackgroundDot(cellCode)) {
        this.drawBackground(cellCode, i, j);
        this.drawDot(cellCode % this.dotsPairsNumber, i, j); // convenction

    } else if (this.isPipe(cellCode)) {
        this.drawPipe(cellCode % this.dotsPairsNumber, i, j); // convenction

    } else if (this.isBackgroundPipe(cellCode)) {
        this.drawBackground(cellCode, i, j); // convenction
        this.drawPipe(cellCode % this.dotsPairsNumber, i, j); // convenction
    }
};


Board.prototype.isDot = function (cellCode) {
    return cellCode >= 0 && cellCode <= this.dotsPairsNumber - 1;
};


Board.prototype.isBackgroundDot = function (cellCode) {
    return cellCode >= this.dotsPairsNumber && cellCode <= (this.dotsPairsNumber * 2) - 1;
};


Board.prototype.isPipe = function (cellCode) {
    return cellCode >= this.dotsPairsNumber * 2 && cellCode <= (this.dotsPairsNumber * 3) - 1;
};


Board.prototype.isBackgroundPipe = function (cellCode) {
    return cellCode >= this.dotsPairsNumber * 3 && cellCode <= (this.dotsPairsNumber * 4) - 1;
};


Board.prototype.drawBackground = function (pair, i, j) {
    var image = this.selectColorOrImage(pair);
    var initX = i * this.cellHeight;
    var initY = j * this.cellWidth;
    this.canvasCtx.drawImage(image, initX, initY, this.cellWidth, this.cellHeight);
};


Board.prototype.drawDot = function (pair, i, j) {
    this.canvasCtx.fillStyle = this.selectColorOrImage(pair);
    this.canvasCtx.beginPath();
    var centerX = (i * this.cellHeight) + (this.cellHeight / 2);
    var centerY = (j * this.cellWidth) + (this.cellWidth / 2);
    var radio = (this.cellHeight / 2) * 0.7;
    this.canvasCtx.arc(centerX, centerY, radio, 0, 2 * Math.PI);
    this.canvasCtx.fill();
};


Board.prototype.drawPipe = function (pair, i, j) {
    this.canvasCtx.fillStyle = this.selectColorOrImage(pair);

    // orientation ? guardar tuberia a un array, si estam colocant el troç i-essim
    // llavors miram el (i-1)-essim i (i+1)-essim, de manera que sapiguem la orientacio
    // i poguem fer un dibuix o un altre

    // alpha channel!
    this.canvasCtx.fillRect(x1, y1, x2, y2);
};


Board.prototype.selectColorOrImage = function (pair) {
    pair = parseInt(pair);

    if (this.isDot(pair)) {
        return this.dotColors[pair];
    } else if (this.isBackgroundDot(pair)) {
        return this.dotBgImages[pair % this.dotsPairsNumber]; // convenction
    } else {
        return "#000000";
    }
};


Board.prototype.localizeCell = function (x, y) {
    cell = new Object();
    cell.i = Math.floor(x / this.cellWidth);
    cell.j = Math.floor(y / this.cellWidth);
    return cell;
};


Board.prototype.setCell = function (cellCode, i, j) {
    this.boardMatrix[i][j] = cellCode;
};


Board.prototype.getCell = function (i, j) {
    return this.boardMatrix[i][j];
};


Board.prototype.loadBackgroundImages = function () {
    var bgImages = new Array(this.dotsPairsNumber);
    for (var i = 0; i < this.dotsPairsNumber; i++) {
        bgImages[i] = loadImage("game/bg" + i + ".png");
    }
    return bgImages;
};