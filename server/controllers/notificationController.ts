import { Response, NextFunction } from 'express';
import { NotificationModel } from '../models/index.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';

export async function getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const recipientId = req.user!._id;
    const notifs = await NotificationModel.find({ recipientId });

    // Sort descending by creation date
    notifs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const unreadCount = notifs.filter(n => !n.read).length;

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved',
      data: {
        unreadCount,
        notifications: notifs,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const notif = await NotificationModel.findById(id);
    if (!notif) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }

    if (notif.recipientId !== req.user!._id) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    const updated = await NotificationModel.findByIdAndUpdate(id, { read: true });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const recipientId = req.user!._id;
    await NotificationModel.updateMany({ recipientId }, { read: true });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: null,
    });
  } catch (err) {
    next(err);
  }
}
