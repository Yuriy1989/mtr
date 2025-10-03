import { PartialType } from '@nestjs/swagger';
import { CreateVl06Dto } from './create-vl06.dto';

export class UpdateVl06Dto extends PartialType(CreateVl06Dto) {}
