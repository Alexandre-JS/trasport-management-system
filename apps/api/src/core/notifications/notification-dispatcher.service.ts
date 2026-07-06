import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RealtimeGateway } from '../events/realtime.gateway';
import { AppLoggerService } from '../logger/app-logger.service';

export type NotificationPayload = {
  title: string;
  message: string;
  type?: NotificationType;
};

@Injectable()
export class NotificationDispatcherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: RealtimeGateway,
    private readonly logger: AppLoggerService,
  ) {}

  async notifyUser(userId: string, payload: NotificationPayload) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title: payload.title,
        message: payload.message,
        type: payload.type ?? NotificationType.INFO,
      },
    });

    this.gateway.publish('notification:created', {
      id: notification.id,
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt,
    });

    return notification;
  }

  async notifyRoles(roleNames: string[], payload: NotificationPayload) {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        role: { name: { in: roleNames } },
      },
      select: { id: true },
    });

    if (users.length === 0) {
      return { count: 0 };
    }

    const type = payload.type ?? NotificationType.INFO;
    const result = await this.prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        title: payload.title,
        message: payload.message,
        type,
      })),
    });

    this.gateway.publish('notification:created', {
      roles: roleNames,
      title: payload.title,
      message: payload.message,
      type,
    });

    this.logger.log(
      `Notification dispatched to roles [${roleNames.join(', ')}] (${result.count})`,
      NotificationDispatcherService.name,
    );

    return result;
  }
}
