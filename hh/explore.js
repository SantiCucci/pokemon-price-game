const EXPLORE_API_URL = "https://api.pokemontcg.io/v2/cards";
const EXPLORE_PAGE_SIZE = 250; 
const EXPLORE_MAX_PAGES = 15; 
const EXPLORE_STALE_PAGE_LIMIT = 3; 
const EXPLORE_FIELDS = "id,name,images,set,types,tcgplayer";

const startScreenEl = document.getElementById("startScreen");
const exploreScreenEl = document.getElementById("exploreScreen");
const exploreBtn = document.getElementById("exploreBtn");
const exploreBackBtn = document.getElementById("exploreBackBtn");

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");

const exploreLoading = document.getElementById("exploreLoading");
const exploreLoadingText = document.getElementById("exploreLoadingText");
const exploreErrorEl = document.getElementById("exploreError");
const exploreNoResults = document.getElementById("exploreNoResults");
const exploreCount = document.getElementById("exploreCount");
const exploreResults = document.getElementById("exploreResults");

let exploreCards = [];
let exploreLoaded = false;

function sleepExplore(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadExploreCards() {
  showExploreState("loading", 0, 0);

  const seenNames = new Set();
  const catalog = [];
  let stalePages = 0;
  let pagesFetched = 0;

  try {
    for (let page = 1; page <= EXPLORE_MAX_PAGES; page++) {
      const url = `${EXPLORE_API_URL}?page=${page}&pageSize=${EXPLORE_PAGE_SIZE}&select=${EXPLORE_FIELDS}`;

      let cards;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`La API respondió con estado ${response.status}`);
        }
        const data = await response.json();
        cards = Array.isArray(data.data) ? data.data : [];
      } catch (pageErr) {

        console.error(pageErr);
        if (catalog.length > 0) break;
        throw pageErr; 
      }

      pagesFetched++;

      if (cards.length === 0) break;

      let addedThisPage = 0;
      cards.forEach((card) => {
        const hasImage = card.images && card.images.small;
        if (hasImage && !seenNames.has(card.name)) {
          seenNames.add(card.name);
          catalog.push(card);
          addedThisPage++;
        }
      });

      showExploreState("loading", catalog.length, pagesFetched);

      stalePages = addedThisPage === 0 ? stalePages + 1 : 0;
      if (stalePages >= EXPLORE_STALE_PAGE_LIMIT) break; 

      if (cards.length < EXPLORE_PAGE_SIZE) break; 

      await sleepExplore(150); 
    }

    if (catalog.length === 0) {
      throw new Error("No se pudo armar el catálogo de cartas.");
    }

    catalog.sort((a, b) => a.name.localeCompare(b.name));

    exploreCards = catalog;
    exploreLoaded = true;
    buildTypeOptions(exploreCards);
    applyFilters(); 
  } catch (err) {
    console.error(err);
    showExploreState("error");
  }
}

function buildTypeOptions(cards) {
  const types = new Set();
  cards.forEach((card) => {
    if (Array.isArray(card.types)) {
      card.types.forEach((t) => types.add(t));
    }
  });

  const sortedTypes = Array.from(types).sort();

  typeFilter.innerHTML = '<option value="">Todos los tipos</option>';
  sortedTypes.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    typeFilter.appendChild(option);
  });
}


function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedType = typeFilter.value;

  const filtered = exploreCards.filter((card) => {
    const matchesName = card.name.toLowerCase().includes(query);
    const matchesType =
      !selectedType || (Array.isArray(card.types) && card.types.includes(selectedType));
    return matchesName && matchesType;
  });

  renderResults(filtered);
}

function renderResults(cards) {
  exploreResults.innerHTML = "";

  if (cards.length === 0) {
    showExploreState("empty");
    return;
  }

  showExploreState("results", cards.length);

  const fragment = document.createDocumentFragment();

  cards.forEach((card) => {
    const price = getExplorePrice(card);
    const col = document.createElement("div");
    col.className = "col-6 col-sm-4 col-md-3";

    col.innerHTML = `
      <div class="card explore-card h-100 text-center shadow-sm">
        <img src="${card.images && card.images.small ? card.images.small : ""}"
             alt="${card.name}" class="card-img-top p-2" loading="lazy">
        <div class="card-body p-2">
          <h6 class="card-title mb-1">${card.name}</h6>
          <p class="card-text text-muted small mb-1">${card.set && card.set.name ? card.set.name : ""}</p>
          <p class="card-text small mb-0">${price !== null ? `$${price.toFixed(2)}` : "Sin precio"}</p>
        </div>
      </div>
    `;

    fragment.appendChild(col);
  });

  exploreResults.appendChild(fragment);
}


function getExplorePrice(card) {
  if (!card.tcgplayer || !card.tcgplayer.prices) return null;
  let best = null;
  Object.values(card.tcgplayer.prices).forEach((group) => {
    if (typeof group.market === "number" && !Number.isNaN(group.market)) {
      if (best === null || group.market > best) best = group.market;
    }
  });
  return best;
}

function showExploreState(state, catalogCount, pagesFetched) {
  exploreLoading.classList.toggle("d-none", state !== "loading");
  exploreErrorEl.classList.toggle("d-none", state !== "error");
  exploreNoResults.classList.toggle("d-none", state !== "empty");
  exploreResults.classList.toggle("d-none", state !== "results");
  exploreCount.classList.toggle("d-none", state !== "results");

  if (state === "loading") {
    exploreLoadingText.textContent =
      catalogCount > 0
        ? `Armando el catálogo... ${catalogCount} Pokémon distintos encontrados (página ${pagesFetched})`
        : "Buscando cartas...";
  }
  if (state === "error") {
    exploreErrorEl.textContent =
      "Ocurrió un error al conectar con la API de pokemontcg.io. Probá de nuevo más tarde.";
  }
  if (state === "results") {
    exploreCount.textContent = `${catalogCount} Pokémon encontrado(s) (sobre ${exploreCards.length} en el catálogo)`;
  }
}

function openExploreScreen() {
  startScreenEl.classList.add("d-none");
  exploreScreenEl.classList.remove("d-none");

  if (!exploreLoaded) {
    loadExploreCards();
  }
}

function closeExploreScreen() {
  exploreScreenEl.classList.add("d-none");
  startScreenEl.classList.remove("d-none");
}

exploreBtn.addEventListener("click", openExploreScreen);
exploreBackBtn.addEventListener("click", closeExploreScreen);

searchInput.addEventListener("input", applyFilters);
typeFilter.addEventListener("change", applyFilters);
