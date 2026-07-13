import { Injectable } from '@nestjs/common';
import { Prisma, TruckStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateTruckDto } from '../dto/create-truck.dto';
import { ListTrucksQueryDto } from '../dto/list-trucks-query.dto';
import { UpdateTruckDto } from '../dto/update-truck.dto';
import { TruckEntity } from '../entities/truck.entity';

const truckSelect = {
  id: true,
  plateNumber: true,
  brand: true,
  model: true,
  year: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TruckSelect;

@Injectable()
export class TrucksRepository {
  constructor(private readonly prisma: PrismaService) {}

  health() {
    return { module: 'trucks', status: 'ready' };
  }

  async findMany(query: ListTrucksQueryDto): Promise<{
    data: TruckEntity[];
    total: number;
  }> {
    const where = this.buildWhere(query);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.truck.findMany({
        where,
        select: truckSelect,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
      }),
      this.prisma.truck.count({ where }),
    ]);

    return { data, total };
  }

  findById(id: string): Promise<TruckEntity | null> {
    return this.prisma.truck.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: truckSelect,
    });
  }

  findByPlateNumber(plateNumber: string): Promise<TruckEntity | null> {
    return this.prisma.truck.findFirst({
      where: {
        plateNumber,
        deletedAt: null,
      },
      select: truckSelect,
    });
  }

  create(data: CreateTruckDto): Promise<TruckEntity> {
    return this.prisma.truck.create({
      data: {
        ...data,
        status: data.status ?? TruckStatus.AVAILABLE,
      },
      select: truckSelect,
    });
  }

  update(id: string, data: UpdateTruckDto): Promise<TruckEntity> {
    return this.prisma.truck.update({
      where: { id },
      data,
      select: truckSelect,
    });
  }

  updateStatus(id: string, status: TruckStatus): Promise<TruckEntity> {
    return this.prisma.truck.update({
      where: { id },
      data: { status },
      select: truckSelect,
    });
  }

  softDelete(id: string): Promise<TruckEntity> {
    return this.prisma.truck.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: TruckStatus.INACTIVE,
      },
      select: truckSelect,
    });
  }

  private buildWhere(query: ListTrucksQueryDto): Prisma.TruckWhereInput {
    return {
      deletedAt: null,
      ...(query.withoutTrailer
        ? { trailers: { none: { deletedAt: null } } }
        : {}),
      ...(query.search
        ? {
            OR: [
              {
                plateNumber: {
                  contains: query.search,
                },
              },
              { brand: { contains: query.search } },
              { model: { contains: query.search } },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
    };
  }
}
