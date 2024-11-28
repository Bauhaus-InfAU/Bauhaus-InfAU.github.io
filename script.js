// Question data structure
const questions = [];

// Track selected options
let selectedWeek = null;
let selectedTask = null;
let selectedVariant = null;

// Initialize after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    loadQuestionData();
    initializeEventListeners();
});

// Load and parse CSV data
async function loadQuestionData() {
    try {
        // Using relative path for GitHub Pages
        const response = await fetch('course-questions.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        parseCSVData(csvText);
        initializeWeekButtons();
    } catch (error) {
        console.error('Error loading question data:', error);
        document.getElementById('result').innerHTML = `
            <div class="incorrect">
                <h3>Loading Error</h3>
                <p>Unable to load questions. Please try refreshing the page.</p>
            </div>
        `;
        document.getElementById('result').style.display = 'block';
    }
}

// Parse CSV data and populate questions array
function parseCSVData(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const fieldAnswers = values[5].replace(/"/g, '').split(',');
        const fieldNumber = parseInt(values[6]);
        const isUniqueVariant = values[3].toLowerCase() === 'yes';
        
        // For unique variants, calculate number of variants based on answers and field number
        const variantCount = isUniqueVariant ? Math.floor(fieldAnswers.length / fieldNumber) : 1;
        
        const question = {
            week: parseInt(values[0]),
            task: parseInt(values[1]),
            tags: values[2] ? values[2].split(';') : [],
            uniqueVariant: isUniqueVariant,
            question: values[4],
            fieldAnswers: fieldAnswers,
            fieldNumber: fieldNumber,
            fieldNames: values[7].replace(/"/g, '').split(';'),
            variantCount: variantCount
        };
        questions.push(question);
    }
}

// Initialize event listeners
function initializeEventListeners() {
    document.getElementById('checkButton').addEventListener('click', checkAnswer);
}

// Initialize week buttons
function initializeWeekButtons() {
    const weeks = [...new Set(questions.map(q => q.week))];
    const container = document.getElementById('weekButtons');
    container.innerHTML = '';
    
    weeks.forEach(week => {
        const button = createButton(`Week ${week}`, () => selectWeek(week));
        container.appendChild(button);
    });
}

// Initialize task buttons for selected week
function initializeTaskButtons(week) {
    const weekQuestions = questions.filter(q => q.week === week);
    const container = document.getElementById('taskButtons');
    container.innerHTML = '';
    
    weekQuestions.forEach(q => {
        const button = createButton(`Task ${q.task}`, () => selectTask(q.task));
        if (q.tags.includes('bonus')) {
            const badge = document.createElement('span');
            badge.className = 'bonus-badge';
            badge.textContent = 'bonus';
            button.appendChild(badge);
        }
        container.appendChild(button);
    });
}

// Initialize variant buttons if needed
function initializeVariantButtons(question) {
    const container = document.getElementById('variantButtons');
    const section = document.getElementById('variantSection');
    
    if (!question.uniqueVariant) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    container.innerHTML = '';
    
    // Create buttons based on calculated variant count
    for (let i = 0; i < question.variantCount; i++) {
        const button = createButton(`Variant ${i + 1}`, () => selectVariant(i));
        container.appendChild(button);
    }
}

// Create button helper function
function createButton(text, onClick) {
    const button = document.createElement('button');
    button.className = 'button';
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
}

// Selection handlers
function selectWeek(week) {
    selectedWeek = week;
    selectedTask = null;
    selectedVariant = null;
    
    // Update UI
    updateButtonStates('weekButtons', week, 'Week');
    initializeTaskButtons(week);
    clearResults();
    resetInputFields();
}

function selectTask(task) {
    selectedTask = task;
    selectedVariant = null;
    
    // Update UI
    updateButtonStates('taskButtons', task, 'Task');
    const question = getCurrentQuestion();
    if (question) {
        initializeVariantButtons(question);
        if (!question.uniqueVariant) {
            setupInputFields(question);
        }
    }
    clearResults();
}

function selectVariant(variant) {
    selectedVariant = variant;
    
    // Update UI
    updateButtonStates('variantButtons', variant, 'Variant');
    const question = getCurrentQuestion();
    if (question) {
        setupInputFields(question);
    }
    clearResults();
}

// Get current question helper
function getCurrentQuestion() {
    return questions.find(q => 
        q.week === selectedWeek && 
        q.task === selectedTask
    );
}

// Setup input fields based on question
function setupInputFields(question) {
    const container = document.getElementById('inputFields');
    const questionText = document.getElementById('questionText');
    
    // Set question text
    questionText.textContent = question.question;
    
    // Clear previous inputs
    container.innerHTML = '';
    
    // Calculate start index for variant's answers
    const startIndex = question.uniqueVariant ? selectedVariant * question.fieldNumber : 0;
    
    // Create the correct number of input fields
    for (let i = 0; i < question.fieldNumber; i++) {
        const group = document.createElement('div');
        group.className = 'input-group';
        
        const label = document.createElement('label');
        label.className = 'input-label';
        const fieldName = question.fieldNames[Math.min(i, question.fieldNames.length - 1)];
        label.textContent = fieldName || `Value ${i + 1}`;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.step = 'any';
        input.required = true;
        input.className = 'score-input';
        
        group.appendChild(label);
        group.appendChild(input);
        container.appendChild(group);
    }
}

// Update button states helper
function updateButtonStates(containerId, selectedValue, prefix) {
    const container = document.getElementById(containerId);
    const buttons = container.getElementsByClassName('button');
    Array.from(buttons).forEach(button => {
        button.classList.toggle('selected', 
            button.textContent === `${prefix} ${selectedValue + 1}`);
    });
}

// Check answer
function checkAnswer(event) {
    event.preventDefault();
    
    const question = getCurrentQuestion();
    if (!question) return;
    
    if (question.uniqueVariant && selectedVariant === null) {
        alert('Please select a variant');
        return;
    }
    
    const inputs = document.querySelectorAll('#inputFields input');
    const values = Array.from(inputs).map(input => parseFloat(input.value));
    
    // Validate all inputs are filled
    if (values.some(isNaN)) {
        alert('Please fill all fields with valid numbers');
        return;
    }
    
    // Get the correct answers based on variant
    const startIndex = question.uniqueVariant ? selectedVariant * question.fieldNumber : 0;
    const relevantAnswers = question.fieldAnswers.slice(startIndex, startIndex + question.fieldNumber);
    
    const isCorrect = checkValues(values, relevantAnswers);
    showResult(isCorrect);
}

// Check values against answers
function checkValues(values, answers) {
    if (values.length !== answers.length) return false;
    
    const margin = 0.01; // 1% tolerance
    
    return values.every((value, index) => {
        const expected = parseFloat(answers[index]);
        const percentDiff = Math.abs((value - expected) / expected) * 100;
        return percentDiff <= margin;
    });
}

// Show result message
function showResult(isCorrect) {
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.className = isCorrect ? 'correct' : 'incorrect';
    
    if (isCorrect) {
        resultDiv.innerHTML = `
            <h3>Correct! ✅</h3>
            <p>Your calculation is correct</p>
        `;
    } else {
        resultDiv.innerHTML = `
            <h3>Not quite right ❌</h3>
            <p>Please check your calculations and try again</p>
        `;
    }
}

// Clear results
function clearResults() {
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'none';
    resultDiv.innerHTML = '';
}

// Reset input fields
function resetInputFields() {
    const container = document.getElementById('inputFields');
    container.innerHTML = '';
    const questionText = document.getElementById('questionText');
    questionText.textContent = '';
}

// Protect against console inspection
(function() {
    const originalLog = console.log;
    console.log = function(...args) {
        if (args.some(arg => 
            arg === questions || 
            arg === encodedAnswers ||
            (typeof arg === 'string' && arg.includes('fieldAnswers'))
        )) {
            return;
        }
        originalLog.apply(console, args);
    };
})();

// Disable right-click to make inspection slightly harder
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Make questions non-enumerable
Object.defineProperties(window, {
    'questions': {
        enumerable: false,
        writable: false,
        configurable: false
    }
});