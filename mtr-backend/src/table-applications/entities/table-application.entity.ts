import { IsEmpty } from 'class-validator';
import { Application } from 'src/applications/entities/application.entity';
import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tableApplication')
@Unique(['listApp', 'mtrList'])
export class TableApplication {
  @PrimaryGeneratedColumn()
  id: number;

  // --- связи с Приложение 3 а уже через нее со Служебной запиской ---
  @ManyToOne(() => Application, (h) => h.tableApp, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationId' })
  @Index()
  listApp: Application;

  //привязка к строке MTR
  @ManyToOne(() => MtrList, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'mtrListId' })
  @Index()
  mtrList: MtrList;

  // --- поля доп. данных по Приложению №3 ---
  @Column({ nullable: true }) // Длина одной единицы
  lengthObject: string;

  @Column({ nullable: true }) // Ширина одной единицы
  width: string;

  @Column({ nullable: true }) // Высота одной единицы
  height: string;

  @Column({ nullable: true }) // Вес одной единицы
  massa: string;

  @Column({ nullable: true }) // Дата заявки на отгрузку
  dateRequest: string;

  @Column({ nullable: true }) // Заявка на контейнер/автотранспорт (тип)
  transport: string; // 'container' | 'auto' | null

  @Column({ nullable: true }) // Дата отгрузки
  dateShipment: string;

  @Column({ nullable: true }) // Груз сформирован в контейнер/автотранспорт (тип)
  format: string; // 'container' | 'auto' | null

  @Column({ nullable: true }) // Номер контейнер/автотранспорт (НОВОЕ)
  transportNumber: string;

  @Column({ nullable: true }) // Отгружено (кол-во)
  discarded: string;

  @Column({ nullable: true }) // Остаток
  remainder: string;

  @Column({ nullable: true }) // Транзитный/конечный получатель
  transit: string;

  @Column({ nullable: true }) // № накладной
  numberM11: string;

  @Column({ nullable: true }) // Дата накладной
  dateM11: string;

  @Column({ nullable: true }) // Примечание
  addNote: string;

  @IsEmpty()
  @CreateDateColumn()
  createdAt: Date;

  @IsEmpty()
  @UpdateDateColumn()
  updatedAt: Date;
}
