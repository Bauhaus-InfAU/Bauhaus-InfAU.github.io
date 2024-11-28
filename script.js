// Ensure the script runs after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    loadQuestionData();
    initializeEventListeners();
});

// Global Variables

// Question data structure
const questions = [];

// Track selected options
let selectedWeek = null;
let selectedTask = null;
let selectedVariant = null;

// Initialize event listeners
function initializeEventListeners() {
    document.getElementById('checkButton').addEventListener('click', checkAnswer);
}

// Load and parse CSV data using PapaParse
async function loadQuestionData() {
    try {
        // Fetch the CSV file relative to the GitHub Pages root
        const response = await fetch('course-questions.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        parseCSVData(csvText);
        initializeWeekButtons();
    } catch (error) {
        console.error('Error loading question data:', error);
        displayErrorMessage('Loading Error', 'Unable to load questions. Please try refreshing the page.');
    }
}

// Display error message to the user
function displayErrorMessage(title, message) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="incorrect">
            <h3>${title}</h3>
            <p>${message}</p>
        </div>
    `;
    resultDiv.style.display = 'block';
}

// Parse CSV data and populate questions array using PapaParse
function parseCSVData(csvText) {
    const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });

    parsed.data.forEach(row => {
        const fieldAnswers = row['field-answers']
            ? row['field-answers'].replace(/"/g, '').split(',').map(ans => ans.trim())
            : [];
        const fieldNumber = parseInt(row['field-number'], 10) || 1;
        const isUniqueVariant = row['unique-variant'].toString().toLowerCase() === 'yes';
        const variantCount = isUniqueVariant ? Math.floor(fieldAnswers.length / fieldNumber) : 1;

        const fieldNames = row['field-names']
            ? row['field-names'].replace(/"/g, '').split(',').map(name => name.trim())
            : [];

        const tags = row['tags']
            ? row['tags'].split(';').map(tag => tag.trim())
            : [];

        const question = {
            week: parseInt(row['week'], 10),
            task: parseInt(row['task'], 10),
            tags: tags,
            uniqueVariant: isUniqueVariant,
            question: row['question'] || '',
            fieldAnswers: fieldAnswers,
            fieldNumber: fieldNumber,
            fieldNames: fieldNames,
            variantCount: variantCount,
        };
        questions.push(question);
    });
}

// Initialize week buttons based on parsed questions
function initializeWeekButtons() {
    const weeks = [...new Set(questions.map(q => q.week))].sort((a, b) => a - b);
    const container = document.getElementById('weekButtons');
    container.innerHTML = '';

    weeks.forEach(week => {
        const button = createButton(`Week ${week}`, () => selectWeek(week));
        container.appendChild(button);
    });
}

// Initialize task buttons for the selected week
function initializeTaskButtons(week) {
    const weekQuestions = questions.filter(q => q.week === week);
    const container = document.getElementById('taskButtons');
    container.innerHTML = '';

    weekQuestions.forEach(q => {
        const button = createButton(`Task ${q.task}`, () => selectTask(q.task));
        if (q.tags.includes('bonus')) {
            const badge = document.createElement('span');
            badge.className = 'bonus-badge';
            badge.textContent = 'Bonus';
            button.appendChild(badge);
        }
        container.appendChild(button);
    });
}

// Initialize variant buttons if the question has unique variants
function initializeVariantButtons(question) {
    const container = document.getElementById('variantButtons');
    const section = document.getElementById('variantSection');

    if (!question.uniqueVariant) {
        section.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = '';

    // Create buttons based on the number of variants
    for (let i = 0; i < question.variantCount; i++) {
        const button = createButton(`Variant ${i + 1}`, () => selectVariant(i));
        container.appendChild(button);
    }
}

// Create a button element with text and click handler
function createButton(text, onClick) {
    const button = document.createElement('button');
    button.className = 'button';
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
}

// Selection Handlers

function selectWeek(week) {
    selectedWeek = week;
    selectedTask = null;
    selectedVariant = null;

    // Update UI
    updateButtonStates('weekButtons', week, 'Week');
    initializeTaskButtons(week);
    clearResults();
    resetInputFields();
    hideVariantSection();
}

function selectTask(task) {
    selectedTask = task;
    selectedVariant = null;

    // Update UI
    updateButtonStates('taskButtons', task, 'Task');
    const currentQuestions = getCurrentQuestions();

    if (currentQuestions.length === 1) {
        initializeVariantButtons(currentQuestions[0]);
        if (!currentQuestions[0].uniqueVariant) {
            setupInputFields(currentQuestions[0]);
        }
    } else if (currentQuestions.length > 1) {
        // Handle multiple questions (e.g., bonus tasks)
        // For simplicity, display the first non-bonus question
        // and provide an option to select bonus if available
        const primaryQuestion = currentQuestions.find(q => !q.tags.includes('bonus'));
        const bonusQuestions = currentQuestions.filter(q => q.tags.includes('bonus'));

        if (primaryQuestion) {
            initializeVariantButtons(primaryQuestion);
            if (!primaryQuestion.uniqueVariant) {
                setupInputFields(primaryQuestion);
            }
        }

        if (bonusQuestions.length > 0) {
            // Optionally, you can create separate UI elements for bonus questions
            // For this example, we'll initialize the first bonus question
            // Alternatively, you can prompt the user to select between primary and bonus
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

// Get current question based on selected week, task, and variant
function getCurrentQuestion() {
    return questions.find(q =>
        q.week === selectedWeek &&
        q.task === selectedTask &&
        (!q.uniqueVariant || (q.uniqueVariant && selectedVariant !== null))
    );
}

// Get all current questions based on selected week and task
function getCurrentQuestions() {
    return questions.filter(q =>
        q.week === selectedWeek &&
        q.task === selectedTask
    );
}

// Setup input fields based on the current question
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

// Update button states to reflect the selected option
function updateButtonStates(containerId, selectedValue, prefix) {
    const container = document.getElementById(containerId);
    const buttons = container.getElementsByClassName('button');
    Array.from(buttons).forEach(button => {
        let buttonNumber;
        if (prefix === 'Variant') {
            // For Variant buttons, subtract 1 to get zero-based index
            buttonNumber = parseInt(button.textContent.replace(`${prefix} `, ''), 10) - 1;
            button.classList.toggle('selected', buttonNumber === selectedValue);
        } else {
            // For Week and Task buttons, use the actual number
            buttonNumber = parseInt(button.textContent.replace(`${prefix} `, ''), 10);
            button.classList.toggle('selected', buttonNumber === selectedValue);
        }
    });
}

// Check the user's answer
function checkAnswer(event) {
    event.preventDefault();

    const question = getCurrentQuestion();
    if (!question) {
        alert('No question selected. Please choose a week and task.');
        return;
    }

    if (question.uniqueVariant && selectedVariant === null) {
        alert('Please select a variant.');
        return;
    }

    const inputs = document.querySelectorAll('#inputFields input');
    const values = Array.from(inputs).map(input => parseFloat(input.value));

    // Validate all inputs are filled and are numbers
    if (values.some(isNaN)) {
        alert('Please fill all fields with valid numbers.');
        return;
    }

    // Get the correct answers based on variant
    const startIndex = question.uniqueVariant ? selectedVariant * question.fieldNumber : 0;
    const relevantAnswers = question.fieldAnswers.slice(startIndex, startIndex + question.fieldNumber).map(ans => parseFloat(ans));

    const isCorrect = checkValues(values, relevantAnswers);
    showResult(isCorrect);
}

// Check user input values against the correct answers with a margin of tolerance
function checkValues(values, answers) {
    if (values.length !== answers.length) return false;

    const margin = 0.01; // 1% tolerance

    return values.every((value, index) => {
        const expected = answers[index];
        if (expected === 0) {
            return value === 0;
        }
        const percentDiff = Math.abs((value - expected) / expected) * 100;
        return percentDiff <= margin;
    });
}

// Display the result to the user
function showResult(isCorrect) {
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.className = isCorrect ? 'correct' : 'incorrect';

    if (isCorrect) {
        resultDiv.innerHTML = `
            <h3>Correct! ✅</h3>
            <p>Your calculation is correct.</p>
        `;
    } else {
        resultDiv.innerHTML = `
            <h3>Not Quite Right ❌</h3>
            <p>Please check your calculations and try again.</p>
        `;
    }
}

// Clear the result message
function clearResults() {
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'none';
    resultDiv.innerHTML = '';
}

// Reset input fields and question text
function resetInputFields() {
    const container = document.getElementById('inputFields');
    container.innerHTML = '';
    const questionText = document.getElementById('questionText');
    questionText.textContent = '';
}

// Hide the variant selection section
function hideVariantSection() {
    const section = document.getElementById('variantSection');
    section.style.display = 'none';
}

// Optional: Remove or adjust console protection measures
// Note: Client-side code cannot be fully secured. Sensitive data should be handled server-side.
// The following code removes previous console protection as it was ineffective and contained errors.
/*
(function() {
    const originalLog = console.log;
    console.log = function(...args) {
        if (args.some(arg => 
            arg === questions ||
            (typeof arg === 'string' && arg.includes('fieldAnswers'))
        )) {
            return;
        }
        originalLog.apply(console, args);
    };
})();
*/

// Optional: Disable right-click context menu
// Note: Disabling right-click can frustrate users and does not secure your code.
// Consider removing this for better user experience.
/*
document.addEventListener('contextmenu', (e) => e.preventDefault());
*/

// Make questions array non-enumerable
// Note: This provides minimal protection and can be bypassed easily.
Object.defineProperty(window, 'questions', {
    enumerable: false,
    writable: false,
    configurable: false
});
