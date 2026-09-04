const Product = require('../models/Product');
const { generateRecommendation, compareProducts } = require('../services/geminiService');

const getSmartRecommendation = async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) return res.status(400).json({ message: "Search query is required." });

        // 🔥 TOKEN SAVER 1: Extract keywords to search MongoDB first!
        // (e.g., "I want whey protein" -> searches for "whey" and "protein")
        const words = query.toLowerCase().split(' ').filter(w => w.length > 3);
        const regexPattern = words.join('|');

        // 🔥 TOKEN SAVER 2: Pre-filter the database and limit to 4 items!
        const inventoryQuery = words.length > 0 ? {
            stock: { $gt: 0 },
            $or: [
                { name: { $regex: regexPattern, $options: 'i' } },
                { category: { $regex: regexPattern, $options: 'i' } }
            ]
        } : { stock: { $gt: 0 } };

        let inventory = await Product.find(inventoryQuery)
            // Exclude long descriptions and _id to save thousands of tokens!
            .select('name price category attributes -_id')
            .limit(4);

        // Fallback: If no exact match, grab 3 random products so the AI isn't empty-handed
        if (inventory.length === 0) {
            inventory = await Product.find({ stock: { $gt: 0 } })
                .select('name price category attributes -_id')
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