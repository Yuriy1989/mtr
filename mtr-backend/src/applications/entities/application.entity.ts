import { IsEmpty } from 'class-validator';
import { TableApplication } from 'src/table-applications/entities/table-application.entity';
import { User } from 'src/users/entities/user.entity';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('application')
@Unique(['zapiska'])
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  // --- связи со служебной запиской ---
  @OneToOne(() => Zapiski, { eager: true })
  @JoinColumn({ name: 'zapiskaId' })
  zapiska: Zapiski;

  // --- связи со строками Приложения ---
  @OneToMany(() => TableApplication, (h) => h.listApp, { cascade: true })
  tableApp: TableApplication[];

  @ManyToOne(() => User, (user) => user.application, { onDelete: 'CASCADE' })
  user: User | null;

  @Column({ nullable: true })
  status: number;

  @Column({ type: 'boolean', default: false })
  sendLock: boolean;

  @IsEmpty()
  @CreateDateColumn()
  createdAt: Date;

  @IsEmpty()
  @UpdateDateColumn()
  updatedAt: Date;
}
