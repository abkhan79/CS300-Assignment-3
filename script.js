const API_BASE = 'https://www.themealdb.com/api/json/v1/1';
const MIN_LOADING_MS = 5000;

const searchForm = document.querySelector('#searchForm');
const queryInput = document.querySelector('#queryInput');
const searchTypeSelect = document.querySelector('#searchType');
const categoryFilter = document.querySelector('#categoryFilter');
const organizeToggle = document.querySelector('#organizeToggle');
const statusSection = document.querySelector('#statusSection');
const resultsGrid = document.querySelector('#resultsGrid');
const groupedResults = document.querySelector('#groupedResults');
const mealDialog = document.querySelector('#mealDialog');
const mealDetail = document.querySelector('#mealDetail');
const loadMoreBtn = document.querySelector('#loadMoreBtn');
const controls = document.querySelectorAll('[data-control]');

const appState = {
  meals: [],
  filteredMeals: [],
  displayedCount: 0,
  batchSize: 8,
  currentQuery: '',
  currentMode: 'name',
};

const setControlsDisabled = (isDisabled) => {
  controls.forEach((control) => {
    control.disabled = isDisabled;
  });

  if (organizeToggle) {
    organizeToggle.disabled = isDisabled;
  }
};

const setStatus = (type, message) => {
  statusSection.className = `status status-${type}`;
  statusSection.textContent = message;
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const mealCardMarkup = (meal) => `
  <article class="meal-card">
    <button type="button" class="meal-open" data-id="${meal.idMeal}" aria-label="View details for ${meal.strMeal}">
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy" />
      <div class="meal-info">
        <h3>${meal.strMeal}</h3>
        <p>Category: ${meal.strCategory || 'Unknown'}</p>
      </div>
    </button>
  </article>
`;

const classifyMeal = (meal) => {
  const mealName = (meal.strMeal || '').toLowerCase();
  const mealCategory = (meal.strCategory || '').toLowerCase();
  const query = appState.currentQuery.toLowerCase();

  if (mealName.includes('burger')) {
    return 'Burgers';
  }

  if (mealName.includes('fries') || mealName.includes('chips') || mealName.includes('kapsalon') || query.includes('fries')) {
    return 'Fries';
  }

  if (
    mealCategory === 'pasta' ||
    mealName.includes('pasta') ||
    mealName.includes('spaghetti') ||
    mealName.includes('penne') ||
    mealName.includes('linguine') ||
    mealName.includes('mac') ||
    query.includes('pasta')
  ) {
    return 'Pasta';
  }

  if (mealName.includes('garlic') || query.includes('garlic')) {
    return 'Garlic Recipes';
  }

  return 'Other Recipes';
};

const renderGroupedMeals = (meals) => {
  resultsGrid.innerHTML = '';
  groupedResults.innerHTML = '';
  loadMoreBtn.style.display = 'none';

  const grouped = {
    Burgers: [],
    Fries: [],
    Pasta: [],
    'Garlic Recipes': [],
    'Other Recipes': [],
  };

  meals.forEach((meal) => {
    const groupKey = classifyMeal(meal);
    grouped[groupKey].push(meal);
  });

  const sectionOrder = ['Burgers', 'Fries', 'Pasta', 'Garlic Recipes', 'Other Recipes'];

  const sectionsMarkup = sectionOrder
    .map(
      (sectionKey) => `
        <section class="group-section" aria-label="${sectionKey}">
          <h2>${sectionKey} (${grouped[sectionKey].length})</h2>
          <div class="group-grid">
            ${
              grouped[sectionKey].length > 0
                ? grouped[sectionKey].map((meal) => mealCardMarkup(meal)).join('')
                : '<p class="group-empty">No meals in this group for the current search/filter.</p>'
            }
          </div>
        </section>
      `
    )
    .join('');

  groupedResults.insertAdjacentHTML('beforeend', sectionsMarkup);
};

const renderMeals = (meals, append = false) => {
  if (!append) {
    resultsGrid.innerHTML = '';
    groupedResults.innerHTML = '';
    appState.displayedCount = 0;
  }

  const cardsMarkup = meals.map((meal) => mealCardMarkup(meal)).join('');

  resultsGrid.insertAdjacentHTML('beforeend', cardsMarkup);
  appState.displayedCount += meals.length;
};

const updateLoadMoreBtn = () => {
  const hasMore = appState.displayedCount < appState.filteredMeals.length;
  loadMoreBtn.style.display = hasMore ? 'block' : 'none';
};

const loadMore = () => {
  const nextBatch = appState.filteredMeals.slice(
    appState.displayedCount,
    appState.displayedCount + appState.batchSize
  );

  if (nextBatch.length > 0) {
    renderMeals(nextBatch, true);
    updateLoadMoreBtn();
  }
};

const applyCategoryFilter = () => {
  const selectedCategory = categoryFilter.value;

  appState.filteredMeals =
    selectedCategory === 'all'
      ? [...appState.meals]
      : appState.meals.filter((meal) => meal.strCategory === selectedCategory);

  if (appState.filteredMeals.length === 0) {
    resultsGrid.innerHTML = '';
    groupedResults.innerHTML = '';
    loadMoreBtn.style.display = 'none';
    setStatus('empty', 'No results found for this category.');
    return;
  }

  if (organizeToggle.checked) {
    renderGroupedMeals(appState.filteredMeals);
    setStatus('success', `Showing ${appState.filteredMeals.length} meal(s) organized by type.`);
    return;
  }

  const initialBatch = appState.filteredMeals.slice(0, appState.batchSize);
  renderMeals(initialBatch, false);
  updateLoadMoreBtn();
  setStatus('success', `Showing ${initialBatch.length} of ${appState.filteredMeals.length} meal(s).`);
};

const fetchMealById = async (mealId) => {
  const response = await fetch(`${API_BASE}/lookup.php?i=${encodeURIComponent(mealId)}`);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  return data.meals ? data.meals[0] : null;
};

const enrichMealsWithCategory = async (meals) => {
  const limitedMeals = meals.slice(0, 24);

  const enrichedMeals = [];
  for (const meal of limitedMeals) {
    try {
      const fullMeal = await fetchMealById(meal.idMeal);
      enrichedMeals.push({
        ...meal,
        strCategory: fullMeal?.strCategory || 'Unknown',
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch {
      enrichedMeals.push({
        ...meal,
        strCategory: 'Unknown',
      });
    }
  }

  return enrichedMeals;
};

const fetchMeals = async (query, mode) => {
  const loadingStartTime = Date.now();

  try {
    setControlsDisabled(true);
    setStatus('loading', 'Loading recipes...');
    appState.currentQuery = query;
    appState.currentMode = mode;

    const endpoint =
      mode === 'ingredient'
        ? `${API_BASE}/filter.php?i=${encodeURIComponent(query)}`
        : `${API_BASE}/search.php?s=${encodeURIComponent(query)}`;

    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    const elapsedTime = Date.now() - loadingStartTime;
    const remainingLoadingTime = Math.max(0, MIN_LOADING_MS - elapsedTime);
    if (remainingLoadingTime > 0) {
      await wait(remainingLoadingTime);
    }

    if (!data.meals) {
      appState.meals = [];
      appState.filteredMeals = [];
      resultsGrid.innerHTML = '';
      groupedResults.innerHTML = '';
      loadMoreBtn.style.display = 'none';
      setStatus('empty', 'No results found. Try a different search term.');
      return;
    }

    appState.meals =
      mode === 'name' ? data.meals : await enrichMealsWithCategory(data.meals);

    applyCategoryFilter();
  } catch (error) {
    resultsGrid.innerHTML = '';
    groupedResults.innerHTML = '';
    loadMoreBtn.style.display = 'none';
    setStatus('error', `Something went wrong: ${error.message}`);
  } finally {
    setControlsDisabled(false);
  }
};

const populateCategories = async () => {
  try {
    const response = await fetch(`${API_BASE}/list.php?c=list`);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const categories = data.meals || [];

    const optionsMarkup = categories
      .map((categoryItem) => `<option value="${categoryItem.strCategory}">${categoryItem.strCategory}</option>`)
      .join('');

    categoryFilter.insertAdjacentHTML('beforeend', optionsMarkup);
  } catch {
    setStatus('error', 'Could not load categories. Search still works.');
  }
};

const openMealDetails = async (mealId) => {
  try {
    setStatus('loading', 'Loading meal details...');
    const meal = await fetchMealById(mealId);

    if (!meal) {
      setStatus('error', 'Meal details were not found.');
      return;
    }

    mealDetail.innerHTML = `
      <h2>${meal.strMeal}</h2>
      <p class="meta">Category: ${meal.strCategory || 'Unknown'} | Area: ${meal.strArea || 'Unknown'}</p>
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" />
      <h3>Instructions</h3>
      <p>${meal.strInstructions || 'No instructions available.'}</p>
    `;

    if (typeof mealDialog.showModal === 'function') {
      mealDialog.showModal();
    } else {
      alert('Your browser does not support dialog.');
    }

    setStatus('success', `Showing ${appState.filteredMeals.length} meal(s).`);
  } catch (error) {
    setStatus('error', `Could not load meal details: ${error.message}`);
  }
};

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = queryInput.value.trim();

  if (!query) {
    setStatus('empty', 'Please enter a search term first.');
    resultsGrid.innerHTML = '';
    groupedResults.innerHTML = '';
    loadMoreBtn.style.display = 'none';
    return;
  }

  await fetchMeals(query, searchTypeSelect.value);
});

queryInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    searchForm.requestSubmit();
  }
});

categoryFilter.addEventListener('change', () => {
  if (appState.meals.length === 0) {
    setStatus('initial', 'Search for meals first, then use category filtering.');
    return;
  }

  applyCategoryFilter();
});

organizeToggle.addEventListener('change', () => {
  if (appState.meals.length === 0) {
    return;
  }

  applyCategoryFilter();
});

loadMoreBtn.addEventListener('click', loadMore);

resultsGrid.addEventListener('click', async (event) => {
  const targetButton = event.target.closest('.meal-open');

  if (!targetButton) {
    return;
  }

  const mealId = targetButton.dataset.id;
  await openMealDetails(mealId);
});

groupedResults.addEventListener('click', async (event) => {
  const targetButton = event.target.closest('.meal-open');

  if (!targetButton) {
    return;
  }

  const mealId = targetButton.dataset.id;
  await openMealDetails(mealId);
});

populateCategories();
