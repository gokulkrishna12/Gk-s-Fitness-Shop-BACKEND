const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateRecommendation = async (userPrompt, availableProducts) => {
    const prompt = `
User: "${userPrompt}"
Inventory: ${JSON.stringify(availableProducts)}

RULES:
1. You are GK's Fitness Shop AI.
2. If greeting, just say hi and ask how to help.
3. If asking for products, recommend 1 item from Inventory.
4. Keep it under 20 words. Be direct. NO markdown.
`;

    try {
        const response = await ai.models.generateContent({
            // 🔥 Locked to the only valid model for the new SDK
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                maxOutputTokens: 60
            }
        });
        return response.text;
    } catch (error) {
        console.error('Gemini AI Error:', error);
        // 🔥 This will print the REAL error for the 2.5 model if it fails!
        return `API Error (2.5-flash): ${error.message}`;
    }
};

const compareProducts = async (productA, productB, userGoal) => {
    const prompt = `Goal: "${userGoal}"\nA: ${JSON.stringify(productA)}\nB: ${JSON.stringify(productB)}\nRULE: Compare A and B for this goal in under 30 words. Be direct, no markdown.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { maxOutputTokens: 60 }
        });
        return response.text;
    } catch (error) {
        return `API Error (2.5-flash): ${error.message}`;
    }
};

module.exports = { generateRecommendation, compareProducts };