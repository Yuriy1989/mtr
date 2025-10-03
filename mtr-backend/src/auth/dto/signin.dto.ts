import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

export class SigninToketDto extends PickType(CreateUserDto, [
  'username',
  'password',
]) {}

export class ResponceSigninToketDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Inl1cmEiLCJzdWIiOjMsImlhdCI6MTY4NjgyNTYwNywiZXhwIjoxNjg2ODI1OTA3fQ.dvJvyQeh4_pF7qjKOjlQZZ8IpHkGFrxiC_s4vkCJDRA',
  })
  access_token: string;
}
