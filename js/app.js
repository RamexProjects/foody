import { setRecipes, resetAll } from './state.js';
import { getResponse, doRandom } from './engine.js';
import { addMessage, showLoading, removeLoading, typeWriter, clearChat, removeChips } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById('chat-box');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const clearBtn = document.getElementById('clear-btn');

  fetch('recipes.json')
    .then((r) => r.json())
    .then((data) => {
      setRecipes(data.recipes || []);
    })
    .catch(() => {});

  function sendBotReply(responseFn) {
    const loadId = showLoading();
    setTimeout(() => {
      removeLoading(loadId);
      typeWriter(responseFn());
    }, 600);
  }

  function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;
    removeChips();
    addMessage(text, 'user');
    userInput.value = '';
    userInput.style.height = '46px';
    sendBotReply(() => getResponse(text));
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
      sendBotReply(() => doRandom());
      return;
    }
    userInput.value = q;
    sendMessage();
  });

  clearChat();
});
