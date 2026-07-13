import { Injectable } from '@nestjs/common';
import { DriverStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { ListDriversQueryDto } from '../dto/list-drivers-query.dto';
import { UpdateDriverDto } from '../dto/update-driver.dto';
import { DriverEntity } from '../entities/driver.entity';

const driverSelect = {
  id: true,
  userId: true,
  fullName: true,
  licenseNumber: true,
  phone: true,
  email: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DriverSelect;

@Injectable()
export class DriversRepository {
  constructor(private readonly prisma: PrismaService) {}

  health() {
    return { module: 'drivers', status: 'ready' };
  }

  async findMany(query: ListDriversQueryDto): Promise<{
    data: DriverEntity[];
    total: number;
  }> {
    const where = this.buildWhere(query);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.driver.findMany({
        where,
        select: driverSelect,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
      }),
      this.prisma.driver.count({ where }),
    ]);

    return { data, total };
  }

  findById(id: string): Promise<DriverEntity | null> {
    return this.prisma.driver.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: driverSelect,
    });
  }

  findByLicenseNumber(licenseNumber: string): Promise<DriverEntity | null> {
    return this.prisma.driver.findFirst({
      where: {
        licenseNumber,
        deletedAt: null,
      },
      select: driverSelect,
    });
  }

  findByUserId(userId: string): Promise<DriverEntity | null> {
    return this.prisma.driver.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
      select: driverSelect,
    });
  }

  userExists(userId: string): Promise<boolean> {
    return this.prisma.user
      .count({
        where: {
          id: userId,
          deletedAt: null,
          isActive: true,
        },
      })
      .then((count) => count > 0);
  }

  create(data: CreateDriverDto): Promise<DriverEntity> {
    return this.prisma.driver.create({
      data: {
        ...data,
        status: data.status ?? DriverStatus.AVAILABLE,
      },
      select: driverSelect,
    });
  }

  update(id: string, data: UpdateDriverDto): Promise<DriverEntity> {
    return this.prisma.driver.update({
      where: { id },
      data,
      select: driverSelect,
    });
  }

  updateStatus(id: string, status: DriverStatus): Promise<DriverEntity> {
    return this.prisma.driver.update({
      where: { id },
      data: { status },
      select: driverSelect,
    });
  }

  softDelete(id: string): Promise<DriverEntity> {
    return this.prisma.driver.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: DriverStatus.INACTIVE,
      },
      select: driverSelect,
    });
  }

  getHistory(id: string) {
    return this.prisma.driver.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        trips: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            currentStatus: true,
            departureDate: true,
            arrivalEstimate: true,
            arrivalDate: true,
            createdAt: true,
            cargo: {
              select: {
                id: true,
                code: true,
                origin: true,
                destination: true,
                status: true,
              },
            },
          },
        },
      },
    });
  }

  private buildWhere(query: ListDriversQueryDto): Prisma.DriverWhereInput {
    return {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search } },
              {
                licenseNumber: {
                  contains: query.search,
                },
              },
              { email: { contains: query.search } },
              { phone: { contains: query.search } },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
    };
  }
}
