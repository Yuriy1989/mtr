import { User } from 'src/users/entities/user.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nameDepartment: string;

  @Column()
  numberDepartment: string;

  @OneToMany(() => User, (user) => user.department)
  users: User[];
}
