
(function () {
    "use strict";

    // markers
    var flowsMarker;
    var fillMarker;
    var bestMarker;
    var movesMarker;

    // time
    var oldTimeEpoch;
    var requestId;
    var then;
    var FPS = 8;
    var intervalFPS = 1000 / FPS;

    // game
    var doterama = new Object();
    doterama.startGame = function (fn, fps) {
        oldTimeEpoch = Date.now();
        then = oldTimeEpoch;
        mainLoop(0);
    }
    doterama.stopGame = function () {
        cancelAnimationFrame(requestId);
    }

    // game elements
    var board;
    var levelInfo;
    var level;
    var pipesSolved;



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
            pipesSolved = 0;

            // share contract
            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.addEventListener("datarequested", dataRequested);

            doterama.startGame();
        },

        unload: function () {
            doterama.stopGame();

            // share contract
            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.removeEventListener("datarequested", dataRequested);
        },

        updateLayout: function (element, viewState, lastViewState) {

        }

    });


    function mainLoop(time) {
        requestId = requestAnimationFrame(mainLoop);

        var now = Date.now();
        var deltaTime = now - then;

        if (deltaTime > intervalFPS) { // limiting fps
            then = now - (deltaTime % intervalFPS);

            // render
            board.drawBoard();

            // markers
            updateMarkers(board.getGameInfo());
        }
    }


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
                listenSound(CLICK_SOUND);
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
                        doterama.stopGame();
                        previousLevel();
                        break;
                    case "cmdRestart":
                        doterama.stopGame();
                        restartLevel();
                        break;
                    case "cmdNext":
                        doterama.stopGame();
                        nextLevel();
                        break;
                }
                break;
        }
    }


    function askUseHelp() {
        var t = new Date().getTime();
        var pipes = solveLevel(level.size, level.dots);
        console.log(t);
        console.log(new Date().getTime() - t);
        board.setPipe(pipes[pipesSolved], pipesSolved);
        pipesSolved++;


        board.setPipe(pipes[pipesSolved], pipesSolved);
        pipesSolved++;
        board.setPipe(pipes[pipesSolved], pipesSolved);
        pipesSolved++;
        board.setPipe(pipes[pipesSolved], pipesSolved);
        pipesSolved++;
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
            doterama.stopGame();
            listenSound(LEVEL_COMPLETED_SOUND);

            if (gameInfo.moves < level.moves || level.moves == 0) { // new record
                var levelCode = levelInfo[0] + "-" + levelInfo[1];
                setLevelMoves(levelCode, gameInfo.moves);
            }

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

            setTimeout(function () {
                msg.showAsync();
            }, 800);
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
        level = getLevelInfo(levelInfo[0] + "-" + levelInfo[1]);
        initMarkers(level);
        board = new Board(level);
        pipesSolved = 0;
        doterama.startGame();
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


    function dataRequested(e) {
        var request = e.request;

        var localImage = "ms-appx:///images/logo_header.png";
        request.data.properties.title = "Doterama";
        request.data.properties.description = "Just having fun playing at Doterama!";

        var htmlValues = Windows.ApplicationModel.DataTransfer.HtmlFormatHelper.createHtmlFormat(
              "<img style='display:block;margin:auto;' src=\'" + localImage + "\'> "
            + "<p style='font-weight:bold;color:#fff;font-size:20px;padding:50px;margin:5px;background-color:#F96400;'>"
            + "I'm playing at Doterama application for Windows 8! "
            + "<a href='http://win8privacygenerator.azurewebsites.net/privacy?dev=Unity%20Makes%20Software&app=Doterama&mail=am9hbi5nLmZsb3JpdEBnbWFpbC5jb20=&lng=En'>Download it</a>"
            + " and join me!"
            + "</p>");
        var text = "I'm playing at Doterama application for Windows 8! Download it and join me!";

        request.data.setHtmlFormat(htmlValues);
        request.data.setText(text);

        var streamRef = Windows.Storage.Streams.RandomAccessStreamReference.createFromUri(new Windows.Foundation.Uri(localImage));
        request.data.resourceMap[localImage] = streamRef;
    }


})();
