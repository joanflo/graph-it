
// data
var xmlDocData;
var dataFile;

// scores
var xmlDocScores;
var scoresFile;

// solutons
var xmlDocSolutions;
var solutionsFile;

var maxCategories;
var levelsPerCategory;


var FREE = -1;
var OCCUPY = -2;


function openDataFiles() {
    // settings
    var loadSettings = new Windows.Data.Xml.Dom.XmlLoadSettings;
    loadSettings.prohibitDtd = false;
    loadSettings.resolveExternals = false;

    // get data file
    var uri1 = new Windows.Foundation.Uri('ms-appx:///data/data.xml');
    Windows.Storage.StorageFile.getFileFromApplicationUriAsync(uri1).then(function (file) {
        return file;
    }).done(function (file) {
        dataFile = file;

        Windows.Data.Xml.Dom.XmlDocument.loadFromFileAsync(file, loadSettings).then(function (doc) {
            xmlDocData = doc;

            // get scores file
            Windows.Storage.ApplicationData.current.roamingFolder.getFileAsync("scores.xml").then(function (file) {
                return file;
            }).done(function (file) {
                scoresFile = file;

                Windows.Data.Xml.Dom.XmlDocument.loadFromFileAsync(file, loadSettings).then(function (doc) {
                    xmlDocScores = doc;
                }, false);
            }, function (error) {

                // file doesn't exists, let's create it
                Windows.Storage.ApplicationData.current.roamingFolder.createFileAsync("scores.xml", Windows.Storage.CreationCollisionOption.replaceExisting).then(function (file) {

                    var auxDOM = xmlDocData.getElementsByTagName('category');
                    var maxCategories = auxDOM.length;
                    auxDOM = auxDOM[0].getElementsByTagName('level');
                    var itemsPerCateory = auxDOM.length;

                    var memoryStream = new Windows.Storage.Streams.InMemoryRandomAccessStream();
                    var dataWriter = new Windows.Storage.Streams.DataWriter(memoryStream);

                    var NEW_LINE = "\n";
                    var TAB = "\t";
                    var strScores = '<?xml version="1.0" encoding="utf-8"?>'
                                    + NEW_LINE
                                    + "<scores>"
                                    + NEW_LINE;

                    for (var x = 0; x < maxCategories; x++) {
                        strScores += TAB + "<category>" + NEW_LINE;
                        for (var y = 0; y < itemsPerCateory; y++) {
                            strScores += TAB + TAB + '<level moves="0" code="' + x + '-' + y + '"/>' + NEW_LINE;
                        }
                        strScores += TAB + "</category>" + NEW_LINE + NEW_LINE;
                    }

                    strScores += "</scores>";
                    dataWriter.writeString(strScores);

                    var buffer = dataWriter.detachBuffer();
                    dataWriter.close();

                    Windows.Storage.FileIO.writeBufferAsync(file, buffer).done(function (file) {
                        openDataFiles();
                    });
                });
            });

        }, false);
    }, false);

    /*
    var loadSettings = new Windows.Data.Xml.Dom.XmlLoadSettings;
    loadSettings.prohibitDtd = false;
    loadSettings.resolveExternals = false;

    // get data file
    var uri1 = new Windows.Foundation.Uri('ms-appx:///data/data.xml');
    Windows.Storage.StorageFile.getFileFromApplicationUriAsync(uri1).then(function (file) {
        return file;
    }).done(function (file) {
        dataFile = file;

        Windows.Data.Xml.Dom.XmlDocument.loadFromFileAsync(file, loadSettings).then(function (doc) {
            xmlDocData = doc;
        }, false);
    }, function (error) {
        console.log("error 1");
    });

    // get scores file
    Windows.Storage.ApplicationData.current.roamingFolder.getFileAsync("scores.xml").then(function (file) {
        return file;
    }).done(function (file) {
        scoresFile = file;

        Windows.Data.Xml.Dom.XmlDocument.loadFromFileAsync(file, loadSettings).then(function (doc) {
            xmlDocScores = doc;
        }, false);
    }, function (error) {
        // file doesn't exists, let's create it
        var uri2 = new Windows.Foundation.Uri('ms-appx:///data/scores.xml');
        Windows.Storage.StorageFile.getFileFromApplicationUriAsync(uri2).then(function (file) {
            return file;
        }).done(function (file) {
            file.copyAsync(Windows.Storage.ApplicationData.current.roamingFolder).then(function (file) {
                scoresFile = file;
                Windows.Data.Xml.Dom.XmlDocument.loadFromFileAsync(file, loadSettings).then(function (doc) {
                    xmlDocScores = doc;
                }, false);
            });
        }, function (error) {
            console.log("error 2");
        });
    });
    */
}


