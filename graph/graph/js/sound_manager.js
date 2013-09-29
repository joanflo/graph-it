var clickSound;
var CLICK_SOUND = 0;

var levelCompletedSound;
var LEVEL_COMPLETED_SOUND = 1;

var pipeBrokenSound;
var PIPE_BROKEN_SOUND = 2;

var pipeCompletedSound;
var PIPE_COMPLETED_SOUND = 3;

var pipeBackSound;
var PIPE_BACK_SOUND = 4;


function initSounds() {
    soundManager.setup({
        onready: function () {

            clickSound = soundManager.createSound({
                id: 'click',
                url: '/sounds/click.wav',
                volume: 50
            });

            levelCompletedSound = soundManager.createSound({
                id: 'level_completed',
                url: '/sounds/level_completed.mp3',
                volume: 50
            });

            pipeBrokenSound = soundManager.createSound({
                id: 'pipe_broken',
                url: '/sounds/pipe_broken.wav',
                volume: 50
            });

            pipeCompletedSound = soundManager.createSound({
                id: 'pipe_completed',
                url: '/sounds/pipe_completed.wav',
                volume: 50
            });

            pipeBackSound = soundManager.createSound({
                id: 'pipe_back',
                url: '/sounds/pipe_back.wav',
                volume: 50
            });

        },

        ontimeout: function () {
            console.log("Error");
        },

        preferFlash: false,
        debugMode: false,
        useConsole: false

    });
}


function listenSound(codi) {
    if (sounds.getSound() == 1) {
        switch (codi) {
            case CLICK_SOUND:
                clickSound.play();
                break;
            case LEVEL_COMPLETED_SOUND:
                levelCompletedSound.play();
                break;
            case PIPE_BROKEN_SOUND:
                pipeBrokenSound.play();
                break;
            case PIPE_COMPLETED_SOUND:
                pipeCompletedSound.play();
                break;
            case PIPE_BACK_SOUND:
                pipeBackSound.play();
                break;
        }
        //info API: http://www.schillmania.com/projects/soundmanager2/doc/#sm-config
    }
}


function isPlaying(soundAux) {
    return soundAux.playState == 1;
}