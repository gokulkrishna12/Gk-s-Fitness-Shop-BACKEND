const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateRecommendation = async (userPrompt, availableProducts) => {
    const prompt = `
        You are a friendly, expert AI fitness coach for GK's Fitness Shop.
        User Message: "${userPrompt}"
        
        Inventory available: ${JSON.stringify(availableProducts)}

        RULES:
        1. If the user says a simple greeting (like "hi" or "hello"), reply with a warm greeting and ask how you can help. DO NOT list products yet.
        2. If they ask about products, recommend 1 or 2 items from the Inventory in full, conversational sentences.
        3. DO NOT use markdown symbols like ** or -. Talk like a normal human in plain text.
        4. Keep your entire response under 40 words.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash', // 🔥 Fixed to the correct, lightning-fast model
            contents: prompt,
            config: {
                temperature: 0.7
                // 🔥 Removed maxOutputTokens completely so it NEVER chops words again!
            }
        });
        return response.text;
    } catch (error) {
        console.error('Gemini AI Error:', error);
        return "I'm having a little trouble connecting right now! How can I help you today?";
    }
};

const compareProducts = async (productA, productB, userGoal) => {
    // Keeping your compare function safe too!
    const prompt = `Goal: "${userGoal}"\nA: ${JSON.stringify(productA)}\nB: ${JSON.stringify(productB)}\nRULE: Compare A and B for this goal in under 40 words. Be direct, no markdown.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: { temperature: 0.5 }
        });
        return response.text;
    } catch (error) {
        return "Sorry, I can't compare these right now!";
    }
};

module.exports = { generateRecommendation, compareProducts };