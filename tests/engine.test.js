import { describe, it, expect, beforeEach } from 'vitest';
import { getResponse, doRandom } from '../js/engine.js';
import {
  setRecipes,
  getLastRecipe,
  getLastResults,
  getContext,
  setContext,
  setLastRecipe,
  setLastResults,
  resetAll,
} from '../js/state.js';

const SAMPLE_RECIPES = [
  {
    name: 'Pasta Carbonara',
    cuisine: 'Italian',
    tags: ['italian', 'pasta', 'creamy', 'main', 'quick'],
    content: '🛒<b>INGREDIENTS:</b><br>pasta, eggs, bacon, parmesan, garlic<br><br>👨 <b>INSTRUCTIONS:</b><br>cook pasta, mix with eggs and bacon<br><br>⏱ Prep: 10 min | Cook: 20 min',
    time: '30 minutes',
  },
  {
    name: 'Margherita Pizza',
    cuisine: 'Italian',
    tags: ['italian', 'vegetarian', 'main'],
    content: '🛒<b>INGREDIENTS:</b><br>dough, mozzarella, tomato, basil<br><br>👨 <b>INSTRUCTIONS:</b><br>roll dough, add toppings, bake<br><br>⏱ Prep: 15 min | Cook: 12 min',
    time: '27 minutes',
  },
  {
    name: 'Tacos al Pastor',
    cuisine: 'Mexican',
    tags: ['mexican', 'pork', 'main', 'spicy'],
    content: '🛒<b>INGREDIENTS:</b><br>pork, pineapple, onion, cilantro, corn tortillas<br><br>👨 <b>INSTRUCTIONS:</b><br>marinate pork, grill, serve in tortillas<br><br>⏱ Prep: 30 min | Cook: 20 min',
    time: '50 minutes',
  },
  {
    name: 'Doro Wat',
    cuisine: 'Ethiopian',
    tags: ['ethiopian', 'chicken', 'stew', 'spicy', 'main'],
    content: '🛒<b>INGREDIENTS:</b><br>chicken, onion, berbere spice, garlic, ginger, eggs<br><br>👨 <b>INSTRUCTIONS:</b><br>slow cook chicken in berbere sauce<br><br>⏱ Prep: 20 min | Cook: 60 min',
    time: '80 minutes',
  },
  {
    name: 'Chocolate Cake',
    cuisine: 'American',
    tags: ['american', 'dessert', 'sweet', 'baking'],
    content: '🛒<b>INGREDIENTS:</b><br>flour, sugar, cocoa, eggs, butter, milk, vanilla<br><br>👨 <b>INSTRUCTIONS:</b><br>mix dry, mix wet, combine, bake<br><br>⏱ Prep: 15 min | Cook: 35 min',
    time: '50 minutes',
  },
  {
    name: 'Green Salad',
    cuisine: 'American',
    tags: ['american', 'vegetarian', 'vegan', 'healthy', 'quick', 'salad'],
    content: '🛒<b>INGREDIENTS:</b><br>lettuce, spinach, avocado, tomato, lemon, olive oil<br><br>👨 <b>INSTRUCTIONS:</b><br>wash greens, chop, toss with dressing<br><br>⏱ Prep: 10 min | Cook: 0 min',
    time: '10 minutes',
  },
];

