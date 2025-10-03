import { PartialType } from '@nestjs/swagger';
import { CreateMtrListDto } from './create-mtr-list.dto';

export class UpdateMtrListDto extends PartialType(CreateMtrListDto) {}
