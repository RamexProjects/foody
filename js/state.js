const state = {
  recipes: [],
  lastRecipe: null,
  lastResults: [],
  context: {
    cuisine: null,
    ingredients: [],
    filters: [],
    excluded: [],
  },
};

export function getState() {
  return state;
}

export function setRecipes(recipes) {
  state.recipes = recipes;
}

export function getRecipes() {
  return state.recipes;
}

export function setLastRecipe(recipe) {
  state.lastRecipe = recipe;
}

export function getLastRecipe() {
  return state.lastRecipe;
}

export function setLastResults(results) {
  state.lastResults = results;
}

export function getLastResults() {
  return state.lastResults;
}

export function getContext() {
  return state.context;
}

export function setContext(ctx) {
  state.context = ctx;
}

export function resetContext() {
  state.context = { cuisine: null, ingredients: [], filters: [], excluded: [] };
}

export function resetAll() {
  state.lastRecipe = null;
  state.lastResults = [];
  resetContext();
}
