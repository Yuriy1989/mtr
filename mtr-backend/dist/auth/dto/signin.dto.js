"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponceSigninToketDto = exports.SigninToketDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const create_user_dto_1 = require("../../users/dto/create-user.dto");
class SigninToketDto extends (0, swagger_1.PickType)(create_user_dto_1.CreateUserDto, [
    'username',
    'password',
]) {
}
exports.SigninToketDto = SigninToketDto;
class ResponceSigninToketDto {
}
exports.ResponceSigninToketDto = ResponceSigninToketDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Inl1cmEiLCJzdWIiOjMsImlhdCI6MTY4NjgyNTYwNywiZXhwIjoxNjg2ODI1OTA3fQ.dvJvyQeh4_pF7qjKOjlQZZ8IpHkGFrxiC_s4vkCJDRA',
    }),
    __metadata("design:type", String)
], ResponceSigninToketDto.prototype, "access_token", void 0);
//# sourceMappingURL=signin.dto.js.map