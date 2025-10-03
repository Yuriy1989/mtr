import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { createHash } from 'src/helpers/hash';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password } = createUserDto;
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
    const user = await this.userRepository.findOneBy({ username });
    return user;
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
