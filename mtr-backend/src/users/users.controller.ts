import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { DepartmentsService } from 'src/departments/departments.service';
import { AuthUser } from 'src/common/decorators/user.decorator';
import { JwtGuard } from 'src/auth/guard/jwtAuth.guard';

interface IidUser {
  id: number;
}

@UseGuards(JwtGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly departmentService: DepartmentsService,
  ) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      success: true,
      data: user,
    };
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(+id);
  }

  @Get('me')
  findOwn(@AuthUser() user) {
    return this.usersService.findOne({
      where: { id: user.id },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        surname: true,
      },
    });
  }

  @Patch()
  async update(@Body() updateUserDto: any) {
    const updateUser = await this.usersService.update(
      updateUserDto?.id,
      updateUserDto,
    );
    return {
      success: true,
      data: updateUser,
    };
  }

  @Delete()
  remove(@Body() data: IidUser) {
    return this.usersService.remove(data.id);
  }
}
