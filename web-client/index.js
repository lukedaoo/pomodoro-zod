function $(id) {
    return document.getElementById(id);
}

const DEFAULT_CONFIG = {
    circleRadius: 230,
    timer: {
        interval: 25, // minutes
        shortBreak: 5, // minutes
        longBreak: 15  // minutes
    }
}

function initState(appConfig) {
    return {
        runningIntervalId: -1,
        runningTimerContext: {
            totalSeconds: appConfig.timer.interval * 60,
            secondsRemain: appConfig.timer.interval * 60,
        },
        timerContext: {
            intervalSeconds: appConfig.timer.interval * 60,
            shortBreakSeconds: appConfig.timer.shortBreak * 60,
            longBreakSeconds: appConfig.timer.longBreak * 60
        },
        mode: "pomodoro",
        perimeterProgress: 2 * appConfig.circleRadius * Math.PI,
        showingSettings: false,
        isRunning: function() {
            return this.runningIntervalId > 0
        },
        changeMode: function(mode) {
            this.mode = mode;
            switch (this.mode) {
                case "pomodoro": {
                    this.runningTimerContext = {
                        totalSeconds: this.timerContext.intervalSeconds,
                        secondsRemain: this.timerContext.intervalSeconds
                    }
                    break;
                }
                case "short-break": {
                    this.runningTimerContext = {
                        totalSeconds: this.timerContext.shortBreakSeconds,
                        secondsRemain: this.timerContext.shortBreakSeconds
                    }
                    break;
                }
                case "long-break": {
                    this.runningTimerContext = {
                        totalSeconds: this.timerContext.longBreakSeconds,
                        secondsRemain: this.timerContext.longBreakSeconds
                    }
                    break;
                }
            }
        }
    }
}

async function getConfig() {
    const SERVER = "http://localhost:3000/config";
    try {
        const response = await fetch(SERVER);
        if (!response.ok) {
            throw new Error("Status:" + response.status);
        }
        const json = await response.json();
        return json;
    } catch (err) {
        console.error(err.message);
    }
}


const app = {
    init: function(state) {
        utils.updateTimerTextWithSeconds(state.runningTimerContext.totalSeconds);
        $("stroke-circle").style.strokeDasharray = state.perimeterProgress
        document.title = "Pomodoro";
    },
    start: function({ state: state, timer: timer }) {
        clearInterval(state.runningIntervalId);
        utils.stopSound();

        let runningTimerContext = state.runningTimerContext;
        runningTimerContext.perimeter = state.perimeterProgress;

        state.runningIntervalId = timer.run(runningTimerContext);
        utils.toggleStartPauseButton(state);
    },
    pause: function(state) {
        clearInterval(state.runningIntervalId);
        state.runningIntervalId = -1;
        utils.toggleStartPauseButton(state);
        utils.stopSound();
    }
}

