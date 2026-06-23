const settings = document.getElementById('settings');
const sessionsInput = document.getElementById('sessions');
const studyInput = document.getElementById('study-length');
const breakInput = document.getElementById('break-length');

const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const resetButton = document.getElementById('reset-button');

const phaseDisplay = document.getElementById('phase-display');
const timeDisplay = document.getElementById('time-display');
const studyTimeDisplay = document.getElementById('study-time-display');
const sessionsDisplay = document.getElementById('sessions-display');
const endTimeDisplay = document.getElementById('end-time-display');

let isRunning = false;
let isStarted = false;
let phase = 'Başlamadı';
let totalSessions = 0;
let completedSessions = 0;

let studyDurationMs = 0;
let breakDurationMs = 0;

let targetEndTime = null;
let pausedRemainingMs = 0;
let totalStudyMsCompletedAtStartOfPhase = 0; 

const Phase = Object.freeze({
    BREAK: "Mola",
    STUDY: "Ders",
    OVER: "Bitti",
    NSTART: "Başlamadı",
})

let appstate = {
    isRunning: false,
    isStarted: false,
    phase: Phase.NSTART,
    totalSessions: 0, completedSessions: 0,
    studyDuration: 0, breakDuration: 0,
}

const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

const updateBreakConstraints = () => {
    const studyValue = parseInt(studyInput.value);

    if (isNaN(studyValue) || studyValue < 30 || studyValue > 120) return;
    
    const minBreak = Math.ceil(studyValue / 6);
    const maxBreak = Math.floor(studyValue / 2);
    
    breakInput.min = minBreak;
    breakInput.max = maxBreak;
    if (parseInt(breakInput.value) < minBreak) breakInput.value = minBreak;
    if (parseInt(breakInput.value) > maxBreak) breakInput.value = maxBreak;
};

const syncTimer = () => {
    if (!isRunning) return;

    let now = Date.now();
    let remainingMs = targetEndTime - now;

    while (remainingMs <= 0 && isRunning) {
        if (phase === 'Ders') {
            completedSessions++;
            totalStudyMsCompletedAtStartOfPhase += studyDurationMs;
            
            if (completedSessions >= totalSessions) {
                endCycle();
                return;
            } else {
                phase = 'Mola';
                targetEndTime += breakDurationMs;
            }
        } else if (phase === 'Mola') {
            phase = 'Ders';
            targetEndTime += studyDurationMs;
        }
        
        now = Date.now();
        remainingMs = targetEndTime - now;
    }

    updateUI(remainingMs);
};

setInterval(syncTimer, 200);

const updateUI = (currentRemainingMs = 0) => {
    const displaySeconds = Math.max(0, Math.ceil(currentRemainingMs / 1000));

    timeDisplay.textContent = formatTime(displaySeconds);
    phaseDisplay.textContent = phase;
    sessionsDisplay.textContent = `${completedSessions} / ${totalSessions}`;
    
    let currentSessionProgress = 0;

    if (phase === 'Ders') {
        currentSessionProgress = Math.max(0, studyDurationMs - currentRemainingMs);
    }

    const totalStudyMins = Math.floor((totalStudyMsCompletedAtStartOfPhase + currentSessionProgress) / 60000);
    const goalMins = (totalSessions * studyDurationMs) / 60000 || 0;

    studyTimeDisplay.textContent = `${totalStudyMins} / ${goalMins} dk`;

    if (isStarted && phase !== 'Bitti') {
        const totalRemainingInCycle = calculateTotalRemainingMs(currentRemainingMs);
        const endData = new Date(Date.now() + totalRemainingInCycle);
        endTimeDisplay.textContent = `${endData.getHours().toString().padStart(2, '0')}:${endData.getMinutes().toString().padStart(2, '0')}`;
    } else {
        endTimeDisplay.textContent = '--:--';
    }
};

const calculateTotalRemainingMs = (currentRemainingMs) => {
    let total = currentRemainingMs;
    const sessionsLeft = totalSessions - completedSessions;
    
    if (phase === 'Ders') {
        total += (sessionsLeft - 1) * studyDurationMs;
        total += (sessionsLeft - 1) * breakDurationMs;
    } else if (phase === 'Mola') {
        total += (sessionsLeft) * studyDurationMs;
        total += (sessionsLeft - 1) * breakDurationMs;
    }
    return total;
};

const endCycle = () => {
    isRunning = false;
    isStarted = false;

    phase = 'Bitti';
    
    startButton.disabled = true;
    pauseButton.disabled = true;
    resetButton.disabled = false;
    
    updateUI(0);
};

startButton.addEventListener('click', () => {
    if (!isStarted) {
        const sVal = parseInt(studyInput.value);
        const bVal = parseInt(breakInput.value);
        
        totalSessions = parseInt(sessionsInput.value);
        studyDurationMs = sVal * 60 * 1000;
        breakDurationMs = bVal * 60 * 1000;
        
        pausedRemainingMs = studyDurationMs;
        phase = 'Ders';
        completedSessions = 0;
        totalStudyMsCompletedAtStartOfPhase = 0;
        isStarted = true;
        
        sessionsInput.disabled = true;
        studyInput.disabled = true;
        breakInput.disabled = true;
    }

    isRunning = true;
    targetEndTime = Date.now() + pausedRemainingMs;
    
    startButton.disabled = true;
    pauseButton.disabled = false;
    resetButton.disabled = false;

    updateUI(pausedRemainingMs);
});

pauseButton.addEventListener('click', () => {
    if (isRunning) {
        isRunning = false;
        pausedRemainingMs = targetEndTime - Date.now();
        
        startButton.disabled = false;
        pauseButton.disabled = true;

        updateUI(pausedRemainingMs);
    }
});

resetButton.addEventListener('click', () => {
    isRunning = false;
    isStarted = false;
    phase = 'Başlamadı';
    pausedRemainingMs = 0;
    completedSessions = 0;
    totalSessions = 0; 
    totalStudyMsCompletedAtStartOfPhase = 0;

    sessionsInput.disabled = false;
    studyInput.disabled = false;
    breakInput.disabled = false;

    startButton.disabled = false;
    pauseButton.disabled = true;
    resetButton.disabled = true;

    updateUI(0);
});

studyInput.addEventListener('input', updateBreakConstraints);

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        if (isRunning) {
            syncTimer();
        } else if (isStarted && phase !== 'Bitti') {
            updateUI(pausedRemainingMs);
        }
    }
});