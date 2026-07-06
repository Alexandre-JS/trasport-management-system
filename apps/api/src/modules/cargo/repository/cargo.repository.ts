import { Injectable } from '@nestjs/common';
import { CargoStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateCargoDto } from '../dto/create-cargo.dto';
import { ListCargoQueryDto } from '../dto/list-cargo-query.dto';
import { UpdateCargoDto } from '../dto/update-cargo.dto';
import { CargoEntity } from '../entities/cargo.entity';

const cargoSelect = {
  id: true,
  clientId: true,
  code: true,
  description: true,
  weightKg: true,
  volumeM3: true,
  origin: true,
  destination: true,
  pickupDate: true,
  expectedDelivery: true,
  status: true,
  observations: true,
  client: {
    select: {
      id: true,
      companyName: true,
    },
  },
  trips: {
    where: { deletedAt: null },
    select: {
      id: true,
      currentStatus: true,
      departureDate: true,
      arrivalEstimate: true,
      arrivalDate: true,
      loadedDate: true,
      currentPosition: true,
      border: true,
      driver: {
        select: {
          id: true,
          fullName: true,
        },
      },
      truck: {
        select: {
          id: true,
          plateNumber: true,
        },
      },
      trailer: {
        select: {
          id: true,
          plateNumber: true,
        },
      },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CargoSelect;

@Injectable()
export class CargoRepository {
  constructor(private readonly prisma: PrismaService) {}

  health() {
    return { module: 'cargo', status: 'ready' };
  }

  async findMany(query: ListCargoQueryDto): Promise<{
    data: CargoEntity[];
    total: number;
  }> {
    const where = this.buildWhere(query);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.cargo.findMany({
        where,
        select: cargoSelect,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
      }),
      this.prisma.cargo.count({ where }),
    ]);

    return { data, total };
  }

  findById(id: string): Promise<CargoEntity | null> {
    return this.prisma.cargo.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: cargoSelect,
    });
  }

  findByCode(code: string): Promise<CargoEntity | null> {
    return this.prisma.cargo.findFirst({
      where: {
        code,
        deletedAt: null,
      },
      select: cargoSelect,
    });
  }

  clientExists(clientId: string): Promise<boolean> {
    return this.prisma.client
      .count({
        where: {
          id: clientId,
          deletedAt: null,
          isActive: true,
        },
      })
      .then((count) => count > 0);
  }

  create(data: CreateCargoDto & { code: string }): Promise<CargoEntity> {
    return this.prisma.cargo.create({
      data: {
        ...data,
        pickupDate: data.pickupDate ? new Date(data.pickupDate) : undefined,
        expectedDelivery: data.expectedDelivery
          ? new Date(data.expectedDelivery)
          : undefined,
        status: data.status ?? CargoStatus.CREATED,
      },
      select: cargoSelect,
    });
  }

  update(id: string, data: UpdateCargoDto): Promise<CargoEntity> {
    return this.prisma.cargo.update({
      where: { id },
      data: {
        ...data,
        pickupDate: data.pickupDate ? new Date(data.pickupDate) : undefined,
        expectedDelivery: data.expectedDelivery
          ? new Date(data.expectedDelivery)
          : undefined,
      },
      select: cargoSelect,
    });
  }

  updateStatus(id: string, status: CargoStatus): Promise<CargoEntity> {
    return this.prisma.cargo.update({
      where: { id },
      data: { status },
      select: cargoSelect,
    });
  }

  softDelete(id: string): Promise<CargoEntity> {
    return this.prisma.cargo.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: CargoStatus.CANCELLED,
      },
      select: cargoSelect,
    });
  }

  private buildWhere(query: ListCargoQueryDto): Prisma.CargoWhereInput {
    return {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: 'insensitive' } },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              { origin: { contains: query.search, mode: 'insensitive' } },
              { destination: { contains: query.search, mode: 'insensitive' } },
              {
                client: {
                  companyName: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.origin
        ? { origin: { contains: query.origin, mode: 'insensitive' } }
        : {}),
      ...(query.destination
        ? {
            destination: {
              contains: query.destination,
              mode: 'insensitive',
            },
          }
        : {}),
    };
  }
}
