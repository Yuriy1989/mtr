import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tableVL06')
export class Vl06 {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  supply: string; // "Поставка"

  @Column({ nullable: true })
  factory: string; // "Завод"

  @Column({ nullable: true })
  storage: string; // "Склад"

  @Column({ type: 'date', nullable: true })
  vacationOfTheMaterial: Date | null; // "Д/Отпуска материала"

  @Column({ nullable: true })
  material: string; // "Материал"

  @Column({ nullable: true })
  party: string; // "Партия"

  @Column({ nullable: true })
  nameMTR: string; // "Название"

  @Column({ nullable: true })
  basic: string; // "Базовая ЕИ"

  @Column({ type: 'double precision', nullable: true })
  supplyVolume: number | null;

  @Column({ nullable: true })
  address: string; // "Имя получателя материала"

  @Column({ nullable: true })
  created: string; // "Создал"

  @OneToMany(() => MtrList, (link) => link.vl06)
  mtrList: MtrList[];

  @Column({ nullable: true })
  status: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
