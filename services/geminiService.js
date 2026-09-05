const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateRecommendation = async (userPrompt, availableProducts) => {
    const prompt = `
User: "${userPrompt}"
Full Store Inventory: ${JSON.stringify(availableProducts)}

RULES:
1. You are GK's Fitness Shop AI.
2. Search the "Full Store Inventory" carefully. If the user asks for whey, find the item with "Whey" in the name.
3. Recommend the exact matching product from the inventory and tell them the price.
4. Keep it under 30 words. Be direct. NO markdown.
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: {
                temperature: 0.1 // 🔥 Ultra-low temperature so it doesn't hallucinate or guess
            }
        });
        return response.text;
    } catch (error) {
        return `API Error: ${error.message}`;
    }
};

const compareProducts = async (productA, productB, userGoal) => {
    const prompt = `Goal: "${userGoal}"\nA: ${JSON.stringify(productA)}\nB: ${JSON.stringify(productB)}\nRULE: Compare A and B for this goal in under 30 words. Be direct, no markdown.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: { temperature: 0.1 }
        });
        return response.text;
    } catch (error) {
        return `API Error: ${error.message}`;
    }
};

module.exports = { generateRecommendation, compareProducts };