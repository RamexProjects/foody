import { describe, it, expect, vi } from 'vitest';
import {
  correctTypos,
  normalizeInput,
  extractEntities,
  calculateScore,
  rand,
  getTimestamp,
} from '../js/nlp.js';

describe('correctTypos', () => {
  it('corrects known misspellings', () => {
    expect(correctTypos('desert')).toBe('dessert');
    expect(correctTypos('vegitarian')).toBe('vegetarian');
    expect(correctTypos('vegatarian')).toBe('vegetarian');
    expect(correctTypos('italin')).toBe('italian');
    expect(correctTypos('mexian')).toBe('mexican');
    expect(correctTypos('chineese')).toBe('chinese');
    expect(correctTypos('indain')).toBe('indian');
    expect(correctTypos('ethopian')).toBe('ethiopian');
    expect(correctTypos('garlec')).toBe('garlic');
    expect(correctTypos('onoin')).toBe('onion');
    expect(correctTypos('tomatos')).toBe('tomatoes');
    expect(correctTypos('potatos')).toBe('potatoes');
    expect(correctTypos('vegtable')).toBe('vegetable');
  });

  it('lowercases and trims the input', () => {
    expect(correctTypos('  HELLO  ')).toBe('hello');
    expect(correctTypos('Italian')).toBe('italian');
  });

  it('preserves punctuation around words', () => {
    expect(correctTypos('"desert"')).toBe('"dessert"');
  });

  it('does not change unknown words', () => {
    expect(correctTypos('chicken')).toBe('chicken');
    expect(correctTypos('pasta')).toBe('pasta');
  });

  it('handles multiple words with corrections', () => {
    expect(correctTypos('I want desert and vegitarian')).toBe('i want dessert and vegetarian');
  });
});

describe('normalizeInput', () => {
  it('removes conversational fillers', () => {
    expect(normalizeInput('show me italian')).toBe('italian');
    expect(normalizeInput('I want chicken')).toBe('chicken');
    expect(normalizeInput('give me something spicy')).toBe('something spicy');
    expect(normalizeInput("let's do mexican")).toBe('mexican');
  });

  it('collapses whitespace', () => {
    expect(normalizeInput('   too   many   spaces   ')).toBe('too many spaces');
  });

  it('lowercases the input', () => {
    expect(normalizeInput('HELLO WORLD')).toBe('hello world');
  });

  it('handles empty-ish input after filler removal', () => {
    expect(normalizeInput('show me')).toBe('');
  });

  it('removes multiple fillers in sequence', () => {
    expect(normalizeInput('can i have something looking for pasta')).toBe('something pasta');
  });
});

describe('extractEntities', () => {
  describe('cuisines', () => {
    it('detects cuisine mentions', () => {
      expect(extractEntities('italian food').cuisines).toContain('italian');
      expect(extractEntities('something from mexico').cuisines).toContain('mexican');
      expect(extractEntities('I love japan').cuisines).toContain('japanese');
      expect(extractEntities('thai food').cuisines).toContain('thai');
    });

    it('detects multiple cuisines', () => {
      const result = extractEntities('italian or mexican food');
      expect(result.cuisines).toContain('italian');
      expect(result.cuisines).toContain('mexican');
    });

    it('returns no cuisines for generic text', () => {
      expect(extractEntities('something tasty').cuisines).toEqual([]);
    });
  });

  describe('tags', () => {
    it('detects tag synonyms', () => {
      expect(extractEntities('something spicy').tags).toContain('spicy');
      expect(extractEntities('something sweet').tags).toContain('dessert');
      expect(extractEntities('quick recipe').tags).toContain('quick');
      expect(extractEntities('healthy food').tags).toContain('healthy');
    });

    it('detects vegetarian from meatless', () => {
      expect(extractEntities('meatless dinner').tags).toContain('vegetarian');
    });

    it('detects vegan from dairy-free', () => {
      expect(extractEntities('dairy free options').tags).toContain('vegan');
    });
  });

  describe('ingredients', () => {
    it('detects known ingredients', () => {
      expect(extractEntities('something with chicken').ingredients).toContain('chicken');
      expect(extractEntities('recipes with garlic and tomato').ingredients).toContain('garlic');
      expect(extractEntities('recipes with garlic and tomato').ingredients).toContain('tomato');
    });

    it('does not double-detect cuisine words as ingredients', () => {
      const result = extractEntities('thai curry');
      expect(result.ingredients).not.toContain('thai');
    });
  });

  describe('exclusions', () => {
    it('detects "without X" patterns', () => {
      expect(extractEntities('without garlic').excluded).toContain('garlic');
      expect(extractEntities('no onion please').excluded).toContain('onion');
    });

    it('detects "exclude X" patterns', () => {
      expect(extractEntities('exclude dairy').excluded).toContain('dairy');
    });

    it('handles multiple exclusions with commas', () => {
      const result = extractEntities('without garlic, onion');
      expect(result.excluded).toContain('garlic');
      expect(result.excluded).toContain('onion');
    });

    it('treats "and" as a terminator for exclusion groups', () => {
      // "and" terminates the capture, so only the first item is excluded
      const result = extractEntities('without garlic and tomato');
      expect(result.excluded).toContain('garlic');
      expect(result.excluded).not.toContain('tomato');
    });
  });
});

