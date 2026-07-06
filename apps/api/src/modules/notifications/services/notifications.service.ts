import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { ListNotificationsQueryDto } from '../dto/list-notifications-query.dto';
import { NotificationsRepository } from '../repository/notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly logger: AppLoggerService,
  ) {}

  health() {
    return this.notificationsRepository.health();
  }

  async findAll(userId: string, query: ListNotificationsQueryDto) {
    const { data, total } = await this.notificationsRepository.findMany(
      userId,
      query,
    );
    const unread = await this.notificationsRepository.countUnread(userId);

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        unread,
      },
    };
  }

  async unreadCount(userId: string) {
    const unread = await this.notificationsRepository.countUnread(userId);

    return { unread };
  }

  async markAsRead(userId: string, id: string) {
    await this.ensureOwnership(userId, id);

    return this.notificationsRepository.markAsRead(id);
  }

  async markAllAsRead(userId: string) {
    const result = await this.notificationsRepository.markAllAsRead(userId);

    this.logger.log(
      `Notifications marked as read for user ${userId} (${result.count})`,
      NotificationsService.name,
    );

    return { updated: result.count };
  }

  async remove(userId: string, id: string) {
    await this.ensureOwnership(userId, id);

    return this.notificationsRepository.remove(id);
  }

  private async ensureOwnership(userId: string, id: string) {
    const notification = await this.notificationsRepository.findById(id);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Notification does not belong to this user');
    }

    return notification;
  }
}
