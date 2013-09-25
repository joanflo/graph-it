

var xmlDoc;
var dataFile;

var maxCategories;
var levelsPerCategory;


function openDataFile() {
    Windows.Storage.ApplicationData.current.roamingFolder.getFileAsync("data.xml")
        .then(function (file) {
            return file;
        }).done(function (file) {
            dataFile = file;

            var loadSettings = new Windows.Data.Xml.Dom.XmlLoadSettings;
            loadSettings.prohibitDtd = false;
            loadSettings.resolveExternals = false;

            Windows.Data.Xml.Dom.XmlDocument.loadFromFileAsync(file, loadSettings).then(function (doc) {
                xmlDoc = doc;
            }, false);
        }, false);
}


function saveDataFile() {
    xmlDoc.saveToFileAsync(dataFile);
}


// info (array): name, size, level moves (array)
function getCategoryList() {
    var xmlCategory = xmlDoc.getElementsByTagName('category');
    maxCategories = xmlCategory.length;
    var categoryList = new Array(xmlCategory.length);

    for (var i = 0; i < xmlCategory.length; i++) {
        var category = new Object();
        category.name = xmlCategory[i].getAttribute("name");
        category.size = xmlCategory[i].getAttribute("size");

        var xmlLevel = xmlCategory[i].getElementsByTagName('level');
        category.levelList = new Array(xmlLevel.length);

        for (var j = 0; j < xmlLevel.length; j++) {
            var level = new Object();
            level.code = xmlLevel[j].getAttribute("code");
            level.moves = xmlLevel[j].getAttribute("moves");
            var xmlDot = xmlLevel[j].getElementsByTagName('dot');
            level.best = xmlDot.length / 2; // dots/2 = pipeline number
            category.levelList[j] = level;
        }

        categoryList[i] = category;
    }

    return categoryList;
}



// info: moves, best, dots (array --> pair, position)
function getLevelInfo(levelCode) {
    var level = new Object();
    levelCode = levelCode.split('-');

    var xmlCategory = xmlDoc.getElementsByTagName('category')[levelCode[0]];
    levelsPerCategory = xmlCategory.getElementsByTagName('level').length;
    var xmlLevel = xmlCategory.getElementsByTagName('level')[levelCode[1]];

    level.moves = xmlLevel.getAttribute("moves");
    var xmlDot = xmlLevel.getElementsByTagName('dot');
    level.best = xmlDot.length / 2; // dots/2 = pipeline number

    var dotList = new Array(xmlDot.length);
    for (var i = 0; i < xmlDot.length; i++) {
        var dot = new Object();
        dot.pair = parseInt(xmlDot[i].getAttribute("pair"));

        dot.position = new Object();
        var posAux = xmlDot[i].getAttribute("position");
        posAux = posAux.split('x');
        dot.position.i = parseInt(posAux[0]);
        dot.position.j = parseInt(posAux[1]);

        dotList[i] = dot;
    }
    level.dots = dotList;

    level.size = new Object();
    var sizeAux = xmlCategory.getAttribute("size");
    sizeAux = sizeAux.split('x');
    level.size.i = sizeAux[0];
    level.size.j = sizeAux[1];

    return level;
}


function setLevelMoves(levelCode, moves) {
    levelCode = levelCode.split('-');

    var xmlCategory = xmlDoc.getElementsByTagName('category')[levelCode[0]];
    var xmlLevel = xmlCategory.getElementsByTagName('level')[levelCode[1]];
    xmlLevel.setAttribute("moves", moves);

    saveDataFile();
}






function createRandomLevels(size, pairDotsNumber) {
    /* RULES:
        - Two dots of the same pair can not stay in contiguous cells
        - A level can be solved <====> you can complete all flows & fill the entire board
    */

}



