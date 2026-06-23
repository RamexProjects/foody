import { describe, it, expect, beforeEach } from 'vitest';
import {
  getState,
  setRecipes,
  getRecipes,
  setLastRecipe,
  getLastRecipe,
  setLastResults,
  getLastResults,
  getContext,
  setContext,
  resetContext,
  resetAll,
} from '../js/state.js';

describe('state', () => {
  beforeEach(() => {
    resetAll();
    setRecipes([]);
  });

  describe('recipes', () => {
    it('starts with an empty array', () => {
      expect(getRecipes()).toEqual([]);
    });

    it('stores and retrieves recipes', () => {
      const recipes = [{ name: 'Pasta' }, { name: 'Tacos' }];
      setRecipes(recipes);
      expect(getRecipes()).toBe(recipes);
      expect(getRecipes()).toHaveLength(2);
    });

    it('overwrites previous recipes', () => {
      setRecipes([{ name: 'A' }]);
      setRecipes([{ name: 'B' }, { name: 'C' }]);
      expect(getRecipes()).toHaveLength(2);
      expect(getRecipes()[0].name).toBe('B');
    });
  });

  describe('lastRecipe', () => {
    it('starts as null', () => {
      expect(getLastRecipe()).toBeNull();
    });

    it('stores and retrieves a recipe', () => {
      const recipe = { name: 'Doro Wat', cuisine: 'Ethiopian' };
      setLastRecipe(recipe);
      expect(getLastRecipe()).toBe(recipe);
    });

    it('can be set back to null', () => {
      setLastRecipe({ name: 'X' });
      setLastRecipe(null);
      expect(getLastRecipe()).toBeNull();
    });
  });

  describe('lastResults', () => {
    it('starts as an empty array', () => {
      expect(getLastResults()).toEqual([]);
    });

    it('stores and retrieves results', () => {
      const results = [{ name: 'A' }, { name: 'B' }];
      setLastResults(results);
      expect(getLastResults()).toBe(results);
    });
  });

  describe('context', () => {
    it('starts with default values', () => {
      const ctx = getContext();
      expect(ctx.cuisine).toBeNull();
      expect(ctx.ingredients).toEqual([]);
      expect(ctx.filters).toEqual([]);
      expect(ctx.excluded).toEqual([]);
    });

    it('sets and retrieves a full context', () => {
      const ctx = {
        cuisine: 'italian',
        ingredients: ['garlic', 'tomato'],
        filters: ['vegetarian'],
        excluded: ['onion'],
      };
      setContext(ctx);
      expect(getContext()).toBe(ctx);
    });

    it('resetContext restores defaults but keeps recipes and lastRecipe', () => {
      setRecipes([{ name: 'X' }]);
      setLastRecipe({ name: 'Y' });
      setContext({ cuisine: 'mexican', ingredients: ['beef'], filters: ['spicy'], excluded: ['garlic'] });

      resetContext();

      expect(getContext().cuisine).toBeNull();
      expect(getContext().ingredients).toEqual([]);
      expect(getRecipes()).toHaveLength(1);
      expect(getLastRecipe()).not.toBeNull();
    });
  });

  describe('resetAll', () => {
    it('clears lastRecipe, lastResults, and context but preserves recipes', () => {
      setRecipes([{ name: 'A' }]);
      setLastRecipe({ name: 'B' });
      setLastResults([{ name: 'C' }]);
      setContext({ cuisine: 'thai', ingredients: ['chicken'], filters: ['quick'], excluded: ['fish'] });

      resetAll();

      expect(getLastRecipe()).toBeNull();
      expect(getLastResults()).toEqual([]);
      expect(getContext().cuisine).toBeNull();
      expect(getContext().ingredients).toEqual([]);
      expect(getContext().filters).toEqual([]);
      expect(getContext().excluded).toEqual([]);
      expect(getRecipes()).toHaveLength(1);
    });
  });

  describe('getState', () => {
    it('returns the full state object', () => {
      const s = getState();
      expect(s).toHaveProperty('recipes');
      expect(s).toHaveProperty('lastRecipe');
      expect(s).toHaveProperty('lastResults');
      expect(s).toHaveProperty('context');
    });

    it('reflects mutations made through setters', () => {
      setRecipes([{ name: 'Z' }]);
      setLastRecipe({ name: 'Z' });
      const s = getState();
      expect(s.recipes[0].name).toBe('Z');
      expect(s.lastRecipe.name).toBe('Z');
    });
  });
});
