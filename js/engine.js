import {
  getRecipes,
  getLastResults,
  getLastRecipe,
  getContext,
  setLastRecipe,
  setLastResults,
  setContext,
  resetContext,
} from './state.js';
import {
  correctTypos,
  normalizeInput,
  extractEntities,
  calculateScore,
  rand,
} from './nlp.js';

function cuisineSummary(recipes) {
  const map = {};
  recipes.forEach((r) => {
    const c = r.cuisine || 'Other';
    map[c] = (map[c] || 0) + 1;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `• <b>${c}</b> (${n})`)
    .join('<br>');
}

function formatRecipe(r) {
  if (!r) return '';
  return (
    `<div class="recipe-header">${r.name}</div>` +
    (r.cuisine ? `<span class="recipe-cuisine">${r.cuisine}</span><br>` : '') +
    `${r.content || ''}`
  );
}

function handleChitChat(input) {
  if (/^(hi|hello|hey|howdy|yo|sup|hiya|greetings|good (morning|afternoon|evening|day)|what('?)s good|what('?)s up)\b/.test(input)) {
    return rand([
      'Hello! 👋 I\'m <b>Foody</b>, your recipe assistant. What would you like to cook today?',
      'Hey there! 🍳 Hungry? Just tell me a dish, cuisine, or ingredient and I\'ll find you a recipe!',
    ]) || 'Hello! 👋 How can I help you cook today?';
  }
  if (/\b(thank(s| you)|thx|ty|cheers|appreciate)\b/.test(input)) {
    return "You're very welcome! 🎉 Happy cooking!";
  }
  if (/\b(bye|goodbye|see ya|see you|later|cya|farewell|adios|take care)\b/.test(input)) {
    return 'Goodbye! 👋 Happy cooking!';
  }
  if (/\b(help|how (do you work|to use|does this work)|what can you do|commands|options)\b/.test(input)) {
    return (
      '🧑‍🍳 I\'m <b>Foody</b>! I remember our conversation context.<br><br>' +
      '• <b>Cuisines:</b> <i>"I want something from Italy"</i><br>' +
      '• <b>Context Modifiers:</b> <i>"Show me Mexican"</i> -> <i>"Vegetarian ones"</i><br>' +
      '• <b>Recommendations:</b> <i>"Any dessert recommendation?"</i><br>' +
      '• <b>Exclusions:</b> <i>"Make it without onions"</i>'
    );
  }
  if (/\b(what (cuisines|types|categories|kinds)|which cuisines|list (cuisines|recipes|dishes)|what do you (have| know)|show (me )?(everything|all))\b/.test(input)) {
    return '🍽️ Here\'s what I\'ve got — recipes by cuisine: <br><br>' +
      cuisineSummary(getRecipes()) +
      '<br><br><i>Say any cuisine name to browse it!</i>';
  }
  if (/\b(surprise me|random|anything|i don('?t| not) (know|care)|whatever|you choose|you decide)\b/.test(input)) {
    return doRandom();
  }
  return null;
}

function handleFollowUp(input, lastRecipe) {
  if (!lastRecipe) return null;
  if (/\b(how long|cooking time|time|minutes?|hours?|how many minutes|prep time|how fast)\b/.test(input)) {
    if (lastRecipe.time) return `⏱️ <b>${lastRecipe.name}</b> takes about <b>${lastRecipe.time}</b>.`;
  }
  if (/\b(show( it| the recipe)? again|repeat|show (me )?(it|the recipe|that))\b/.test(input)) {
    return formatRecipe(lastRecipe);
  }
  return null;
}

function parseNumberedPick(input) {
  const ordinals = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  for (let i = 0; i < ordinals.length; i++) {
    if (input.includes(ordinals[i])) return i;
  }
  const m = input.match(/(?:number\s*|#\s*|no\.?\s*)?(\d+)/);
  if (m) return parseInt(m[1]) - 1;
  return null;
}

function findRecipeMention(input, recipes) {
  let clean = normalizeInput(input)
    .replace(/\b(lets|let's|do|make|cook|want|have|show|give|me|some|the|a|an|please|thanks|then|now)\b/g, '')
    .replace(/[?.!,]/g, '')
    .trim();
  if (!clean || clean.length < 3) return null;
  let exact = recipes.find((r) => r.name && clean === r.name.toLowerCase());
  if (exact) return exact;
  exact = recipes.find((r) => r.name && clean.includes(r.name.toLowerCase()));
  if (exact) return exact;
  exact = recipes.find((r) => r.name && r.name.toLowerCase().includes(clean));
  return exact || null;
}

function findRecipeFromLastResults(input, lastResults) {
  if (!lastResults || lastResults.length === 0) return null;
  let clean = normalizeInput(input)
    .replace(/\b(lets|let's|do|make|cook|want|have|show|give|me|some|the|a|an|please|thanks|number|#|then|now)\b/g, '')
    .replace(/[?.!,]/g, '')
    .trim();
  if (!clean || clean.length < 3) return null;
  return lastResults.find(
    (r) => r.name && (clean === r.name.toLowerCase() || clean.includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(clean)),
  );
}

function buildContextSummary(ctx) {
  const parts = [];
  if (ctx.cuisine) parts.push(ctx.cuisine);
  if (ctx.filters.length > 0) parts.push(ctx.filters.join(', '));
  if (ctx.ingredients.length > 0) parts.push('with ' + ctx.ingredients.join(', '));
  if (ctx.excluded.length > 0) parts.push('without ' + ctx.excluded.join(', '));
  if (parts.length === 0) return 'your request';
  return parts.join(' ');
}

function buildNotFoundMessage(ctx, recipes) {
  const summary = buildContextSummary(ctx);
  const suggestions = recipes
    .sort(() => 0.5 - Math.random())
    .slice(0, 4)
    .map((r) => `• ${r.name}`)
    .join('<br>');
  return `😕 I couldn't find any recipes matching <b>${summary}</b>. <br><br>Try tweaking your filters, or try one of these: <br><br>${suggestions}`;
}

function handleRecommendationIntent(input, recipes, context) {
  const isRecIntent = /\b(recommend|suggest|idea|ideas|suggestion|give me|what should i|any|some)\b/.test(input);
  if (!isRecIntent) return null;

  let pool = [...recipes];

  if (context.cuisine) {
    pool = pool.filter((r) => r.cuisine && r.cuisine.toLowerCase() === context.cuisine.toLowerCase());
  }

  context.filters.forEach((f) => {
    pool = pool.filter((r) => {
      const tags = (r.tags || []).map((t) => t.toLowerCase());
      return tags.includes(f) || (r.content || '').toLowerCase().includes(f);
    });
  });

  const categories = {
    dessert: /\b(dessert|sweet|cake|treat|pastry)\b/,
    breakfast: /\b(breakfast|morning|brunch)\b/,
    dinner: /\b(dinner|supper|evening)\b/,
    vegetarian: /\b(vegetarian|veggie|meatless)\b/,
    vegan: /\b(vegan|plant.based)\b/,
    quick: /\b(quick|fast|easy|simple)\b/,
  };

  let activeCategories = [];
  for (const [cat, regex] of Object.entries(categories)) {
    if (regex.test(input)) {
      activeCategories.push(cat);
      pool = pool.filter((r) => {
        const tags = (r.tags || []).map((t) => t.toLowerCase());
        const content = (r.content || '').toLowerCase();
        return (
          tags.includes(cat) ||
          content.includes(cat) ||
          (cat === 'dessert' && (tags.includes('sweet') || tags.includes('cake'))) ||
          (cat === 'quick' && (tags.includes('easy') || tags.includes('30 minutes')))
        );
      });
    }
  }

  if (pool.length === 0) {
    if (context.cuisine && activeCategories.length > 0) {
      return `😕 I don't have any ${activeCategories.join(' or ')} recipes for ${context.cuisine} cuisine. Try asking for something else!`;
    }
    return null;
  }

  const recipe = pool[Math.floor(Math.random() * pool.length)];
  setLastRecipe(recipe);

  let emoji = '🍽️';
  if (activeCategories.includes('dessert') || context.filters.includes('dessert')) emoji = '🍰';
  else if (activeCategories.includes('breakfast') || context.filters.includes('breakfast')) emoji = '🍳';

  return `${emoji} I'd recommend <b>${recipe.name}</b>! ${recipe.cuisine ? `<span class="recipe-cuisine">${recipe.cuisine}</span>` : ''}<br><br>${formatRecipe(recipe)}`;
}

function handleSmartSearch(input, recipes, context) {
  const normalized = normalizeInput(input);
  const entities = extractEntities(normalized);

  const isModifier =
    /^(make it|make them|only|just|preferably|but|and|also|plus|except|without|no|any|some|more|less|mostly|mainly|specifically|actually|wait|never mind|forget|vegetarian ones|quick ones|vegan ones)\b/i.test(normalized) ||
    /\b(ones?|things?|dishes?|recipes?|options?|ideas?|please|thanks|thank you)\b$/i.test(normalized) ||
    (entities.cuisines.length === 0 && entities.ingredients.length === 0 && entities.tags.length > 0 && normalized.split(' ').length <= 4) ||
    entities.excluded.length > 0;

  if (isModifier && (context.cuisine || context.filters.length > 0 || context.ingredients.length > 0)) {
    if (entities.cuisines.length > 0) context.cuisine = entities.cuisines[0];
    context.filters = [...new Set([...context.filters, ...entities.tags])];
    context.ingredients = [...new Set([...context.ingredients, ...entities.ingredients])];
    context.excluded = [...new Set([...context.excluded, ...entities.excluded])];
  } else {
    context = {
      cuisine: entities.cuisines.length > 0 ? entities.cuisines[0] : null,
      ingredients: entities.ingredients,
      filters: entities.tags,
      excluded: entities.excluded,
    };
  }

  setContext(context);

  let scoredRecipes = recipes.map((r) => ({
    recipe: r,
    score: calculateScore(r, context),
  }));

  scoredRecipes = scoredRecipes.filter((s) => s.score > 0);
  scoredRecipes.sort((a, b) => b.score - a.score);

  if (scoredRecipes.length === 0) {
    if (isModifier) {
      resetContext();
      return "😕 I couldn't find any recipes matching those specific filters. I've cleared your search context. Try asking for a cuisine or ingredient!";
    }
    return buildNotFoundMessage(context, recipes);
  }

  if (scoredRecipes.length === 1) {
    setLastRecipe(scoredRecipes[0].recipe);
    return formatRecipe(scoredRecipes[0].recipe);
  }

  const top = scoredRecipes.slice(0, 8).map((s) => s.recipe);
  setLastResults(top);

  const summary = buildContextSummary(context);
  const list = top
    .map(
      (r, i) =>
        `${i + 1}. <b>${r.name}</b>${r.cuisine ? ` <span class="recipe-cuisine">${r.cuisine}</span>` : ''}`,
    )
    .join('<br>');

  return `🍽️ I found <b>${scoredRecipes.length}</b> recipes matching ${summary}: <br><br>${list}<br><br><i>Pick a number, or add filters like "vegetarian" or "without garlic"!</i>`;
}

export function doRandom() {
  const recipes = getRecipes();
  if (recipes.length === 0) return '😕 No recipes loaded yet!';
  const r = recipes[Math.floor(Math.random() * recipes.length)];
  setLastRecipe(r);
  return `How about <b>${r.name}</b>? 🎉 <br><br>${formatRecipe(r)}`;
}

export function getResponse(raw) {
  const recipes = getRecipes();

  const input = correctTypos(raw);

  const chat = handleChitChat(input);
  if (chat) return chat;

  if (recipes.length === 0) {
    return '😕 My recipe book seems to be missing! Please try again in a moment.';
  }

  const pick = parseNumberedPick(input);
  if (pick !== null && getLastResults().length) {
    const results = getLastResults();
    if (pick < 0 || pick >= results.length) {
      return `\u{1F914} I only showed <b>${results.length}</b> results. Pick a number between 1 and ${results.length}!`;
    }
    const chosen = results[pick];
    if (chosen) {
      setLastRecipe(chosen);
      setLastResults([]);
      return formatRecipe(chosen);
    }
  }

  const fromLastResults = findRecipeFromLastResults(input, getLastResults());
  if (fromLastResults) {
    setLastRecipe(fromLastResults);
    setLastResults([]);
    return formatRecipe(fromLastResults);
  }

  const directRecipe = findRecipeMention(input, recipes);
  if (directRecipe) {
    setLastRecipe(directRecipe);
    setContext({
      cuisine: directRecipe.cuisine || null,
      ingredients: [],
      filters: [],
      excluded: [],
    });
    return formatRecipe(directRecipe);
  }

  const context = getContext();
  const followUp = handleFollowUp(input, getLastRecipe());
  if (followUp) return followUp;

  if (/^(another( one)?|next|more|again|show me (another|more)|one more)$/.test(input)) return doRandom();

  const rec = handleRecommendationIntent(input, recipes, context);
  if (rec) return rec;

  return handleSmartSearch(input, recipes, context);
}