var FREE = -1;
var OCCUPY = -2;
function solveLevel(size, dots) {
    // INITIALIZING DATA STRUCTURES
    // pipes & paths
    var dotsPairsNumber = dots.length / 2;
    var pipes = new Array(dotsPairsNumber);
    var pathsMatrix = new Array(dotsPairsNumber);
    // board matrix
    var boardMatrix = new Array(size.i);
    for (var i = 0; i < size.i; i++) {
        boardMatrix[i] = new Array(size.j);
        for (var j = 0; j < size.j; j++) {
            boardMatrix[i][j] = FREE;
        }
    }
    for (var x = 0; x < dots.length; x++) {
        var i = dots[x].position.i;
        var j = dots[x].position.j;
        boardMatrix[i][j] = dots[x].pair;
    }
    /*
    boardMatrix[3][0] = OCCUPY;
    boardMatrix[3][1] = OCCUPY;
    boardMatrix[3][2] = OCCUPY;
    boardMatrix[4][2] = OCCUPY;
    boardMatrix[4][3] = OCCUPY;
    boardMatrix[4][4] = OCCUPY;
    */

    // SOLVING LEVEL
    // get all individual solutions for each dot pair
    for (var x = 0; x < dotsPairsNumber; x++) {
        // get both pair dots position
        var dotPositions = getDotsPairPositions(x, dots);
        // calculate all valid paths between both dots
        var lastPos = dotPositions.last;
        boardMatrix[lastPos.i][lastPos.j] = FREE;
        pathsMatrix[x] = calculatePaths(dotPositions.first, lastPos, boardMatrix);
        boardMatrix[lastPos.i][lastPos.j] = x;
    }
    
    // trying different combinations of paths of each dot pair to find one that fills the entire board
    /* TODO !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    var solved = false;
    var i = 0;
    var maxCombinations = 0;
    var combination = new Array(dotsPairsNumber);
    for (var x = 0; x < dotsPairsNumber; x++) {
        maxCombinations += pathsMatrix[x].length;
    }
    while (!solved && i < maxCombinations) {
        for (var x = 0; x < dotsPairsNumber; x++) {

            combination[x].push(path[x][counter[x]]);

        }
        if (isSolution(combination)) {
            solved = true;
        }
        i++;
    }
    

    // returning solution
    if (solved) {
        return pipes;
    } else {
        return -1;
    }*/
}


function getDotsPairPositions(pair, dots) {
    var positions = new Object();
    var i = 0;
    var found = false;
    var num = 0;

    while (!found && i < dots.length) {
        if (dots[i].pair == pair) {
            switch (num) {
                case 0:
                    positions.first = dots[i].position;
                    num++;
                    break;
                case 1:
                    positions.last = dots[i].position;
                    found = true;
                    break;
            }
        }
        i++;
    }

    return positions;
}


function calculatePaths(pos, lastPos, boardMatrix) {
    console.log("[" + pos.i + ", " + pos.j + "]");

    // depth-first tree traversal
    if (isLastPosition(pos, lastPos)) {
        // solution
        console.log("exit!");
    } else {
        var positions = getValidContiguousPositions(pos, boardMatrix);
        // For each neighbor
        for (var x = 0; x < positions.length; x++) {
            var pos = positions[x];
            boardMatrix[pos.i][pos.j] = OCCUPY;
            calculatePaths(pos, lastPos, boardMatrix);
            boardMatrix[pos.i][pos.j] = FREE;
        }
    }
}


function getValidContiguousPositions(pos, boardMatrix) {
    var n = boardMatrix.length;
    var m = boardMatrix[0].length;
    var i = pos.i;
    var j = pos.j;

    // 4-connect [pos.i, pos.j]
    var positions = new Array();
    // EAST [pos.i + 1, pos.j]
    if (i + 1 < n && boardMatrix[i + 1][j] == FREE) {
        positions.push({
            i: i + 1,
            j: j
        });
    }
    // WEST [pos.i - 1, pos.j]
    if (i - 1 >= 0 && boardMatrix[i - 1][j] == FREE) {
        positions.push({
            i: i - 1,
            j: j
        });
    }
    // NORTH [pos.i, pos.j - 1]
    if (j - 1 >= 0 && boardMatrix[i][j - 1] == FREE) {
        positions.push({
            i: i,
            j: j - 1
        });
    }
    // SOUTH [pos.i, pos.j + 1]
    if (j + 1 < m && boardMatrix[i][j + 1] == FREE) {
        positions.push({
            i: i,
            j: j + 1
        });
    }

    return positions;
}


function isLastPosition(pos1, pos2) {
    return (pos1.i == pos2.i) && (pos1.j == pos2.j);
}