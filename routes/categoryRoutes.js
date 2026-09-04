const express = require('express');
const router = express.Router();
const { createCategory, getCategories } = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category (Admin Only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Protein Supplements"
 *               description:
 *                 type: string
 *                 example: "Whey, Casein, and Plant-based proteins"
 *     responses:
 *       201:
 *         description: Category created
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.route('/').post(protect, admin, createCategory).get(getCategories);

module.exports = router;