import { Injectable } from '@nestjs/common';
import { Prisma, TrailerStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateTrailerDto } from '../dto/create-trailer.dto';
import { ListTrailersQueryDto } from '../dto/list-trailers-query.dto';
import { UpdateTrailerDto } from '../dto/update-trailer.dto';
import { TrailerEntity } from '../entities/trailer.entity';

const trailerSelect = {
  id: true,
  truckId: true,
  plateNumber: true,
  brand: true,
  model: true,
  year: true,
  tonnage: true,
  status: true,
  truck: {
    select: {
      id: true,
      plateNumber: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TrailerSelect;

@Injectable()
export class TrailersRepository {
  constructor(private readonly prisma: PrismaService) {}

  health() {
    return { module: 'trailers', status: 'ready' };
  }

  async findMany(query: ListTrailersQueryDto): Promise<{
    data: TrailerEntity[];
    total: number;
  }> {
    const where = this.buildWhere(query);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.trailer.findMany({
        where,
        select: trailerSelect,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
      }),
      this.prisma.trailer.count({ where }),
    ]);

    return { data, total };
  }

  findById(id: string): Promise<TrailerEntity | null> {
    return this.prisma.trailer.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: trailerSelect,
    });
  }

  findByPlateNumber(plateNumber: string): Promise<TrailerEntity | null> {
    return this.prisma.trailer.findFirst({
      where: {
        plateNumber,
        deletedAt: null,
      },
      select: trailerSelect,
    });
  }

  truckExists(truckId: string): Promise<boolean> {
    return this.prisma.truck
      .count({
        where: {
          id: truckId,
          deletedAt: null,
        },
      })
      .then((count) => count > 0);
  }

  create(data: CreateTrailerDto): Promise<TrailerEntity> {
    return this.prisma.trailer.create({
      data: {
        ...data,
        status: data.status ?? TrailerStatus.AVAILABLE,
      },
      select: trailerSelect,
    });
  }

  update(id: string, data: UpdateTrailerDto): Promise<TrailerEntity> {
    return this.prisma.trailer.update({
      where: { id },
      data,
      select: trailerSelect,
    });
  }

  updateStatus(id: string, status: TrailerStatus): Promise<TrailerEntity> {
    return this.prisma.trailer.update({
      where: { id },
      data: { status },
      select: trailerSelect,
    });
  }

  softDelete(id: string): Promise<TrailerEntity> {
    return this.prisma.trailer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: TrailerStatus.INACTIVE,
      },
      select: trailerSelect,
    });
  }

  private buildWhere(query: ListTrailersQueryDto): Prisma.TrailerWhereInput {
    return {
      deletedAt: null,
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
      ...(query.truckId ? { truckId: query.truckId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
  }
}
