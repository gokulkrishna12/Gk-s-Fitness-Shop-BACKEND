const Category = require('../models/Category');

const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const categoryExists = await Category.findOne({ name });

        if (categoryExists) return res.status(400).json({ message: 'Category already exists' });

        const category = await Category.create({ name, description });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({});
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createCategory, getCategories };