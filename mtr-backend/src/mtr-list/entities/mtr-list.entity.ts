import { Vl06 } from 'src/vl06/entities/vl06.entity';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

@Entity('mtrList')
@Unique(['zapiska', 'vl06'])
export class MtrList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  express: string;

  @Column({ nullable: true })
  note: string;

  // NEW: Наименование объекта ремонта
  @Column({ nullable: true })
  repairObjectName: string;

  @ManyToOne(() => Zapiski, (z) => z.mtrList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zapiskiId' })
  zapiska: Zapiski;

  @ManyToOne(() => Vl06, (z) => z.mtrList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vl06' })
  vl06: Vl06;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
