// script.js

let selectedGroup = null;

const correctAnswers = {
    1: 85.6,
    2: 72.3,
    3: 93.1,
    4: 67.8,
    5: 88.9,
    6: 76.5,
    7: 91.2,
    8: 83.7
};

function selectGroup(groupNum) {
    document.querySelectorAll('.group-button').forEach((button) => {
        button.classList.remove('selected');
    });

    const selectedButton = document.querySelector(`.group-button:nth-child(${groupNum})`);
    selectedButton.classList.add('selected');

    selectedGroup = groupNum;
}

function checkScore(event) {
    event.preventDefault();

    if (!selectedGroup) {
        alert('Please select your group');
        return;
    }

    const userScore = parseFloat(document.getElementById('score').value);
    const resultDiv = document.getElementById('result');

    if (isNaN(userScore)) {
        alert('Please enter your calculated score');
        return;
    }

    const correctScore = correctAnswers[selectedGroup];
    const margin = 0.1;
    const isCorrect = Math.abs(userScore - correctScore) <= margin;

    resultDiv.style.display = 'block';
    resultDiv.className = isCorrect ? 'correct' : 'incorrect';

    if (isCorrect) {
        resultDiv.innerHTML = `
            <h3>Correct! ✅</h3>
            <p>Your calculation matches the expected score of ${correctScore}.</p>
        `;
    } else {
        resultDiv.innerHTML = `
            <h3>Not quite right ❌</h3>
            <p>Please review your calculations and try again.</p>
        `;
    }
}
