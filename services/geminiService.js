const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateRecommendation = async (userPrompt, availableProducts) => {
    // 🔥 TOKEN SAVER 3: Strict Prompting. Tell the AI to shut up and be concise.
    const prompt = `
        You are an expert AI fitness coach for GK's Fitness Shop.
        User: "${userPrompt}"
        
        Inventory: ${JSON.stringify(availableProducts)}

        RULES:
        1. Recommend 1-2 products ONLY from the provided inventory.
        2. Keep the response extremely concise (Under 50 words).
        3. Use bullet points for the products.
        4. Do NOT include generic greetings or fluff. Be direct.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            // 🔥 TOKEN SAVER 4: The Hard Config Limit!
            config: {
                maxOutputTokens: 100, // Forces the AI to stop generating after ~75 words
                temperature: 0.5      // Lower temperature makes it more direct and less creative/rambling
            }
        });
        return response.text;
    } catch (error) {
        console.error('Gemini AI Error:', error);
        throw new Error(`Google API Error: ${error.message}`);
    }
};

const compareProducts = async (productA, productB, userGoal) => {
    const prompt = `
        Goal: "${userGoal}"
        A: ${JSON.stringify(productA)}
        B: ${JSON.stringify(productB)}

        RULE: Compare A and B for this goal in under 40 words. Be direct.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: {
                maxOutputTokens: 80, // Hard limit for comparisons
                temperature: 0.5
            }
        });
        return response.text;
    } catch (error) {
        console.error('Gemini AI Error:', error);
        throw new Error(`Google API Error: ${error.message}`);
    }
};

module.exports = { generateRecommendation, compareProducts };