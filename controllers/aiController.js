const Product = require('../models/Product');
const { generateRecommendation } = require('../services/geminiService');

const getSmartRecommendation = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ message: "Search query is required." });

        // 🔥 Filter out filler words so they don't mess up the regex search
        const ignoreWords = ['what', 'which', 'have', 'price', 'tell', 'show', 'you', 'are'];
        const words = query.toLowerCase().split(' ').filter(w => w.length > 2 && !ignoreWords.includes(w));
        const regexPattern = words.join('|');

        // 🔥 FIX: Only search 'name'. Searching an ObjectId (category) with regex breaks Mongoose!
        const inventoryQuery = words.length > 0 ? {
            stock: { $gt: 0 },
            name: { $regex: regexPattern, $options: 'i' }
        } : { stock: { $gt: 0 } };

        let inventory = await Product.find(inventoryQuery)
            .select('name price attributes -_id')
            .limit(5);

        // Fallback if absolutely no match is found
        if (inventory.length === 0) {
            inventory = await Product.find({ stock: { $gt: 0 } })
                .select('name price -_id')
                .limit(3);
        }

        const aiResponse = await generateRecommendation(query, inventory);
        res.status(200).json({ recommendation: aiResponse });

    } catch (error) {
        console.error("AI Controller Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getSmartRecommendation };