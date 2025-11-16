const Product = require('../models/Product');

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
  try {
    const { 
      search, 
      category, 
      animeSeries, 
      minPrice, 
      maxPrice, 
      sort,
      page = 1,
      limit = 12 
    } = req.query;

    // Build query
    const query = { isActive: true };

    // Search by name, description, or anime series
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { animeSeries: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by anime series
    if (animeSeries) {
      query.animeSeries = { $regex: animeSeries, $options: 'i' };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Sorting
    let sortOption = {};
    if (sort === 'price-low') sortOption.price = 1;
    else if (sort === 'price-high') sortOption.price = -1;
    else if (sort === 'rating') sortOption.rating = -1;
    else if (sort === 'newest') sortOption.createdAt = -1;
    else sortOption.createdAt = -1; // Default: newest first

    // Pagination
    const skip = (page - 1) * limit;

    // Execute query
    const products = await Product.find(query)
      .sort(sortOption)
      .limit(Number(limit))
      .skip(skip);

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: Number(page),
      products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    if (!product.isActive) {
      return res.status(404).json({ 
        success: false,
        message: 'Product is not available' 
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid product ID' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      category,
      subCategory,
      animeSeries,
      characters,
      images,
      sizes,
      colors,
      stock,
      tags,
      isFeatured
    } = req.body;

    // Validation
    if (!name || !description || !price || !category || !animeSeries || !images || images.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields: name, description, price, category, animeSeries, and at least one image' 
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      discountPrice,
      category,
      subCategory,
      animeSeries,
      characters,
      images,
      sizes,
      colors,
      stock,
      tags,
      isFeatured: isFeatured || false
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Duplicate field value entered' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors 
      });
    }
    
    // Handle invalid ID format
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid product ID' 
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Duplicate field value entered' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    // Soft delete - just set isActive to false
    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    
    // Handle invalid ID format
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid product ID' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true })
      .limit(8)
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ 
      category: req.params.category,
      isActive: true 
    }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};