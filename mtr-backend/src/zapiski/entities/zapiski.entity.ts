import { Application } from 'src/applications/entities/application.entity';
import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  Column,
  OneToOne,
} from 'typeorm';

@Entity('tableZapiski')
export class Zapiski {
  @PrimaryGeneratedColumn()
  id: number;

  // --- связи с Приложением 3---
  @OneToOne(() => Application, (a) => a.zapiska)
  application: Application | null;

  // массив id регионов (из таблицы regions)
  @Column('int', { array: true, nullable: true })
  region: number[];

  @OneToMany(() => MtrList, (m) => m.zapiska, { cascade: true })
  mtrList: MtrList[];

  @ManyToOne(() => User, (user) => user.zapiski, {
    onDelete: 'CASCADE',
  })
  user: User | null;

  @Column({ nullable: true })
  status: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
