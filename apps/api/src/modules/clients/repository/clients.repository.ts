import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateClientDto } from '../dto/create-client.dto';
import { ListClientsQueryDto } from '../dto/list-clients-query.dto';
import { UpdateClientDto } from '../dto/update-client.dto';
import { ClientEntity } from '../entities/client.entity';

const clientSelect = {
  id: true,
  companyName: true,
  contactName: true,
  nuit: true,
  phone: true,
  email: true,
  address: true,
  city: true,
  province: true,
  country: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientSelect;

@Injectable()
export class ClientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  health() {
    return { module: 'clients', status: 'ready' };
  }

  async findMany(query: ListClientsQueryDto): Promise<{
    data: ClientEntity[];
    total: number;
  }> {
    const where = this.buildWhere(query);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        select: clientSelect,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { data, total };
  }

  findById(id: string): Promise<ClientEntity | null> {
    return this.prisma.client.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: clientSelect,
    });
  }

  create(data: CreateClientDto): Promise<ClientEntity> {
    return this.prisma.client.create({
      data: {
        ...data,
        country: data.country ?? 'Moçambique',
        isActive: data.isActive ?? true,
      },
      select: clientSelect,
    });
  }

  update(id: string, data: UpdateClientDto): Promise<ClientEntity> {
    return this.prisma.client.update({
      where: { id },
      data,
      select: clientSelect,
    });
  }

  setActive(id: string, isActive: boolean): Promise<ClientEntity> {
    return this.prisma.client.update({
      where: { id },
      data: { isActive },
      select: clientSelect,
    });
  }

  softDelete(id: string): Promise<ClientEntity> {
    return this.prisma.client.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
      select: clientSelect,
    });
  }

  async getHistory(id: string) {
    return this.prisma.client.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        cargos: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            code: true,
            origin: true,
            destination: true,
            status: true,
            createdAt: true,
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
              },
            },
          },
        },
      },
    });
  }

  private buildWhere(query: ListClientsQueryDto): Prisma.ClientWhereInput {
    return {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              {
                companyName: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                contactName: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
              { nuit: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.city
        ? { city: { contains: query.city, mode: 'insensitive' } }
        : {}),
      ...(query.province
        ? { province: { contains: query.province, mode: 'insensitive' } }
        : {}),
      ...(query.country
        ? { country: { contains: query.country, mode: 'insensitive' } }
        : {}),
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    };
  }
}
