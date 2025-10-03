import { Department } from 'src/departments/entities/department.entity';

export interface ILoginUser {
  username: string;
  password: string;
}

export interface ILoginUserAuth {
  username: string;
  password: string;
}

export interface IUser {
  id: number;
  firstName: string;
  lastName: string;
  surname: string;
  username: string;
  email: string;
  position: string;
  department?: Department;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}
