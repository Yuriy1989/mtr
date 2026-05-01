import { CreateUserDto } from 'src/users/dto/create-user.dto';
declare const SigninToketDto_base: import("@nestjs/common").Type<Pick<CreateUserDto, "username" | "password">>;
export declare class SigninToketDto extends SigninToketDto_base {
}
export declare class ResponceSigninToketDto {
    access_token: string;
}
export {};
