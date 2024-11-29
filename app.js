// Disable right-click context menu
document.addEventListener('contextmenu', event => event.preventDefault());

// Immediately Invoked Function Expression to avoid global scope pollution
(() => {
    // Fetch and parse CSV data using PapaParse
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

    // Parse CSV text into an array of objects using PapaParse
    function parseCSV(text) {
        const results = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            trimHeaders: true,
        });

        if (results.errors.length) {
            console.error('CSV Parsing Errors:', results.errors);
        }

        const data = results.data.map(entry => {
            // Ensure that all expected fields are present
            return {
                week: entry.week,
                task: entry.task,
                tags: entry.tags || '',
                'unique-variant': entry['unique-variant'] || 'no',
                question: entry.question || '',
                'field-answers': entry['field-answers'] || '',
                'field-number': entry['field-number'] || 1,
                'field-names': entry['field-names'] || '',
            };
        });

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

        // Hide all labels initially
        document.querySelectorAll('label').forEach(label => label.style.display = 'none');
        
        // Show week label since we always have weeks
        document.querySelector('label[for="week-selection"]').style.display = 'block';

        // Render week selection buttons
        weeks.forEach(week => {
            const button = document.createElement('button');
            button.textContent = `Week ${week}`;
            button.className = 'button';
            button.onclick = () => selectWeek(week);
            weekSelection.appendChild(button);
        });

        // Week selection handler with updated task generation logic
        function selectWeek(week) {
            currentWeek = week;
            currentTask = null;
            currentVariant = null;
            currentQuestion = null;
            clearUI();
            // Highlight selected week
            highlightSelectedButton(weekSelection, `Week ${week}`);
            // Clear previous task buttons
            taskSelection.innerHTML = '';
            
            // Get all tasks for the selected week
            const weekTasks = data.filter(item => item.week === week);
            
            // Create a map to store task buttons with their bonus status
            const taskButtons = new Map();
            
            weekTasks.forEach(taskData => {
                const taskNum = taskData.task;
                const isBonus = taskData.tags && taskData.tags.includes('bonus');
                const buttonKey = isBonus ? `${taskNum}-bonus` : `${taskNum}`;
                
                // Create button if it doesn't exist
                if (!taskButtons.has(buttonKey)) {
                    const button = document.createElement('button');
                    button.className = 'button';
                    
                    if (isBonus) {
                        button.textContent = `Task ${taskNum}`;
                        const badge = document.createElement('span');
                        badge.className = 'bonus-badge';
                        badge.textContent = 'bonus';
                        button.appendChild(badge);
                    } else {
                        button.textContent = `Task ${taskNum}`;
                    }
                    
                    // Store both the button and the task data
                    taskButtons.set(buttonKey, {
                        button,
                        taskData,
                        isBonus
                    });
                }
            });
            
            // Sort and append buttons
            Array.from(taskButtons.entries())
                .sort(([keyA], [keyB]) => {
                    const taskA = parseInt(keyA.split('-')[0]);
                    const taskB = parseInt(keyB.split('-')[0]);
                    if (taskA === taskB) {
                        // If task numbers are equal, non-bonus comes before bonus
                        return keyA.includes('bonus') ? 1 : -1;
                    }
                    return taskA - taskB;
                })
                .forEach(([_, {button, taskData, isBonus}]) => {
                    button.onclick = () => selectTask(taskData.task, isBonus);
                    taskSelection.appendChild(button);
                });
            
            // Show task label since we're displaying task buttons
            document.querySelector('label[for="task-selection"]').style.display = 'block';
            // Hide variant label until needed
            document.querySelector('label[for="variant-selection"]').style.display = 'none';
        }

        // Updated task selection handler
        function selectTask(task, isBonus) {
            currentTask = task;
            currentVariant = null;
            currentQuestion = null;
            clearTaskUI();
            
            // Highlight selected task
            const taskText = `Task ${task}`;
            highlightSelectedButton(taskSelection, taskText);
            
            // Get question data matching both task number and bonus status
            const questions = data.filter(item => 
                item.week === currentWeek && 
                item.task === task && 
                Boolean(item.tags && item.tags.includes('bonus')) === isBonus
            );
            
            currentQuestion = questions[0];
            if (!currentQuestion) {
                console.error(`No question found for week ${currentWeek}, task ${task}, bonus: ${isBonus}`);
                return;
            }
            
            // Check for variants
            if (currentQuestion['unique-variant'] === 'yes') {
                renderVariants(currentQuestion);
            } else {
                renderQuestion(currentQuestion);
            }
        }

        // Render variant selection if applicable
        function renderVariants(question) {
            // Split answers by forward slash and trim whitespace
            const answers = question['field-answers'].split('/').map(answer => answer.trim());
            // For unique variants, each answer should be its own variant
            const numVariants = answers.length;
            
            variantSelection.innerHTML = '';
            
            // Show variant label since we're displaying variant buttons
            document.querySelector('label[for="variant-selection"]').style.display = 'block';
            
            for (let i = 0; i < numVariants; i++) {
                const button = document.createElement('button');
                button.textContent = `Variant ${i + 1}`;
                button.className = 'button';
                button.onclick = () => selectVariant(i);
                variantSelection.appendChild(button);
            }
        }

        function selectVariant(variantIndex) {
            currentVariant = variantIndex;
            highlightSelectedButton(variantSelection, `Variant ${variantIndex + 1}`);
            renderQuestion(currentQuestion);
        }

        // Render question and input fields
        function renderQuestion(question) {
            if (question && question.question) {
                questionContainer.textContent = question.question;
                questionContainer.className = 'question-text';
                questionContainer.style.display = 'block';
            } else {
                questionContainer.textContent = 'Question not available.';
                questionContainer.style.display = 'none';
                return;
            }
            
            const fieldNumber = question['unique-variant'] === 'yes' ? 1 : parseInt(question['field-number'], 10);
            const fieldNames = splitPreservingCommas(question['field-names']);
            
            // Clear and set proper class on the container
            inputFieldsContainer.innerHTML = '';
            inputFieldsContainer.className = 'input-fields';
            
            for (let i = 0; i < fieldNumber; i++) {
                const inputGroup = document.createElement('div');
                inputGroup.className = 'input-group';
                
                const input = document.createElement('input');
                input.type = 'number';
                input.step = 'any';
                input.className = 'default-input';
                
                // If there's only one field name, use it for all inputs
                // If there are multiple field names, use the corresponding one for each input
                if (fieldNames.length === 1) {
                    input.placeholder = fieldNames[0];
                } else {
                    input.placeholder = fieldNames[i] || 'Input';
                }
                
                inputGroup.appendChild(input);
                inputFieldsContainer.appendChild(inputGroup);
            }
            
            checkAnswerButton.style.display = 'block';
            resultContainer.style.display = 'none';
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
            // Split answers and get the correct one for the current variant
            const allAnswers = currentQuestion['field-answers'].split('/').map(answer => parseFloat(answer.trim()));
            let correctAnswers;
            
            if (currentQuestion['unique-variant'] === 'yes') {
                // For unique variants, use the answer corresponding to the selected variant
                correctAnswers = [allAnswers[currentVariant]];
            } else {
                correctAnswers = allAnswers;
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
            questionContainer.style.display = 'none';
            inputFieldsContainer.innerHTML = '';
            checkAnswerButton.style.display = 'none';
            resultContainer.style.display = 'none';
            clearSelection(taskSelection);
            clearSelection(variantSelection);
            // Hide task and variant labels
            document.querySelector('label[for="task-selection"]').style.display = 'none';
            document.querySelector('label[for="variant-selection"]').style.display = 'none';
        }

        function clearTaskUI() {
            variantSelection.innerHTML = '';
            questionContainer.textContent = '';
            questionContainer.style.display = 'none';
            inputFieldsContainer.innerHTML = '';
            checkAnswerButton.style.display = 'none';
            resultContainer.style.display = 'none';
            clearSelection(variantSelection);
        }

        function highlightSelectedButton(container, text) {
            const buttons = container.querySelectorAll('button');
            buttons.forEach(button => {
                const buttonText = button.childNodes[0].textContent.trim();
                if (buttonText === text) {
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

        // Function to split fields while preserving commas inside quotes
        function splitPreservingCommas(str) {
            if (!str) return ['Input'];
            return str.split('/').map(s => s.trim());
        }
    }
})();