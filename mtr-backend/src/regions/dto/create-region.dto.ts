import { IsString } from 'class-validator';

export class CreateRegionDto {
  @IsString()
  nameRegion: string;
}
