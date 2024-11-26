// script.js

let selectedGroup = null;
let selectedWeek = null;

const correctAnswers = {
    1: {
        1: 85.6,
        2: 72.3,
        3: 93.1,
        4: 67.8,
        5: 88.9,
        6: 76.5,
        7: 91.2,
        8: 83.7
    },
    2: {
        1: 88.2,
        2: 75.6,
        3: 91.4,
        4: 69.9,
        5: 86.3,
        6: 79.8,
        7: 93.5,
        8: 81.2
    },
    3: {
        1: 90.1,
        2: 78.9,
        3: 94.7,
        4: 73.4,
        5: 89.6,
        6: 82.3,
        7: 95.8,
        8: 84.5
    },
    4: {
        1: 92.8,
        2: 83.4,
        3: 96.2,
        4: 77.8,
        5: 91.9,
        6: 85.7,
        7: 97.3,
        8: 87.8
    }
};

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
    // Hide any previous results
    document.getElementById('result').style.display = 'none';
}

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

function checkScore(event) {
    event.preventDefault();

    if (!selectedWeek) {
        alert('Please select your week');
        return;
    }

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

    const correctScore = correctAnswers[selectedWeek][selectedGroup];
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