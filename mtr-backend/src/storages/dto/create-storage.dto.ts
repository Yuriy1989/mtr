import { IsString } from 'class-validator';

export class CreateStorageDto {
  @IsString()
  nameStorage: string;
}
