import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { Storage } from 'src/storages/entities/storage.entity';
import { Region } from 'src/regions/entities/region.entity';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';
import { Application } from 'src/applications/entities/application.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  surname: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  email: string;

  @Column()
  position: string;

  @ManyToOne(() => Department, (depart) => depart.users)
  department: Department;

  @ManyToOne(() => Storage, (storag) => storag.users, { nullable: true })
  storage: Storage;

  @ManyToOne(() => Region, (region) => region.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'region_id' })
  region: Region;

  @OneToMany(() => Zapiski, (zapiski) => zapiski.user)
  zapiski: Zapiski[];

  @OneToMany(() => Application, (application) => application.user)
  application: Application[];

  @Column('text', { array: true })
  roles: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
