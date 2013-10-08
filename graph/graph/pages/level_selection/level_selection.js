// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/level_selection/level_selection.html", {

        ready: function (element, options) {
            drawString("Level selection.", document.getElementById('pagetitle'), 45);

            var categoryList = getCategoryList();
            var htmlCategories = document.getElementsByClassName('level_category_title');

            for (var i = 0; i < htmlCategories.length; i++) {
                drawString(categoryList[i].name + "_" + categoryList[i].size, htmlCategories[i], 22);
                
                var levelList = categoryList[i].levelList;
                var htmlLevels = htmlCategories[i].parentNode.getElementsByClassName('level_item');

                for (var j = 0; j < htmlLevels.length; j++) {
                    var htmlLevel = htmlLevels[j];

                    var overlayItem = htmlLevel.getElementsByClassName('overlay_level_item')[0];
                    drawString(String(j + 1), overlayItem, 23);

                    htmlLevel.id = levelList[j].code;
                    htmlLevel.className = "level_item type" + i;
                    htmlLevel.addEventListener("click", levelSelected, false);

                    var moves = levelList[j].moves;
                    var best = levelList[j].best;
                    if (moves == best) {
                        htmlLevel.className = htmlLevel.className + " gold";
                    } else if (moves == best +1) {
                        htmlLevel.className = htmlLevel.className + " silver";
                    } else if (moves >= best + 2) {
                        htmlLevel.className = htmlLevel.className + " bronze";
                    } else {
                        htmlLevel.className = htmlLevel.className + " empty";
                    }
                }
            }

        },

        unload: function () {
            // TODO: Respond to navigations away from this page.
        },

        updateLayout: function (element, viewState, lastViewState) {
            // TODO: Respond to changes in viewState.
        }
    });


    function levelSelected(evt) {
        listenSound(CLICK_SOUND);
        WinJS.Navigation.navigate("pages/game/game.html", evt.currentTarget.id);
    }


})();
