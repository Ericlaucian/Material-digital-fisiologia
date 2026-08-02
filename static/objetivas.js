// // Selecionando os elementos do DOM
// const botao = document.getElementById('meuBotao');
// const inputTexto = document.getElementById('meuInput');
// const paragrafoResultado = document.getElementById('resultado');

// // Declaração da variável que vai armazenar o texto
// let textoArmazenado = "";

// // Adicionando o evento de clique ao botão
// botao.addEventListener('click', function() {
//     // Armazenando o valor do input na variável
//     textoArmazenado = inputTexto.value;

//     // Exibindo no console para verificação técnica
//     console.log("Texto armazenado na variável:", textoArmazenado);
//     enviarTextoParaServidor(textoArmazenado);

//     // Opcional: Mostra o resultado na página para o usuário
    
// });

// async function enviarTextoParaServidor(text) {
//     const resposta = await fetch("http://localhost:5000/receber_texto", {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ texto: text })
//     });

//     if (textoArmazenado.trim() !== "") {
//         paragrafoResultado.textContent = `Variável atualizada: "${textoArmazenado}"`;
//     } else {
//         paragrafoResultado.textContent = "Por favor, digite algo antes de apertar o botão.";
//     }

//     const dados = await resposta.json();
//     console.log("Resposta do servidor:", dados);
// }


const topicId = localStorage.getItem('topic') || '2';
const difficulty = localStorage.getItem('difficulty') || 'facil';
const questionSection = document.getElementById('question-section');
const questionTextElement = document.getElementById('question-text');
const hintsContainer = document.getElementById('hints-container');
const answerArea = document.getElementById('answer-area');
const optionsContainer = document.getElementById('options-container');
const feedbackMessage = document.getElementById('feedback-message');
const nextHintButton = document.getElementById('next-hint-button');
const answerNowButton = document.getElementById('answer-now-button');
const nextQuestionButton = document.getElementById('next-question-button');
const scoreDisplayElement = document.getElementById('score-display');
const roundProgressElement = document.getElementById('round-progress');
const scoreLargeElement = document.getElementById('score-large');
const roundProgressSmallElement = document.getElementById('round-progress-small');
const themeSwitch = document.getElementById('checkbox');

let currentTopicQuestions = {};
let selectedQuestionName = null;
let currentHintIndex = 0;
let hintsUsedInQuestion = 0;
let currentPossibleScore = 100;
let score = 0;
let questionsAnsweredCount = 0;
let answeredQuestions = [];

function getTopicName(topicIdValue) {
    const topicMap = {
        '0': 'fisiologia',
        '1': 'cardiologia',
        '2': 'citologia',
        '3': 'sis-nervoso',
        '4': 'histologia'
    };
    return topicMap[topicIdValue || '0'] || 'fisiologia';
}

function formatTopicLabel(topicName) {
    return topicName
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function applyInitialTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-theme');
        if (themeSwitch) themeSwitch.checked = true;
    } else {
        document.body.classList.remove('dark-theme');
        if (themeSwitch) themeSwitch.checked = false;
    }
}

function updateScoreDisplay() {
    if (scoreDisplayElement) scoreDisplayElement.textContent = `Score: ${score}`;
    if (scoreLargeElement) scoreLargeElement.textContent = currentPossibleScore;
}

async function loadQuestions() {
    const topicName = getTopicName(topicId);
    let fileUrl;
    const isAlwaysRandomTopic = topicName.toLowerCase() === 'histologia';
    const shouldLoadBaseFile = difficulty === 'aleatorio' || isAlwaysRandomTopic;

    if (shouldLoadBaseFile) {
        fileUrl = `/static/data/${topicName.toLowerCase()}.json`;
    } else {
        fileUrl = `/static/data/${topicName.toLowerCase()}_${difficulty}.json`;
    }

    try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
            const fallback = `/static/data/${topicName.toLowerCase()}.json`;
            const fallbackResponse = await fetch(fallback);
            if (!fallbackResponse.ok) throw new Error('Falha ao carregar arquivo');
            currentTopicQuestions = await fallbackResponse.json();
        } else {
            currentTopicQuestions = await response.json();
        }
        answeredQuestions = [];
        startRound();
    } catch (error) {
        console.error(error);
        if (questionTextElement) {
            questionTextElement.textContent = 'Não foi possível carregar as perguntas para este tema.';
        }
    }
}

