const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2; // Require it to use our global config

// 🔥 THE SPEED FIX: A magic function that blasts all images to Cloudinary simultaneously!
const uploadImagesInParallel = async (files) => {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map(file => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'gks_fitness_products',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [{ width: 800, height: 800, crop: 'limit' }]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      // Pipe the fast RAM buffer directly to Cloudinary
      stream.end(file.buffer);
    });
  });

  // Promise.all runs all uploads at the exact same time!
  return await Promise.all(uploadPromises);
};


// @desc    Fetch all products
// @route   GET /api/products
const getProducts = async (req, res) => {
  try {
    const keyword = req.query.keyword
      ? { name: { $regex: req.query.keyword, $options: 'i' } }
      : {};
    const products = await Product.find({ ...keyword });
    res.json(products);
  } catch (error) {
    console.error("Fetch Products Error:", error);
    res.status(500).json({ message: 'Server Error while fetching products' });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error("Fetch Product By ID Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const { name, price, description, category, countInStock, stock } = req.body;

    // 🔥 PARALLEL UPLOAD ACTIVATED
    let uploadedImageUrls = [];
    if (req.files && req.files.length > 0) {
      uploadedImageUrls = await uploadImagesInParallel(req.files);
    } else {
      uploadedImageUrls = ['https://via.placeholder.com/300x300?text=No+Image'];
    }

    const finalStock = countInStock !== undefined ? countInStock : (stock || 0);

    const product = new Product({
      name,
      price,
      user: req.user._id,
      images: uploadedImageUrls,
      image: uploadedImageUrls[0], // fallback single image field
      category,
      countInStock: Number(finalStock),
      stock: Number(finalStock),
      description
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = req.body.name || product.name;
      product.price = req.body.price || product.price;
      product.description = req.body.description || product.description;
      product.category = req.body.category || product.category;

      const newStock = req.body.stock !== undefined ? req.body.stock : req.body.countInStock;
      if (newStock !== undefined) {
        product.stock = Number(newStock);
        product.countInStock = Number(newStock);
      }

      // 🔥 PARALLEL UPLOAD FOR UPDATES
      if (req.files && req.files.length > 0) {
        const newImages = await uploadImagesInParallel(req.files);
        product.images = newImages;
        product.image = newImages[0];
      }

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create product review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        return res.status(400).json({ message: 'Product already reviewed' });
      }

      // 🔥 PARALLEL UPLOAD FOR REVIEW IMAGES (Wraps single file in array)
      let reviewImage = '';
      if (req.file) {
        const urls = await uploadImagesInParallel([req.file]);
        reviewImage = urls[0];
      }

      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        image: reviewImage,
        user: req.user._id,
      };

      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).json({ message: 'Review added' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error("Review Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a review
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private
const deleteProductReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      const reviewIndex = product.reviews.findIndex(
        (r) => r._id.toString() === req.params.reviewId.toString()
      );

      if (reviewIndex === -1) {
        return res.status(404).json({ message: 'Review not found' });
      }

      if (
        product.reviews[reviewIndex].user.toString() !== req.user._id.toString() &&
        !req.user.isAdmin
      ) {
        return res.status(403).json({ message: 'Not authorized to delete this review' });
      }

      product.reviews.splice(reviewIndex, 1);
      product.numReviews = product.reviews.length;
      product.rating = product.reviews.length > 0
        ? product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length
        : 0;

      await product.save();
      res.json({ message: 'Review removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error("Delete Review Error:", error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  createProductReview,
  deleteProductReview,
  deleteProduct
};