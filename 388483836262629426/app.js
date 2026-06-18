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

    const now = Date.now();
    let remainingMs = targetEndTime - now;

    if (remainingMs <= 0) {
        if (phase === 'Ders') {
            completedSessions++;
            totalStudyMsCompletedAtStartOfPhase += studyDurationMs;
            
            if (completedSessions >= totalSessions) {
                endCycle();
                return;
            } else {
                phase = 'Mola';
                remainingMs = breakDurationMs;
                targetEndTime = now + remainingMs;
            }
        } else if (phase === 'Mola') {
            phase = 'Ders';
            remainingMs = studyDurationMs;
            targetEndTime = now + remainingMs;
        }
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
    if (phase === 'Ders' && isRunning) {
        currentSessionProgress = studyDurationMs - currentRemainingMs;
    }

    const totalStudyMins = Math.floor((totalStudyMsCompletedAtStartOfPhase + currentSessionProgress) / 60000);
    const goalMins = (totalSessions * studyDurationMs) / 60000;

    studyTimeDisplay.textContent = `${totalStudyMins} / ${goalMins} dk`;

    if (isStarted && phase !== 'Bitti') {
        const totalRemainingInCycle = calculateTotalRemainingMs(currentRemainingMs);
        const endData = new Date(Date.now() + totalRemainingInCycle);
        endTimeDisplay.textContent = `${endData.getHours().toString().padStart(2, '0')}:${endData.getMinutes().toString().padStart(2, '0')}`;
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
});

pauseButton.addEventListener('click', () => {
    if (isRunning) {
        isRunning = false;
        pausedRemainingMs = targetEndTime - Date.now();
        
        startButton.disabled = false;
        pauseButton.disabled = true;
    }
});

resetButton.addEventListener('click', () => {
    isRunning = false;
    isStarted = false;
    phase = 'Başlamadı';
    pausedRemainingMs = 0;
    completedSessions = 0;
    totalStudyMsCompletedAtStartOfPhase = 0;

    sessionsInput.disabled = false;
    studyInput.disabled = false;
    breakInput.disabled = false;

    startButton.disabled = false;
    pauseButton.disabled = true;
    resetButton.disabled = true;

    timeDisplay.textContent = '00:00';
    updateUI(0);
});

studyInput.addEventListener('input', updateBreakConstraints);

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        if (isRunning) {
            const remaining = targetEndTime - Date.now();
            updateUI(remaining);
        }
    }
});