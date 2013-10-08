// For an introduction to the Fixed Layout template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232508

var ready = false;
var game;

var currentApp;
var licenseInformation;

(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var nav = WinJS.Navigation;


    app.addEventListener("activated", function (args) {

        loadCharacterImages();
        initSounds();
        openDataFiles();

        // in-app purchases
        currentApp = Windows.ApplicationModel.Store.CurrentApp; // Get current product object 
        licenseInformation = currentApp.licenseInformation; // Get the license info

        if (args.detail.kind === activation.ActivationKind.launch) {
            if (app.sessionState.history) {
                nav.history = app.sessionState.history;
            }
            document.addEventListener("visibilitychange", function (e) {
                if (ready) {

                }
            });
            args.setPromise(WinJS.UI.processAll().then(function () {
                if (nav.location) {
                    nav.history.current.initialPlaceholder = true;
                    return nav.navigate(nav.location, nav.state);
                } else {
                    return nav.navigate(Application.navigator.home);
                }

            }));
        }
    });


    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };


    app.onsettings = function (e) {
        e.detail.applicationcommands = {
            "how_to_play": {
                href: "/pages/how_to_play/how_to_play.html",
                title: "How to play"
            },

            "about": {
                href: "/pages/about/about.html",
                title: "About"
            },

            "history": {
                href: "/pages/history/history.html",
                title: "Game history"
            },

            "settings": {
                href: "/pages/settings/settings.html",
                title: "Settings"
            },

            "privacy": {
                href: "/pages/privacy/privacy.html",
                title: "Privacy"
            }
        };
        WinJS.UI.SettingsFlyout.populateSettings(e);
    };


    app.start();
})();
