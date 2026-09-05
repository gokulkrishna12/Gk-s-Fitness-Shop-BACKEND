const generateRecommendation = async (userPrompt, availableProducts) => {
    // 🧠 Let the AI be conversational but still concise!
    const prompt = `
        You are a friendly, expert AI fitness coach for GK's Fitness Shop.
        User: "${userPrompt}"
        
        Inventory available: ${JSON.stringify(availableProducts)}

        RULES:
        1. If the user is just saying greeting you (like "hi" or "hello"), greet them warmly and ask how you can help them achieve their fitness goals.
        2. If they are asking for products or advice, recommend 1-2 items from the Inventory and briefly explain why it helps.
        3. Keep the response natural and conversational, but under 60 words.
    `;

    try {
        const response = await ai.models.generateContent({
            // Note: If you get a model error later, make sure to use 'gemini-2.5-flash' or 'gemini-1.5-flash'
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: {
                // Increased to 200 so it doesn't chop off words like "100g, Citrus"
                maxOutputTokens: 200,
                temperature: 0.7 // Slightly more creative so it sounds human
            }
        });
        return response.text;
    } catch (error) {
        console.error('Gemini AI Error:', error);
        throw new Error(`Google API Error: ${error.message}`);
    }
};