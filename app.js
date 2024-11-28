// Disable right-click context menu
document.addEventListener('contextmenu', event => event.preventDefault());

// Immediately Invoked Function Expression to avoid global scope pollution
(() => {
    // Fetch and parse CSV data
    fetch('course-questions.csv')
        .then(response => response.text())
        .then(text => {
            const parsedData = parseCSV(text);
            console.log('Parsed Data:', parsedData); // Debug log
            initializeApp(parsedData);
        })
        .catch(error => {
            console.error('Error loading CSV data:', error);
            alert('Failed to load data. Please try again later.');
        });

    // Parse CSV text into an array of objects
    function parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split('\t'); // Adjust delimiter if necessary
        const data = lines.slice(1).map(line => {
            const values = line.split('\t'); // Adjust delimiter if necessary
            if (values.length !== headers.length) {
                console.warn('Skipping line due to mismatched columns:', line);
                return null;
            }
            const entry = {};
            headers.forEach((header, index) => {
                entry[header.trim()] = values[index] ? values[index].trim() : '';
            });
            // Parse week and task as numbers
            entry.week = parseInt(entry.week, 10);
            entry.task = parseInt(entry.task, 10);
            return entry;
        }).filter(entry => entry !== null); // Remove null entries
        return data;
    }

    // Main application initialization
    function initializeApp(data) {
        const weeks = [...new Set(data.map(item => item.week))];
        const weekSelection = document.getElementById('week-selection');
        const taskSelection = document.getElementById('task-selection');
        const variantSelection = document.getElementById('variant-selection');
        const questionContainer = document.getElementById('question-container');
        const inputFieldsContainer = document.getElementById('input-fields');
        const checkAnswerButton = document.getElementById('check-answer');
        const resultContainer = document.getElementById('result');

        let currentWeek = null;
        let currentTask = null;
        let currentVariant = null;
        let currentQuestion = null;

        // Make answer data non-enumerable
        const answerData = {};
        Object.defineProperty(window, 'answerData', {
            value: answerData,
            writable: false,
            enumerable: false,
            configurable: false
        });

        // Render week selection buttons
        weeks.forEach(week => {
            const button = document.createElement('button');
            button.textContent = `Week ${week}`;
            button.className = 'task-button';
            button.onclick = () => selectWeek(week);
            weekSelection.appendChild(button);
        });

        // Week selection handler
        function selectWeek(week) {
            currentWeek = week;
            currentTask = null;
            currentVariant = null;
            currentQuestion = null;
            clearUI();
            // Highlight selected week
            highlightSelectedButton(weekSelection, `Week ${week}`);
            // Render tasks for the selected week
            const tasks = data.filter(item => item.week === week)
                              .map(item => item.task);
            const uniqueTasks = [...new Set(tasks)];
            uniqueTasks.forEach(task => {
                const taskData = data.find(item => item.week === week && item.task === task);
                if (!taskData) {
                    console.error(`No task data found for week ${week}, task ${task}`);
                    return;
                }
                const button = document.createElement('button');
                button.textContent = `Task ${task}`;
                button.className = 'task-button';
                if (taskData.tags && taskData.tags.includes('bonus')) {
                    const badge = document.createElement('span');
                    badge.textContent = 'Bonus';
                    badge.style.marginLeft = '5px';
                    badge.style.color = 'red';
                    button.appendChild(badge);
                }
                button.onclick = () => selectTask(task);
                taskSelection.appendChild(button);
            });
        }

        // Task selection handler
        function selectTask(task) {
            currentTask = task;
            currentVariant = null;
            currentQuestion = null;
            clearTaskUI();
            // Highlight selected task
            highlightSelectedButton(taskSelection, `Task ${task}`);
            // Get question data
            const questions = data.filter(item => item.week === currentWeek && item.task === task);
            currentQuestion = questions[0];
            // Check for variants
            if (currentQuestion && currentQuestion['unique-variant'] === 'yes') {
                renderVariants(currentQuestion);
            } else {
                renderQuestion(currentQuestion);
            }
        }

        // Render variant selection if applicable
        function renderVariants(question) {
            const answers = question['field-answers'].split(',');
            const numVariants = answers.length;
            variantSelection.innerHTML = '';
            for (let i = 0; i < numVariants; i++) {
                const button = document.createElement('button');
                button.textContent = `Variant ${i + 1}`;
                button.className = 'task-button';
                button.onclick = () => selectVariant(i);
                variantSelection.appendChild(button);
            }
        }

        // Variant selection handler
        function selectVariant(variantIndex) {
            currentVariant = variantIndex;
            highlightSelectedButton(variantSelection, `Variant ${variantIndex + 1}`);
            renderQuestion(currentQuestion);
        }

        // Render question and input fields
        function renderQuestion(question) {
            if (question && question.question) {
                questionContainer.textContent = question.question;
            } else {
                questionContainer.textContent = 'Question not available.';
                return;
            }
            const fieldNumber = parseInt(question['field-number'], 10);
            const fieldNames = question['field-names'].split(',');
            inputFieldsContainer.innerHTML = '';
            for (let i = 0; i < fieldNumber; i++) {
                const label = document.createElement('label');
                label.textContent = fieldNames[i] || `Input ${i + 1}`;
                const input = document.createElement('input');
                input.type = 'number';
                input.step = 'any';
                input.className = 'default-input';
                inputFieldsContainer.appendChild(label);
                inputFieldsContainer.appendChild(input);
            }
            checkAnswerButton.style.display = 'block';
            resultContainer.style.display = 'none';
            // Clear previous inputs
            checkAnswerButton.disabled = false;
            clearInputs();
        }

        // Check answer handler
        checkAnswerButton.onclick = () => {
            const inputs = [...inputFieldsContainer.querySelectorAll('input')];
            const userAnswers = inputs.map(input => parseFloat(input.value));
            if (userAnswers.some(isNaN)) {
                alert('Please fill in all input fields.');
                return;
            }
            // Retrieve correct answers
            let correctAnswers = currentQuestion['field-answers'].split(',').map(Number);
            if (currentQuestion['unique-variant'] === 'yes') {
                correctAnswers = [correctAnswers[currentVariant]];
            }
            // Compare answers with 1% tolerance
            let allCorrect = true;
            userAnswers.forEach((answer, index) => {
                const correctAnswer = correctAnswers[index];
                const tolerance = Math.abs(correctAnswer) * 0.01;
                if (Math.abs(answer - correctAnswer) <= tolerance) {
                    inputs[index].className = 'valid-input';
                } else {
                    inputs[index].className = 'invalid-input';
                    allCorrect = false;
                }
            });
            // Display result
            resultContainer.style.display = 'block';
            resultContainer.className = allCorrect ? 'correct' : 'incorrect';
            resultContainer.textContent = allCorrect ? 'Correct!' : 'Incorrect. Please try again.';
        };

        // Utility functions
        function clearUI() {
            taskSelection.innerHTML = '';
            variantSelection.innerHTML = '';
            questionContainer.textContent = '';
            inputFieldsContainer.innerHTML = '';
            checkAnswerButton.style.display = 'none';
            resultContainer.style.display = 'none';
            clearSelection(taskSelection);
            clearSelection(variantSelection);
        }

        function clearTaskUI() {
            variantSelection.innerHTML = '';
            questionContainer.textContent = '';
            inputFieldsContainer.innerHTML = '';
            checkAnswerButton.style.display = 'none';
            resultContainer.style.display = 'none';
            clearSelection(variantSelection);
        }

        function highlightSelectedButton(container, text) {
            const buttons = container.querySelectorAll('button');
            buttons.forEach(button => {
                if (button.textContent.includes(text)) {
                    button.classList.add('selected');
                } else {
                    button.classList.remove('selected');
                }
            });
        }

        function clearSelection(container) {
            const buttons = container.querySelectorAll('button');
            buttons.forEach(button => button.classList.remove('selected'));
        }

        function clearInputs() {
            const inputs = inputFieldsContainer.querySelectorAll('input');
            inputs.forEach(input => {
                input.value = '';
                input.className = 'default-input';
            });
            resultContainer.style.display = 'none';
        }
    }
})();
