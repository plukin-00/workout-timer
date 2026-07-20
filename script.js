// State Variables
let isRunning = false;
let isPaused = false;
let currentRound = 1;
let currentPhase = 'prepare'; // 'prepare', 'work', 'rest'
let timeRemaining = 0;
let totalTime = 0;
let timerInterval = null;
let soundPlayedForCurrentPhase = false; // Track if sound has been played

// Configuration
let config = {
    rounds: 5,
    workTime: 30,
    restTime: 15,
    prepareTime: 10,
    soundEnabled: true,
    vibrationEnabled: true
};

// Exercise names
let exerciseNames = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initializeExerciseNames();
    resetTimer();
});

// Exercise Names Functions
function initializeExerciseNames() {
    loadSettings();
    exerciseNames = [];
    
    // Load saved exercise names from localStorage
    const saved = localStorage.getItem('exerciseNames');
    if (saved) {
        exerciseNames = JSON.parse(saved);
    } else {
        // Initialize with default names
        for (let i = 0; i < config.rounds; i++) {
            exerciseNames.push(`Übung ${i + 1}`);
        }
    }
    
    renderExerciseList();
}

function renderExerciseList() {
    const exerciseList = document.getElementById('exerciseList');
    exerciseList.innerHTML = '';
    
    for (let i = 0; i < config.rounds; i++) {
        const item = document.createElement('div');
        item.className = 'exercise-item';
        
        const label = document.createElement('label');
        label.textContent = `Runde ${i + 1}:`;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Übung ${i + 1}`;
        input.value = exerciseNames[i] || `Übung ${i + 1}`;
        input.dataset.round = i;
        input.addEventListener('change', (e) => {
            exerciseNames[i] = e.target.value || `Übung ${i + 1}`;
            saveExerciseNames();
        });
        
        item.appendChild(label);
        item.appendChild(input);
        exerciseList.appendChild(item);
    }
}

function saveExerciseNames() {
    localStorage.setItem('exerciseNames', JSON.stringify(exerciseNames));
}

function toggleExercisePanel() {
    const panel = document.getElementById('exercisePanel');
    panel.classList.toggle('active');
    
    if (panel.classList.contains('active')) {
        renderExerciseList();
    }
}

// Settings Functions
function loadSettings() {
    config.rounds = parseInt(document.getElementById('rounds').value);
    config.workTime = parseInt(document.getElementById('workTime').value);
    config.restTime = parseInt(document.getElementById('restTime').value);
    config.prepareTime = parseInt(document.getElementById('prepareTime').value);
    config.soundEnabled = document.getElementById('soundEnabled').checked;
    config.vibrationEnabled = document.getElementById('vibrationEnabled').checked;
}

function updateSettings() {
    const oldRounds = config.rounds;
    loadSettings();
    
    if (config.rounds !== oldRounds) {
        currentRound = Math.min(currentRound, config.rounds);
        initializeExerciseNames();
    }
    
    if (!isRunning) {
        resetTimer();
    }
}

// Increment/Decrement Functions
function increaseRounds() {
    const input = document.getElementById('rounds');
    input.value = Math.min(parseInt(input.value) + 1, 99);
    updateSettings();
}

function decreaseRounds() {
    const input = document.getElementById('rounds');
    input.value = Math.max(parseInt(input.value) - 1, 1);
    updateSettings();
}

function increaseWorkTime() {
    const input = document.getElementById('workTime');
    input.value = Math.min(parseInt(input.value) + 5, 300);
    updateSettings();
}

function decreaseWorkTime() {
    const input = document.getElementById('workTime');
    input.value = Math.max(parseInt(input.value) - 5, 5);
    updateSettings();
}

function increaseRestTime() {
    const input = document.getElementById('restTime');
    input.value = Math.min(parseInt(input.value) + 5, 300);
    updateSettings();
}

function decreaseRestTime() {
    const input = document.getElementById('restTime');
    input.value = Math.max(parseInt(input.value) - 5, 5);
    updateSettings();
}

function increasePrepareTime() {
    const input = document.getElementById('prepareTime');
    input.value = Math.min(parseInt(input.value) + 1, 60);
    updateSettings();
}

function decreasePrepareTime() {
    const input = document.getElementById('prepareTime');
    input.value = Math.max(parseInt(input.value) - 1, 0);
    updateSettings();
}

// Timer Functions
function calculateTotalTime() {
    const totalWorkTime = config.prepareTime + (config.rounds * (config.workTime + config.restTime)) - config.restTime;
    return totalWorkTime;
}

function resetTimer() {
    loadSettings();
    
    clearInterval(timerInterval);
    isRunning = false;
    isPaused = false;
    currentRound = 1;
    currentPhase = 'prepare';
    timeRemaining = config.prepareTime;
    totalTime = calculateTotalTime();
    soundPlayedForCurrentPhase = false;
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    
    updateDisplay();
    updateProgressBar();
}

function startTimer() {
    if (!isRunning) {
        loadSettings();
        
        if (!isPaused) {
            // First time starting
            timeRemaining = config.prepareTime;
            currentRound = 1;
            currentPhase = 'prepare';
            totalTime = calculateTotalTime();
            soundPlayedForCurrentPhase = false;
        }
        
        isRunning = true;
        isPaused = false;
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        
        timerInterval = setInterval(tick, 1000);
    }
}

function pauseTimer() {
    if (isRunning) {
        isRunning = false;
        isPaused = true;
        clearInterval(timerInterval);
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }
}

function tick() {
    timeRemaining--;
    
    if (timeRemaining < 0) {
        phaseComplete();
    }
    
    updateDisplay();
    updateProgressBar();
}

function phaseComplete() {
    // Play sound only once when phase ends
    if (!soundPlayedForCurrentPhase) {
        playBeep(1);
        triggerVibration(200);
        soundPlayedForCurrentPhase = true;
    }
    
    if (currentPhase === 'prepare') {
        currentPhase = 'work';
        timeRemaining = config.workTime;
        soundPlayedForCurrentPhase = false; // Reset for next phase
    } else if (currentPhase === 'work') {
        if (currentRound < config.rounds) {
            currentPhase = 'rest';
            timeRemaining = config.restTime;
            soundPlayedForCurrentPhase = false; // Reset for next phase
        } else {
            // Workout complete
            workoutComplete();
            return;
        }
    } else if (currentPhase === 'rest') {
        currentRound++;
        if (currentRound <= config.rounds) {
            currentPhase = 'work';
            timeRemaining = config.workTime;
            soundPlayedForCurrentPhase = false; // Reset for next phase
        } else {
            // Workout complete
            workoutComplete();
            return;
        }
    }
    
    updateDisplay();
}

function workoutComplete() {
    isRunning = false;
    clearInterval(timerInterval);
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    
    // Final beep
    playBeep(1);
    triggerVibration(300);
    
    const phaseElement = document.getElementById('phaseIndicator');
    phaseElement.textContent = '🎉 Training abgeschlossen!';
    phaseElement.style.background = 'rgba(76, 175, 80, 0.3)';
    phaseElement.style.borderColor = 'var(--primary-color)';
    
    const timeText = document.getElementById('timeDisplay');
    timeText.textContent = '✓';
    timeText.style.fontSize = '3em';
    timeText.parentElement.classList.add('pulse');
}

function updateDisplay() {
    // Update time display
    document.getElementById('timeDisplay').textContent = formatTime(timeRemaining);
    
    // Update phase indicator
    const phaseElement = document.getElementById('phaseIndicator');
    const phaseText = document.getElementById('phaseText');
    
    if (currentPhase === 'prepare') {
        phaseElement.textContent = '⏳ Vorbereitung';
        phaseElement.className = 'phase-indicator';
        phaseText.textContent = 'VORBEREITUNG';
    } else if (currentPhase === 'work') {
        const exerciseName = exerciseNames[currentRound - 1] || `Übung ${currentRound}`;
        phaseElement.textContent = `💪 ${exerciseName}`;
        phaseElement.className = 'phase-indicator work';
        phaseText.textContent = exerciseName.toUpperCase();
    } else if (currentPhase === 'rest') {
        phaseElement.textContent = '😮‍💨 Pause';
        phaseElement.className = 'phase-indicator rest';
        phaseText.textContent = 'PAUSE';
    }
    
    // Update round counter
    document.getElementById('currentRound').textContent = currentRound;
    document.getElementById('totalRounds').textContent = config.rounds;
    
    // Update progress ring
    updateProgressRing();
}

function updateProgressRing() {
    const circle = document.querySelector('.progress-ring-fill');
    const circumference = 2 * Math.PI * 140; // radius = 140
    
    let maxTime = 0;
    if (currentPhase === 'prepare') {
        maxTime = config.prepareTime;
    } else if (currentPhase === 'work') {
        maxTime = config.workTime;
    } else if (currentPhase === 'rest') {
        maxTime = config.restTime;
    }
    
    const progress = (maxTime - timeRemaining) / maxTime;
    const offset = circumference * (1 - progress);
    
    circle.style.strokeDashoffset = offset;
}

function updateProgressBar() {
    const elapsed = calculateElapsedTime();
    const progress = (elapsed / totalTime) * 100;
    
    document.getElementById('progressFill').style.width = Math.min(progress, 100) + '%';
    document.getElementById('progressText').textContent = Math.min(Math.round(progress), 100) + '%';
}

function calculateElapsedTime() {
    let elapsed = config.prepareTime - timeRemaining;
    
    if (currentPhase !== 'prepare') {
        elapsed = config.prepareTime;
        
        for (let i = 1; i < currentRound; i++) {
            elapsed += config.workTime + config.restTime;
        }
        
        if (currentPhase === 'work') {
            elapsed += config.workTime - timeRemaining;
        } else if (currentPhase === 'rest') {
            elapsed += config.workTime + (config.restTime - timeRemaining);
        }
    }
    
    return elapsed;
}

// Utility Functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function playBeep(count = 1) {
    if (!config.soundEnabled) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        }, i * 150);
    }
}

function triggerVibration(duration = 100) {
    if (!config.vibrationEnabled) return;
    
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

// Event Listeners for Settings Input
document.getElementById('rounds').addEventListener('change', updateSettings);
document.getElementById('workTime').addEventListener('change', updateSettings);
document.getElementById('restTime').addEventListener('change', updateSettings);
document.getElementById('prepareTime').addEventListener('change', updateSettings);
document.getElementById('soundEnabled').addEventListener('change', updateSettings);
document.getElementById('vibrationEnabled').addEventListener('change', updateSettings);

// Keyboard Controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    }
    if (e.code === 'Escape') {
        resetTimer();
    }
});
