const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 🔥 BULLETPROOF TRICK: The Auto-Fallback List
// It will try these one by one until your specific API key accepts one.
const validModels = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-pro'
];

const generateRecommendation = async (userPrompt, availableProducts) => {
    const prompt = `
User: "${userPrompt}"
Inventory: ${JSON.stringify(availableProducts)}
RULES:
1. You are GK's Fitness Shop AI.
2. If greeting, just say hi and ask how to help.
3. If asking for products, recommend 1 item from Inventory.
4. Keep it under 20 words. Be direct. NO markdown.`;

    let lastError = "";

    // Loop through the models until one works
    for (const modelName of validModels) {
        try {
            const response = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: { temperature: 0.3, maxOutputTokens: 60 }
            });
            return response.text; // Success! Return immediately!
        } catch (error) {
            console.log(`Skipping ${modelName} - not supported by this API key...`);
            lastError = error.message;
        }
    }

    // If absolutely every model fails, print the final error
    return `Backend Error: All models failed. Last error: ${lastError}`;
};

const compareProducts = async (productA, productB, userGoal) => {
    const prompt = `Goal: "${userGoal}"\nA: ${JSON.stringify(productA)}\nB: ${JSON.stringify(productB)}\nRULE: Compare A and B for this goal in under 30 words. Be direct, no markdown.`;

    let lastError = "";
    for (const modelName of validModels) {
        try {
            const response = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: { temperature: 0.3, maxOutputTokens: 60 }
            });
            return response.text;
        } catch (error) {
            lastError = error.message;
        }
    }
    return `Backend Error: ${lastError}`;
};

module.exports = { generateRecommendation, compareProducts };