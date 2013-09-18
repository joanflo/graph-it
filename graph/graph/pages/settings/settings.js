// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    var sounds = new Object();
    var appData = Windows.Storage.ApplicationData;


    sounds.getSound = function () {
        var config;
        if ((config = appData.current.roamingSettings.values["soundSwitch"]) != undefined) {
            return config;
        } else {
            return true;
        }
    };


    sounds.init = function () {
        var toggle = document.querySelector("#soundSwitch").winControl;

        var soundSwitch = appData.current.roamingSettings.values["soundSwitch"];
        soundSwitch = !soundSwitch ? false : soundSwitch; // false if value doesn’t exist
        toggle.checked = soundSwitch;
        toggle.addEventListener("change", function (e) {
            appData.current.roamingSettings.values["soundSwitch"] = e.target.winControl.checked;
        });
    }


    WinJS.UI.Pages.define("/pages/settings/settings.html", {

        ready: function (element, options) {
            sounds.init();
        },

        unload: function () {
            // TODO: Respond to navigations away from this page.
        },

        updateLayout: function (element, viewState, lastViewState) {
            // TODO: Respond to changes in viewState.
        }
    });







})();
