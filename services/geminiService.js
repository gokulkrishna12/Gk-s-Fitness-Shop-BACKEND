const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateRecommendation = async (userPrompt, availableProducts) => {
    // 🔥 Ultra-short prompt saves input tokens and processing time
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
            model: 'gemini-1.5-flash', // Fastest standard model
            contents: prompt,
            config: {
                temperature: 0.3, // Lower temp = faster response, less rambling
                maxOutputTokens: 60 // 🔥 Hard limit to save output tokens
            }
        });
        return response.text;
    } catch (error) {
        console.error('Gemini AI Error:', error);
        // 🔥 This will print the EXACT error on your screen so we can fix it!
        return `Backend Error: ${error.message}`;
    }
};

const compareProducts = async (productA, productB, userGoal) => {
    const prompt = `Goal: "${userGoal}"\nA: ${JSON.stringify(productA)}\nB: ${JSON.stringify(productB)}\nRULE: Compare A and B for this goal in under 30 words. Be direct, no markdown.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: { temperature: 0.3, maxOutputTokens: 60 }
        });
        return response.text;
    } catch (error) {
        return `Backend Error: ${error.message}`;
    }
};

module.exports = { generateRecommendation, compareProducts };