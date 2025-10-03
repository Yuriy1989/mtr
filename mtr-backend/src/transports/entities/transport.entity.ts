import {
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
} from 'typeorm';
import { Application } from 'src/applications/entities/application.entity';

export enum TransportStatus {
  PENDING = 10, // На согласование
  APPROVED = 20, // Согласовано
  REJECTED = 30, // Не согласовано
}

@Entity('transport')
export class Transport {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Application, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationId' })
  @Index()
  application: Application;

  @Column({ type: 'int', default: TransportStatus.PENDING })
  status: number;

  @Column({ type: 'text', nullable: true })
  rejectReason: string | null;

  @Column({ type: 'int', default: 1 })
  wave: number;

  // ---- Срез / витрина для списков ----
  @Column({ type: 'double precision', nullable: true })
  supplyVolumeTotal: number | null; // сумма VL06.supplyVolume

  @Column({ type: 'double precision', nullable: true })
  shippedTotal: number | null; // сумма TableApplication.discarded

  @Column({ type: 'text', nullable: true })
  recipientsSummary: string | null; // список получателей (transit)

  @Column({ type: 'text', nullable: true })
  cargoFormedSummary: string | null; // формат/номера (конт./авто)

  @Column({ type: 'text', nullable: true })
  materialsSummary: string | null; // кратко: “N позиций: A, B, C…”

  @Column('text', { array: true, nullable: true })
  storages: string[] | null; // набор складов (для Направления)

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
