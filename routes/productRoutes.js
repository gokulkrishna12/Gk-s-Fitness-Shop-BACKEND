// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  createProductReview,
  deleteProductReview,
  deleteProduct
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, admin, upload.array('images', 5), createProduct)
  .get(getProducts);

router.route('/:id')
  .get(getProductById)
  .put(protect, admin, upload.array('images', 5), updateProduct)
  .delete(protect, admin, deleteProduct);

router.route('/:id/reviews')
  .post(protect, upload.single('image'), createProductReview);

router.route('/:id/reviews/:reviewId')
  .delete(protect, deleteProductReview);

module.exports = router;