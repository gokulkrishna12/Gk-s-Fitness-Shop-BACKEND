const Product = require('../models/Product');
const { generateRecommendation } = require('../services/geminiService');

const getSmartRecommendation = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ message: "Search query is required." });

        // 🔥 BULLETPROOF FIX: Stop filtering! Grab ALL products and let Gemini do the searching.
        const allProducts = await Product.find().select('name price');

        const aiResponse = await generateRecommendation(query, allProducts);
        res.status(200).json({ recommendation: aiResponse });

    } catch (error) {
        console.error("AI Controller Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getSmartRecommendation };