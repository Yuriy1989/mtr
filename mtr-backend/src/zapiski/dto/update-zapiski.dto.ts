import { PartialType } from '@nestjs/swagger';
import { CreateZapiskiDto } from './create-zapiski.dto';

export class UpdateZapiskiDto extends PartialType(CreateZapiskiDto) {}
