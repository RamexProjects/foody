document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    // --- 1. Event Listeners ---

    // Click Send Button
    sendBtn.addEventListener('click', sendMessage);

    // Press Enter Key
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // --- 2. Main Logic ---

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Display user message immediately
        addMessageToUI(text, 'user-message');
        userInput.value = '';

        // Create the "Cooking..." loading indicator
        const loadingId = showLoadingIndicator();

        // Get response from the JSON "Database"
        const botResponse = await getBotResponse(text);

        // Remove loading and "animate" the answer
        removeLoadingIndicator(loadingId);
        typeWriterEffect(botResponse);
    }

    // --- 3. AI & Data Logic ---

    async function getBotResponse(query) {
        // Artificial delay (1.5 seconds) to show the loading state
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            // Fetch your JSON file
            const response = await fetch('recipes.json');
            if (!response.ok) throw new Error("Could not load recipes.");
            
            const data = await response.json();
            const recipes = data.recipes;
            const input = query.toLowerCase();

            // Search logic: Check if any recipe name exists in the user's input
            const matchedRecipe = recipes.find(r => input.includes(r.name.toLowerCase()));

            if (matchedRecipe) {
                return `Here is a recipe for **${matchedRecipe.name}**:<br><br>${matchedRecipe.content}`;
            } else {
                // If no match, provide the "I'm sorry" message + suggestions
                const suggestions = recipes
                    .sort(() => 0.5 - Math.random()) // Shuffle
                    .slice(0, 4) // Pick 4
                    .map(r => `• ${r.name}`)
                    .join('<br>');

                return `I am sorry, I can only give you a food recipe. 😔<br><br>I can provide recipes for things like:<br>${suggestions}`;
            }
        } catch (error) {
            console.error(error);
            return "System Error: I can't find my recipe book.";
        }
    }

    // --- 4. UI Helper Functions ---

    function addMessageToUI(text, className) {
        const div = document.createElement('div');
        div.classList.add('message', className);
        div.innerHTML = text.replace(/\n/g, '<br>');
        chatBox.appendChild(div);
        scrollChat();
    }

    function showLoadingIndicator() {
        const id = 'load-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.id = id;
        loadingDiv.classList.add('loading-message');
        loadingDiv.innerText = 'Cooking your food... 🍳';
        chatBox.appendChild(loadingDiv);
        scrollChat();
        return id;
    }

    function removeLoadingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function typeWriterEffect(text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'bot-message');
        chatBox.appendChild(messageDiv);

        let i = 0;
        const speed = 25; // Milliseconds per character

        function type() {
            if (i < text.length) {
                // Check for HTML tags like <br> so they don't break the animation
                if (text.substring(i, i + 4) === '<br>') {
                    messageDiv.innerHTML += '<br>';
                    i += 4;
                } else {
                    messageDiv.innerHTML += text.charAt(i);
                    i++;
                }
                scrollChat();
                setTimeout(type, speed);
            }
        }
        type();
    }

    function scrollChat() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});