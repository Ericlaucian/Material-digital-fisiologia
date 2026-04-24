// src/main.ts
var AVAILABLE_TOPICS = ["fisiologia"];
var rouletteSection = document.getElementById("roulette-section");
var rouletteDisplayElement = document.getElementById("roulette-wheel");
var spinButton = document.getElementById("spin-button");
var questionSection = document.getElementById("question-section");
var questionTextElement = document.getElementById("question-text");
var hintsContainer = document.getElementById("hints-container");
var hintTimerControls = document.getElementById("hint-timer-controls");
var nextHintButton = document.getElementById("next-hint-button");
var answerNowButton = document.getElementById("answer-now-button");
var hintTimerDisplay = document.getElementById("hint-timer-display");
var userAnswerContainer = document.getElementById("user-answer-container");
var userAnswerInput = document.getElementById("user-answer-input");
var submitAnswerButton = document.getElementById("submit-answer-button");
var feedbackMessage = document.getElementById("feedback-message");
var showAnswerButton = document.getElementById("show-answer-button");
var answerContainer = document.getElementById("answer-container");
var answerTextElement = document.getElementById("answer-text");
var correctWrongContainer = document.getElementById("correct-wrong-container");
var nextQuestionButton = document.getElementById("next-question-button");
var themeSwitch = document.getElementById("checkbox");
var scoreDisplayElement = document.getElementById("score-display");
var roundProgressElement = document.getElementById("round-progress");
var backButton = document.getElementById("back-button");
var currentTopicQuestions = {};
var answeredQuestions = [];
var selectedQuestionName = null;
var hintCountdownTimer;
var hintsUsedInQuestion = 0;
var currentHintIndex = 0;
var score = 0;
var questionsAnsweredCount = 0;
async function selectTopic(topicName) {
  console.log(`Selected topic: ${topicName}`);
  try {
    const response = await fetch(`./data/${topicName.toLowerCase()}.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    currentTopicQuestions = await response.json();
    answeredQuestions = [];
    console.log("Loaded questions for topic:", topicName, currentTopicQuestions);
    if (rouletteSection)
      rouletteSection.classList.remove("hidden");
    if (rouletteDisplayElement)
      rouletteDisplayElement.textContent = "Pronto para responder?";
    if (spinButton) {
      spinButton.disabled = false;
      spinButton.textContent = "Iniciar Pergunta";
      spinButton.onclick = pickRandomQuestion;
      spinButton.classList.remove("hidden");
    }
  } catch (error) {
    console.error(`Failed to load questions for topic ${topicName}:`, error);
    if (rouletteDisplayElement) {
      rouletteDisplayElement.textContent = `<p>Erro ao carregar perguntas para o tópico "${topicName}". Por favor, tente novamente mais tarde.</p>`;
    }
  }
}
function spinRoulette() {
  if (questionSection)
    questionSection.classList.add("hidden");
  if (answerContainer)
    answerContainer.classList.add("hidden");
  if (correctWrongContainer)
    correctWrongContainer.classList.add("hidden");
  if (hintTimerControls)
    hintTimerControls.classList.add("hidden");
  if (showAnswerButton)
    showAnswerButton.classList.add("hidden");
  if (rouletteSection)
    rouletteSection.classList.remove("hidden");
  if (spinButton)
    spinButton.classList.remove("hidden");
  const chosenTopic = AVAILABLE_TOPICS[0];
  if (rouletteDisplayElement && spinButton) {
    rouletteDisplayElement.textContent = `Girando...`;
    spinButton.disabled = true;
    setTimeout(() => {
      selectTopic(chosenTopic);
      spinButton.disabled = false;
    }, 1500);
  }
}
function pickRandomQuestion() {
  hintsUsedInQuestion = 0;
  currentHintIndex = 0;
  clearTimeout(hintCountdownTimer);
  if (hintCountdownTimer !== undefined) {
    clearInterval(hintCountdownTimer);
    hintCountdownTimer = undefined;
  }
  const unansweredQuestions = Object.keys(currentTopicQuestions).filter((q) => !answeredQuestions.includes(q));
  if (unansweredQuestions.length === 0) {
    if (questionTextElement)
      questionTextElement.textContent = "Parabéns! Você respondeu todas as perguntas deste tópico!";
    if (hintsContainer)
      hintsContainer.innerHTML = "";
    if (answerContainer)
      answerContainer.classList.add("hidden");
    if (showAnswerButton)
      showAnswerButton.classList.add("hidden");
    if (hintTimerControls)
      hintTimerControls.classList.add("hidden");
    if (questionSection)
      questionSection.classList.add("hidden");
    if (rouletteSection)
      rouletteSection.classList.remove("hidden");
    if (rouletteDisplayElement)
      rouletteDisplayElement.textContent = "Todas as perguntas de Fisiologia foram respondidas! Clique para reiniciar.";
    if (spinButton) {
      spinButton.onclick = pickRandomQuestion;
      spinButton.textContent = "Reiniciar Perguntas";
      spinButton.classList.remove("hidden");
    }
    answeredQuestions = [];
    return;
  }
  const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
  selectedQuestionName = unansweredQuestions[randomIndex];
  if (roundProgressElement) {
    const currentInRound = questionsAnsweredCount % 5 + 1;
    roundProgressElement.textContent = `Questão: ${currentInRound}/5`;
  }
  if (questionTextElement && selectedQuestionName) {
    questionTextElement.textContent = selectedQuestionName;
  }
  if (spinButton)
    spinButton.classList.add("hidden");
  if (rouletteDisplayElement)
    rouletteDisplayElement.textContent = "";
  if (hintsContainer)
    hintsContainer.innerHTML = "";
  if (answerContainer)
    answerContainer.classList.add("hidden");
  if (correctWrongContainer)
    correctWrongContainer.classList.add("hidden");
  if (showAnswerButton)
    showAnswerButton.classList.remove("hidden");
  if (hintTimerControls)
    hintTimerControls.classList.add("hidden");
  if (rouletteSection)
    rouletteSection.classList.add("hidden");
  if (questionSection)
    questionSection.classList.remove("hidden");
  startQuestion();
}
function startQuestion() {
  if (questionSection)
    questionSection.classList.remove("hidden");
  if (hintsContainer)
    hintsContainer.innerHTML = "";
  if (hintTimerControls)
    hintTimerControls.classList.remove("hidden");
  if (userAnswerContainer)
    userAnswerContainer.classList.add("hidden");
  if (feedbackMessage) {
    feedbackMessage.classList.add("hidden");
    feedbackMessage.textContent = "";
    feedbackMessage.className = "";
  }
  if (userAnswerInput)
    userAnswerInput.value = "";
  if (answerContainer)
    answerContainer.classList.add("hidden");
  if (correctWrongContainer)
    correctWrongContainer.classList.add("hidden");
  if (showAnswerButton)
    showAnswerButton.classList.add("hidden");
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
  if (hintTimerDisplay)
    hintTimerDisplay.textContent = "";
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
      const hintElement = document.createElement("p");
      hintElement.classList.add("revealed-hint");
      hintElement.textContent = `Dica ${currentHintIndex + 1}: ${hintText}`;
      hintsContainer.appendChild(hintElement);
      hintsUsedInQuestion++;
    }
    currentHintIndex++;
    if (nextHintButton) {
      nextHintButton.disabled = currentHintIndex >= 4;
    }
    startHintTimer();
  } else {
    if (hintTimerControls)
      hintTimerControls.classList.add("hidden");
    revealAnswer();
  }
}
function startHintTimer() {
  let timeLeft = 15;
  if (hintTimerDisplay)
    hintTimerDisplay.textContent = `Tempo para a próxima dica/resposta: ${timeLeft}s`;
  if (hintCountdownTimer !== undefined) {
    clearInterval(hintCountdownTimer);
  }
  hintCountdownTimer = undefined;
  hintCountdownTimer = setInterval(() => {
    timeLeft--;
    if (hintTimerDisplay)
      hintTimerDisplay.textContent = `Tempo para a próxima dica/resposta: ${timeLeft}s`;
    if (timeLeft <= 0) {
      if (hintCountdownTimer !== undefined) {
        clearInterval(hintCountdownTimer);
      }
      hintCountdownTimer = undefined;
      if (feedbackMessage) {
        feedbackMessage.textContent = "Tempo esgotado!";
        feedbackMessage.classList.add("incorrect-feedback");
        feedbackMessage.classList.remove("hidden");
      }
      revealAnswer();
    }
  }, 1000);
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
function resetQuestionStateAndSpinRoulette() {
  clearTimeout(hintCountdownTimer);
  if (hintCountdownTimer !== undefined) {
    clearInterval(hintCountdownTimer);
    hintCountdownTimer = undefined;
  }
  selectedQuestionName = null;
  hintsUsedInQuestion = 0;
  currentHintIndex = 0;
  if (questionSection)
    questionSection.classList.add("hidden");
  if (answerContainer)
    answerContainer.classList.add("hidden");
  if (correctWrongContainer)
    correctWrongContainer.classList.add("hidden");
  if (hintsContainer)
    hintsContainer.innerHTML = "";
  if (hintTimerControls)
    hintTimerControls.classList.add("hidden");
  if (hintTimerDisplay)
    hintTimerDisplay.textContent = "";
  if (showAnswerButton)
    showAnswerButton.classList.add("hidden");
  if (feedbackMessage) {
    feedbackMessage.classList.add("hidden");
    feedbackMessage.textContent = "";
    feedbackMessage.className = "";
  }
  if (userAnswerContainer)
    userAnswerContainer.classList.add("hidden");
  if (rouletteDisplayElement)
    rouletteDisplayElement.textContent = "";
  questionsAnsweredCount++;
  if (questionsAnsweredCount % 5 === 0) {
    alert(`Fim da rodada! Sua pontuação total: ${score} pontos.`);
    score = 0;
    if (roundProgressElement) {
      roundProgressElement.textContent = `Questão: 0/5`;
    }
  }
  if (scoreDisplayElement) {
    scoreDisplayElement.textContent = `Score: ${score}`;
  }
  spinRoulette();
}
function checkAnswer() {
  if (!selectedQuestionName || !currentTopicQuestions[selectedQuestionName])
    return;
  const questionData = currentTopicQuestions[selectedQuestionName];
  const userAnswer = userAnswerInput.value.trim().toLowerCase().replace(/\s+/g, " ");
  const primaryAnswer = questionData.Answer.trim().toLowerCase().replace(/\s+/g, " ");
  const alternativeAnswers = (questionData.AlternativeAnswers || []).map((alt) => alt.trim().toLowerCase().replace(/\s+/g, " "));
  const isCorrect = userAnswer === primaryAnswer || alternativeAnswers.includes(userAnswer);
  if (feedbackMessage) {
    feedbackMessage.classList.remove("hidden");
    if (isCorrect) {
      feedbackMessage.textContent = "Correto!";
      feedbackMessage.classList.add("correct-feedback");
      score += calculateScore(hintsUsedInQuestion);
    } else {
      feedbackMessage.textContent = `Incorreto! A resposta correta era: ${questionData.Answer}`;
      feedbackMessage.classList.add("incorrect-feedback");
    }
  }
  if (userAnswerContainer)
    userAnswerContainer.classList.add("hidden");
  revealAnswer();
}
function revealAnswer() {
  clearTimeout(hintCountdownTimer);
  if (hintCountdownTimer !== undefined) {
    clearInterval(hintCountdownTimer);
    hintCountdownTimer = undefined;
  }
  if (hintTimerControls)
    hintTimerControls.classList.add("hidden");
  if (userAnswerContainer)
    userAnswerContainer.classList.add("hidden");
  if (showAnswerButton)
    showAnswerButton.classList.add("hidden");
  const currentQuestionData = selectedQuestionName ? currentTopicQuestions[selectedQuestionName] : undefined;
  if (!selectedQuestionName || !currentQuestionData) {
    console.error("revealAnswer called but question data is missing.");
    console.error("selectedQuestionName:", selectedQuestionName);
    console.error("currentTopicQuestions for selectedQuestionName:", currentQuestionData);
    resetQuestionStateAndSpinRoulette();
    return;
  }
  if (!answeredQuestions.includes(selectedQuestionName)) {
    answeredQuestions.push(selectedQuestionName);
  }
  const questionData = currentQuestionData;
  if (answerTextElement) {
    answerTextElement.textContent = questionData.Answer;
  }
  if (answerContainer) {
    answerContainer.classList.remove("hidden");
  }
  if (correctWrongContainer) {
    correctWrongContainer.classList.remove("hidden");
  }
  if (spinButton)
    spinButton.classList.add("hidden");
}
if (themeSwitch) {
  themeSwitch.addEventListener("change", () => {
    if (themeSwitch.checked) {
      document.body.classList.add("dark-theme");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("theme", "light");
    }
  });
}
function applyInitialTheme() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (savedTheme === "dark" || !savedTheme && prefersDark) {
    if (themeSwitch)
      themeSwitch.checked = true;
    document.body.classList.add("dark-theme");
  } else {
    if (themeSwitch)
      themeSwitch.checked = false;
    document.body.classList.remove("dark-theme");
  }
}
document.addEventListener("DOMContentLoaded", () => {
  spinRoulette();
  applyInitialTheme();
});
if (nextHintButton) {
  nextHintButton.addEventListener("click", revealNextHint);
}
if (answerNowButton) {
  answerNowButton.addEventListener("click", () => {
    clearTimeout(hintCountdownTimer);
    if (hintCountdownTimer !== undefined) {
      clearInterval(hintCountdownTimer);
      hintCountdownTimer = undefined;
    }
    if (hintTimerControls)
      hintTimerControls.classList.add("hidden");
    if (userAnswerContainer)
      userAnswerContainer.classList.remove("hidden");
    if (userAnswerInput)
      userAnswerInput.focus();
  });
}
if (submitAnswerButton) {
  submitAnswerButton.addEventListener("click", checkAnswer);
}
if (userAnswerInput) {
  userAnswerInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      checkAnswer();
    }
  });
}
if (nextQuestionButton) {
  nextQuestionButton.addEventListener("click", () => {
    resetQuestionStateAndSpinRoulette();
  });
}
if (backButton) {
  backButton.addEventListener("click", () => {
    score = 0;
    questionsAnsweredCount = 0;
    answeredQuestions = [];
    currentTopicQuestions = {};
    hintsUsedInQuestion = 0;
    currentHintIndex = 0;
    if (scoreDisplayElement) {
      scoreDisplayElement.textContent = "Score: 0";
    }
    if (roundProgressElement) {
      roundProgressElement.textContent = "Questão: 0/5";
    }
    if (questionSection) {
      questionSection.classList.add("hidden");
    }
    if (rouletteSection) {
      rouletteSection.classList.add("hidden");
    }
    if (answerContainer) {
      answerContainer.classList.add("hidden");
    }
    window.location.href = "menu.html";
  });
}
