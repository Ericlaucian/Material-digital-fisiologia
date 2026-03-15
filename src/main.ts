const AVAILABLE_TOPICS = ['fisiologia'];

// --- DOM Elements ---
const rouletteSection = document.getElementById('roulette-section');
const rouletteDisplayElement = document.getElementById('roulette-wheel');
const spinButton = document.getElementById('spin-button');
const questionSection = document.getElementById('question-section');
const questionTextElement = document.getElementById('question-text');
const hintsContainer = document.getElementById('hints-container');
const hintTimerControls = document.getElementById('hint-timer-controls');
const nextHintButton = document.getElementById('next-hint-button');
const answerNowButton = document.getElementById('answer-now-button');
const hintTimerDisplay = document.getElementById('hint-timer-display');
const userAnswerContainer = document.getElementById('user-answer-container');
const userAnswerInput = document.getElementById('user-answer-input') as HTMLInputElement;
const submitAnswerButton = document.getElementById('submit-answer-button');
const feedbackMessage = document.getElementById('feedback-message');
const showAnswerButton = document.getElementById('show-answer-button'); // This button is functionally replaced by answerNowButton but may still be in HTML
const answerContainer = document.getElementById('answer-container');
const answerTextElement = document.getElementById('answer-text');
const correctWrongContainer = document.getElementById('correct-wrong-container');
const nextQuestionButton = document.getElementById('next-question-button');
const themeSwitch = document.getElementById('checkbox') as HTMLInputElement;
const scoreDisplayElement = document.getElementById('score-display');
const roundProgressElement = document.getElementById('round-progress');

// --- State Management ---
let currentTopicQuestions: { [key: string]: any } = {};
let answeredQuestions: string[] = [];
let selectedQuestionName: string | null = null;
let hintCountdownTimer: number | undefined; // Specific timer for hints
let hintsUsedInQuestion: number = 0;
let currentHintIndex: number = 0;
let score: number = 0;
let questionsAnsweredCount: number = 0;

