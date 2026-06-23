import { getTimestamp } from './nlp.js';

const chatBox = document.getElementById('chat-box');

export function scrollChat() {
  chatBox.scrollTop = chatBox.scrollHeight;
}

function createMessageRow(type) {
  const row = document.createElement('div');
  row.className = `message-row ${type}`;

  const avatar = document.createElement('div');
  avatar.className = `message-avatar ${type}`;
  avatar.textContent = type === 'bot' ? '🍽' : '👤';

  const bubble = document.createElement('div');
  bubble.className = `message-bubble ${type}`;

  row.appendChild(avatar);
  row.appendChild(bubble);
  return { row, bubble };
}

export function removeChips() {
  document.querySelectorAll('.quick-replies').forEach((el) => el.remove());
}

export function addMessage(text, type) {
  const { row, bubble } = createMessageRow(type);
  bubble.innerHTML = text.replace(/\n/g, '<br>');

  const time = document.createElement('div');
  time.className = 'message-time';
  time.textContent = getTimestamp();

  chatBox.appendChild(row);
  chatBox.appendChild(time);
  scrollChat();
}

export function showLoading() {
  const id = 'load-' + Date.now();
  const { row, bubble } = createMessageRow('bot');
  row.className = 'loading-row';
  row.id = id;
  bubble.className = 'loading-bubble';
  bubble.innerHTML = `<span class="loading-text">Cooking</span><span class="loading-dots"><span></span><span></span><span></span></span>`;

  chatBox.appendChild(row);
  scrollChat();
  return id;
}

export function removeLoading(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

export function typeWriter(text) {
  if (!text) return;
  const { row, bubble } = createMessageRow('bot');

  chatBox.appendChild(row);
  scrollChat();

  let i = 0;
  const type = () => {
    if (i >= text.length) return;
    if (text[i] === '<') {
      const close = text.indexOf('>', i);
      if (close !== -1) {
        bubble.innerHTML += text.substring(i, close + 1);
        i = close + 1;
      } else {
        bubble.innerHTML += text[i++];
      }
    } else {
      bubble.innerHTML += text[i++];
    }
    scrollChat();
    setTimeout(type, 10);
  };
  type();

  const time = document.createElement('div');
  time.className = 'message-time';
  time.textContent = getTimestamp();
  chatBox.appendChild(time);
}

export function clearChat() {
  chatBox.innerHTML = '';

  const welcome = document.createElement('div');
  welcome.className = 'welcome-msg message-bubble bot';
  welcome.style.maxWidth = '100%';
  welcome.innerHTML =
    '👋 Hello! I\'m <b>Foody</b>, your smart recipe assistant. <br><br>Try asking for a dish, cuisine, or ingredient — or tap a suggestion below:';
  chatBox.appendChild(welcome);

  const chips = document.createElement('div');
  chips.className = 'quick-replies';
  chips.innerHTML = `
    <button class="chip" data-query="ethiopian">🇪🇹 Ethiopian</button>
    <button class="chip" data-query="italian">🇮🇹 Italian</button>
    <button class="chip" data-query="mexican">🇲🇽 Mexican</button>
    <button class="chip" data-query="indian">🇮🇳 Indian</button>
    <button class="chip" data-query="dessert">🍰 Dessert</button>
    <button class="chip" data-query="random">🎲 Surprise Me</button>
  `;
  chatBox.appendChild(chips);
  scrollChat();
}
