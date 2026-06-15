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

let timerInterval = null;
let isRunning = false;
let isStarted = false;
let phase = 'Başlamadı'; 
let totalSessions = 0;
let studySeconds = 0;
let breakSeconds = 0;
    
let timeLeft = 0;
let completedSessions = 0;
let totalStudySecondsCompleted = 0;
let startingTime = 0;
let endingTime = null;

const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
const addMinutes = (date, minutes) => new Date(date.getTime() + minutes*60000);

const workerCode = `
    let timerInterval = null;
    self.onmessage = function(e) {
        if (e.data === 'start') {
            timerInterval = setInterval(() => self.postMessage('tick'), 1000);
        } else if (e.data === 'stop') {
            clearInterval(timerInterval);
        }
    };
`;
const blob = new Blob([workerCode], { type: 'application/javascript' });
const worker = new Worker(URL.createObjectURL(blob));

// When the worker sends a 'tick' message, run your existing tick logic
worker.onmessage = () => {
    tick(); 
};

const updateBreakConstraints = () => {
    const studyValue = parseInt(studyInput.value);
    const breakValue = parseInt(breakInput.value);

    if (isNaN(studyValue) || studyValue < 30 || studyValue > 120) return;

    const minBreak = Math.ceil(studyValue / 6);
    const maxBreak = Math.floor(studyValue / 2);
    breakInput.min = minBreak;
    breakInput.max = maxBreak;

    if (breakValue < minBreak) breakInput.value = minBreak;
    if (breakValue > maxBreak) breakInput.value = maxBreak;
};

const updateUI = () => {
    const completedMins = Math.floor(totalStudySecondsCompleted / 60);
    const totalMins = totalSessions * Math.floor(studySeconds / 60);
    endingTime = addMinutes(startingTime, totalMins);

    phaseDisplay.textContent = phase;
    timeDisplay.textContent = formatTime(timeLeft);
    
    studyTimeDisplay.textContent = `${completedMins} / ${totalMins} dk`;
    sessionsDisplay.textContent = `${completedSessions} / ${totalSessions}`;
    endTimeDisplay.textContent = `${endingTime.getHours().toString().padStart(2, '0')}:${endingTime.getMinutes().toString().padStart(2, '0')}`
};

const tick = () => {
    timeLeft--;

    if (phase === 'Ders') totalStudySecondsCompleted++;
    
    if (timeLeft <= 0) {
        switch (phase) {
            case 'Ders': 
                completedSessions++;
            
                if (completedSessions >= totalSessions) {
                    clearInterval(timerInterval);
                    isRunning = false;
                    phase = 'Bitti';
                
                    // Timer is done: disable start/pause, make sure reset is available
                    startButton.disabled = true;
                    pauseButton.disabled = true;
                    resetButton.disabled = false;
                } else {    
                    phase = 'Mola';
                    timeLeft = breakSeconds;
                }
                break;
            case 'Mola':
                phase = 'Ders';
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
            return alert('Ders süresi 30 ile 120 dakika arasında olmalı');

        if (breakValue < breakInput.min || breakValue > breakInput.max) 
            return alert(`Ara süresi ${breakInput.min} ile ${breakInput.max} dakika arasında olmalı`);

        totalSessions = parseInt(sessionsInput.value);
        studySeconds = studyValue * 60;
        breakSeconds = breakValue * 60;
        timeLeft = studySeconds;
        completedSessions = 0;
        totalStudySecondsCompleted = 0;
        startingTime = new Date();
        
        phase = 'Ders';
        isStarted = true;
        
        // Lock inputs when started
        sessionsInput.disabled = true;
        studyInput.disabled = true;
        breakInput.disabled = true;
    }

    if (!isRunning && phase !== 'Bitti') {
        isRunning = true;
        
        // Toggle buttons for running state
        startButton.disabled = true;
        pauseButton.disabled = false;
        resetButton.disabled = false; // Allow user to reset while running
        
        worker.postMessage('start');
    }
        
    updateUI();
});

pauseButton.addEventListener('click', () => {
    if (isRunning) {
        worker.postMessage('stop');
        isRunning = false;
        
        // Toggle buttons for paused state
        startButton.disabled = false; // Allow them to resume
        pauseButton.disabled = true;
        resetButton.disabled = false; // Keep reset available
    }
});

resetButton.addEventListener('click', () => {
    worker.postMessage('stop');
    isRunning = false;
    isStarted = false;
    phase = 'Başlamadı';
    timeLeft = 0;
    totalStudySecondsCompleted = 0;
    completedSessions = 0;
    totalSessions = 0;
    
    // Unlock inputs
    sessionsInput.disabled = false;
    studyInput.disabled = false;
    breakInput.disabled = false;

    // Reset button states to initial
    startButton.disabled = false;
    pauseButton.disabled = true;
    resetButton.disabled = true;

    phaseDisplay.textContent = 'Başlamadı';
    timeDisplay.textContent = '00:00';
    studyTimeDisplay.textContent = '0 / 0 dk';
    sessionsDisplay.textContent = '0 / 0';
});

studyInput.addEventListener('input', updateBreakConstraints);
updateBreakConstraints();

let lastTickTime = Date.now();

// Update lastTickTime every tick so we know when the last successful second was
const originalTick = tick; // Keep your old function
tick = () => {
    lastTickTime = Date.now();
    originalTick();
};

// When the user opens the phone or tab again:
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && isRunning) {
        const now = Date.now();
        // Calculate how many seconds we missed while the phone was sleeping
        const missedSeconds = Math.floor((now - lastTickTime) / 1000);
        
        if (missedSeconds > 0) {
            // Fast-forward the timer
            for (let i = 0; i < missedSeconds; i++) {
                if (isRunning) originalTick(); // Simulate the missed ticks
            }
        }
    }
});