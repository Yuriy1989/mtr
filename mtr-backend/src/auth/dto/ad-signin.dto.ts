import { IsNotEmpty, IsString } from 'class-validator';

export class AdSigninDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
