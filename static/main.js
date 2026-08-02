// src/main.ts
var AVAILABLE_TOPICS = ["fisiologia", "cardiologia", "citologia", "sis-nervoso", "histologia"];
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
var scoreLargeElement = document.getElementById("score-large");
var roundProgressSmallElement = document.getElementById("round-progress-small");
var backButton = document.getElementById("back-button");
var resultDialog = document.getElementById("result-dialog");
var resultMessage = document.getElementById("result-message");
var closeDialogButton = document.getElementById("close-dialog-button");
var currentTopicQuestions = {};
var answeredQuestions = [];
var selectedQuestionName = null;
var hintCountdownTimer;
var hintsUsedInQuestion = 0;
var currentHintIndex = 0;
var score = 0;
var questionsAnsweredCount = 0;
var currentPossibleScore = 100;

function getTopicName(topicId) {
  const topicMap = {
    '0': 'fisiologia',
    '1': 'cardiologia',
    '2': 'citologia',
    '3': 'sis-nervoso',
    '4': 'histologia'
  };
  return topicMap[topicId || '0'] || 'fisiologia';
}

function formatTopicLabel(topicName) {
  return topicName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getDifficultyFromStorage() {
  const difficulty = localStorage.getItem('difficulty') || 'facil';
  return difficulty;
}

async function selectTopic(topicName) {
  console.log(`Selected topic: ${topicName}`);
  try {
    const difficulty = getDifficultyFromStorage();
    const isAlwaysRandomTopic = topicName.toLowerCase() === 'histologia';
    const shouldLoadBaseFile = difficulty === 'aleatorio' || isAlwaysRandomTopic;
    let fileUrl;
    
    if (shouldLoadBaseFile) {
      fileUrl = `/static/data/${topicName.toLowerCase()}.json`;
    } else {
      fileUrl = `/static/data/${topicName.toLowerCase()}_${difficulty}.json`;
    }
    
    console.log(`Loading file: ${fileUrl}`);
    let response = await fetch(fileUrl);
    
    if (!response.ok) {
      console.warn(`File not found: ${fileUrl}, trying base file...`);
      response = await fetch(`/static/data/${topicName.toLowerCase()}.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
    
    currentTopicQuestions = await response.json();
    answeredQuestions = [];
    console.log("Loaded questions for topic:", topicName, "difficulty:", difficulty, currentTopicQuestions);
    
    if (rouletteSection)
      rouletteSection.classList.remove("hidden");
    if (rouletteDisplayElement) {
      const displayDifficulty = isAlwaysRandomTopic ? 'aleatorio' : difficulty;
      const difficultyDisplay = displayDifficulty === 'aleatorio' ? 'Aleatório' : displayDifficulty.charAt(0).toUpperCase() + displayDifficulty.slice(1);
      rouletteDisplayElement.textContent = `${formatTopicLabel(topicName)} - ${difficultyDisplay}`;
    }
    if (spinButton) {
      spinButton.disabled = false;
      spinButton.textContent = "Iniciar Pergunta";
      spinButton.onclick = pickRandomQuestion;
      spinButton.classList.remove("hidden");
    }
  } catch (error) {
    console.error(`Failed to load questions for topic ${topicName}:`, error);
    if (rouletteDisplayElement) {
      rouletteDisplayElement.textContent = `Erro ao carregar perguntas. Por favor, tente novamente mais tarde.`;
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

  const topicId = localStorage.getItem('topic') || '0';
  const chosenTopic = getTopicName(topicId);

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
    const currentTopic = getTopicName(localStorage.getItem('topic') || '0');
    if (rouletteDisplayElement)
      rouletteDisplayElement.textContent = `Todas as perguntas de ${formatTopicLabel(currentTopic)} foram respondidas! Clique para reiniciar.`;
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
  currentPossibleScore = 100;
  if (scoreLargeElement) {
    scoreLargeElement.textContent = currentPossibleScore;
  }
  if (roundProgressSmallElement && roundProgressElement) {
    roundProgressSmallElement.textContent = roundProgressElement.textContent || "Questão 0/5";
  }
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
      const hintCard = document.createElement("div");
      hintCard.classList.add("hint-card");
      hintCard.style.background = "var(--button-bg-color)";
      hintCard.style.border = "1px solid rgba(0,0,0,0.06)";
      hintCard.style.padding = "1rem";
      hintCard.style.borderRadius = "12px";
      hintCard.style.fontWeight = "500";
      hintCard.textContent = `${hintText}`;
      hintsContainer.appendChild(hintCard);
      hintsUsedInQuestion++;
    }
    currentHintIndex++;
    updatePossibleScore();
    if (nextHintButton) {
      nextHintButton.disabled = currentHintIndex >= 4;
    }
    // No automatic timer in the new layout; manual reveal via buttons
  } else {
    if (hintTimerControls)
      hintTimerControls.classList.add("hidden");
    revealAnswer();
  }
}
function startHintTimer() {
  // No automatic countdown — layout uses manual controls for hints and answering.
  if (hintCountdownTimer !== undefined) {
    clearInterval(hintCountdownTimer);
    hintCountdownTimer = undefined;
  }
  if (hintTimerDisplay)
    hintTimerDisplay.textContent = "";
}
function updatePossibleScore() {
  currentPossibleScore = calculateScore(hintsUsedInQuestion);
  if (scoreLargeElement) {
    scoreLargeElement.textContent = currentPossibleScore;
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
    // alert(`Fim da rodada! Sua pontuação total: ${score} pontos.`);
    resultDialog.showModal();
    resultMessage.textContent = `Fim da rodada! Sua pontuação total: ${score} pontos.`;
    if (closeDialogButton) {
      closeDialogButton.addEventListener('click',  () => {
        resultDialog.close();
        window.location.href = "/";
      });
    }
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
async function checkAnswer() {
  if (!selectedQuestionName || !currentTopicQuestions[selectedQuestionName])
    return;
  const questionData = currentTopicQuestions[selectedQuestionName];
  const userAnswer = userAnswerInput.value.trim();
  const hints = [questionData['Hint 1'], questionData['Hint 2'], questionData['Hint 3'], questionData['Hint 4']]
  if (feedbackMessage) {
    feedbackMessage.classList.remove("hidden");
    feedbackMessage.textContent = "Corrigindo resposta...";
    feedbackMessage.className = "feedback-message";
  }
  try {
    
    const correcao_gemini = await enviarDados(selectedQuestionName, userAnswer, questionData.Answer, questionData.AlternativeAnswers || []);
    if (feedbackMessage) {
      feedbackMessage.classList.remove("hidden");
      if (correcao_gemini === "Yes") {
        feedbackMessage.textContent = "Correto!";
        feedbackMessage.classList.add("correct-feedback");
        score += currentPossibleScore;
        if (scoreDisplayElement) {
          scoreDisplayElement.textContent = `Score: ${score}`;
        }
        if (scoreLargeElement) {
          scoreLargeElement.textContent = score;
        }
      } else {
        const mensagemCorrecao = await receber_mensagem_errada(selectedQuestionName, userAnswer, questionData.Answer, questionData.AlternativeAnswers || [], hints);
        feedbackMessage.textContent = mensagemCorrecao || `Incorreto! A resposta correta era: ${questionData.Answer}`;
        feedbackMessage.classList.add("incorrect-feedback");
      }
    }
  } catch (error) {
    console.error("Erro ao corrigir resposta:", error);
    if (feedbackMessage) {
      feedbackMessage.classList.remove("hidden");
      feedbackMessage.textContent = "Não foi possível corrigir no momento. Tente novamente.";
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
    window.location.href = "index.html";
  });
}

async function enviarDados(question, answer, rightAnswer, alternativeAnswers) {
  const resposta = await fetch("/receber_dados", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      question,
      user_answer: answer,
      correct_answer: rightAnswer,
      alternative_answers: alternativeAnswers,
      pergunta: question,
      resposta: answer,
      resposta_correta: rightAnswer,
      respostas_alternativas: alternativeAnswers,
      resposta_usuario: answer
    })
  });
  if (!resposta.ok) {
    const errorText = await resposta.text();
    throw new Error(errorText || `Erro ao comunicar com a API: ${resposta.status}`);
  }
  const dados = await resposta.json();
  return (dados.result || "No").toString().trim();
}

async function receber_mensagem_errada(question, answer, rightAnswer, alternativeAnswers, hints) {
  const resposta = await fetch("/receber_correcao", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      question,
      user_answer: answer,
      correct_answer: rightAnswer,
      alternative_answers: alternativeAnswers,
      pergunta: question,
      resposta: answer,
      resposta_correta: rightAnswer,
      respostas_alternativas: alternativeAnswers,
      resposta_usuario: answer,
      dicas: hints
    })
  });
  if (!resposta.ok) {
    const errorText = await resposta.text();
    throw new Error(errorText || `Erro ao comunicar com a API: ${resposta.status}`);
  }
  const dados = await resposta.json();
  return (dados.resposta || dados.result || "").toString().trim();
}