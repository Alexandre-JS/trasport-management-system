import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateBorderDto } from '../dto/create-border.dto';
import { ListBordersQueryDto } from '../dto/list-borders-query.dto';
import { UpdateBorderDto } from '../dto/update-border.dto';
import { BorderEntity } from '../entities/border.entity';

const borderSelect = {
  id: true,
  name: true,
  countryA: true,
  countryB: true,
  lat: true,
  lng: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BorderSelect;

@Injectable()
export class BordersRepository {
  constructor(private readonly prisma: PrismaService) {}

  health() {
    return { module: 'borders', status: 'ready' };
  }

  async findMany(query: ListBordersQueryDto): Promise<{
    data: BorderEntity[];
    total: number;
  }> {
    const where = this.buildWhere(query);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.border.findMany({
        where,
        select: borderSelect,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
      }),
      this.prisma.border.count({ where }),
    ]);

    return { data, total };
  }

  findById(id: string): Promise<BorderEntity | null> {
    return this.prisma.border.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: borderSelect,
    });
  }

  findByName(name: string): Promise<BorderEntity | null> {
    return this.prisma.border.findFirst({
      where: {
        name,
        deletedAt: null,
      },
      select: borderSelect,
    });
  }

  create(data: CreateBorderDto): Promise<BorderEntity> {
    return this.prisma.border.create({
      data,
      select: borderSelect,
    });
  }

  update(id: string, data: UpdateBorderDto): Promise<BorderEntity> {
    return this.prisma.border.update({
      where: { id },
      data,
      select: borderSelect,
    });
  }

  softDelete(id: string): Promise<BorderEntity> {
    return this.prisma.border.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
      select: borderSelect,
    });
  }

  private buildWhere(query: ListBordersQueryDto): Prisma.BorderWhereInput {
    return {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search } },
              { countryA: { contains: query.search } },
              { countryB: { contains: query.search } },
            ],
          }
        : {}),
      ...(query.active === undefined ? {} : { isActive: query.active }),
    };
  }
}
