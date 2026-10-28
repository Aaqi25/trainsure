import { NotificationModel, INotification, UserModel } from '../models/index.ts';
import { sendEmailNotification } from './emailService.ts';

export async function createNotification(params: {
  recipientId: string;
  type: INotification['type'];
  title: string;
  message: string;
  link?: string;
}): Promise<INotification> {
  const notif = await NotificationModel.create({
    recipientId: params.recipientId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link,
    read: false,
    createdAt: new Date().toISOString(),
  });

  // Attempt email delivery if user has email
  try {
    const user = await UserModel.findById(params.recipientId);
    if (user && user.email) {
      sendEmailNotification(
        user.email,
        `[TrainSure Alert] ${params.title}`,
        params.message
      ).catch(() => {});
    }
  } catch (e) {
    // non-blocking
  }

  return notif;
}