function startRound() {
    hintsUsedInQuestion = 0;
    currentHintIndex = 0;
    currentPossibleScore = 100;
    if (roundProgressElement) {
        roundProgressElement.textContent = 'Questão: 0/5';
    }
    if (roundProgressSmallElement) {
        roundProgressSmallElement.textContent = 'Questão 0/5';
    }
    pickRandomQuestion();
}

function pickRandomQuestion() {
    const unansweredQuestions = Object.keys(currentTopicQuestions).filter((q) => !answeredQuestions.includes(q));

    if (unansweredQuestions.length === 0) {
        if (questionTextElement) questionTextElement.textContent = 'Parabéns! Você respondeu todas as perguntas deste tema.';
        if (hintsContainer) hintsContainer.innerHTML = '';
        if (answerArea) answerArea.classList.add('hidden');
        if (feedbackMessage) feedbackMessage.classList.add('hidden');
        if (nextQuestionButton) nextQuestionButton.classList.add('hidden');
        return;
    }

    const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
    selectedQuestionName = unansweredQuestions[randomIndex];

    if (roundProgressElement) {
        const currentInRound = (questionsAnsweredCount % 5) + 1;
        roundProgressElement.textContent = `Questão: ${currentInRound}/5`;
    }
    if (roundProgressSmallElement) {
        roundProgressSmallElement.textContent = `Questão ${(questionsAnsweredCount % 5) + 1}/5`;
    }
    if (questionTextElement && selectedQuestionName) {
        questionTextElement.textContent = selectedQuestionName;
    }

    if (hintsContainer) hintsContainer.innerHTML = '';
    if (answerArea) answerArea.classList.add('hidden');
    if (optionsContainer) optionsContainer.innerHTML = '';
    if (feedbackMessage) {
        feedbackMessage.className = 'hidden';
        feedbackMessage.textContent = '';
    }
    if (nextQuestionButton) nextQuestionButton.classList.add('hidden');
    if (nextHintButton) nextHintButton.classList.remove('hidden');
    if (answerNowButton) answerNowButton.classList.remove('hidden');

    showQuestion();
}

function showQuestion() {
    currentHintIndex = 0;
    hintsUsedInQuestion = 0;
    currentPossibleScore = 100;
    updateScoreDisplay();
    revealNextHint();
}

function revealNextHint() {
    if (!selectedQuestionName || !currentTopicQuestions[selectedQuestionName]) return;

    const questionData = currentTopicQuestions[selectedQuestionName];
    const hintKey = `Hint ${currentHintIndex + 1}`;
    const hintText = questionData[hintKey];

    if (hintText) {
        const hintCard = document.createElement('div');
        hintCard.className = 'hint-card';
        hintCard.textContent = hintText;
        hintCard.style.background = 'var(--button-bg-color)';
        hintCard.style.border = '1px solid rgba(0,0,0,0.06)';
        hintCard.style.padding = '1rem';
        hintCard.style.borderRadius = '12px';
        hintCard.style.fontWeight = '500';
        if (hintsContainer) hintsContainer.appendChild(hintCard);
        currentHintIndex += 1;
        hintsUsedInQuestion += 1;
        currentPossibleScore = calculateScore(hintsUsedInQuestion);
        updateScoreDisplay();
    } else {
        if (answerArea) answerArea.classList.remove('hidden');
        renderOptions();
    }
}

