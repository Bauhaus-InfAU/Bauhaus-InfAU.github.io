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

        // Hide check button initially
        checkAnswerButton.style.display = 'none';

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
                const buttonKey = `${taskNum}-${isBonus ? 'bonus' : 'regular'}`;
                
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
                    
                    // Store button, task data, and bonus status
                    taskButtons.set(buttonKey, {
                        button,
                        taskData,
                        isBonus
                    });
                }
            });
            
            // Sort and append buttons
            Array.from(taskButtons.entries())
                .sort(([keyA, _], [keyB, __]) => {
                    // Split keys into task number and type (regular/bonus)
                    const [taskA, typeA] = keyA.split('-');
                    const [taskB, typeB] = keyB.split('-');
                    
                    // Compare task numbers first
                    const taskNumA = parseInt(taskA);
                    const taskNumB = parseInt(taskB);
                    if (taskNumA !== taskNumB) {
                        return taskNumA - taskNumB;
                    }
                    
                    // If task numbers are equal, regular comes before bonus
                    return typeA === 'bonus' ? 1 : -1;
                })
                .forEach(([_, {button, taskData, isBonus}]) => {
                    // Add onclick handler that includes both task number and bonus status
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
            
            // Highlight only the button that matches both task number AND bonus status
            const taskButtons = taskSelection.querySelectorAll('button');
            taskButtons.forEach(button => {
                const buttonText = button.childNodes[0].textContent.trim();
                const buttonHasBonus = button.querySelector('.bonus-badge') !== null;
                
                if (buttonText === `Task ${task}` && buttonHasBonus === isBonus) {
                    button.classList.add('selected');
                } else {
                    button.classList.remove('selected');
                }
            });
            
            // Get question data matching both task number and bonus status exactly
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
                button.textContent = `Group ${i + 1}`;
                button.className = 'button';
                button.onclick = () => selectVariant(i);
                variantSelection.appendChild(button);
            }
        }

        function selectVariant(variantIndex) {
            currentVariant = variantIndex;
            // Highlight selected variant button
            highlightSelectedButton(variantSelection, `Group ${variantIndex + 1}`);
            renderQuestion(currentQuestion);
        }

        // Render question and input fields
        function renderQuestion(question) {
            if (question && question.question) {
                // Replace \n with <br> tags for proper line breaks
                const formattedQuestion = question.question.split('\n').map(line => {
                    // Trim whitespace from each line
                    return line.trim();
                }).join('<br>');
                
                questionContainer.innerHTML = formattedQuestion;
                questionContainer.className = 'question-text';
                questionContainer.style.display = 'block';
            } else {
                questionContainer.textContent = 'Question not available.';
                questionContainer.style.display = 'none';
                return;
            }
            
            // Rest of the function remains the same...
            const fieldNumber = question['unique-variant'] === 'yes' ? 1 : parseInt(question['field-number'], 10);
            const fieldNames = splitPreservingCommas(question['field-names']);
            
            inputFieldsContainer.innerHTML = '';
            inputFieldsContainer.className = 'input-fields';
            
            for (let i = 0; i < fieldNumber; i++) {
                const inputGroup = document.createElement('div');
                inputGroup.className = 'input-group';
                
                const input = document.createElement('input');
                input.type = 'number';
                input.step = 'any';
                input.className = 'default-input';
                
                input.addEventListener('focus', function() {
                    this.className = 'default-input';
                });
                
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

        // Get feedback message based on percentage difference
        function getFeedbackMessage(percentDiff) {
            const absDiff = Math.abs(percentDiff);
            if (absDiff <= 5) {
                return "You're very close! Just a small adjustment needed in your calculations.";
            } else if (absDiff <= 20) {
                return percentDiff > 0 
                    ? "Your answer is a bit high. Double-check your calculations." 
                    : "Your answer is a bit low. Double-check your calculations.";
            } else {
                return "That's quite different from the expected result. Consider reviewing your approach - are you using the right formula?";
            }
        }

        // Check answer handler
        checkAnswerButton.onclick = () => {
            const inputs = [...inputFieldsContainer.querySelectorAll('input')];
            const userAnswers = inputs.map(input => parseFloat(input.value));
            
            // Split answers and get the correct one for the current variant
            const allAnswers = currentQuestion['field-answers'].split('/').map(answer => parseFloat(answer.trim()));
            let correctAnswers;
            
            if (currentQuestion['unique-variant'] === 'yes') {
                correctAnswers = [allAnswers[currentVariant]];
            } else {
                correctAnswers = allAnswers;
            }
            
            // Compare only filled answers
            let allCorrect = true;
            const feedbacks = [];
            
            userAnswers.forEach((answer, index) => {
                // Skip empty or invalid inputs
                if (isNaN(answer)) {
                    inputs[index].className = 'default-input';
                    return;
                }
                
                const correctAnswer = correctAnswers[index];
                const tolerance = Math.abs(correctAnswer) * 0.001;
                const percentDiff = ((answer - correctAnswer) / correctAnswer) * 100;
                
                if (Math.abs(answer - correctAnswer) <= tolerance) {
                    inputs[index].className = 'valid-input';
                } else {
                    inputs[index].className = 'invalid-input';
                    allCorrect = false;
                    feedbacks.push(getFeedbackMessage(percentDiff));
                }
            });

            // Display result with feedback
            resultContainer.style.display = 'block';
            resultContainer.className = allCorrect ? 'correct' : 'incorrect';
            if (allCorrect) {
                resultContainer.textContent = 'Correct!';
            } else {
                // Show the feedback for the first incorrect answer
                resultContainer.textContent = feedbacks[0] || 'Incorrect. Please try again.';
            }
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