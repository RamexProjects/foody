const CORRECTIONS = {
  desert: 'dessert',
  vegitarian: 'vegetarian',
  vegatarian: 'vegetarian',
  vegtable: 'vegetable',
  italin: 'italian',
  mexian: 'mexican',
  chineese: 'chinese',
  indain: 'indian',
  ethopian: 'ethiopian',
  garlec: 'garlic',
  onoin: 'onion',
  tomatos: 'tomatoes',
  potatos: 'potatoes',
};

const CONVERSATIONAL_FILLERS = [
  'i want',
  "i'm feeling",
  'i am feeling',
  'am feeling',
  'maybe',
  'lets do',
  "let's do",
  'how about',
  'show me',
  'give me',
  'can i have',
  "i'd like",
  'i would like',
  'looking for',
  'search for',
  'find me',
  'get me',
  'what about',
  'can you make',
  'do you have',
  'i need',
  'can i get',
  'i crave',
  'craving',
];

const KNOWN_INGREDIENTS = new Set([
  'chicken', 'beef', 'lamb', 'pork', 'veal', 'turkey', 'duck', 'bacon', 'sausage', 'meat',
  'rice', 'pasta', 'noodles', 'bread', 'flour', 'cornmeal', 'teff', 'barley', 'wheat', 'oats', 'quinoa', 'hominy', 'masa',
  'garlic', 'onion', 'tomato', 'potato', 'carrot', 'celery', 'pepper', 'bell pepper', 'jalapeno', 'chili', 'chilies',
  'egg', 'eggs', 'milk', 'cream', 'cheese', 'parmesan', 'mozzarella', 'cheddar', 'feta', 'ricotta', 'butter', 'yogurt', 'ghee',
  'oil', 'olive oil', 'sesame oil', 'vinegar', 'soy sauce', 'fish sauce', 'tamarind',
  'fish', 'shrimp', 'salmon', 'tuna', 'crab', 'mussels', 'clams', 'seafood', 'tilapia',
  'spinach', 'cabbage', 'lettuce', 'broccoli', 'zucchini', 'eggplant', 'mushroom', 'mushrooms', 'peas', 'beans', 'lentils', 'chickpeas', 'corn',
  'lemon', 'lime', 'apple', 'mango', 'avocado', 'coconut', 'banana', 'berries',
  'sugar', 'salt', 'honey', 'chocolate', 'vanilla', 'cinnamon', 'cumin', 'turmeric', 'ginger', 'cardamom', 'cilantro', 'basil', 'parsley', 'mint', 'oregano', 'thyme', 'rosemary', 'saffron',
]);

const CUISINE_MAP = {
  italian: ['italy', 'italian'],
  mexican: ['mexico', 'mexican', 'tex-mex'],
  indian: ['india', 'indian'],
  ethiopian: ['ethiopia', 'ethiopian'],
  japanese: ['japan', 'japanese'],
  chinese: ['china', 'chinese'],
  thai: ['thailand', 'thai'],
  french: ['france', 'french'],
  greek: ['greece', 'greek'],
  spanish: ['spain', 'spanish'],
  korean: ['korea', 'korean'],
  vietnamese: ['vietnam', 'vietnamese'],
  'middle eastern': ['middle east', 'middle eastern', 'mediterranean'],
  american: ['america', 'american', 'usa', 'us'],
  british: ['britain', 'british', 'uk', 'english'],
};

const TAG_SYNONYMS = {
  spicy: ['hot', 'fiery', 'chili', 'heat', 'pepper', 'spiced'],
  quick: ['fast', 'easy', 'simple', '30 minutes', 'quickly'],
  dessert: ['sweet', 'cake', 'treat', 'pastry', 'pudding', 'sweets'],
  vegetarian: ['veggie', 'meatless', 'plant-based', 'no meat'],
  vegan: ['plant-based', 'dairy-free', 'no dairy'],
  creamy: ['rich', 'cheesy', 'dairy', 'milk', 'cream', 'cheese', 'alfredo'],
  comforting: ['hearty', 'warm', 'rich', 'stew', 'soup', 'bake', 'comfort'],
  healthy: ['light', 'fresh', 'diet', 'low calorie', 'salad', 'clean'],
  breakfast: ['morning', 'brunch'],
  dinner: ['supper', 'evening'],
  seafood: ['fish', 'shrimp', 'crab', 'ocean', 'salmon', 'tuna'],
  pasta: ['noodles', 'spaghetti', 'macaroni', 'carbs'],
};

