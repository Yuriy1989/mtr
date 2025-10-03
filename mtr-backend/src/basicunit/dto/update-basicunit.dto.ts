import { PartialType } from '@nestjs/swagger';
import { CreateBasicunitDto } from './create-basicunit.dto';

export class UpdateBasicunitDto extends PartialType(CreateBasicunitDto) {}
