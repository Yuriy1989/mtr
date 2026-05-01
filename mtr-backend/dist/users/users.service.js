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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("./entities/user.entity");
const typeorm_2 = require("typeorm");
const hash_1 = require("../helpers/hash");
const crypto_1 = require("crypto");
let UsersService = class UsersService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async create(createUserDto) {
        const existingUser = await this.findByUsername(createUserDto.username);
        if (existingUser) {
            throw new common_1.ConflictException('Пользователь с таким логином уже существует');
        }
        const password = createUserDto.password || (0, crypto_1.randomBytes)(32).toString('hex');
        const passwordHash = await (0, hash_1.createHash)(password);
        const user = this.userRepository.create({
            ...createUserDto,
            password: passwordHash,
        });
        return await this.userRepository.save(user);
    }
    async findAll() {
        const data = await this.userRepository.find({
            relations: {
                department: true,
                storage: true,
                region: true,
            },
        });
        return data;
    }
    async findById(id) {
        const user = await this.userRepository.findOneBy({ id });
        return user;
    }
    async findOne(query) {
        return await this.userRepository.findOneOrFail(query);
    }
    async findByUsername(username) {
        const user = await this.userRepository.findOne({
            where: {
                username: (0, typeorm_2.Raw)((alias) => `LOWER(${alias}) = LOWER(:username)`, {
                    username,
                }),
            },
        });
        return user;
    }
    async upsertAdUser(data) {
        const user = await this.findByUsername(data.username);
        if (user) {
            throw new common_1.ConflictException('Пользователь с таким логином уже существует');
        }
        const payload = {
            ...data,
            authProvider: 'ad',
            password: undefined,
        };
        const passwordHash = await (0, hash_1.createHash)((0, crypto_1.randomBytes)(32).toString('hex'));
        return this.userRepository.save(this.userRepository.create({
            ...payload,
            password: passwordHash,
        }));
    }
    async update(id, updateUserDto) {
        const { password } = updateUserDto;
        const user = await this.findById(id);
        if (password) {
            updateUserDto.password = await (0, hash_1.createHash)(password);
        }
        else {
            delete updateUserDto.password;
        }
        return this.userRepository.save({ ...user, ...updateUserDto });
    }
    async remove(id) {
        return await this.userRepository.delete({ id });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map