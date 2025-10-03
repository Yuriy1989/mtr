// src/table-applications/dto/update-table-application.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateTableApplicationDto } from './create-table-application.dto';

export class UpdateTableApplicationDto extends PartialType(
  CreateTableApplicationDto,
) {}