function calculateScore(hintsUsed) {
    switch (hintsUsed) {
        case 0:
        case 1:
            return 100;
        case 2:
            return 75;
        case 3:
            return 50;
        case 4:
            return 25;
        default:
            return 0;
    }
}

function renderOptions() {
    if (!selectedQuestionName || !currentTopicQuestions[selectedQuestionName]) return;

    const questionData = currentTopicQuestions[selectedQuestionName];
    const options = questionData.Options || [];

    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        options.forEach((option) => {
            const button = document.createElement('button');
            button.className = 'action-button';
            button.type = 'button';
            button.textContent = option;
            button.style.marginTop = '0';
            button.addEventListener('click', () => evaluateAnswer(option));
            optionsContainer.appendChild(button);
        });
    }
}

function evaluateAnswer(selectedOption) {
    if (!selectedQuestionName || !currentTopicQuestions[selectedQuestionName]) return;

    const questionData = currentTopicQuestions[selectedQuestionName];
    const correctAnswer = questionData.Answer;
    const isCorrect = selectedOption.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

    if (feedbackMessage) {
        feedbackMessage.classList.remove('hidden');
        feedbackMessage.className = 'feedback-message';
        if (isCorrect) {
            feedbackMessage.textContent = 'Correto!';
            feedbackMessage.classList.add('correct-feedback');
            score += currentPossibleScore;
        } else {
            feedbackMessage.textContent = `Incorreto! A resposta correta era: ${correctAnswer}`;
            feedbackMessage.classList.add('incorrect-feedback');
        }
    }

    if (optionsContainer) {
        optionsContainer.querySelectorAll('button').forEach((button) => {
            button.disabled = true;
            if (button.textContent?.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
                button.style.backgroundColor = '#2e7d32';
                button.style.color = '#fff';
            }
        });
    }

    if (nextQuestionButton) nextQuestionButton.classList.remove('hidden');
    if (nextHintButton) nextHintButton.classList.add('hidden');
    if (answerNowButton) answerNowButton.classList.add('hidden');
    if (!answeredQuestions.includes(selectedQuestionName)) answeredQuestions.push(selectedQuestionName);
    updateScoreDisplay();
}

if (themeSwitch) {
    themeSwitch.addEventListener('change', () => {
        if (themeSwitch.checked) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    });
}

if (nextHintButton) {
    nextHintButton.addEventListener('click', () => {
        if (hintsContainer && hintsContainer.children.length >= 4) {
            if (answerArea) answerArea.classList.remove('hidden');
            renderOptions();
            return;
        }
        revealNextHint();
    });
}

if (answerNowButton) {
    answerNowButton.addEventListener('click', () => {
        if (answerArea) answerArea.classList.remove('hidden');
        renderOptions();
        if (nextHintButton) nextHintButton.classList.add('hidden');
        if (answerNowButton) answerNowButton.classList.add('hidden');
    });
}

if (nextQuestionButton) {
    nextQuestionButton.addEventListener('click', () => {
        questionsAnsweredCount += 1;
        if (questionsAnsweredCount % 5 === 0) {
            resultDialog.showModal();
            resultMessage.textContent = `Fim da rodada! Sua pontuação total: ${score} pontos.`;
            if (closeDialogButton) {
                closeDialogButton.addEventListener('click', () => {
                    resultDialog.close();
                    window.location.href = "/";
                });
                score = 0;
            }
        }
        updateScoreDisplay();
        if (answerArea) answerArea.classList.add('hidden');
        if (optionsContainer) optionsContainer.innerHTML = '';
        if (feedbackMessage) {
            feedbackMessage.className = 'hidden';
            feedbackMessage.textContent = '';
        }
        if (nextHintButton) nextHintButton.classList.remove('hidden');
        if (answerNowButton) answerNowButton.classList.remove('hidden');
        pickRandomQuestion();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    applyInitialTheme();
    loadQuestions();
});
