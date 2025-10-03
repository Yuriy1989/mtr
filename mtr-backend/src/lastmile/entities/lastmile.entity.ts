import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Application } from 'src/applications/entities/application.entity';
import { TableApplication } from 'src/table-applications/entities/table-application.entity';

@Entity('lastmile_decisions')
export class LastmileDecision {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @ManyToOne(() => TableApplication, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'row_id' })
  row: TableApplication;

  @Column({ type: 'boolean', default: true })
  accepted: boolean; // true = Принят, false = Не принят

  @Column({ type: 'text', nullable: true })
  reason: string | null; // причина, если не принят

  @CreateDateColumn()
  createdAt: Date; // ← дата решения

  @UpdateDateColumn()
  updatedAt: Date;
}