const utils = {
    updateTimerContext: function(runningTimerContext) {
        if (runningTimerContext != undefined && runningTimerContext.totalSeconds != undefined) {
            state.runningTimerContext.totalSeconds = runningTimerContext.totalSeconds;
        }
        if (runningTimerContext != undefined && runningTimerContext.secondsRemain != undefined) {
            state.runningTimerContext.secondsRemain = runningTimerContext.secondsRemain;
        }
    },
    getTime: function(seconds) {
        function convertTo2Digit(num) {
            return num < 10 ? '0' + num : num;
        }
        const minutes = Math.floor(seconds / 60);
        const remain = seconds % 60;
        return convertTo2Digit(minutes) + ":" + convertTo2Digit(remain);
    },
    updateTimerTextWithSeconds: function(seconds) {
        let displayTimer = this.getTime(seconds);
        $("timer-text-label").innerHTML = displayTimer;
    },
    updateProgressWithWidth: function(width) {
        $("stroke-circle").style.strokeDashoffset = width;
    },
    updateProgress: function({ perimeter: perimeter, width: width }) {
        let circularWidth = perimeter / 100 * width - perimeter;
        this.updateProgressWithWidth(circularWidth);
    },
    toggleStartPauseButton: function(state) {
        if (state.isRunning()) {
            $("start-pause-label").innerHTML = "⏸"
        } else {
            $("start-pause-label").innerHTML = "⏵"
        }
    },
    updateTitle: function(text) {
        document.title = text;
    },
    enableSound: function() {
        const alarm = $("alarm-sound");
        alarm.play().then(() => {
            alarm.pause();
            alarm.currentTime = 0;
        }).catch(err => {
            console.log("Alarm play failed: ", err);
        })
    },
    playSound: function() {
        const alarm = $("alarm-sound");
        alarm.play();
    },
    stopSound: function() {
        const alarm = $("alarm-sound");
        alarm.pause();
        alarm.currentTime = 0;
    },
    toggleSettings: function(state) {
        if (state.showingSettings) {
            $("settings-container-div").style.display = "none";
            state.showingSettings = false;
        } else {
            $("settings-container-div").style.display = "block";
            state.showingSettings = true;
        }

    },
}

const timer = {
    run: function(context) {
        let totalSeconds = context.totalSeconds;
        let secondsRemain = context.secondsRemain;
        let perimeter = context.perimeter;

        return setInterval(() => {
            secondsRemain--;
            utils.updateTimerTextWithSeconds(secondsRemain);

            let width = secondsRemain / totalSeconds * 100;
            utils.updateProgress({ perimeter: perimeter, width: width });
            utils.updateTimerContext({ secondsRemain: secondsRemain });
            utils.updateTitle(utils.getTime(secondsRemain) + " - Pomodoro");

            if (secondsRemain <= 0) {
                clearInterval(state.runningIntervalId);
                state.runningIntervalId = -1;
                utils.playSound();
                this.reset();
            }

        }, 1 * 1000); // 1 seconds
    },
    reset: function() {
        utils.updateTimerTextWithSeconds(state.runningTimerContext.totalSeconds);
        utils.updateProgressWithWidth(0);
        utils.updateTitle("Pomodoro");

        $("stroke-circle").style.strokeDasharray = state.perimeterProgress
        $("start-pause-label").innerHTML = "⏵"
    }
}

let config;
let state;
async function init() {
    config = await getConfig() || DEFAULT_CONFIG;
    state = initState(config);
    app.init(state);
}

init();

$("timer-container-div").addEventListener("click", () => {
    if (state.isRunning()) {
        app.pause(state);
    } else {
        app.start({ state: state, timer: timer });
    }

})

$("restart-label").addEventListener("click", () => {
    app.pause(state)
    state.changeMode("pomodoro");
    app.init(state);
    timer.reset();
})

$("settings-label").addEventListener("click", () => {
    utils.toggleSettings(state);
});

$("apply-label").addEventListener("click", () => {
    const pomodoroInterval = $("pomodoro-interval-input").value;
    const shortBreakInterval = $("short-break-interval-input").value;
    const longBreakInterval = $("long-break-interval-input").value;

    config.timer = {
        interval: pomodoroInterval,
        shortBreak: shortBreakInterval,
        longBreak: longBreakInterval
    }

    app.pause(state);
    state = initState(config);
    app.init(state);
    timer.reset();

    state.showingSettings = true;
    utils.toggleSettings(state);
});

$("short-break-label").addEventListener("click", () => {
    app.pause(state);
    state.changeMode("short-break");
    app.init(state);
    timer.reset();
});

$("long-break-label").addEventListener("click", () => {
    app.pause(state);
    state.changeMode("long-break");
    app.init(state);
    timer.reset();
});

document.body.addEventListener("click", utils.enableSound, { once: true });
document.addEventListener("visibilitychange", function() {
    if (!document.hidden && state.runningIntervalId != -1) {
        clearInterval(state.runningIntervalId);
        app.start({ state: state, timer: timer });
    }
});
