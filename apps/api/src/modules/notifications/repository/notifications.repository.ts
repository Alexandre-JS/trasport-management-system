import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { ListNotificationsQueryDto } from '../dto/list-notifications-query.dto';
import { NotificationEntity } from '../entities/notification.entity';

const notificationSelect = {
  id: true,
  userId: true,
  title: true,
  message: true,
  type: true,
  isRead: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NotificationSelect;

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  health() {
    return { module: 'notifications', status: 'ready' };
  }

  async findMany(
    userId: string,
    query: ListNotificationsQueryDto,
  ): Promise<{ data: NotificationEntity[]; total: number }> {
    const where = this.buildWhere(userId, query);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        select: notificationSelect,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total };
  }

  countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  findById(id: string): Promise<NotificationEntity | null> {
    return this.prisma.notification.findUnique({
      where: { id },
      select: notificationSelect,
    });
  }

  markAsRead(id: string): Promise<NotificationEntity> {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
      select: notificationSelect,
    });
  }

  markAllAsRead(userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  remove(id: string): Promise<NotificationEntity> {
    return this.prisma.notification.delete({
      where: { id },
      select: notificationSelect,
    });
  }

  private buildWhere(
    userId: string,
    query: ListNotificationsQueryDto,
  ): Prisma.NotificationWhereInput {
    return {
      userId,
      ...(query.isRead !== undefined ? { isRead: query.isRead } : {}),
      ...(query.type ? { type: query.type } : {}),
    };
  }
}
