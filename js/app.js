import { setRecipes, resetAll } from './state.js';
import { getResponse, doRandom } from './engine.js';
import { addMessage, showLoading, removeLoading, typeWriter, clearChat, removeChips } from './ui.js';

const LOAD_ERROR_MSG = '\u{1F61E} I couldn\'t load my recipe book. Please refresh the page to try again.';

document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById('chat-box');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const clearBtn = document.getElementById('clear-btn');

  fetch('recipes.json')
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load recipes (HTTP ${r.status})`);
      return r.json();
    })
    .then((data) => {
      if (!data || !Array.isArray(data.recipes)) {
        throw new Error('Invalid recipe data: expected { recipes: [...] }');
      }
      setRecipes(data.recipes);
    })
    .catch((err) => {
      console.error('Recipe loading failed:', err);
      addMessage(LOAD_ERROR_MSG, 'bot');
    });

  function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;
    removeChips();
    addMessage(text, 'user');
    userInput.value = '';
    userInput.style.height = '46px';

    const loadId = showLoading();
    setTimeout(() => {
      removeLoading(loadId);
      try {
        typeWriter(getResponse(text));
      } catch (err) {
        console.error('Error generating response:', err);
        addMessage('\u{1F61E} Something went wrong. Please try again!', 'bot');
      }
    }, 600);
  }

  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
  });

  clearBtn.addEventListener('click', () => {
    resetAll();
    clearChat();
  });

  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const q = chip.dataset.query;
    if (q === 'random') {
      removeChips();
      addMessage('🎲 Surprise me!', 'user');
      const loadId = showLoading();
      setTimeout(() => {
        removeLoading(loadId);
        try {
          typeWriter(doRandom());
        } catch (err) {
          console.error('Error generating random recipe:', err);
          addMessage('\u{1F61E} Something went wrong. Please try again!', 'bot');
        }
      }, 600);
      return;
    }
    userInput.value = q;
    sendMessage();
  });

  clearChat();
});
