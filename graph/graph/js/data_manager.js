

var xmlDoc;
var dataFile;


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
    var xmlLevel = xmlCategory.getElementsByTagName('level')[levelCode[1]];

    level.moves = xmlLevel.getAttribute("moves");
    var xmlDot = xmlLevel.getElementsByTagName('dot');
    level.best = xmlDot.length / 2; // dots/2 = pipeline number

    var dotList = new Array(xmlDot.length);
    for (var i = 0; i < xmlDot.length; i++) {
        var dot = new Object();
        dot.pair = xmlDot[i].getAttribute("pair");

        dot.position = new Object();
        var posAux = xmlDot[i].getAttribute("position");
        posAux = posAux.split('x');
        dot.position.i = posAux[0];
        dot.position.j = posAux[1];

        dotList[i] = dot;
    }
    level.dots = dotList;

    return level;
}


function setLevelMoves(levelCode, moves) {
    levelCode = levelCode.split('-');

    var xmlCategory = xmlDoc.getElementsByTagName('category')[levelCode[0]];
    var xmlLevel = xmlCategory.getElementsByTagName('level')[levelCode[1]];
    xmlLevel.setAttribute("moves", moves);

    saveDataFile();
}