export function correctTypos(text) {
  return text
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((w) => {
      const match = w.match(/^([^a-z0-9]*)([a-z0-9]+)([^a-z0-9]*)$/i);
      if (match) {
        const pre = match[1];
        const word = match[2].toLowerCase();
        const post = match[3];
        return pre + (CORRECTIONS[word] || word) + post;
      }
      return w;
    })
    .join(' ');
}

export function normalizeInput(text) {
  let result = text.toLowerCase();
  CONVERSATIONAL_FILLERS.forEach((p) => {
    result = result.replace(new RegExp(`\\b${p}\\b`, 'g'), ' ');
  });
  return result.replace(/\s+/g, ' ').trim();
}

export function extractEntities(text) {
  const lower = text.toLowerCase();
  const words = lower.split(/[\s,.!?]+/).filter((w) => w.length > 1);
  const entities = { cuisines: [], tags: [], ingredients: [], excluded: [] };

  Object.entries(CUISINE_MAP).forEach(([canonical, synonyms]) => {
    synonyms.forEach((syn) => {
      if (new RegExp(`\\b${syn}\\b`).test(lower)) {
        if (!entities.cuisines.includes(canonical)) {
          entities.cuisines.push(canonical);
        }
      }
    });
  });

  const excludeRegex = /\b(without|no|exclude|except|allergic to|hate|don't want|dont want|free of)\b\s+([a-z\s,]+?)(?:\b(?:and|or|but|in|on|with|please)\b|$)/g;
  let match;
  while ((match = excludeRegex.exec(lower)) !== null) {
    const excludedItems = match[2]
      .split(/,|\band\b|\bor\b/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);
    entities.excluded.push(...excludedItems);
  }

  if (lower.includes('meatless') || lower.includes('no meat')) entities.tags.push('vegetarian');
  if (lower.includes('dairy free') || lower.includes('no dairy')) entities.tags.push('vegan');

  Object.entries(TAG_SYNONYMS).forEach(([canonical, synonyms]) => {
    if (new RegExp(`\\b(${canonical}|${synonyms.join('|')})\\b`).test(lower)) {
      if (!entities.tags.includes(canonical)) entities.tags.push(canonical);
    }
  });

  const allExtractedWords = new Set([...entities.cuisines, ...entities.tags, ...entities.excluded]);
  words.forEach((w) => {
    const clean = w.replace(/s$/, '');
    if ((KNOWN_INGREDIENTS.has(clean) || KNOWN_INGREDIENTS.has(w)) && !allExtractedWords.has(w) && !allExtractedWords.has(clean)) {
      if (!entities.ingredients.includes(clean)) entities.ingredients.push(clean);
    }
  });

  return entities;
}

export function calculateScore(r, ctx) {
  let score = 0;
  const content = (r.content || '').toLowerCase();
  const name = (r.name || '').toLowerCase();
  const tags = normalizeTags(r);
  const cuisine = (r.cuisine || '').toLowerCase();

  if (ctx.cuisine) {
    if (cuisine.includes(ctx.cuisine) || ctx.cuisine.includes(cuisine)) {
      score += 50;
    } else {
      return -100;
    }
  }

  ctx.filters.forEach((tag) => {
    const hasTag = tags.includes(tag) || content.includes(tag) || name.includes(tag);
    if (hasTag) score += 20;
    else {
      if (['vegan', 'vegetarian', 'dessert'].includes(tag)) score -= 50;
      else score -= 10;
    }
  });

  ctx.ingredients.forEach((ing) => {
    if (content.includes(ing)) {
      score += 10;
      if (content.split('instructions')[0].includes(ing)) score += 5;
    } else score -= 5;
  });

  ctx.excluded.forEach((ex) => {
    if (content.includes(ex)) score -= 100;
  });

  return score;
}

const BASE_STOPWORDS = ['lets', "let's", 'do', 'make', 'cook', 'want', 'have', 'show', 'give', 'me', 'some', 'the', 'a', 'an', 'please', 'thanks', 'then', 'now'];

export function cleanInputForMatching(input, extraStopwords = []) {
  const allStopwords = [...BASE_STOPWORDS, ...extraStopwords];
  const pattern = new RegExp(`\\b(${allStopwords.join('|')})\\b`, 'g');
  const clean = normalizeInput(input)
    .replace(pattern, '')
    .replace(/[?.!,]/g, '')
    .trim();
  return clean.length < 3 ? null : clean;
}

export function matchRecipeByName(clean, recipe) {
  if (!recipe.name) return false;
  const name = recipe.name.toLowerCase();
  return clean === name || clean.includes(name) || name.includes(clean);
}

export function normalizeTags(recipe) {
  return (recipe.tags || []).map((t) => t.toLowerCase());
}

export function rand(arr) {
  return arr && arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;
}

export function getTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
