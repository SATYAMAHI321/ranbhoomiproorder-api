import { Request, Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import ExternalOrderTracking from '../models/ExternalOrderTracking';
import { generateTrackingId, generateActivationCode, calculateExpiryDate } from '../utils/trackingHelper';
import { sendOrderConfirmationEmail, sendStatusUpdateEmail } from '../utils/emailService';
import axios from 'axios';

/**
 * @route   GET /api/orders/track/:trackingId
 * @desc    Get order by tracking ID (public)
 * @access  Public
 */
export const trackOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId } = req.params;

    const order = await Order.findOne({ trackingId: trackingId.toUpperCase() })
      .populate('productId');

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res.json({ order });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private/Admin
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      productId,
      customerName,
      customerEmail,
      customerPhone,
      paymentAmount,
      paymentStatus,
    } = req.body;

    // Validate input
    if (!productId || !customerName || !customerEmail || !paymentAmount) {
      res.status(400).json({ message: 'Please provide all required fields' });
      return;
    }

    // Check if product exists
    const product = await Product.findById(productId);

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Generate tracking ID
    const trackingId = generateTrackingId();

    // Create order
    const order = await Order.create({
      trackingId,
      productId,
      customerName,
      customerEmail,
      customerPhone,
      paymentAmount,
      paymentStatus: paymentStatus || 'pending',
      status: 'pending',
    });

    // Send confirmation email
    try {
      await sendOrderConfirmationEmail(
        customerEmail,
        customerName,
        trackingId,
        product.name
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the order creation if email fails
    }

    const populatedOrder = await Order.findById(order._id).populate('productId');

    res.status(201).json({
      message: 'Order created successfully',
      order: populatedOrder,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/orders
 * @desc    Get all orders
 * @access  Private/Admin
 */
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, limit = '50', page = '1' } = req.query;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { trackingId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query)
      .populate('productId')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   PUT /api/orders/:id
 * @desc    Update order
 * @access  Private/Admin
 */
export const updateOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const order = await Order.findById(id).populate('productId');

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const oldStatus = order.status;

    // Update order fields
    Object.assign(order, updateData);

    // If status changed to activated or delivered, set delivery date and calculate expiry
    if ((order.status === 'activated' || order.status === 'delivered') && !order.deliveryDate) {
      order.deliveryDate = new Date();
      
      if (order.productId && typeof order.productId !== 'string') {
        const product = order.productId as any;
        order.expiryDate = calculateExpiryDate(product.validity);
      }

      // Generate activation code if not exists
      if (!order.activationCode) {
        order.activationCode = generateActivationCode();
      }
    }

    await order.save();

    // Send status update email if status changed
    if (oldStatus !== order.status && order.productId && typeof order.productId !== 'string') {
      try {
        const product = order.productId as any;
        await sendStatusUpdateEmail(
          order.customerEmail,
          order.customerName,
          order.trackingId,
          product.name,
          order.status,
          order.activationCode
        );
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }

    const updatedOrder = await Order.findById(id).populate('productId');

    res.json({
      message: 'Order updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   DELETE /api/orders/:id
 * @desc    Delete order
 * @access  Private/Admin
 */
export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/orders/stats
 * @desc    Get order statistics
 * @access  Private/Admin
 */
export const getOrderStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const activatedOrders = await Order.countDocuments({ status: 'activated' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const expiredOrders = await Order.countDocuments({ status: 'expired' });
    const failedOrders = await Order.countDocuments({ status: 'failed' });

    // Get total revenue
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$paymentAmount' } } },
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.json({
      stats: {
        totalOrders,
        pendingOrders,
        processingOrders,
        activatedOrders,
        deliveredOrders,
        expiredOrders,
        failedOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/orders/external
 * @desc    Get orders from external API (Ranbhoomi)
 * @access  Private/Admin
 */
export const getExternalOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const externalApiUrl = 'https://ranbhoomipro.in/api/allorders';
    
    // Fetch orders from external API
    const response = await axios.get(externalApiUrl, {
      timeout: 10000, // 10 second timeout
    });

    // Transform external API response to our format
    const externalOrders = response.data.all_orders?.map((order: any) => ({
      id: order.orders_id,
      orderNo: order.order_no,
      trackingId: order.tracking_id || 'N/A',
      productName: order.product_name,
      productImage: order.product_image,
      productPrice: parseFloat(order.product_price),
      customerName: order.name,
      customerEmail: order.address, // Email is in address field
      additionalInfo: order.add_info,
      status: mapExternalStatus(order.order_status),
      originalStatus: order.order_status,
      courierLink: order.courier_link,
      createdDate: order.created_date,
      memberId: order.member_id,
      source: 'external', // Mark as external order
    })) || [];

    res.json({
      orders: externalOrders,
      source: 'external',
      total: externalOrders.length,
    });
  } catch (error: any) {
    console.error('Get external orders error:', error.message);
    res.status(500).json({ 
      message: 'Failed to fetch external orders',
      error: error.message,
    });
  }
};

/**
 * Map external order status to our system status
 */
function mapExternalStatus(externalStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'Delivered': 'delivered',
    'Cancelled': 'cancelled',
    'Pending': 'pending',
    'Processing': 'processing',
    'Shipped': 'processing',
    'Hold': 'pending', // Hold status mapped to pending
    'Failed': 'failed',
  };
  
  return statusMap[externalStatus] || 'pending';
}

/**
 * @route   POST /api/orders/external/:orderId/generate-tracking
 * @desc    Generate tracking ID for external order in Hold status and save to DB
 * @access  Private/Admin
 */
export const generateTrackingForExternalOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { customerName, customerEmail, productName, productImage, productPrice, orderNo, originalStatus } = req.body;

    // Generate new tracking ID
    const trackingId = generateTrackingId();

    // Save to database
    const trackingRecord = await ExternalOrderTracking.create({
      externalOrderId: orderId,
      orderNo: orderNo || `ORD${orderId.padStart(5, '0')}`,
      trackingId,
      customerName,
      customerEmail,
      productName,
      productImage,
      productPrice: productPrice || 0,
      status: 'pending',
      originalStatus: originalStatus || 'Hold',
      createdDate: new Date(),
      lastUpdated: new Date(),
    });

    res.json({
      success: true,
      trackingId,
      orderId,
      message: 'Tracking ID generated and saved successfully',
      data: {
        trackingId,
        orderNo: trackingRecord.orderNo,
        customerName,
        customerEmail,
        productName,
        id: trackingRecord._id,
      },
    });
  } catch (error: any) {
    console.error('Generate tracking ID error:', error.message);
    res.status(500).json({ 
      message: 'Failed to generate tracking ID',
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/orders/external/:orderId/update-status
 * @desc    Update external order status and tracking info with delivery description
 * @access  Private/Admin
 */
export const updateExternalOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status, trackingId, notes, deliveryDescription, adminNotes } = req.body;

    // Find and update tracking record
    const trackingRecord = await ExternalOrderTracking.findOne({
      $or: [
        { externalOrderId: orderId },
        { trackingId: trackingId }
      ]
    });

    if (!trackingRecord) {
      res.status(404).json({ message: 'Tracking record not found' });
      return;
    }

    // Update fields
    if (status) trackingRecord.status = status;
    if (deliveryDescription) trackingRecord.deliveryDescription = deliveryDescription;
    if (adminNotes) trackingRecord.adminNotes = adminNotes;
    trackingRecord.lastUpdated = new Date();

    await trackingRecord.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId,
        trackingId: trackingRecord.trackingId,
        status: trackingRecord.status,
        deliveryDescription: trackingRecord.deliveryDescription,
        adminNotes: trackingRecord.adminNotes,
        updatedAt: trackingRecord.lastUpdated,
      },
    });
  } catch (error: any) {
    console.error('Update external order error:', error.message);
    res.status(500).json({ 
      message: 'Failed to update order status',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/orders/track/external/:trackingId
 * @desc    Track external order by generated tracking ID
 * @access  Public
 */
export const trackExternalOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId } = req.params;

    // First, try to find in our database
    const trackingRecord = await ExternalOrderTracking.findOne({ 
      trackingId: trackingId.toUpperCase() 
    });

    if (trackingRecord) {
      // Return from database with delivery description
      res.json({ 
        order: {
          trackingId: trackingRecord.trackingId,
          orderNo: trackingRecord.orderNo,
          productName: trackingRecord.productName,
          productImage: trackingRecord.productImage,
          status: trackingRecord.status,
          originalStatus: trackingRecord.originalStatus,
          customerName: trackingRecord.customerName,
          customerEmail: trackingRecord.customerEmail,
          additionalInfo: trackingRecord.additionalInfo,
          deliveryDescription: trackingRecord.deliveryDescription,
          adminNotes: trackingRecord.adminNotes,
          courierLink: trackingRecord.courierLink,
          createdDate: trackingRecord.createdDate,
          lastUpdated: trackingRecord.lastUpdated,
          productPrice: trackingRecord.productPrice,
          source: 'database',
        }
      });
      return;
    }

    // If not in database, try external API
    const externalApiUrl = 'https://ranbhoomipro.in/api/allorders';
    const response = await axios.get(externalApiUrl, {
      timeout: 10000,
    });

    // Find order with matching tracking ID
    const orders = response.data.all_orders || [];
    const order = orders.find((o: any) => 
      o.tracking_id && o.tracking_id.toUpperCase() === trackingId.toUpperCase()
    );

    if (!order) {
      res.status(404).json({ message: 'Order not found with this tracking ID' });
      return;
    }

    // Transform to our format
    const transformedOrder = {
      trackingId: order.tracking_id,
      orderNo: order.order_no,
      productName: order.product_name,
      productImage: order.product_image,
      status: mapExternalStatus(order.order_status),
      originalStatus: order.order_status,
      customerName: order.name,
      customerEmail: order.address,
      additionalInfo: order.add_info,
      courierLink: order.courier_link,
      createdDate: order.created_date,
      productPrice: parseFloat(order.product_price),
      source: 'external',
    };

    res.json({ order: transformedOrder });
  } catch (error: any) {
    console.error('Track external order error:', error.message);
    res.status(500).json({ 
      message: 'Failed to track order',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/orders/tracking/all
 * @desc    Get all tracking records
 * @access  Private/Admin
 */
export const getAllTrackingRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, limit = '50', page = '1' } = req.query;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { trackingId: { $regex: search, $options: 'i' } },
        { orderNo: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    const records = await ExternalOrderTracking.find(query)
      .sort({ lastUpdated: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await ExternalOrderTracking.countDocuments(query);

    res.json({
      records,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get tracking records error:', error.message);
    res.status(500).json({ 
      message: 'Failed to fetch tracking records',
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/orders/tracking/:id
 * @desc    Update tracking record
 * @access  Private/Admin
 */
export const updateTrackingRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, deliveryDescription, adminNotes } = req.body;

    const record = await ExternalOrderTracking.findById(id);

    if (!record) {
      res.status(404).json({ message: 'Tracking record not found' });
      return;
    }

    if (status) record.status = status;
    if (deliveryDescription !== undefined) record.deliveryDescription = deliveryDescription;
    if (adminNotes !== undefined) record.adminNotes = adminNotes;
    record.lastUpdated = new Date();

    await record.save();

    res.json({
      success: true,
      message: 'Tracking record updated successfully',
      record,
    });
  } catch (error: any) {
    console.error('Update tracking record error:', error.message);
    res.status(500).json({ 
      message: 'Failed to update tracking record',
      error: error.message,
    });
  }
};

/**
 * @route   DELETE /api/orders/tracking/:id
 * @desc    Delete tracking record permanently
 * @access  Private/Admin
 */
export const deleteTrackingRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const record = await ExternalOrderTracking.findByIdAndDelete(id);

    if (!record) {
      res.status(404).json({ message: 'Tracking record not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Tracking record deleted successfully',
      deletedRecordId: id,
      trackingId: record.trackingId,
      orderNo: record.orderNo,
    });
  } catch (error: any) {
    console.error('Delete tracking record error:', error.message);
    res.status(500).json({ 
      message: 'Failed to delete tracking record',
      error: error.message,
    });
  }
};
