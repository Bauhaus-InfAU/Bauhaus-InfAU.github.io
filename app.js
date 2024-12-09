document.addEventListener('contextmenu', event => event.preventDefault());

(() => {
    fetch('course-questions.csv')
        .then(response => response.text())
        .then(text => {
            const parsedData = parseCSV(text);
            initializeApp(parsedData);
        })
        .catch(error => {
            console.error('Error loading CSV data:', error);
            alert('Failed to load data. Please try again later.');
        });

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
        
            return results.data.map(entry => ({
                week: entry.week,
                task: entry.task,
                tags: entry.tags || '',
                'unique-variant': entry['unique-variant'] || 'no',
                question: entry.question || '',
                'field-answers': entry['field-answers'] || '',
                'field-number': entry['field-number'] || 1,
                'field-names': entry['field-names'] || '',
                tolerance: parseFloat(entry.tolerance) || 0.001, // Add default tolerance
            }));
        }

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

        const answerData = {};
        Object.defineProperty(window, 'answerData', {
            value: answerData,
            writable: false,
            enumerable: false,
            configurable: false
        });

        checkAnswerButton.style.display = 'none';
        document.querySelectorAll('label').forEach(label => label.style.display = 'none');
        document.querySelector('label[for="week-selection"]').style.display = 'block';

        weeks.forEach(week => {
            const button = document.createElement('button');
            button.textContent = `Week ${week}`;
            button.className = 'button';
            button.onclick = () => selectWeek(week);
            weekSelection.appendChild(button);
        });

        function selectWeek(week) {
            currentWeek = week;
            currentTask = null;
            currentVariant = null;
            currentQuestion = null;
            clearUI();
            
            highlightSelectedButton(weekSelection, `Week ${week}`);
            taskSelection.innerHTML = '';
            
            const weekTasks = data.filter(item => item.week === week);
            const taskButtons = new Map();
            
            weekTasks.forEach(taskData => {
                const taskNum = taskData.task;
                const isBonus = taskData.tags && taskData.tags.includes('bonus');
                const buttonKey = `${taskNum}-${isBonus ? 'bonus' : 'regular'}`;
                
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
                    
                    taskButtons.set(buttonKey, { button, taskData, isBonus });
                }
            });
            
            // Updated sorting logic
            Array.from(taskButtons.entries())
                .sort(([keyA], [keyB]) => {
                    const [taskA, typeA] = keyA.split('-');
                    const [taskB, typeB] = keyB.split('-');
                    
                    // Split task numbers into main and sub-parts (e.g., "7.1" -> [7, 1])
                    const [mainA, subA = 0] = taskA.toString().split('.').map(Number);
                    const [mainB, subB = 0] = taskB.toString().split('.').map(Number);
                    
                    // First compare main task numbers
                    if (mainA !== mainB) {
                        return mainA - mainB;
                    }
                    
                    // If main numbers are the same, compare sub-numbers
                    if (subA !== subB) {
                        return subA - subB;
                    }
                    
                    // If both main and sub-numbers are the same, sort regular before bonus
                    return typeA === 'bonus' ? 1 : -1;
                })
                .forEach(([_, {button, taskData, isBonus}]) => {
                    button.onclick = () => selectTask(taskData.task, isBonus);
                    taskSelection.appendChild(button);
                });
            
            document.querySelector('label[for="task-selection"]').style.display = 'block';
            document.querySelector('label[for="variant-selection"]').style.display = 'none';
        }

        function selectTask(task, isBonus) {
            currentTask = task;
            currentVariant = null;
            currentQuestion = null;
            clearTaskUI();
            
            const taskButtons = taskSelection.querySelectorAll('button');
            taskButtons.forEach(button => {
                const buttonText = button.childNodes[0].textContent.trim();
                const buttonHasBonus = button.querySelector('.bonus-badge') !== null;
                button.classList.toggle('selected', 
                    buttonText === `Task ${task}` && buttonHasBonus === isBonus);
            });
            
            const questions = data.filter(item => 
                item.week === currentWeek && 
                item.task === task && 
                Boolean(item.tags && item.tags.includes('bonus')) === isBonus
            );
            
            currentQuestion = questions[0];
            if (currentQuestion) {
                currentQuestion['unique-variant'] === 'yes' ? 
                    renderVariants(currentQuestion) : 
                    renderQuestion(currentQuestion);
            }
        }

        function renderVariants(question) {
            const answers = question['field-answers'].split('/').map(answer => answer.trim());
            const numVariants = answers.length;
            
            variantSelection.innerHTML = '';
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
            highlightSelectedButton(variantSelection, `Group ${variantIndex + 1}`);
            renderQuestion(currentQuestion);
        }

        function renderQuestion(question) {
            if (question?.question) {
                questionContainer.innerHTML = question.question.split('\n')
                    .map(line => line.trim()).join('<br>');
                questionContainer.className = 'question-text';
                questionContainer.style.display = 'block';
            } else {
                questionContainer.textContent = 'Question not available.';
                questionContainer.style.display = 'none';
                return;
            }
            
            const fieldNumber = question['unique-variant'] === 'yes' ? 
                1 : parseInt(question['field-number'], 10);
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
                
                input.placeholder = fieldNames.length === 1 ? 
                    fieldNames[0] : (fieldNames[i] || 'Input');
                
                inputGroup.appendChild(input);
                inputFieldsContainer.appendChild(inputGroup);
            }
            
            checkAnswerButton.style.display = 'block';
            resultContainer.style.display = 'none';
            checkAnswerButton.disabled = false;
            clearInputs();
        }

        function getFeedbackMessage(percentDiff) {
            const absDiff = Math.abs(percentDiff);
            if (absDiff <= 5) {
                return "You're very close! Just a small adjustment needed.";
            } else if (absDiff <= 20) {
                return percentDiff > 0 ? 
                    "Your answer is a bit high. Check your calculations." : 
                    "Your answer is a bit low. Check your calculations.";
            }
            return "That's quite different from the expected result. Review your approach.";
        }

        checkAnswerButton.onclick = () => {
            if (!currentQuestion) {
                console.error('No question selected');
                return;
            }
        
            const inputs = [...inputFieldsContainer.querySelectorAll('input')];
            const userAnswers = inputs.map(input => parseFloat(input.value));
            
            // Log debugging information
            console.log('Current Question:', currentQuestion);
            console.log('User Answers:', userAnswers);
            
            const validAnswerIndices = userAnswers
                .map((answer, index) => !isNaN(answer) ? index : -1)
                .filter(index => index !== -1);
            
            if (validAnswerIndices.length === 0) {
                resultContainer.style.display = 'block';
                resultContainer.className = 'incorrect';
                resultContainer.textContent = 'Please fill in at least one field';
                return;
            }
            
            try {
                // Ensure we have a valid answer string
                const rawAnswers = String(currentQuestion['field-answers']).trim();
                //console.log('Raw Answers:', rawAnswers);
                
                // Parse answers, handling both single values and arrays
                const allAnswers = rawAnswers.includes('/') ? 
                    rawAnswers.split('/').map(answer => parseFloat(answer.trim())) :
                    [parseFloat(rawAnswers)];
                    
                console.log('Parsed Answers:', allAnswers);
        
                if (!allAnswers || allAnswers.some(isNaN)) {
                    console.error('Invalid answer format:', allAnswers);
                    resultContainer.style.display = 'block';
                    resultContainer.className = 'incorrect';
                    resultContainer.textContent = 'Error validating answer. Please try again.';
                    return;
                }
                
                let correctAnswers = currentQuestion['unique-variant'] === 'yes' ? 
                    [allAnswers[currentVariant]] : allAnswers;
                    
                //console.log('Correct Answers:', correctAnswers);
                
                let allCorrect = true;
                const feedbacks = [];
                
                validAnswerIndices.forEach(index => {
                    const answer = userAnswers[index];
                    const correctAnswer = correctAnswers[index];
                    const tolerance = currentQuestion.tolerance; // Use the question-specific tolerance
                    const diff = Math.abs(answer - correctAnswer);
                    const percentDiff = ((answer - correctAnswer) / correctAnswer) * 100;
                    
                    console.log(`Comparing answer ${answer} with correct answer ${correctAnswer}`);
                    console.log(`Difference: ${diff}, Tolerance: ${tolerance}`);
                    
                    if (diff <= tolerance) {
                        inputs[index].className = 'valid-input';
                    } else {
                        inputs[index].className = 'invalid-input';
                        allCorrect = false;
                        feedbacks.push(getFeedbackMessage(percentDiff));
                    }
                });
        
                resultContainer.style.display = 'block';
                resultContainer.className = allCorrect ? 'correct' : 'incorrect';
                resultContainer.textContent = allCorrect ? 
                    `Correct within tolerance of ${currentQuestion.tolerance}%, congratulations!` : 
                    (feedbacks[0] || 'Incorrect. Please try again.');
            } catch (error) {
                console.error('Error checking answer:', error);
                resultContainer.style.display = 'block';
                resultContainer.className = 'incorrect';
                resultContainer.textContent = 'Error checking answer. Please try again.';
            }
        };

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
            container.querySelectorAll('button').forEach(button => {
                button.classList.toggle('selected', 
                    button.childNodes[0].textContent.trim() === text);
            });
        }

        function clearSelection(container) {
            container.querySelectorAll('button')
                .forEach(button => button.classList.remove('selected'));
        }

        function clearInputs() {
            inputFieldsContainer.querySelectorAll('input').forEach(input => {
                input.value = '';
                input.className = 'default-input';
            });
            resultContainer.style.display = 'none';
        }

        function splitPreservingCommas(str) {
            return str ? str.split('/').map(s => s.trim()) : ['Input'];
        }
    }
})();