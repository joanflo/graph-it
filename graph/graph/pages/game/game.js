

(function () {
    "use strict";


    var flowsMarker;
    var fillMarker;
    var bestMarker;
    var movesMarker;

    var board;


    WinJS.UI.Pages.define("/pages/game/game.html", {

        ready: function (element, levelCode) {

            var levelInfo = levelCode.split('-');
            drawString("Level " + (++levelInfo[1]) + ".", document.getElementById('pagetitle'), 45);
            var level = getLevelInfo(levelCode);

            // markers
            initMarkers(level);

            // board
            board = new Board(level);

            // touchscreen events
            var gameBoard = document.getElementById("board");
            gameBoard.addEventListener("MSPointerDown", controlManager, false);
            gameBoard.addEventListener("MSPointerUp", controlManager, false);
            gameBoard.addEventListener("MSPointerMove", controlManager, false);
            var gesture = new MSGesture();
            gesture.target = gameBoard;

            // app bar icons
            var buttons = document.getElementsByTagName('button');
            for (var i = 1; i < buttons.length; i++) { //ignore win-back-button
                buttons[i].addEventListener("click", controlManager, true);
            }

        },

        unload: function () {
            // TODO: Respond to navigations away from this page.
        },

        updateLayout: function (element, viewState, lastViewState) {
            // TODO: Respond to changes in viewState.
        }
    });

    var x = 0;
    function controlManager(evt) {
        
        switch (evt.type) {
            case "MSPointerMove":
            case "MSPointerDown":
            case "MSPointerUp":
                // touch & left mouse button only
                if (evt.pointerType == evt.MSPOINTER_TYPE_TOUCH || evt.button == 0 || evt.type == "MSPointerMove") {
                    board.update(evt.offsetX, evt.offsetY, evt.type);
                }
                break;

            case "click":
                switch (evt.target.id) {
                    case "cmdHelp":
                        break;
                    case "cmdHome":
                        WinJS.Navigation.navigate("pages/home/home.html", "yes");
                        break;
                    case "cmdSound":
                        WinJS.UI.SettingsFlyout.showSettings("settings", "/pages/settings/settings.html");
                        break;
                    case "cmdPrevious":
                        break;
                    case "cmdRestart":
                        break;
                    case "cmdNext":
                        break;
                }
                break;
        }
    }


    function initMarkers(level) {
        flowsMarker = document.getElementById('flows').getElementsByTagName('b')[0];
        updateMarker(flowsMarker, "0 / " + level.best);

        fillMarker = document.getElementById('fill').getElementsByTagName('b')[0];
        updateMarker(fillMarker, "0 %");

        bestMarker = document.getElementById('best').getElementsByTagName('b')[0];
        var imageAux = document.createElement("img");
        imageAux.className = "marker";
        if (level.moves > 0) {
            updateMarker(bestMarker, level.moves);
            if (level.moves == level.best) {
                imageAux.src = "/images/level/trophy_gold2.png";
            } else if (level.moves == level.best + 1) {
                imageAux.src = "/images/level/trophy_silver2.png";
            } else if (level.moves >= level.best + 2) {
                imageAux.src = "/images/level/trophy_bronze2.png";
            }
        } else {
            updateMarker(bestMarker, "-");
            imageAux.src = "/images/level/empty.png";
        }
        document.getElementById('img_marker').appendChild(imageAux);

        movesMarker = document.getElementById('moves').getElementsByTagName('b')[0];
        updateMarker(movesMarker, "0");
    }


    function updateMarker(marker, value) {
        marker.innerText = value;
    }


})();
