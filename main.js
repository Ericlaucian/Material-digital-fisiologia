// src/main.ts
var AVAILABLE_TOPICS = ["biology"];
var topicsContainer = document.getElementById("topics-container");
var topicsSection = document.getElementById("topics-section");
var rouletteSection = document.getElementById("roulette-section");
var questionSection = document.getElementById("question-section");
var spinButton = document.getElementById("spin-button");
var questionTextElement = document.getElementById("question-text");
var hintsContainer = document.getElementById("hints-container");
var showAnswerButton = document.getElementById("show-answer-button");
var nextButton = document.getElementById("next-button");
var timerDisplay = document.getElementById("timer-display");
var answerContainer = document.getElementById("answer-container");
var answerTextElement = document.getElementById("answer-text");
var themeSwitch = document.getElementById("checkbox");
var currentTopicQuestions = {};
var answeredQuestions = [];
var selectedQuestionName = null;
var countdownTimer;
async function loadTopicButtons() {
  if (topicsContainer) {
    topicsContainer.innerHTML = "";
    AVAILABLE_TOPICS.forEach((topicName) => {
      const button = document.createElement("button");
      button.classList.add("topic-button");
      button.textContent = topicName;
      button.onclick = () => selectTopic(topicName);
      topicsContainer.appendChild(button);
    });
  }
}
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
    if (topicsSection) {
      topicsSection.classList.add("hidden");
    }
    if (rouletteSection) {
      rouletteSection.classList.remove("hidden");
    }
  } catch (error) {
    console.error(`Failed to load questions for topic ${topicName}:`, error);
    if (topicsContainer) {
      topicsContainer.innerHTML = `<p>Erro ao carregar perguntas para o tópico "${topicName}". Por favor, tente novamente mais tarde.</p>`;
    }
  }
}
function pickRandomQuestion() {
  const unansweredQuestions = Object.keys(currentTopicQuestions).filter((q) => !answeredQuestions.includes(q));
  if (unansweredQuestions.length === 0) {
    if (questionTextElement)
      questionTextElement.textContent = "Parabéns! Você respondeu todas as perguntas!";
    if (hintsContainer)
      hintsContainer.innerHTML = "";
    if (answerContainer)
      answerContainer.classList.add("hidden");
    if (showAnswerButton)
      showAnswerButton.classList.add("hidden");
    if (nextButton)
      nextButton.classList.add("hidden");
    return;
  }
  const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
  selectedQuestionName = unansweredQuestions[randomIndex];
  if (questionTextElement && selectedQuestionName) {
    questionTextElement.textContent = selectedQuestionName;
  }
  if (hintsContainer)
    hintsContainer.innerHTML = "";
  if (timerDisplay)
    timerDisplay.textContent = "";
  if (answerContainer)
    answerContainer.classList.add("hidden");
  if (showAnswerButton)
    showAnswerButton.classList.remove("hidden");
  if (nextButton)
    nextButton.classList.add("hidden");
  clearTimeout(countdownTimer);
  if (rouletteSection) {
    rouletteSection.classList.add("hidden");
  }
  if (questionSection) {
    questionSection.classList.remove("hidden");
  }
  displayHints();
}
function displayHints() {
  if (!hintsContainer || !selectedQuestionName || !currentTopicQuestions[selectedQuestionName]) {
    return;
  }
  hintsContainer.innerHTML = "";
  const questionData = currentTopicQuestions[selectedQuestionName];
  for (let i = 1;i <= 4; i++) {
    const hintKey = `Hint ${i}`;
    const hintText = questionData[hintKey];
    if (hintText) {
      const hintButton = document.createElement("button");
      hintButton.classList.add("hint-button");
      hintButton.textContent = `Dica ${i}`;
      hintButton.dataset.hintNumber = String(i);
      let revealed = false;
      hintButton.onclick = () => {
        if (!revealed) {
          hintButton.textContent = hintText;
          hintButton.disabled = true;
          revealed = true;
          hintButton.classList.add("revealed-hint");
        }
      };
      hintsContainer.appendChild(hintButton);
    }
  }
}
function startAnswerTimer() {
  if (showAnswerButton)
    showAnswerButton.classList.add("hidden");
  let timeLeft = 10;
  if (timerDisplay)
    timerDisplay.textContent = `Tempo restante: ${timeLeft}s`;
  countdownTimer = setInterval(() => {
    timeLeft--;
    if (timerDisplay)
      timerDisplay.textContent = `Tempo restante: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(countdownTimer);
      revealAnswer();
    }
  }, 1000);
}
function revealAnswer() {
  if (!selectedQuestionName || !currentTopicQuestions[selectedQuestionName]) {
    console.warn("No question selected to reveal answer.");
    return;
  }
  if (!answeredQuestions.includes(selectedQuestionName)) {
    answeredQuestions.push(selectedQuestionName);
  }
  const questionData = currentTopicQuestions[selectedQuestionName];
  if (answerTextElement) {
    answerTextElement.textContent = questionData.Answer;
  }
  if (answerContainer) {
    answerContainer.classList.remove("hidden");
  }
  if (timerDisplay)
    timerDisplay.textContent = "";
  if (showAnswerButton)
    showAnswerButton.classList.add("hidden");
  if (nextButton)
    nextButton.classList.remove("hidden");
}
if (spinButton) {
  spinButton.addEventListener("click", pickRandomQuestion);
}
if (showAnswerButton) {
  showAnswerButton.addEventListener("click", startAnswerTimer);
}
if (nextButton) {
  nextButton.addEventListener("click", pickRandomQuestion);
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
  loadTopicButtons();
  applyInitialTheme();
});
