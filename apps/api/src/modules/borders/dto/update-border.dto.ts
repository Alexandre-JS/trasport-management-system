import { PartialType } from '@nestjs/swagger';
import { CreateBorderDto } from './create-border.dto';

export class UpdateBorderDto extends PartialType(CreateBorderDto) {}
