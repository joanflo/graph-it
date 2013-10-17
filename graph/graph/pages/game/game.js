
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
            var body = document.getElementsByTagName('body')[0];
            body.addEventListener("MSPointerUp", controlManager, false);
            gameBoard.addEventListener("MSPointerMove", controlManager, false);
            var gesture = new MSGesture();
            gesture.target = gameBoard;

            // app bar icons
            var buttons = document.getElementsByTagName('button');
            for (var i = 1; i < buttons.length; i++) { //ignore win-back-button
                buttons[i].addEventListener("click", controlManager, true);
            }
            document.getElementById('confirmHelp').addEventListener("click", askUseHelp, true);
            document.getElementById('hints10').addEventListener("click", inAppPurchasing, true);
            document.getElementById('hints20').addEventListener("click", inAppPurchasing, true);

            // share contract
            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.addEventListener("datarequested", dataRequested);

            // hints left
            var appData = Windows.Storage.ApplicationData;
            var hintsLeft;
            if ((hintsLeft = appData.current.roamingSettings.values["hintsLeft"]) == undefined) {
                appData.current.roamingSettings.values["hintsLeft"] = 5;
                hintsLeft = 5;
            }
            document.getElementById('remainingHints').innerText = hintsLeft;

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
                // touch & left mouse button only
                if (evt.pointerType == evt.MSPOINTER_TYPE_TOUCH || evt.button == 0 || evt.type == "MSPointerMove") {
                    board.update(evt.offsetX, evt.offsetY, evt.type);
                }
                break;

            case "MSPointerUp":
                if (evt.currentTarget.localName == "canvas") {
                    // touch & left mouse button only
                    if (evt.pointerType == evt.MSPOINTER_TYPE_TOUCH || evt.button == 0) {
                        board.update(evt.offsetX, evt.offsetY, evt.type);
                    }
                } else {
                    // pointer up out of canvas bounds (discard buttons)
                    board.pipeOutOfBoard();
                }
                break;

            case "click":
                listenSound(CLICK_SOUND);
                switch (evt.target.id) {
                    case "cmdHelp":
                        openSolutionsFile();
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
        if (gameInfo.flows == level.best && gameInfo.fill == 100) {
            //addSolution(levelInfo[0] + "-" + levelInfo[1], board.getPipes());

            doterama.stopGame();
            listenSound(LEVEL_COMPLETED_SOUND);

            if (gameInfo.moves < level.moves || level.moves == 0) { // new record
                var levelCode = levelInfo[0] + "-" + levelInfo[1];
                setLevelMoves(levelCode, gameInfo.moves);
            }

            var msg = new Windows.UI.Popups.MessageDialog("Congrats! You completed the level in " + gameInfo.moves + " moves.", "Level Completed");
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
            }, 600);
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
            + "<a href='http://apps.microsoft.com/windows/es-es/app/doterama/806fbd64-923a-47cb-ac81-8f6e2a7f29bb'>Download it</a>"
            + " and join me!"
            + "</p>");
        var text = "I'm playing at Doterama application for Windows 8! Download it and join me!";

        request.data.setHtmlFormat(htmlValues);
        request.data.setText(text);

        var streamRef = Windows.Storage.Streams.RandomAccessStreamReference.createFromUri(new Windows.Foundation.Uri(localImage));
        request.data.resourceMap[localImage] = streamRef;
    }


    function inAppPurchasing(evt) {
        var sum = 0;
        var featureName = evt.currentTarget.id;
        switch (featureName) {
            case "hints10":
                sum = 10;
                break;
            case "hints20":
                sum = 20;
                break;
        }

        currentApp.requestProductPurchaseAsync(featureName, true).done(
            function (includeReceipt) {
                /*
                We should check the license state to determine if the in-app purchase was successful.
                This way: licenseInformation.productLicenses.lookup("featureName").isActive
                But there was a problem: our in-app purchase are 'consumable' (not 'durable'). But 'consumable' in-app purchases are only
                supported in Windows 8.1 (http://msdn.microsoft.com/en-us/library/windows/apps/windows.applicationmodel.store.producttype)
                and we want offer this in-app purchase for Windows 8 too.
                Therefore, the trick is enable include receipt answer (http://msdn.microsoft.com/en-us/library/windows/apps/hh967814.aspx)
                and check his value. If it's not an empty string, the in-app bought was succesful.
                */
                if (includeReceipt != "") {
                    // Product bought
                    var appData = Windows.Storage.ApplicationData;
                    var hintsLeft = appData.current.roamingSettings.values["hintsLeft"];
                    hintsLeft += sum;
                    appData.current.roamingSettings.values["hintsLeft"] = hintsLeft;
                    document.getElementById('remainingHints').innerText = hintsLeft;
                }
            },
            function (error) {
                // The in-app purchase was not completed because there was an error.
                var msg = new Windows.UI.Popups.MessageDialog("The purchase was not completed because there was an error.", "Purchase not completed");
                msg.showAsync();
            });
    }


    function askUseHelp() {
        var index = board.getFirstPipeIndex();
        if (index == -1) {
            // all pipes completed (but level not finished)
            var msg = new Windows.UI.Popups.MessageDialog("To use the hint please undo at least one pipe.", "All pipes completed");
            msg.showAsync();
        } else {
            // hints left
            var appData = Windows.Storage.ApplicationData;
            var hintsLeft = appData.current.roamingSettings.values["hintsLeft"];
            if (hintsLeft == 0) {
                // in-app purchase
                var msg = new Windows.UI.Popups.MessageDialog("There's 0 hints left. You can buy 10 or 20 more hints.", "0 hints left");
                msg.showAsync();
            } else {
                hintsLeft--;
                appData.current.roamingSettings.values["hintsLeft"] = hintsLeft;
                var pipes = getLevelSolution(levelInfo[0] + "-" + levelInfo[1]);
                board.updateMoves();
                board.setPipe(pipes[index], index);
                document.getElementById('remainingHints').innerText = hintsLeft;

                //var t = new Date().getTime();
                //var pipes = solveLevel(level.size, level.dots);
                //console.log(new Date().getTime() - t);
            }
        }
    }


})();
