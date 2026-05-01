import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FindOneOptions, Raw, Repository } from 'typeorm';
import { createHash } from 'src/helpers/hash';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.findByUsername(createUserDto.username);
    if (existingUser) {
      throw new ConflictException('Пользователь с таким логином уже существует');
    }

    const password = createUserDto.password || randomBytes(32).toString('hex');
    const passwordHash = await createHash(password);
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

  //выгрузка информации о пользователе с паролем, нужно для авторизации
  async findById(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    return user;
  }

  async findOne(query: FindOneOptions<User>) {
    return await this.userRepository.findOneOrFail(query);
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        username: Raw((alias) => `LOWER(${alias}) = LOWER(:username)`, {
          username,
        }),
      },
    });
    return user;
  }

  async upsertAdUser(data: any) {
    const user = await this.findByUsername(data.username);
    if (user) {
      throw new ConflictException('Пользователь с таким логином уже существует');
    }

    const payload = {
      ...data,
      authProvider: 'ad',
      password: undefined,
    };

    const passwordHash = await createHash(randomBytes(32).toString('hex'));
    return this.userRepository.save(
      this.userRepository.create({
        ...payload,
        password: passwordHash,
      }),
    );
  }

  async update(id: number, updateUserDto: any) {
    const { password } = updateUserDto;
    const user = await this.findById(id);
    if (password) {
      updateUserDto.password = await createHash(password);
    } else {
      // если пароль не передан, не трогаем старый
      delete updateUserDto.password;
    }
    return this.userRepository.save({ ...user, ...updateUserDto });
  }

  async remove(id: number) {
    return await this.userRepository.delete({ id });
  }
}
