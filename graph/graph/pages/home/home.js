// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/home/home.html", {

        ready: function (element, options) {

            if (options && (WinJS.Navigation.history.backStack.length - 2) > 0) { // coming from game
                WinJS.Navigation.history.backStack.length -= 2;
            }

            setTile("heading1", "pages/level_selection/level_selection.html", false);

            var heading = document.getElementsByClassName("heading2")[0];
            heading.addEventListener("click", function (e) {
                WinJS.UI.SettingsFlyout.showSettings("how_to_play", "/pages/how_to_play/how_to_play.html");
            }, false);

            setTile("heading3", "https://www.facebook.com/", true);

            setTile("heading4", "https://www.twitter.com/", true);
        },

        unload: function () {

            // TODO: Respond to navigations away from this page.
        },

        updateLayout: function (element, viewState, lastViewState) {

            // TODO: Respond to changes in viewState.
        }
    });


    function setTile(tileID, navURL, share) {
        var heading = document.getElementsByClassName(tileID)[0];

        if (!share) {
            heading.addEventListener("click", function () {
                WinJS.Navigation.navigate(navURL);
            }, false);
        } else { // facebook & twitter
            heading.addEventListener("click", function () {
                window.open(link, "_blank");
            }, false);
        }
    }



})();
