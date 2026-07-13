import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { CreateBorderDto } from '../dto/create-border.dto';
import { ListBordersQueryDto } from '../dto/list-borders-query.dto';
import { UpdateBorderDto } from '../dto/update-border.dto';
import { BordersRepository } from '../repository/borders.repository';

@Injectable()
export class BordersService {
  constructor(
    private readonly bordersRepository: BordersRepository,
    private readonly logger: AppLoggerService,
  ) {}

  health() {
    return this.bordersRepository.health();
  }

  async findAll(query: ListBordersQueryDto) {
    const { data, total } = await this.bordersRepository.findMany(query);

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string) {
    const border = await this.bordersRepository.findById(id);

    if (!border) {
      throw new NotFoundException('Border not found');
    }

    return border;
  }

  async create(dto: CreateBorderDto) {
    await this.ensureNameAvailable(dto.name);
    const border = await this.bordersRepository.create(dto);

    this.logger.log(`Border created: ${border.id}`, BordersService.name);

    return border;
  }

  async update(id: string, dto: UpdateBorderDto) {
    await this.ensureBorderExists(id);

    if (dto.name) {
      await this.ensureNameAvailable(dto.name, id);
    }

    const border = await this.bordersRepository.update(id, dto);

    this.logger.log(`Border updated: ${border.id}`, BordersService.name);

    return border;
  }

  async remove(id: string) {
    await this.ensureBorderExists(id);
    const border = await this.bordersRepository.softDelete(id);

    this.logger.log(`Border deleted: ${border.id}`, BordersService.name);

    return border;
  }

  private async ensureBorderExists(id: string) {
    const border = await this.bordersRepository.findById(id);

    if (!border) {
      throw new NotFoundException('Border not found');
    }

    return border;
  }

  private async ensureNameAvailable(name: string, currentBorderId?: string) {
    const existingBorder = await this.bordersRepository.findByName(name);

    if (existingBorder && existingBorder.id !== currentBorderId) {
      throw new ConflictException('Border name already in use');
    }
  }
}
