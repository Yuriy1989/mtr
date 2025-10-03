import { PartialType } from '@nestjs/mapped-types';
import { CreateFilialDto } from './create-filial.dto';
import { IsInt } from 'class-validator';

export class UpdateFilialDto extends PartialType(CreateFilialDto) {
  @IsInt()
  id: number;
}
