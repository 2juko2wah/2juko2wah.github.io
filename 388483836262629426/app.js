const settings = document.getElementById('settings');
const sessionsInput = document.getElementById('sessions');
const studyInput = document.getElementById('study-length');
const breakInput = document.getElementById('break-length');
const breakHint = document.getElementById('break-hint');
    
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const resetButton = document.getElementById('reset-button');
    
const phaseDisplay = document.getElementById('phase-display');
const timeDisplay = document.getElementById('time-display');
const studyTimeDisplay = document.getElementById('study-time-display');
const sessionsDisplay = document.getElementById('sessions-display');

let timerInterval = null;
let isRunning = false;
let isStarted = false;
let phase = 'Not Started'; 
let totalSessions = 0;
let studySeconds = 0;
let breakSeconds = 0;
    
let timeLeft = 0;
let completedSessions = 0;
let totalStudySecondsCompleted = 0;

const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

const updateBreakConstraints = () => {
    const studyValue = parseInt(studyInput.value);
    const breakValue = parseInt(breakInput.value);

    if (isNaN(studyValue) || studyValue < 30 || studyValue > 120) return;

    const minBreak = Math.ceil(studyValue / 6);
    const maxBreak = Math.floor(studyValue / 2);
    breakInput.min = minBreak;
    breakInput.max = maxBreak;
    breakHint.textContent = `(min: ${minBreak}, max: ${maxBreak})`;
    
    if (breakValue < minBreak) breakInput.value = minBreak;
    if (breakValue > maxBreak) breakInput.value = maxBreak;
};

const updateUI = () => {
    const completedMins = Math.floor(totalStudySecondsCompleted / 60);
    const totalMins = totalSessions * Math.floor(studySeconds / 60);
    
    phaseDisplay.textContent = phase;
    timeDisplay.textContent = formatTime(timeLeft);
    
    studyTimeDisplay.textContent = `${completedMins} / ${totalMins} mins`;
    sessionsDisplay.textContent = `${completedSessions} / ${totalSessions}`;
};

const tick = () => {
    timeLeft--;

    if (phase === 'Study') totalStudySecondsCompleted++;
    
    if (timeLeft <= 0) {
        switch (phase) {
            case 'Study': 
                completedSessions++;
            
                if (completedSessions >= totalSessions) {
                    clearInterval(timerInterval);
                    isRunning = false;
                    phase = 'Finished';
                
                
                    startButton.disabled = true;
                    pauseButton.disabled = true;
                } else {    
                    phase = 'Break';
                    timeLeft = breakSeconds;
                }
                break;
            case 'Break':
                phase = 'Study';
                timeLeft = studySeconds;
                break;
        }
    }
    
    updateUI();
};

startButton.addEventListener('click', () => {
    if (!isStarted) {
        const studyValue = parseInt(studyInput.value);
        const breakValue = parseInt(breakInput.value);

        if (studyValue < 30 || studyValue > 120) 
            return alert('Study session must be between 30 and 120 minutes.');

        if (breakValue < breakInput.min || breakValue > breakInput.max) 
            return alert(`Break session must be between ${breakInput.min} and ${breakInput.max} minutes.`);

        totalSessions = parseInt(sessionsInput.value);
        studySeconds = studyValue * 60;
        breakSeconds = studyValue * 60;
        timeLeft = studySeconds;
        completedSessions = 0;
        totalStudySecondsCompleted = 0;
            
        phase = 'Study';
        isStarted = true;
        settings.disabled = true;
        resetButton.disabled = false;
    }

    if (!isRunning && phase !== 'Finished') {
        isRunning = true;
        startButton.disabled = true;
        pauseButton.disabled = false;
        timerInterval = setInterval(tick, 1000);
    }
        
    updateUI();
});

pauseButton.addEventListener('click', () => {
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        startButton.disabled = false;
        pauseButton.disabled = true;
    }
});

resetButton.addEventListener('click', () => {
    clearInterval(timerInterval);
    isRunning = false;
    isStarted = false;
    phase = 'Not Started';
    timeLeft = 0;
    totalStudySecondsCompleted = 0;
    completedSessions = 0;
    totalSessions = 0;
    
    settings.disabled = false;
    startButton.disabled = false;
    pauseButton.disabled = true;
    resetButton.disabled = true;
    phaseDisplay.textContent = 'Not Started';
    timeDisplay.textContent = '00:00';
    studyTimeDisplay.textContent = '0 / 0 mins';
    sessionsDisplay.textContent = '0 / 0';
});

studyInput.addEventListener('input', updateBreakConstraints);
updateBreakConstraints();