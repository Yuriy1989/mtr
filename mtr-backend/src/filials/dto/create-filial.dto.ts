import { IsString } from 'class-validator';

export class CreateFilialDto {
  @IsString()
  nameFilial: string;
}
