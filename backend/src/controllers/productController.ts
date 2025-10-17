import { Request, Response } from 'express';
import Product from '../models/Product';
import axios from 'axios';

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Public
 */
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, isActive, search } = req.query;

    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { platform: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private/Admin
 */
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      platform,
      description,
      price,
      validity,
      features,
      category,
      image,
    } = req.body;

    // Validate input
    if (!name || !platform || !description || !price || !validity) {
      res.status(400).json({ message: 'Please provide all required fields' });
      return;
    }

    const product = await Product.create({
      name,
      platform,
      description,
      price,
      validity,
      features: features || [],
      category: category || 'streaming',
      image: image || '',
    });

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private/Admin
 */
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Private/Admin
 */
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/products/external
 * @desc    Get products from external API (Ranbhoomi)
 * @access  Public
 */
export const getExternalProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const externalApiUrl = 'https://ranbhoomipro.in/api/products';
    
    // Fetch products from external API
    const response = await axios.get(externalApiUrl, {
      timeout: 10000, // 10 second timeout
    });

    // Transform external API response to our format
    const externalProducts = response.data.product?.map((product: any) => ({
      id: product.product_id,
      name: product.product_name,
      platform: 'Amazon', // Default platform based on API
      description: product.product_short_description || product.product_description?.replace(/<\/?p>/g, ''),
      price: parseFloat(product.product_selling_price || product.product_actual_price),
      actualPrice: parseFloat(product.product_actual_price),
      image: product.product_image,
      isActive: product.product_status === '1',
      category: 'other',
      validity: 365, // Default validity
      features: [],
      source: 'external', // Mark as external product
      createdAt: product.date_created,
    })) || [];

    res.json({
      products: externalProducts,
      source: 'external',
      total: externalProducts.length,
    });
  } catch (error: any) {
    console.error('Get external products error:', error.message);
    res.status(500).json({ 
      message: 'Failed to fetch external products',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/products/all
 * @desc    Get all products (local + external combined)
 * @access  Public
 */
export const getAllProductsCombined = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, isActive, search, includeExternal } = req.query;

    // Fetch local products
    const query: any = {};
    if (category) {
      query.category = category;
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { platform: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const localProducts = await Product.find(query).sort({ createdAt: -1 });
    
    // Transform local products to match format
    const localProductsList = localProducts.map(product => ({
      id: product._id,
      name: product.name,
      platform: product.platform,
      description: product.description,
      price: product.price,
      actualPrice: product.price,
      image: product.image,
      isActive: product.isActive,
      category: product.category,
      validity: product.validity,
      features: product.features,
      source: 'local',
      createdAt: product.createdAt,
    }));

    // Fetch external products if requested
    let externalProducts: any[] = [];
    if (includeExternal === 'true') {
      try {
        const externalApiUrl = 'https://ranbhoomipro.in/api/products';
        const response = await axios.get(externalApiUrl, { timeout: 5000 });
        
        externalProducts = response.data.product?.map((product: any) => ({
          id: `ext_${product.product_id}`,
          name: product.product_name,
          platform: 'Amazon',
          description: product.product_short_description || product.product_description?.replace(/<\/?p>/g, ''),
          price: parseFloat(product.product_selling_price || product.product_actual_price),
          actualPrice: parseFloat(product.product_actual_price),
          image: product.product_image,
          isActive: product.product_status === '1',
          category: 'other',
          validity: 365,
          features: [],
          source: 'external',
          createdAt: product.date_created,
        })) || [];
      } catch (externalError) {
        console.error('Failed to fetch external products:', externalError);
        // Continue without external products
      }
    }

    // Combine products
    const allProducts = [...localProductsList, ...externalProducts];

    res.json({
      products: allProducts,
      local: localProductsList.length,
      external: externalProducts.length,
      total: allProducts.length,
    });
  } catch (error) {
    console.error('Get all products combined error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