function saveDataFile() {
    xmlDocScores.saveToFileAsync(scoresFile);
}


// info (array): name, size, level moves (array)
function getCategoryList() {
    var xmlCategory = xmlDocData.getElementsByTagName('category');
    maxCategories = xmlCategory.length;
    var categoryList = new Array(xmlCategory.length);
    var xmlScoreCategory = xmlDocScores.getElementsByTagName('category');

    for (var i = 0; i < xmlCategory.length; i++) {
        var category = new Object();
        category.name = xmlCategory[i].getAttribute("name");
        category.size = xmlCategory[i].getAttribute("size");

        var xmlLevel = xmlCategory[i].getElementsByTagName('level');
        category.levelList = new Array(xmlLevel.length);
        var xmlScoreLevel = xmlScoreCategory[i].getElementsByTagName('level');

        for (var j = 0; j < xmlLevel.length; j++) {
            var level = new Object();
            level.code = xmlLevel[j].getAttribute("code");
            level.moves = xmlScoreLevel[j].getAttribute("moves");
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

    var xmlCategory = xmlDocData.getElementsByTagName('category')[levelCode[0]];
    levelsPerCategory = xmlCategory.getElementsByTagName('level').length;
    var xmlScoreCategory = xmlDocScores.getElementsByTagName('category')[levelCode[0]];
    var xmlLevel = xmlCategory.getElementsByTagName('level')[levelCode[1]];
    var xmlScoreLevel = xmlScoreCategory.getElementsByTagName('level')[levelCode[1]];

    level.moves = xmlScoreLevel.getAttribute("moves");
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

    var xmlScoreCategory = xmlDocScores.getElementsByTagName('category')[levelCode[0]];
    var xmlScoreLevel = xmlScoreCategory.getElementsByTagName('level')[levelCode[1]];
    xmlScoreLevel.setAttribute("moves", moves);

    saveDataFile();
}


function createSolutionsFile() {
    // file doesn't exists, let's create it
    Windows.Storage.ApplicationData.current.roamingFolder.createFileAsync("solutions.xml", Windows.Storage.CreationCollisionOption.replaceExisting).then(function (file) {

        var auxDOM = xmlDocData.getElementsByTagName('category');
        var maxCategories = auxDOM.length;
        auxDOM = auxDOM[0].getElementsByTagName('level');
        var itemsPerCateory = auxDOM.length;

        var memoryStream = new Windows.Storage.Streams.InMemoryRandomAccessStream();
        var dataWriter = new Windows.Storage.Streams.DataWriter(memoryStream);

        var NEW_LINE = "\n";
        var TAB = "\t";
        var strSolutions = '<?xml version="1.0" encoding="utf-8"?>'
                        + NEW_LINE
                        + "<solutions>"
                        + NEW_LINE;

        for (var x = 0; x < maxCategories; x++) {
            strSolutions += TAB + "<category>" + NEW_LINE;
            for (var y = 0; y < itemsPerCateory; y++) {
                strSolutions += TAB + TAB + '<level code="' + x + '-' + y + '">' + NEW_LINE;
                strSolutions += TAB + TAB + '</level>' + NEW_LINE;
            }
            strSolutions += TAB + "</category>" + NEW_LINE + NEW_LINE;
        }

        strSolutions += "</solutions>";
        dataWriter.writeString(strSolutions);

        var buffer = dataWriter.detachBuffer();
        dataWriter.close();

        Windows.Storage.FileIO.writeBufferAsync(file, buffer).done(function (file) {
            console.log("saved correctly");
        });
    });
}


function openSolutionsFile() {
    if (solutionsFile == undefined) {
        // settings
        var loadSettings = new Windows.Data.Xml.Dom.XmlLoadSettings;
        loadSettings.prohibitDtd = false;
        loadSettings.resolveExternals = false;

        // get solutions file
        var uri = new Windows.Foundation.Uri('ms-appx:///data/solutions.xml');
        Windows.Storage.StorageFile.getFileFromApplicationUriAsync(uri).then(function (file) {
            return file;
        }).done(function (file) {
            solutionsFile = file;

            Windows.Data.Xml.Dom.XmlDocument.loadFromFileAsync(file, loadSettings).then(function (doc) {
                xmlDocSolutions = doc;
            }, false);
        }, false);
    }
}


function addSolution(levelCode, pipes) {
    levelCode = levelCode.split('-');
    
    var NEW_LINE = "\n";
    var TAB = "\t";
    var strLevel = TAB + TAB + '<level code="' + levelCode[0] + '-' + levelCode[1] + '">' + NEW_LINE;
    for (var x = 0; x < pipes.length; x++) {
        var pipe = pipes[x];
        strLevel += TAB + TAB + TAB + '<solution pair="' + x + '">' + NEW_LINE;
        for (var y = 0; y < pipe.length; y++) {
            strLevel += TAB + TAB + TAB + TAB + '<path position="' + pipe[y][0] + "x" + pipe[y][1] + '"/>' + NEW_LINE;
        }
        strLevel += TAB + TAB + TAB + '</solution>' + NEW_LINE;
    }
    strLevel += TAB + TAB + '</level>' + NEW_LINE;

    console.log(strLevel);
}


function getLevelSolution(levelCode) {
    levelCode = levelCode.split('-');

    var xmlSolutionCategory = xmlDocSolutions.getElementsByTagName('category')[levelCode[0]];
    var xmlSolutionLevel = xmlSolutionCategory.getElementsByTagName('level')[levelCode[1]];

    var xmlSolutions = xmlSolutionLevel.getElementsByTagName('solution');
    var pipes = new Array(xmlSolutions.length);
    for (var x = 0; x < xmlSolutions.length; x++) {

        var xmlPaths = xmlSolutions[x].getElementsByTagName('path');
        var pipe = new Array(xmlPaths.length);
        for (var y = 0; y < xmlPaths.length; y++) {
            var position = xmlPaths[y].getAttribute('position');
            position = position.split('x');
            var objPos = new Object();
            objPos.i = position[0];
            objPos.j = position[1];
            pipe[y] = objPos;
        }

        pipes[x] = pipe;
    }

    return pipes;
}




// no used:

var pathsMatrix;
var currentPair;
var numCells;
var cartesianProd;
function solveLevel(size, dots) {
    // INITIALIZING DATA STRUCTURES
    // pipes & paths
    var dotsPairsNumber = dots.length / 2;
    var pipes = new Array(dotsPairsNumber);
    pathsMatrix = new Array(dotsPairsNumber);
    for (var x = 0; x < dotsPairsNumber; x++) {
        pathsMatrix[x] = new Array();
    }
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

    // SOLVING LEVEL
    // get all individual solutions for each dot pair
    for (var x = 0; x < dotsPairsNumber; x++) {
        // get both pair dots position
        var dotPositions = getDotsPairPositions(x, dots);
        // calculate all valid paths between both dots
        var lastPos = dotPositions.last;
        currentPair = x;
        boardMatrix[lastPos.i][lastPos.j] = FREE;
        calculatePaths(new Array(dotPositions.first), dotPositions.first, lastPos, boardMatrix);
        boardMatrix[lastPos.i][lastPos.j] = x;
    }

    // JOINING PARTIAL SOLUTIONS
    // trying different combinations of paths of each dot pair to find one that fills the entire board
    var solved = false;
    numCells = size.i * size.j;
    //cartesianProd = new Array();
    var combinations = cartesianProductOf(pathsMatrix);
    //var combinations = cartesianProduct(pathsMatrix);
    //cartesianProduct(new Array(), 0);
    var x = 0;
    while (!solved && x < combinations.length) {
        var combAux = combinations[x];
        if (isPossibleSolution(combAux)) {
            if (isSolution(cloneMatrix(boardMatrix), combAux)) {
                solved = true;
                pipes = combAux;
            }
        }
        x++;
    }
    
    // RETURNING SOLUTION
    if (solved) {
        return pipes;
    } else {
        return -1;
    }
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


function calculatePaths(path, pos, lastPos, boardMatrix) {
    //console.log("[" + pos.i + ", " + pos.j + "]");

    // heuristics
    if (path.length > 15) {
        return;
    }

    // depth-first tree traversal
    if (isLastPosition(pos, lastPos)) {
        // solution
        var pathAux = cloneArray(path); // clone: cannot use splice(0) cause only works if the array contains simple data types
        pathsMatrix[currentPair].push(pathAux);
    } else {
        var positions = getValidContiguousPositions(pos, boardMatrix);
        // For each neighbor
        for (var x = 0; x < positions.length; x++) {
            var posAux = positions[x];
            boardMatrix[posAux.i][posAux.j] = OCCUPY;
            path.push(posAux);
            calculatePaths(path, posAux, lastPos, boardMatrix);
            path.splice(path.length - 1, 1);
            boardMatrix[posAux.i][posAux.j] = FREE;
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


function cloneArray(arr) {
    var arrAux = new Array();
    for (var x = 0; x < arr.length; x++) {
        arrAux[x] = new Object();
        arrAux[x].i = arr[x].i;
        arrAux[x].j = arr[x].j;
    }
    return arrAux;
}


function cloneMatrix(mat) {
    var matAux = new Array();
    for (var x = 0; x < mat.length; x++) {
        matAux[x] = new Array();
        for (var y = 0; y < mat[x].length; y++) {
            matAux[x][y] = mat[x][y];
        }
    }
    return matAux;
}


function cartesianProductOf(arguments) {
    return Array.prototype.reduce.call(arguments, function (a, b) {
        var ret = [];
        a.forEach(function (a) {
            b.forEach(function (b) {
                ret.push(a.concat([b]));
            });
        });
        return ret;
    }, [[]]);
}


function cartesianProduct(combAux, n) {
    if (n == pathsMatrix.length) { // pathsMatrix.length == pipes number
        if (isPossibleSolution(combAux)) {
            // save possible soluton
            cartesianProd.push(cloneMatrix(combAux));
        }
    } else {
        for (var x = 0; x < pathsMatrix[n].length; x++) { // for each path
            var path = pathsMatrix[n][x];
            combAux.push(path);
            cartesianProduct2(combAux, n + 1);
            combAux.splice(combAux.length - 1, 1);
        }
    }
}


function isPossibleSolution(combination) {
    var sum = 0;
    for (var x = 0; x < combination.length; x++) {
        sum += combination[x].length;
    }
    return sum == numCells;
}


function isSolution(boardMatrix, paths) {
    var cellsNumber = boardMatrix.length * boardMatrix[0].length;
    var cellsCount = paths.length * 2; // initial dot number
    var validBoard = true;

    // for each path
    var x = 0;
    while (validBoard && x < paths.length) {
        var path = paths[x];
        // for each position
        var y = 1;
        while (validBoard && y < path.length - 1) {
            var pos = path[y];
            var cell = boardMatrix[pos.i][pos.j];
            switch (cell) {
                case FREE:
                    cellsCount++;
                    boardMatrix[pos.i][pos.j] = OCCUPY;
                    break;
                default:
                    validBoard = false;
                    break;
            }
            y++;
        }
        x++;
    }

    // filled entire board?
    return cellsCount == cellsNumber;
}