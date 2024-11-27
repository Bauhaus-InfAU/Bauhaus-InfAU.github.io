// Encoded answer values
const _0xf4e9 = [
    ['MTQyLjM1', 'NTExLjA=', 'MjYxLjM0', 'NjU3LjA=', 'MTQyLjM1', 'OTEyLjU=', 'MzI4LjU=', 'Mjc5LjU5'], // Task 1
    ['NjQzLjg2', 'NTUxLjg4', 'NjY3LjIy', 'NTEwLjI3', 'NjI5Ljk5', 'NTgyLjU0', 'NjgyLjU1', 'NTkyLjc2'], // Task 2
    ['NjU3Ljcz', 'NTc1Ljk3', 'NjkxLjMx', 'NTM1LjgyJA==', 'NjU0LjA4', 'NjAwLjc5', 'Njk5LjM0', 'NjE2Ljg1'], // Task 3
    ['Njc3LjQ0', 'NjA4LjgyJA==', 'NzAyLjI2', 'NTY3Ljk0', 'NjcwLjg3', 'NjI1LjYx', 'NzEwLjI5', 'NjQwLjk0'] // Task 4
];

// Track selected options
let selectedGroup = null;
let selectedTask = null;

// Initialize UI elements
document.addEventListener('DOMContentLoaded', () => {
    initializeButtons();
    document.querySelector('form').addEventListener('submit', checkScore);
    
    const scoreInput = document.getElementById('score');
    
    // Reset on any interaction
    ['input', 'focus', 'click', 'mousedown', 'touchstart'].forEach(event => {
        scoreInput.addEventListener(event, resetInputToDefault);
    });
    
    // Also reset when selecting new task/group
    document.querySelectorAll('.task-button, .group-button').forEach(button => {
        button.addEventListener('click', resetInputToDefault);
    });
});

// Reset input styles
function resetInputToDefault() {
    const scoreInput = document.getElementById('score');
    const resultDiv = document.getElementById('result');
    scoreInput.classList.remove('valid-input', 'invalid-input');
    scoreInput.classList.add('default-input');
    resultDiv.style.display = 'none';
}

// Initialize task and group buttons
function initializeButtons() {
    // Task buttons
    const taskButtons = document.querySelectorAll('.task-buttons button');
    taskButtons.forEach((button, index) => {
        button.classList.add('task-button');
        button.addEventListener('click', () => selectTask(index + 1));
    });

    // Group buttons
    const groupButtons = document.querySelectorAll('.group-buttons button');
    groupButtons.forEach((button, index) => {
        button.classList.add('group-button');
        button.addEventListener('click', () => selectGroup(index + 1));
    });
}

// Task selection handler
function selectTask(taskNum) {
    document.querySelectorAll('.task-button').forEach((button) => {
        button.classList.remove('selected');
    });

    const selectedButton = document.querySelector(`.task-button:nth-child(${taskNum})`);
    selectedButton.classList.add('selected');

    selectedTask = taskNum;
    // Reset group selection when task changes
    selectedGroup = null;
    document.querySelectorAll('.group-button').forEach((button) => {
        button.classList.remove('selected');
    });
}

// Group selection handler
function selectGroup(groupNum) {
    if (!selectedTask) {
        alert('Please select a task first');
        return;
    }

    document.querySelectorAll('.group-button').forEach((button) => {
        button.classList.remove('selected');
    });

    const selectedButton = document.querySelector(`.group-button:nth-child(${groupNum})`);
    selectedButton.classList.add('selected');

    selectedGroup = groupNum;
}

// Score checking function
function checkScore(event) {
    event.preventDefault();

    if (!selectedTask || !selectedGroup) {
        alert('Please select both task and group');
        return;
    }

    const scoreInput = document.getElementById('score');
    const resultDiv = document.getElementById('result');
    const userScore = parseFloat(scoreInput.value);
    
    if (isNaN(userScore)) {
        alert('Please enter a valid score');
        return;
    }

    // Decode and compare
    const encodedCorrect = _0xf4e9[selectedTask - 1][selectedGroup - 1];
    const correctScore = Number(atob(encodedCorrect)) / 7.3;
    
    const margin = 0.01;
    const percentDiff = Math.abs((userScore - correctScore) / correctScore) * 100;
    const isCorrect = percentDiff <= margin;
    
    // Remove existing validation classes
    scoreInput.classList.remove('valid-input', 'invalid-input', 'default-input');
    
    if (isCorrect) {
        scoreInput.classList.add('valid-input');
        resultDiv.className = 'correct';
        resultDiv.innerHTML = `
            <h3>Correct! ✅</h3>
            <p>Your calculation is correct</p>
        `;
    } else {
        scoreInput.classList.add('invalid-input');
        resultDiv.className = 'incorrect';
        
        let message;
        if (percentDiff <= 5) {
            message = "You're very close! Just a small adjustment needed in your calculations";
        } else if (percentDiff <= 20) {
            message = userScore > correctScore 
                ? "Your answer is a bit high. Double-check your calculations"
                : "Your answer is a bit low. Double-check your calculations";
        } else {
            message = "That's quite different from the expected result. Consider reviewing your approach - are you using the right formula?";
        }
        
        resultDiv.innerHTML = `
            <h3>Not quite right ❌</h3>
            <p>${message}</p>
        `;
    }
    resultDiv.style.display = 'block';
}

// Prevent console inspection
(function() {
    const originalLog = console.log;
    console.log = function(...args) {
        if (args.some(arg => 
            arg === _0xf4e9 || 
            (typeof arg === 'string' && arg.includes('btoa')) || 
            (typeof arg === 'string' && arg.includes('atob'))
        )) {
            return;
        }
        originalLog.apply(console, args);
    };
})();

// Additional protection against direct variable access
Object.defineProperty(window, '_0xf4e9', {
    enumerable: false,
    configurable: false,
    writable: false
});

// Disable right-click to make inspection slightly harder
document.addEventListener('contextmenu', (e) => e.preventDefault());