async function selectTopic(topicName: string) {
    console.log(`Selected topic: ${topicName}`);
    try {
        const response = await fetch(`./data/${topicName.toLowerCase()}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        currentTopicQuestions = await response.json();
        answeredQuestions = []; // Reset answered questions when a new topic is selected
        console.log("Loaded questions for topic:", topicName, currentTopicQuestions);

        // Update UI to reflect selected topic and enable starting question
        if (rouletteSection) rouletteSection.classList.remove('hidden'); // Keep roulette section visible
        if (rouletteDisplayElement) rouletteDisplayElement.textContent = "Pronto para responder?";
        if (spinButton) {
            spinButton.disabled = false;
            spinButton.textContent = "Iniciar Pergunta";
            spinButton.onclick = pickRandomQuestion; // Assign only after successful load
            spinButton.classList.remove('hidden'); // Ensure spin button is visible
        }
    } catch (error) {
        console.error(`Failed to load questions for topic ${topicName}:`, error);
        if (rouletteDisplayElement) {
            rouletteDisplayElement.textContent = `<p>Erro ao carregar perguntas para o tópico "${topicName}". Por favor, tente novamente mais tarde.</p>`;
        }
    }
}


function spinRoulette() { // Renamed back to spinRoulette
    // Hide question-related sections
    if (questionSection) questionSection.classList.add('hidden');
    if (answerContainer) answerContainer.classList.add('hidden');
    if (correctWrongContainer) correctWrongContainer.classList.add('hidden');
    if (hintTimerControls) hintTimerControls.classList.add('hidden');
    if (showAnswerButton) showAnswerButton.classList.add('hidden'); // Ensure old show answer is hidden

    // Show roulette section
    if (rouletteSection) rouletteSection.classList.remove('hidden');
    if (spinButton) spinButton.classList.remove('hidden'); // Ensure spin button is visible for spinning

    // No random selection needed, topic is fixed to 'fisiologia' as per AVAILABLE_TOPICS
    const chosenTopic = AVAILABLE_TOPICS[0]!;

    if (rouletteDisplayElement && spinButton) {
        rouletteDisplayElement.textContent = `Girando...`;
        spinButton.disabled = true; // Disable spin button during animation

        setTimeout(() => {
            selectTopic(chosenTopic); // Selects the topic after spin
            spinButton.disabled = false; // Re-enable regardless of selectTopic result for user feedback
        }, 1500); // Simulate spin time
    }
}


function pickRandomQuestion() {
    hintsUsedInQuestion = 0;
    currentHintIndex = 0;
    clearTimeout(hintCountdownTimer); // Clear any previous hint timers
    if (hintCountdownTimer !== undefined) {
        clearInterval(hintCountdownTimer);
        hintCountdownTimer = undefined;
    }


    const unansweredQuestions = Object.keys(currentTopicQuestions).filter(q => !answeredQuestions.includes(q));

    if (unansweredQuestions.length === 0) {
        // All questions answered for this topic
        if (questionTextElement) questionTextElement.textContent = "Parabéns! Você respondeu todas as perguntas deste tópico!";
        if (hintsContainer) hintsContainer.innerHTML = '';
        if (answerContainer) answerContainer.classList.add('hidden');
        if (showAnswerButton) showAnswerButton.classList.add('hidden');
        if (hintTimerControls) hintTimerControls.classList.add('hidden');

        if (questionSection) questionSection.classList.add('hidden'); // Hide question section
        if (rouletteSection) rouletteSection.classList.remove('hidden'); // Show roulette section for message

        if (rouletteDisplayElement) rouletteDisplayElement.textContent = "Todas as perguntas de Fisiologia foram respondidas! Clique para reiniciar.";
        if (spinButton) {
            spinButton.onclick = pickRandomQuestion; // Allow restarting questions from the same topic
            spinButton.textContent = "Reiniciar Perguntas"; // Reset button text
            spinButton.classList.remove('hidden'); // Ensure spin button is visible
        }
        answeredQuestions = []; // Reset answered questions to allow playing again
        return;
    }

    const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
    selectedQuestionName = unansweredQuestions[randomIndex]!;

    if (roundProgressElement) {
        const currentInRound = (questionsAnsweredCount % 5) + 1;
        roundProgressElement.textContent = `Questão: ${currentInRound}/5`;
    }

    if (questionTextElement && selectedQuestionName) {
        questionTextElement.textContent = selectedQuestionName;
    }
    
    // Hide spin button during question answering phase
    if (spinButton) spinButton.classList.add('hidden');
    if (rouletteDisplayElement) rouletteDisplayElement.textContent = ""; // Clear roulette display when question is shown

    // Reset UI for new question
    if (hintsContainer) hintsContainer.innerHTML = '';
    // if (timerDisplay) timerDisplay.textContent = ''; // timerDisplay is no longer used for general timer
    if (answerContainer) answerContainer.classList.add('hidden');
    if (correctWrongContainer) correctWrongContainer.classList.add('hidden');
    if (showAnswerButton) showAnswerButton.classList.remove('hidden'); // This button will now serve as "Answer Now" initially
    if (hintTimerControls) hintTimerControls.classList.add('hidden');

    // Hide roulette section, show question section
    if (rouletteSection) rouletteSection.classList.add('hidden');
    if (questionSection) questionSection.classList.remove('hidden');

    startQuestion();
}


function startQuestion() {
    if (questionSection) questionSection.classList.remove('hidden');
    if (hintsContainer) hintsContainer.innerHTML = ''; // Clear previous hints
    if (hintTimerControls) hintTimerControls.classList.remove('hidden');
    if (userAnswerContainer) userAnswerContainer.classList.add('hidden');
    if (feedbackMessage) {
        feedbackMessage.classList.add('hidden');
        feedbackMessage.textContent = '';
        feedbackMessage.className = '';
    }
    if (userAnswerInput) userAnswerInput.value = '';
    if (answerContainer) answerContainer.classList.add('hidden');
    if (correctWrongContainer) correctWrongContainer.classList.add('hidden');
    if (showAnswerButton) showAnswerButton.classList.add('hidden'); // This button is replaced by answerNowButton

    currentHintIndex = 0;
    hintsUsedInQuestion = 0;
    revealNextHint();
}


function revealNextHint() {
    clearTimeout(hintCountdownTimer);
    if (hintCountdownTimer !== undefined) {
        clearInterval(hintCountdownTimer);
        hintCountdownTimer = undefined;
    }
    if (hintTimerDisplay) hintTimerDisplay.textContent = ''; // Clear timer display immediately

    if (!selectedQuestionName || !currentTopicQuestions[selectedQuestionName]) {
        console.error("revealNextHint called but no question is selected or data is missing.");
        resetQuestionStateAndSpinRoulette();
        return;
    }

    const questionData = currentTopicQuestions[selectedQuestionName];
    const hintKey = `Hint ${currentHintIndex + 1}`;
    const hintText = questionData[hintKey];

    if (hintText) {
        if (hintsContainer) {
            const hintElement = document.createElement('p');
            hintElement.classList.add('revealed-hint');
            hintElement.textContent = `Dica ${currentHintIndex + 1}: ${hintText}`;
            hintsContainer.appendChild(hintElement);
            hintsUsedInQuestion++;
        }
        currentHintIndex++;
        if (nextHintButton) {
            nextHintButton.disabled = (currentHintIndex >= 4); // Disable if no more hints
        }
        startHintTimer();
    } else {
        // No more hints, automatically reveal answer
        if (hintTimerControls) hintTimerControls.classList.add('hidden');
        revealAnswer();
    }
}


function startHintTimer() {
    let timeLeft = 15; // 15 seconds for hints
    if (hintTimerDisplay) hintTimerDisplay.textContent = `Tempo para a próxima dica/resposta: ${timeLeft}s`;

    clearTimeout(hintCountdownTimer); // Clear any setTimeout
    if (hintCountdownTimer !== undefined) {
        clearInterval(hintCountdownTimer); // Clear any setInterval
    }
    hintCountdownTimer = undefined;

    hintCountdownTimer = setInterval(() => {
        timeLeft--;
        if (hintTimerDisplay) hintTimerDisplay.textContent = `Tempo para a próxima dica/resposta: ${timeLeft}s`;

        if (timeLeft <= 0) {
            if (hintCountdownTimer !== undefined) {
                clearInterval(hintCountdownTimer);
            }
            hintCountdownTimer = undefined;
            if (feedbackMessage) {
                feedbackMessage.textContent = "Tempo esgotado!";
                feedbackMessage.classList.add('incorrect-feedback');
                feedbackMessage.classList.remove('hidden');
            }
            revealAnswer(); // Timer runs out, reveal answer
        }
    }, 1000);
}


function calculateScore(hintsUsed: number): number {
    switch (hintsUsed) {
        case 0: // Should not happen with current flow, as at least 1 hint is revealed
        case 1: return 100;
        case 2: return 75;
        case 3: return 50;
        case 4: return 25;
        default: return 0;
    }
}


function resetQuestionStateAndSpinRoulette() {
    clearTimeout(hintCountdownTimer);
    if (hintCountdownTimer !== undefined) {
        clearInterval(hintCountdownTimer);
        hintCountdownTimer = undefined;
    }

    selectedQuestionName = null;
    hintsUsedInQuestion = 0;
    currentHintIndex = 0;

    // Reset UI elements
    if (questionSection) questionSection.classList.add('hidden');
    if (answerContainer) answerContainer.classList.add('hidden');
    if (correctWrongContainer) correctWrongContainer.classList.add('hidden');
    if (hintsContainer) hintsContainer.innerHTML = '';
    if (hintTimerControls) hintTimerControls.classList.add('hidden');
    if (hintTimerDisplay) hintTimerDisplay.textContent = '';
    if (showAnswerButton) showAnswerButton.classList.add('hidden');
    if (feedbackMessage) {
        feedbackMessage.classList.add('hidden');
        feedbackMessage.textContent = '';
        feedbackMessage.className = '';
    }
    if (userAnswerContainer) userAnswerContainer.classList.add('hidden');
    if (rouletteDisplayElement) rouletteDisplayElement.textContent = ''; // Clear topic display

    questionsAnsweredCount++;

    if (questionsAnsweredCount % 5 === 0) {
        alert(`Fim da rodada! Sua pontuação total: ${score} pontos.`);
        score = 0; // Reset score for the next round
        if (roundProgressElement) {
            roundProgressElement.textContent = `Questão: 0/5`;
        }
    }

    if (scoreDisplayElement) {
        scoreDisplayElement.textContent = `Score: ${score}`;
    }

    spinRoulette(); // Go back to the roulette state for the next question
}


function checkAnswer() {
    if (!selectedQuestionName || !currentTopicQuestions[selectedQuestionName]) return;

    const questionData = currentTopicQuestions[selectedQuestionName];
    const userAnswer = userAnswerInput.value.trim().toLowerCase().replace(/\s+/g, ' ');
    const primaryAnswer = questionData.Answer.trim().toLowerCase().replace(/\s+/g, ' ');
    const alternativeAnswers = (questionData.AlternativeAnswers || []).map((alt: string) => 
        alt.trim().toLowerCase().replace(/\s+/g, ' ')
    );

    const isCorrect = userAnswer === primaryAnswer || alternativeAnswers.includes(userAnswer);

    if (feedbackMessage) {
        feedbackMessage.classList.remove('hidden');
        if (isCorrect) {
            feedbackMessage.textContent = "Correto!";
            feedbackMessage.classList.add('correct-feedback');
            score += calculateScore(hintsUsedInQuestion);
        } else {
            feedbackMessage.textContent = `Incorreto! A resposta correta era: ${questionData.Answer}`;
            feedbackMessage.classList.add('incorrect-feedback');
        }
    }

    if (userAnswerContainer) userAnswerContainer.classList.add('hidden');
    revealAnswer();
}


function revealAnswer() {
    clearTimeout(hintCountdownTimer);
    if (hintCountdownTimer !== undefined) {
        clearInterval(hintCountdownTimer);
        hintCountdownTimer = undefined;
    }

    if (hintTimerControls) hintTimerControls.classList.add('hidden');
    if (userAnswerContainer) userAnswerContainer.classList.add('hidden');
    if (showAnswerButton) showAnswerButton.classList.add('hidden'); // Hide the old show answer button

    if (!selectedQuestionName || !currentTopicQuestions[selectedQuestionName]) {
        console.error("revealAnswer called but question data is missing.");
        console.error("selectedQuestionName:", selectedQuestionName);
        console.error("currentTopicQuestions for selectedQuestionName:", currentTopicQuestions[selectedQuestionName]);
        resetQuestionStateAndSpinRoulette(); // Go to next question if no answer
        return;
    }

    // Add to answered list
    if (!answeredQuestions.includes(selectedQuestionName)) {
        answeredQuestions.push(selectedQuestionName);
    }

    const questionData = currentTopicQuestions[selectedQuestionName];
    if (answerTextElement) {
        answerTextElement.textContent = questionData.Answer;
    }
    if (answerContainer) {
        answerContainer.classList.remove('hidden');
    }
    if (correctWrongContainer) {
        correctWrongContainer.classList.remove('hidden');
    }
    // Ensure spin button is hidden when answer is revealed
    if (spinButton) spinButton.classList.add('hidden');
}




// Theme switcher logic
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

function applyInitialTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        if (themeSwitch) themeSwitch.checked = true;
        document.body.classList.add('dark-theme');
    } else {
        if (themeSwitch) themeSwitch.checked = false;
        document.body.classList.remove('dark-theme');
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    spinRoulette(); // Start by spinning the roulette
    applyInitialTheme();
});



if (nextHintButton) {
    nextHintButton.addEventListener('click', revealNextHint);
}

if (answerNowButton) {
    answerNowButton.addEventListener('click', () => {
        clearTimeout(hintCountdownTimer);
        if (hintCountdownTimer !== undefined) {
            clearInterval(hintCountdownTimer);
            hintCountdownTimer = undefined;
        }
        if (hintTimerControls) hintTimerControls.classList.add('hidden');
        if (userAnswerContainer) userAnswerContainer.classList.remove('hidden');
        if (userAnswerInput) userAnswerInput.focus();
    });
}

if (submitAnswerButton) {
    submitAnswerButton.addEventListener('click', checkAnswer);
}

if (userAnswerInput) {
    userAnswerInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            checkAnswer();
        }
    });
}

if (nextQuestionButton) {
    nextQuestionButton.addEventListener('click', () => {
        resetQuestionStateAndSpinRoulette();
    });
}
