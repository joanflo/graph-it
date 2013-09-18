

var lettersImages;
var numbersImages;
var dotImage;
var exclamationImage;
var interrogationImage;


function loadCharacterImages() {

    // alphabet
    var arrAux = new Array("A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
                           "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z");
    lettersImages = new Array();
    for (var i = 0; i < arrAux.length; i++) {
        lettersImages[i] = loadImage("text/" + arrAux[i] + ".png");
    }

    // numbers
    arrAux = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9");
    numbersImages = new Array();
    for (var i = 0; i < arrAux.length; i++) {
        numbersImages[i] = loadImage("text/" + arrAux[i] + ".png");
    }

    // others characters
    dotImage = loadImage("text/dot.png");
    exclamationImage = loadImage("text/exclamation.png");
    interrogationImage = loadImage("text/interrogation.png");
}


function loadImage (imagePath) {
    var image = new Image();
    image.src = "images/" + imagePath;
    image.onload = function () {

    };
    return image;
}


function drawString(message, container, wordHeight) {
    var charCode;
    var image;
    for (var i = 0; i < message.length; i++) {
        charCode = message.charCodeAt(i);
        image = convertCharToImage(charCode);
        if (image == -1) {
            // new line
            var new_line = document.createElement("div");
            new_line.className = "text_image1";
            container.appendChild(new_line);
        } else if (image == -2) {
            // space
            var separator = document.createElement("div");
            separator.className = "text_image2";
            container.appendChild(separator);
        } else {
            var imageAux = document.createElement("img");
            var scaleRatio = wordHeight / image.height;
            imageAux.src = image.src;
            imageAux.height = wordHeight;
            imageAux.width = image.width * scaleRatio;
            imageAux.className = "text_image";

            container.appendChild(imageAux);
        }
    }
}


function convertCharToImage(charCode) {
    if (charCode >= 'A'.charCodeAt(0) && charCode <= 'Z'.charCodeAt(0)) { // alphabet
        return lettersImages[charCode - 'A'.charCodeAt(0)];

    } else if (charCode >= 'a'.charCodeAt(0) && charCode <= 'z'.charCodeAt(0)) { // alphabet (key sensitive)
        return lettersImages[charCode - 'a'.charCodeAt(0)];

    } else if (charCode >= '0'.charCodeAt(0) && charCode <= '9'.charCodeAt(0)) { // numbers
        return numbersImages[charCode - '0'.charCodeAt(0)];

    } else { // others
        switch (charCode) {
            case 46: // dot
                return dotImage;
                break;
            case 33: // exclamation
                return exclamationImage;
                break;
            case 63: // interrogation
                return interrogationImage;
                break;
            case 95: // character '_' means new_line
                return -1;
                break;
            default: // space or not accepted characters
                return -2;
                break;
        }
    }

}


function processString(str) {
    var strArray = str.split(" ");

    if (strArray.length > 1) { //more than one word
        var acum = 0;
        var strAux = "";
        for (var i = 0; i < strArray.length; i++) {

            acum += strArray[i].length;
            if (acum > 8) { //word too much large
                strAux = strAux.substring(0, strAux.length - 1);
                strAux = strAux.concat("_" + strArray[i]);
                acum = strArray[i].length;
            } else {
                strAux = strAux.concat(strArray[i]);
            }

            if (i < strArray.length - 1) {
                strAux = strAux.concat(" ");
                acum++;
            }
        }
        return strAux;

    } else {
        return str;
    }
}