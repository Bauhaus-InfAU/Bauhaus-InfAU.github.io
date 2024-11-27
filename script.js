// Encoded answer values
const _0xf4e9 = [
    ['MTQyLjM1', 'NTExLjA=', 'MjYxLjM0', 'NjU3LjA=', 'MTQyLjM1', 'OTEyLjU=', 'MzI4LjU=', 'Mjc5LjU5'], // Week 1
    ['NjQzLjg2', 'NTUxLjg4', 'NjY3LjIy', 'NTEwLjI3', 'NjI5Ljk5', 'NTgyLjU0', 'NjgyLjU1', 'NTkyLjc2'], // Week 2
    ['NjU3Ljcz', 'NTc1Ljk3', 'NjkxLjMx', 'NTM1LjgyJA==', 'NjU0LjA4', 'NjAwLjc5', 'Njk5LjM0', 'NjE2Ljg1'], // Week 3
    ['Njc3LjQ0', 'NjA4LjgyJA==', 'NzAyLjI2', 'NTY3Ljk0', 'NjcwLjg3', 'NjI1LjYx', 'NzEwLjI5', 'NjQwLjk0'] // Week 4
];

// Track selected options
let selectedGroup = null;
let selectedWeek = null;

// Initialize UI elements
document.addEventListener('DOMContentLoaded', () => {
    initializeButtons();
    document.querySelector('form').addEventListener('submit', checkScore);
    
    const scoreInput = document.getElementById('score');
    
    // Reset on any interaction
    ['input', 'focus', 'click', 'mousedown', 'touchstart'].forEach(event => {
        scoreInput.addEventListener(event, resetInputToDefault);
    });
    
    // Also reset when selecting new week/group
    document.querySelectorAll('.week-button, .group-button').forEach(button => {
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

// Initialize week and group buttons
function initializeButtons() {
    // Week buttons
    const weekButtons = document.querySelectorAll('.week-buttons button');
    weekButtons.forEach((button, index) => {
        button.classList.add('week-button');
        button.addEventListener('click', () => selectWeek(index + 1));
    });

    // Group buttons
    const groupButtons = document.querySelectorAll('.group-buttons button');
    groupButtons.forEach((button, index) => {
        button.classList.add('group-button');
        button.addEventListener('click', () => selectGroup(index + 1));
    });
}

// Week selection handler
function selectWeek(weekNum) {
    document.querySelectorAll('.week-button').forEach((button) => {
        button.classList.remove('selected');
    });

    const selectedButton = document.querySelector(`.week-button:nth-child(${weekNum})`);
    selectedButton.classList.add('selected');

    selectedWeek = weekNum;
    // Reset group selection when week changes
    selectedGroup = null;
    document.querySelectorAll('.group-button').forEach((button) => {
        button.classList.remove('selected');
    });
}

// Group selection handler
function selectGroup(groupNum) {
    if (!selectedWeek) {
        alert('Please select a week first');
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

    if (!selectedWeek || !selectedGroup) {
        alert('Please select both week and group');
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
    const encodedCorrect = _0xf4e9[selectedWeek - 1][selectedGroup - 1];
    const correctScore = Number(atob(encodedCorrect)) / 7.3;
    
    const margin = 0.01;
    const isCorrect = Math.abs(userScore - correctScore) <= margin;
    
    // Remove any existing validation classes
    scoreInput.classList.remove('valid-input', 'invalid-input', 'default-input');
    
    // Add appropriate validation class
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
        resultDiv.innerHTML = `
            <h3>Not quite right ❌</h3>
            <p>Please review your calculations and try again</p>
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