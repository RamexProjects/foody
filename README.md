# 🍽️ Foody — AI Recipe Assistant

**Foody** is a modern, context-aware chatbot that helps you discover recipes from around the world. Ask for a dish, browse by cuisine, filter by ingredients or dietary preferences — Foody remembers your conversation and refines results as you go.

> 🧠 Built with vanilla JavaScript, no frameworks or build tools required.

---

## Features

- **🗣️ Conversational Search** — Ask naturally: *"Show me Italian"*, *"Vegetarian ones"*, *"Make it without garlic"*
- **🌍 150+ Recipes** — Ethiopian, Italian, Mexican, Indian, Chinese, Japanese, Thai, French, Korean, Vietnamese, American + more
- **🧠 Contextual Memory** — Foody remembers your cuisine, filters, and exclusions across messages
- **✏️ Auto-Correction** — Knows what you mean even with typos (*"desert"* → *"dessert"*)
- **🏷️ Smart Filters** — Filter by meal type, dietary preference, cooking time, or ingredient
- **🎲 Surprise Me** — Get a random recipe when you can't decide
- **⚡ Quick Replies** — Tap cuisine chips to browse instantly
- **📱 Mobile-First** — Responsive design, works great on any screen

---

## Getting Started

### 1. Clone or download

```bash
git clone <repo-url> foody
cd foody
```

### 2. Serve locally

Since Foody uses ES modules (`type="module"`), you need a local HTTP server — not `file://`:

```bash
# Python 3
python3 -m http.server 8000

# Node (npx)
npx serve .
```

### 3. Open in browser

```
http://localhost:8000
```

---

## Usage Guide

| What to say | Example |
|---|---|
| Browse cuisine | `"italian"`, `"mexican"`, `"ethiopian"` |
| Specific dish | `"Show me Doro Wat"` |
| Dietary filter | `"Vegetarian ones"`, `"Only vegan"` |
| Ingredient | `"Something with chicken"` |
| Exclusions | `"Make it without onions"` |
| Recommendation | `"Any dessert recommendation?"` |
| Follow-up | `"How long does it take?"`, `"Show it again"` |
| Surprise | `"Surprise me"`, `"Random"` |
| Help | `"Help"`, `"What can you do?"` |

---

## Project Structure

```
foody/
├── index.html          # Entry point
├── recipes.json        # Recipe database (150+ recipes)
├── css/
│   ├── base.css        # Reset, custom properties, body/html
│   ├── layout.css      # Chat container, header, input area
│   ├── components.css  # Messages, chips, loading, recipe cards
│   └── animations.css  # Keyframes & transitions
├── js/
│   ├── app.js          # Entry point — event listeners, init
│   ├── state.js        # Central state management
│   ├── nlp.js          # NLP utilities: corrections, entities, scoring
│   ├── engine.js       # Response routing & search logic
│   └── ui.js           # DOM manipulation helpers
└── README.md
```

### Architecture

| Module | Responsibility |
|---|---|
| `state.js` | Manages recipes, context, last results |
| `nlp.js` | Typo correction, entity extraction, scoring |
| `engine.js` | Chit-chat, smart search, recommendation intent |
| `ui.js` | Message rendering, typing animation, loading states |
| `app.js` | Glues everything together, handles events |

---

## Customizing Recipes

Edit `recipes.json`. Each recipe follows this structure:

```json
{
  "name": "Doro Wat",
  "cuisine": "Ethiopian",
  "tags": ["ethiopian", "chicken", "stew", "spicy", "main"],
  "content": "🛒 <b>INGREDIENTS:</b><br>...<br><br>👨‍🍳 <b>INSTRUCTIONS:</b><br>...<br><br>━━━━━━━━━━━━━━<br>⏱️ Prep: ... | Cook: ... | 🍴 Servings: ..."
}
```

---

## Technical Details

- **ES Modules** — Code is split into import/export modules for clean separation of concerns
- **Zero Dependencies** — No frameworks, no build tools, no npm install
- **CSS Custom Properties** — Easy theming via `:root` variables in `base.css`
- **Local-First** — All data lives in `recipes.json`, no backend needed
- **Typing Animation** — Character-by-character bot response rendering

---

## Roadmap

- [ ] Voice input support
- [ ] Recipe scaling (adjust serving sizes)
- [ ] Shopping list generation
- [ ] Multi-language support
- [ ] Save favorite recipes

---

## License

MIT
