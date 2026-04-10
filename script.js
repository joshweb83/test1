const promptInput = document.getElementById('promptInput');
const startBtn = document.getElementById('startBtn');
const retryBtn = document.getElementById('retryBtn');
const roundSection = document.getElementById('roundSection');
const resultSection = document.getElementById('resultSection');
const roundPrompt = document.getElementById('roundPrompt');
const answerForm = document.getElementById('answerForm');
const resultList = document.getElementById('resultList');
const scoreText = document.getElementById('scoreText');

let currentPrompt = '';

function normalize(text) {
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function startRound() {
    const value = promptInput.value.trim();
    if (!value) {
        alert('주제를 입력해 주세요.');
        promptInput.focus();
        return;
    }

    currentPrompt = value;
    roundPrompt.textContent = `주제: ${currentPrompt}`;
    roundSection.hidden = false;
    resultSection.hidden = true;
    answerForm.reset();
}

function revealAnswers(event) {
    event.preventDefault();

    const formData = new FormData(answerForm);
    const answers = [];

    for (const [name, value] of formData.entries()) {
        const cleaned = value.trim();
        if (!cleaned) {
            alert('모든 플레이어 답변을 입력해 주세요.');
            return;
        }
        answers.push({ name, raw: cleaned, normalized: normalize(cleaned) });
    }

    const counts = new Map();
    answers.forEach((answer) => {
        counts.set(answer.normalized, (counts.get(answer.normalized) || 0) + 1);
    });

    const maxCount = Math.max(...counts.values());
    const matchedWords = new Set(
        [...counts.entries()]
            .filter(([, count]) => count === maxCount)
            .map(([word]) => word)
    );

    const unanimous = maxCount === answers.length;

    resultList.innerHTML = '';
    answers.forEach((answer, index) => {
        const li = document.createElement('li');
        li.textContent = `플레이어 ${index + 1}: ${answer.raw}`;
        if (matchedWords.has(answer.normalized) && maxCount > 1) {
            li.classList.add('match');
        }
        resultList.appendChild(li);
    });

    if (unanimous) {
        scoreText.textContent = '🎉 이구동성 성공! 모든 플레이어가 같은 답을 냈어요.';
    } else if (maxCount > 1) {
        scoreText.textContent = `👍 ${maxCount}명이 같은 답을 냈어요!`; 
    } else {
        scoreText.textContent = '😢 모두 다른 답을 냈어요. 다음 라운드에서 도전!';
    }

    resultSection.hidden = false;
}

startBtn.addEventListener('click', startRound);
retryBtn.addEventListener('click', startRound);
answerForm.addEventListener('submit', revealAnswers);