describe('engine', () => {
  beforeEach(() => {
    resetAll();
    setRecipes(SAMPLE_RECIPES);
  });

  describe('doRandom', () => {
    it('returns a recipe from the loaded set', () => {
      const result = doRandom();
      expect(result).toContain('How about');
      expect(result).toContain('🎉');
    });

    it('returns error message when no recipes loaded', () => {
      setRecipes([]);
      expect(doRandom()).toBe('😕 No recipes loaded yet!');
    });

    it('sets lastRecipe', () => {
      doRandom();
      expect(getLastRecipe()).not.toBeNull();
      expect(SAMPLE_RECIPES).toContainEqual(getLastRecipe());
    });
  });

  describe('getResponse — chit-chat', () => {
    it('responds to greetings', () => {
      const result = getResponse('hello');
      expect(result).toMatch(/Hello|Hey/);
    });

    it('responds to "hi"', () => {
      const result = getResponse('hi');
      expect(result).toMatch(/Hello|Hey/);
    });

    it('responds to thanks', () => {
      const result = getResponse('thanks');
      expect(result).toContain('welcome');
    });

    it('responds to goodbye', () => {
      const result = getResponse('bye');
      expect(result).toContain('Goodbye');
    });

    it('responds to help', () => {
      const result = getResponse('help');
      expect(result).toContain('Foody');
      expect(result).toContain('Cuisines');
    });

    it('responds to "what cuisines" with a summary', () => {
      const result = getResponse('what cuisines do you have');
      expect(result).toContain('Italian');
      expect(result).toContain('Mexican');
    });

    it('responds to "surprise me" with a random recipe', () => {
      const result = getResponse('surprise me');
      expect(result).toContain('How about');
    });
  });

  describe('getResponse — no recipes loaded', () => {
    it('returns error when recipes are empty', () => {
      setRecipes([]);
      const result = getResponse('italian');
      expect(result).toContain('recipe book seems to be missing');
    });
  });

  describe('getResponse — numbered pick', () => {
    it('selects a recipe by number from lastResults', () => {
      setLastResults([SAMPLE_RECIPES[0], SAMPLE_RECIPES[1]]);
      const result = getResponse('1');
      expect(result).toContain('Pasta Carbonara');
      expect(getLastRecipe().name).toBe('Pasta Carbonara');
    });

    it('selects by ordinal word', () => {
      setLastResults([SAMPLE_RECIPES[0], SAMPLE_RECIPES[1]]);
      const result = getResponse('second');
      expect(result).toContain('Margherita Pizza');
    });

    it('falls through to smart search if no lastResults', () => {
      setLastResults([]);
      const result = getResponse('1');
      // Falls through to smart search, which returns a "not found" message
      expect(result).toContain("couldn't find");
    });
  });

  describe('getResponse — direct recipe mention', () => {
    it('finds a recipe by exact name', () => {
      const result = getResponse('Doro Wat');
      expect(result).toContain('Doro Wat');
      expect(getLastRecipe().name).toBe('Doro Wat');
    });

    it('finds a recipe by partial name (case insensitive)', () => {
      const result = getResponse('show me pasta carbonara');
      expect(result).toContain('Pasta Carbonara');
    });

    it('sets context cuisine from matched recipe', () => {
      getResponse('Tacos al Pastor');
      expect(getContext().cuisine).toBe('Mexican');
    });
  });

  describe('getResponse — follow-ups', () => {
    it('answers "how long" after viewing a recipe', () => {
      // First look up a recipe to set lastRecipe via normal flow
      getResponse('Pasta Carbonara');
      expect(getLastRecipe().name).toBe('Pasta Carbonara');
      const result = getResponse('how long');
      expect(result).toContain('Pasta Carbonara');
      expect(result).toContain('30 minutes');
    });

    it('shows recipe again on "repeat"', () => {
      getResponse('Tacos al Pastor');
      expect(getLastRecipe().name).toBe('Tacos al Pastor');
      const result = getResponse('repeat');
      expect(result).toContain('Tacos al Pastor');
    });

    it('does not crash when no lastRecipe and query has time words', () => {
      // Without setting lastRecipe, "how long" falls through to smart search
      const result = getResponse('how long does it take');
      expect(result).toBeDefined();
    });
  });

  describe('getResponse — "another" pattern', () => {
    it('gives a random recipe on "another one"', () => {
      const result = getResponse('another one');
      expect(result).toContain('How about');
    });

    it('gives a random recipe on "more"', () => {
      const result = getResponse('more');
      expect(result).toContain('How about');
    });
  });

  describe('getResponse — recommendation intent', () => {
    it('recommends a dessert when asked', () => {
      const result = getResponse('recommend a dessert');
      expect(result).toContain('Chocolate Cake');
    });

    it('recommends within a cuisine context', () => {
      setContext({ cuisine: 'italian', ingredients: [], filters: [], excluded: [] });
      const result = getResponse('any suggestions');
      // Should be one of the Italian recipes
      expect(result).toMatch(/Pasta Carbonara|Margherita Pizza/);
    });

    it('returns not-found message for impossible combos', () => {
      setContext({ cuisine: 'ethiopian', ingredients: [], filters: [], excluded: [] });
      const result = getResponse('recommend a dessert');
      expect(result).toContain("don't have any");
    });
  });

  describe('getResponse — smart search', () => {
    it('searches by cuisine', () => {
      const result = getResponse('italian');
      expect(result).toContain('Italian');
      // Should show at least Pasta Carbonara and Margherita Pizza
      expect(result).toContain('Pasta Carbonara');
      expect(result).toContain('Margherita Pizza');
    });

    it('searches by tag', () => {
      const result = getResponse('spicy food');
      expect(result).toMatch(/Tacos al Pastor|Doro Wat/);
    });

    it('applies ingredient filter', () => {
      const result = getResponse('something with chicken');
      expect(result).toContain('Doro Wat');
    });

    it('applies exclusion filter', () => {
      const result = getResponse('italian without garlic');
      // Pasta Carbonara has garlic, so Margherita Pizza should rank higher
      expect(result).toContain('Margherita Pizza');
    });

    it('updates context on modifiers', () => {
      getResponse('italian');
      expect(getContext().cuisine).toBe('italian');

      getResponse('vegetarian ones');
      expect(getContext().filters).toContain('vegetarian');
      expect(getContext().cuisine).toBe('italian');
    });

    it('returns not-found message for impossible searches', () => {
      const result = getResponse('klingon recipes');
      expect(result).toContain("couldn't find");
    });
  });

  describe('getResponse — typo correction integration', () => {
    it('corrects typos and still finds results', () => {
      const result = getResponse('italin');
      expect(result).toContain('Italian');
    });

    it('corrects "desert" to "dessert" and finds results', () => {
      const result = getResponse('any desert recommendation');
      expect(result).toContain('Chocolate Cake');
    });
  });

  describe('getResponse — recipe from last results', () => {
    it('selects a recipe by name from lastResults', () => {
      setLastResults([SAMPLE_RECIPES[0], SAMPLE_RECIPES[1], SAMPLE_RECIPES[2]]);
      const result = getResponse('make the Margherita Pizza');
      expect(result).toContain('Margherita Pizza');
      expect(getLastRecipe().name).toBe('Margherita Pizza');
    });
  });
});
