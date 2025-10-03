import { ConflictException, Injectable } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { Repository, QueryFailedError } from 'typeorm';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    return await this.departmentRepository.save(createDepartmentDto);
  }

  async findAll() {
    return await this.departmentRepository.find();
  }

  async findByOne(id: number) {
    return await this.departmentRepository.findOneBy({ id });
  }

  async update(updateDepartmentDto: UpdateDepartmentDto) {
    const id: number = updateDepartmentDto.id;
    const data: CreateDepartmentDto = {
      nameDepartment: updateDepartmentDto.nameDepartment,
      numberDepartment: updateDepartmentDto.numberDepartment,
    };
    return await this.departmentRepository.update({ id }, data);
  }

  async remove(id: number) {
    try {
      return await this.departmentRepository.delete(id);
    } catch (e) {
      // Нарушение внешнего ключа
      if (e instanceof QueryFailedError) {
        const code = (e as any)?.driverError?.code;
        if (
          code === '23503' ||
          code === 'ER_ROW_IS_REFERENCED_2' ||
          (e as any)?.errno === 1451
        ) {
          throw new ConflictException({
            message: 'Нельзя удалить отдел: есть связанные пользователи.',
            code,
            details: (e as any)?.driverError?.constraint,
          });
        }
      }
      throw e;
    }
  }
}
