const Product = require('../models/Product');
const { generateRecommendation } = require('../services/geminiService');

const getSmartRecommendation = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ message: "Search query is required." });

        // 🔥 1. Fetch all in-stock names (Very fast, no DB regex crashes!)
        const allProducts = await Product.find({ stock: { $gt: 0 } }).select('name price -_id');

        // 🔥 2. Strip weird symbols (like ?) so they don't break the search
        const cleanQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        const words = cleanQuery.split(' ').filter(w => w.length > 2);

        // 🔥 3. Filter using Pure JavaScript (100% Bulletproof)
        let inventory = allProducts.filter(product => {
            const pName = product.name.toLowerCase();
            // If the product name contains ANY of the words the user typed, keep it!
            return words.some(word => pName.includes(word));
        });

        // 4. Fallback: If they just say "hi" or search fails, grab 3 random items
        if (inventory.length === 0) {
            inventory = allProducts.slice(0, 3);
        } else {
            // Send max 4 items to AI to keep token costs extremely low
            inventory = inventory.slice(0, 4);
        }

        const aiResponse = await generateRecommendation(query, inventory);
        res.status(200).json({ recommendation: aiResponse });

    } catch (error) {
        console.error("AI Controller Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getSmartRecommendation };