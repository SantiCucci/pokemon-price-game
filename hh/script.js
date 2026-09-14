const API_URL = "https://api.pokemontcg.io/v2/cards";
const PAGE_SIZE = 100; 
const MAX_RANDOM_PAGE = 150; 
const FETCH_RETRIES = 4; 
const RETRY_DELAY_MS = 600; 

const TOTAL_ROUNDS = 10;
const MAX_LIVES = 3;
const ROUND_TRANSITION_DELAY_MS = 3000;
const PRICE_ANIM_DURATION_MS = 1400; 


const startScreen = document.getElementById("startScreen");
const pageHeader = document.getElementById("pageHeader");
const startArea = document.getElementById("startArea");
const startBtn = document.getElementById("startBtn");
const loadingArea = document.getElementById("loadingArea");
const errorArea = document.getElementById("errorArea");

const roundNumberEl = document.getElementById("roundNumber");
const totalRoundsEl = document.getElementById("totalRounds");
const livesDisplayEl = document.getElementById("livesDisplay");
const playScreen = document.getElementById("playScreen");

const cardEls = {
  A: {
    wrapper: document.getElementById("cardA"),
    img: document.getElementById("cardA-img"),
    name: document.getElementById("cardA-name"),
    set: document.getElementById("cardA-set"),
    price: document.getElementById("cardA-price"),
  },
  B: {
    wrapper: document.getElementById("cardB"),
    img: document.getElementById("cardB-img"),
    name: document.getElementById("cardB-name"),
    set: document.getElementById("cardB-set"),
    price: document.getElementById("cardB-price"),
  },
};

const endArea = document.getElementById("endArea");
const endTitle = document.getElementById("endTitle");
const endMessage = document.getElementById("endMessage");
const restartBtn = document.getElementById("restartBtn");


let cardPool = [];
let currentPair = null; 
let round = 0;
let correct = 0;
let lives = MAX_LIVES;
let roundLocked = false;
let priceAnimFrames = { A: null, B: null };

totalRoundsEl.textContent = TOTAL_ROUNDS;


function getCardPrice(card) {
  if (!card.tcgplayer || !card.tcgplayer.prices) return null;

  const priceGroups = Object.values(card.tcgplayer.prices); 
  let best = null;

  priceGroups.forEach((group) => {
    if (typeof group.market === "number" && !Number.isNaN(group.market)) {
      if (best === null || group.market > best) {
        best = group.market;
      }
    }
  });

  return best;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}



function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