describe('calculateScore', () => {
  const baseRecipe = {
    name: 'Pasta Carbonara',
    cuisine: 'Italian',
    tags: ['italian', 'pasta', 'creamy', 'main'],
    content: '🛒<b>INGREDIENTS:</b><br>pasta, eggs, bacon, parmesan, garlic<br><br>👨 <b>INSTRUCTIONS:</b><br>cook pasta...',
  };

  it('gives +50 for matching cuisine', () => {
    const score = calculateScore(baseRecipe, {
      cuisine: 'italian',
      filters: [],
      ingredients: [],
      excluded: [],
    });
    expect(score).toBe(50);
  });

  it('returns -100 for non-matching cuisine', () => {
    const score = calculateScore(baseRecipe, {
      cuisine: 'mexican',
      filters: [],
      ingredients: [],
      excluded: [],
    });
    expect(score).toBe(-100);
  });

  it('gives +20 for matching filter tags', () => {
    const score = calculateScore(baseRecipe, {
      cuisine: null,
      filters: ['pasta'],
      ingredients: [],
      excluded: [],
    });
    expect(score).toBe(20);
  });

  it('penalizes -50 for missing critical tags (vegan, vegetarian, dessert)', () => {
    const score = calculateScore(baseRecipe, {
      cuisine: null,
      filters: ['vegan'],
      ingredients: [],
      excluded: [],
    });
    expect(score).toBe(-50);
  });

  it('gives +10 for matching ingredient in content', () => {
    const score = calculateScore(baseRecipe, {
      cuisine: null,
      filters: [],
      ingredients: ['garlic'],
      excluded: [],
    });
    expect(score).toBeGreaterThanOrEqual(10);
  });

  it('gives extra +5 for ingredient in the ingredients section (before instructions)', () => {
    const score = calculateScore(baseRecipe, {
      cuisine: null,
      filters: [],
      ingredients: ['pasta'],
      excluded: [],
    });
    expect(score).toBe(15);
  });

  it('penalizes -100 for excluded ingredient found in content', () => {
    const score = calculateScore(baseRecipe, {
      cuisine: null,
      filters: [],
      ingredients: [],
      excluded: ['bacon'],
    });
    expect(score).toBe(-100);
  });

  it('combines multiple scoring factors', () => {
    const score = calculateScore(baseRecipe, {
      cuisine: 'italian',
      filters: ['pasta', 'creamy'],
      ingredients: ['garlic'],
      excluded: [],
    });
    // +50 cuisine + 20 pasta + 20 creamy + 10 garlic + 5 garlic in ingredients section
    expect(score).toBe(105);
  });

  it('handles recipe with missing fields gracefully', () => {
    const emptyRecipe = { name: '', cuisine: '', tags: [], content: '' };
    const score = calculateScore(emptyRecipe, {
      cuisine: null,
      filters: [],
      ingredients: [],
      excluded: [],
    });
    expect(score).toBe(0);
  });
});

describe('rand', () => {
  it('returns null for empty array', () => {
    expect(rand([])).toBeNull();
  });

  it('returns null for null/undefined', () => {
    expect(rand(null)).toBeNull();
    expect(rand(undefined)).toBeNull();
  });

  it('returns the only element of a single-element array', () => {
    expect(rand(['only'])).toBe('only');
  });

  it('returns an element from the array', () => {
    const arr = ['a', 'b', 'c'];
    const result = rand(arr);
    expect(arr).toContain(result);
  });
});

describe('getTimestamp', () => {
  it('returns a string in HH:MM format', () => {
    const ts = getTimestamp();
    expect(ts).toMatch(/^\d{1,2}:\d{2}\s*(AM|PM)?$/i);
  });

  it('returns a consistent format', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T14:30:00'));
    const ts = getTimestamp();
    expect(ts).toMatch(/\d{1,2}:\d{2}/);
    vi.useRealTimers();
  });
});
