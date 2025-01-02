function $(id) {
    return document.getElementById(id);
}

function initState(appConfig) {
    return {
        runningIntervalId: -1,
        timerContext: {
            totalSeconds: appConfig.timer.interval * 60,
            secondsRemain: appConfig.timer.interval * 60
        },
        perimeterProgress: 2 * appConfig.circleRadius * Math.PI,
        isRunning: function() {
            return this.runningIntervalId > 0
        }
    }
}

const config = {
    circleRadius: 230,
    timer: {
        interval: 25, // minutes
    }
}

let state = initState(config);

const app = {
    init: function(state) {
        utils.updateTimerTextWithSeconds(state.timerContext.totalSeconds);
        $("stroke-circle").style.strokeDasharray = state.perimeterProgress
        document.title = "Pomodoro";
    },
    start: function({ state: state, timer: timer }) {
        clearInterval(state.runningIntervalId);
        utils.stopSound();

        let timerContext = state.timerContext;
        timerContext.perimeter = state.perimeterProgress;

        state.runningIntervalId = timer.run(timerContext);
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
    updateTimerContext: function(timerContext) {
        if (timerContext != undefined && timerContext.totalSeconds != undefined) {
            state.timerContext.totalSeconds = timerContext.totalSeconds;
        }
        if (timerContext != undefined && timerContext.secondsRemain != undefined) {
            state.timerContext.secondsRemain = timerContext.secondsRemain;
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
    }
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
        state.timerContext = {
            totalSeconds: state.timerContext.totalSeconds,
            secondsRemain: state.timerContext.totalSeconds
        };
        utils.updateTimerTextWithSeconds(state.timerContext.totalSeconds);
        utils.updateProgressWithWidth(0);
        utils.updateTitle("Pomodoro");

        $("stroke-circle").style.strokeDasharray = state.perimeterProgress
        $("start-pause-label").innerHTML = "⏵"
    }
}

app.init(state);

document.body.addEventListener("click", utils.enableSound, { once: true });

$("timer-container-div").addEventListener("click", () => {
    if (state.isRunning()) {
        app.pause(state);
    } else {
        app.start({ state: state, timer: timer });
    }

})

$("restart-label").addEventListener("click", () => {
    app.pause(state)
    app.init(state);
    timer.reset();
})

document.addEventListener("visibilitychange", function() {
    if (!document.hidden && state.runningIntervalId != -1) {
        clearInterval(state.runningIntervalId);
        app.start({ state: state, timer: timer });
    }
});
