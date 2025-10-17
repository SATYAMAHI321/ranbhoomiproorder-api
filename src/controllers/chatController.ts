import { Request, Response } from 'express';
import Chat from '../models/Chat';

/**
 * @route   GET /api/chats/:trackingId
 * @desc    Get chat by tracking ID
 * @access  Public
 */
export const getChatByTrackingId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId } = req.params;

    let chat = await Chat.findOne({ trackingId: trackingId.toUpperCase() });

    if (!chat) {
      res.status(404).json({ message: 'Chat not found' });
      return;
    }

    res.json({ chat });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   POST /api/chats
 * @desc    Create or get chat
 * @access  Public
 */
export const createOrGetChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId, customerName, customerEmail } = req.body;

    if (!trackingId || !customerName) {
      res.status(400).json({ message: 'Please provide tracking ID and customer name' });
      return;
    }

    let chat = await Chat.findOne({ trackingId: trackingId.toUpperCase() });

    if (!chat) {
      chat = await Chat.create({
        trackingId: trackingId.toUpperCase(),
        customerName,
        customerEmail,
        messages: [],
      });
    }

    res.json({ chat });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/chats
 * @desc    Get all chats (admin)
 * @access  Private/Admin
 */
export const getAllChats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    const chats = await Chat.find(query).sort({ lastMessageAt: -1 });

    res.json({ chats });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   PUT /api/chats/:id/status
 * @desc    Update chat status
 * @access  Private/Admin
 */
export const updateChatStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ message: 'Please provide status' });
      return;
    }

    const chat = await Chat.findByIdAndUpdate(
      id,
      { status, isUnreadByAdmin: false },
      { new: true }
    );

    if (!chat) {
      res.status(404).json({ message: 'Chat not found' });
      return;
    }

    res.json({
      message: 'Chat status updated successfully',
      chat,
    });
  } catch (error) {
    console.error('Update chat status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   DELETE /api/chats/:id
 * @desc    Delete chat permanently
 * @access  Private/Admin
 */
export const deleteChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const chat = await Chat.findByIdAndDelete(id);

    if (!chat) {
      res.status(404).json({ message: 'Chat not found' });
      return;
    }

    res.json({ 
      message: 'Chat deleted successfully',
      deletedChatId: id,
      trackingId: chat.trackingId
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   PUT /api/chats/:id/read
 * @desc    Mark chat as read
 * @access  Private/Admin
 */
export const markChatAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const chat = await Chat.findByIdAndUpdate(
      id,
      { isUnreadByAdmin: false },
      { new: true }
    );

    if (!chat) {
      res.status(404).json({ message: 'Chat not found' });
      return;
    }

    res.json({ message: 'Chat marked as read', chat });
  } catch (error) {
    console.error('Mark chat as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
