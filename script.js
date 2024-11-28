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
        const response = await fetch('/course-questions.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        parseCSVData(csvText);
        initializeWeekButtons();
    } catch (error) {
        console.error('Error loading question data:', error);
        // Show user-friendly error message
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
        const question = {
            week: parseInt(values[0]),
            task: parseInt(values[1]),
            tags: values[2] ? values[2].split(';') : [],
            uniqueVariant: values[3].toLowerCase() === 'yes',
            question: values[4],
            fieldAnswers: values[5].split(';'),
            fieldNumber: parseInt(values[6]),
            fieldNames: values[7].split(';')
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
    
    const variantCount = question.fieldAnswers.length;
    for (let i = 0; i < variantCount; i++) {
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
    updateButtonStates('week-buttons', week);
    initializeTaskButtons(week);
    clearResults();
    resetInputFields();
}

function selectTask(task) {
    selectedTask = task;
    selectedVariant = null;
    
    // Update UI
    updateButtonStates('task-buttons', task);
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
    updateButtonStates('variant-buttons', variant);
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
    
    // Get answers for selected variant if applicable
    const relevantAnswers = question.uniqueVariant && selectedVariant !== null
        ? [question.fieldAnswers[selectedVariant]]
        : question.fieldAnswers;
    
    // Create the correct number of input fields based on fieldNumber
    for (let i = 0; i < question.fieldNumber; i++) {
        const group = document.createElement('div');
        group.className = 'input-group';
        
        const label = document.createElement('label');
        label.className = 'input-label';
        // Use the field name if available, otherwise use a default
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
function updateButtonStates(containerClass, selectedValue) {
    const buttons = document.getElementsByClassName(containerClass);
    Array.from(buttons).forEach(button => {
        button.classList.toggle('selected', 
            button.textContent.includes(selectedValue.toString()));
    });
}

// Check answer
function checkAnswer(event) {
    event.preventDefault();
    
    const question = getCurrentQuestion();
    if (!question) return;
    
    const inputs = document.querySelectorAll('#inputFields input');
    const values = Array.from(inputs).map(input => parseFloat(input.value));
    
    // Validate all inputs are filled
    if (values.some(isNaN)) {
        alert('Please fill all fields with valid numbers');
        return;
    }
    
    const answersToCheck = question.uniqueVariant 
        ? [question.fieldAnswers[selectedVariant]]
        : question.fieldAnswers;
    
    const isCorrect = checkValues(values, answersToCheck);
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

// Reset all UI state
function resetUI() {
    selectedWeek = null;
    selectedTask = null;
    selectedVariant = null;
    
    document.querySelectorAll('.button').forEach(button => {
        button.classList.remove('selected');
    });
    
    document.getElementById('variantSection').style.display = 'none';
    resetInputFields();
    clearResults();
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
    },
    'encodedAnswers': {
        enumerable: false,
        writable: false,
        configurable: false
    }
});