async function fetchRandomCards() {
  let lastError = null;

  for (let attempt = 1; attempt <= FETCH_RETRIES; attempt++) {
    const page = Math.floor(Math.random() * MAX_RANDOM_PAGE) + 1;
    const url = `${API_URL}?page=${page}&pageSize=${PAGE_SIZE}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`La API respondió con estado ${response.status}`);
      }

      const data = await response.json();
      const cards = Array.isArray(data.data) ? data.data : [];


      if (cards.length > 0) {
        return cards;
      }
      lastError = new Error("La API devolvió una lista vacía.");
    } catch (err) {
      lastError = err;
    }

    if (attempt < FETCH_RETRIES) {
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError || new Error("No se pudo obtener cartas de la API.");
}

async function refillPool() {
  const cards = await fetchRandomCards();

  const valid = cards.filter((card) => {
    const price = getCardPrice(card);
    return price !== null && price > 0 && card.images && card.images.large;
  });

  const existingIds = new Set(cardPool.map((c) => c.id));
  valid.forEach((card) => {
    if (!existingIds.has(card.id)) {
      cardPool.push(card);
      existingIds.add(card.id);
    }
  });

  shuffle(cardPool);
}


async function ensurePairAvailable() {
  let attempts = 0;

  while (attempts < 5) {
    if (cardPool.length >= 2) {

      for (let i = 0; i < cardPool.length; i++) {
        for (let j = i + 1; j < cardPool.length; j++) {
          if (getCardPrice(cardPool[i]) !== getCardPrice(cardPool[j])) {
            return [i, j];
          }
        }
      }
    }
    await refillPool();
    attempts++;
  }

  throw new Error("No se pudieron encontrar suficientes cartas con precio.");
}


function showLoading(show) {
  loadingArea.classList.toggle("d-none", !show);
}

function showError(message) {
  errorArea.textContent = message;
  errorArea.classList.remove("d-none");
}

function hideError() {
  errorArea.classList.add("d-none");
}

function renderLives() {
  livesDisplayEl.innerHTML = "";
  for (let i = 0; i < MAX_LIVES; i++) {
    const ball = document.createElement("span");
    ball.className = "pokeball" + (i >= lives ? " used" : "");
    ball.setAttribute("aria-hidden", "true");
    livesDisplayEl.appendChild(ball);
  }
  livesDisplayEl.setAttribute("aria-label", `${lives} de ${MAX_LIVES} vidas restantes`);
}


async function startGame() {
  pageHeader.classList.add("d-none");
  startArea.classList.add("d-none");
  endArea.classList.add("d-none");
  hideError();
  showLoading(true);

  try {
    await refillPool();
    startScreen.classList.add("d-none"); 
    playScreen.classList.remove("d-none");
    await playNextRound();
  } catch (err) {
    showError("Ocurrió un error al conectar con la API de pokemontcg.io. Probá de nuevo más tarde.");
    pageHeader.classList.remove("d-none");
    startArea.classList.remove("d-none");
    console.error(err);
  } finally {
    showLoading(false);
  }
}

async function playNextRound() {
  roundLocked = false;
  cancelPriceAnimations();

  cardEls.A.wrapper.classList.remove("correct", "incorrect");
  cardEls.B.wrapper.classList.remove("correct", "incorrect");
  cardEls.A.price.classList.add("d-none");
  cardEls.B.price.classList.add("d-none");

  showLoading(true);
  try {
    const [i, j] = await ensurePairAvailable();

    const indices = [i, j].sort((a, b) => b - a); 
    const pickedCards = indices.map((idx) => cardPool.splice(idx, 1)[0]);
    shuffle(pickedCards);

    currentPair = { A: pickedCards[0], B: pickedCards[1] };
    round++;
    roundNumberEl.textContent = round;

    renderCard("A", currentPair.A);
    renderCard("B", currentPair.B);
  } catch (err) {
    showError("No se pudieron cargar más cartas. Probá reiniciar el juego.");
    console.error(err);
  } finally {
    showLoading(false);
  }
}

function renderCard(key, card) {
  const el = cardEls[key];
  el.img.src = card.images.large;
  el.img.alt = card.name;
  el.name.textContent = card.name;
  el.set.textContent = card.set && card.set.name ? card.set.name : "";
}


function animatePriceCountUp(key, target) {
  const el = cardEls[key].price;
  const startTime = performance.now();

  el.textContent = "$0.00";
  el.classList.remove("d-none");

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / PRICE_ANIM_DURATION_MS, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = target * eased;
    el.textContent = `$${current.toFixed(2)}`;

    if (progress < 1) {
      priceAnimFrames[key] = requestAnimationFrame(step);
    } else {
      el.textContent = `$${target.toFixed(2)}`;
      priceAnimFrames[key] = null;
    }
  }

  priceAnimFrames[key] = requestAnimationFrame(step);
}

function cancelPriceAnimations() {
  ["A", "B"].forEach((key) => {
    if (priceAnimFrames[key] !== null) {
      cancelAnimationFrame(priceAnimFrames[key]);
      priceAnimFrames[key] = null;
    }
  });
}

function handleSelect(chosenKey) {
  if (roundLocked || !currentPair) return;
  roundLocked = true;

  const otherKey = chosenKey === "A" ? "B" : "A";
  const chosenCard = currentPair[chosenKey];
  const otherCard = currentPair[otherKey];

  const chosenPrice = getCardPrice(chosenCard);
  const otherPrice = getCardPrice(otherCard);

  const isCorrect = chosenPrice > otherPrice;

  animatePriceCountUp(chosenKey, chosenPrice);
  animatePriceCountUp(otherKey, otherPrice);

  if (isCorrect) {
    correct++;
    cardEls[chosenKey].wrapper.classList.add("correct");
    cardEls[otherKey].wrapper.classList.add("incorrect");
  } else {
    lives--;
    renderLives();
    cardEls[chosenKey].wrapper.classList.add("incorrect");
    cardEls[otherKey].wrapper.classList.add("correct");
  }

  const gameWon = round >= TOTAL_ROUNDS && isCorrect;
  const gameLost = lives <= 0;

  setTimeout(() => {
    if (gameLost) {
      endGame(false);
    } else if (gameWon) {
      endGame(true);
    } else {
      playNextRound();
    }
  }, ROUND_TRANSITION_DELAY_MS);
}

function endGame(won) {
  playScreen.classList.add("d-none");
  endArea.classList.remove("d-none");

  if (won) {
    endTitle.textContent = "¡Ganaste! 🎉";
    endTitle.className = "fw-bold mb-2 win";
    endMessage.textContent = `Completaste las ${TOTAL_ROUNDS} rondas con ${lives} vida(s) de sobra.`;
  } else {
    endTitle.textContent = "Juego terminado";
    endTitle.className = "fw-bold mb-2 lose";
    endMessage.textContent = `Perdiste tus ${MAX_LIVES} vidas en la ronda ${round}. Acertaste ${correct} de ${round}.`;
  }
}

function resetGame() {
  startScreen.classList.remove("d-none");
  pageHeader.classList.remove("d-none");
  startArea.classList.remove("d-none");
  cardPool = [];
  currentPair = null;
  round = 0;
  correct = 0;
  lives = MAX_LIVES;
  roundLocked = false;

  roundNumberEl.textContent = 0;
  renderLives();

  hideError();
  playScreen.classList.add("d-none");
  endArea.classList.add("d-none");
}

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", resetGame);

["A", "B"].forEach((key) => {
  const wrapper = cardEls[key].wrapper;
  wrapper.addEventListener("click", () => handleSelect(key));
  wrapper.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect(key);
    }
  });
});

renderLives();
