

(function () {
    "use strict";


    var flowsMarker;
    var fillMarker;
    var bestMarker;
    var movesMarker;

    var board;
    var levelInfo;
    var level;


    WinJS.UI.Pages.define("/pages/game/game.html", {

        ready: function (element, levelCode) {

            levelInfo = levelCode.split('-');
            var intLevelInfo = parseInt(levelInfo[1]) + 1;
            drawString("Level " + intLevelInfo + ".", document.getElementById('pagetitle'), 45);
            level = getLevelInfo(levelCode);

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
            document.getElementById('confirmHelp').addEventListener("click", askUseHelp, true);

        },

        unload: function () {
            // TODO: Respond to navigations away from this page.
        },

        updateLayout: function (element, viewState, lastViewState) {
            // TODO: Respond to changes in viewState.
        }
    });


    function controlManager(evt) {
        
        switch (evt.type) {
            case "MSPointerMove":
            case "MSPointerDown":
            case "MSPointerUp":
                // touch & left mouse button only
                if (evt.pointerType == evt.MSPOINTER_TYPE_TOUCH || evt.button == 0 || evt.type == "MSPointerMove") {
                    board.update(evt.offsetX, evt.offsetY, evt.type);
                    updateMarkers(board.getGameInfo());
                }
                break;

            case "click":
                switch (evt.target.id) {
                    case "cmdHelp":
                        //askUseHelp();
                        break;
                    case "cmdHome":
                        WinJS.Navigation.navigate("pages/home/home.html", "yes");
                        break;
                    case "cmdSound":
                        WinJS.UI.SettingsFlyout.showSettings("settings", "/pages/settings/settings.html");
                        break;
                    case "cmdPrevious":
                        previousLevel();
                        break;
                    case "cmdRestart":
                        restartLevel();
                        break;
                    case "cmdNext":
                        nextLevel();
                        break;
                }
                break;
        }
    }


    function askUseHelp() {
        // TODO
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
        var imgMarker = document.getElementById('img_marker');
        if (imgMarker.firstChild) {
            imgMarker.removeChild(imgMarker.firstChild);
        }
        imgMarker.appendChild(imageAux);

        movesMarker = document.getElementById('moves').getElementsByTagName('b')[0];
        updateMarker(movesMarker, "0");
    }


    function updateMarkers(gameInfo) {
        updateMarker(flowsMarker, gameInfo.flows + " / " + level.best);
        updateMarker(fillMarker, gameInfo.fill + " %");
        updateMarker(bestMarker, level.moves);
        updateMarker(movesMarker, gameInfo.moves);

        // level completed?
        if (gameInfo.flows == level.best) {

            var msg = new Windows.UI.Popups.MessageDialog("Congrats! You completed the level in " + level.moves + " moves.", "Level Completed");
            msg.commands.append(new Windows.UI.Popups.UICommand("< Previous level", function (command) {
                previousLevel();
            }, 0));
            msg.commands.append(new Windows.UI.Popups.UICommand("Play again", function (command) {
                restartLevel();
            }, 1));
            msg.commands.append(new Windows.UI.Popups.UICommand("Next level >", function (command) {
                nextLevel();
            }, 2));

            //Set the command to be invoked when a user presses ESC
            msg.cancelCommandIndex = 2;
            //Set the command that will be invoked by default
            msg.defaultCommandIndex = 2;

            msg.showAsync();
        }
    }


    function updateMarker(marker, value) {
        marker.innerText = value;
    }


    function previousLevel() {
        levelInfo[1]--;
        if (levelInfo[1] < 0) {
            levelInfo[1] = levelsPerCategory - 1;
            levelInfo[0]--;
            if (levelInfo[0] < 0) {
                levelInfo[0] = maxCategories - 1;
            }
        }

        var levelCode = levelInfo[0] + "-" + levelInfo[1];
        document.getElementById('pagetitle').innerText = "";
        drawString("Level " + (levelInfo[1] + 1) + ".", document.getElementById('pagetitle'), 45);
        level = getLevelInfo(levelCode);

        restartLevel();
    }


    function restartLevel() {
        initMarkers(level);
        board = new Board(level);
    }


    function nextLevel() {
        levelInfo[1]++;
        if (levelInfo[1] == levelsPerCategory) {
            levelInfo[1] = 0;
            levelInfo[0]++;
            if (levelInfo[0] == maxCategories) {
                levelInfo[0] = 0;
            }
        }

        var levelCode = levelInfo[0] + "-" + levelInfo[1];
        document.getElementById('pagetitle').innerText = "";
        drawString("Level " + (levelInfo[1] + 1) + ".", document.getElementById('pagetitle'), 45);
        level = getLevelInfo(levelCode);

        restartLevel();
    }


})();
