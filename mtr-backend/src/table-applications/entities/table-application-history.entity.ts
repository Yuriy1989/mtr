import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TableApplication } from './table-application.entity';

@Entity('tableApplicationHistory')
export class TableApplicationHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TableApplication, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tableApplicationId' })
  @Index()
  tableApplication: TableApplication;

  // Снимок предыдущих значений (совместим с текущей схемой TableApplication)
  @Column({ type: 'jsonb' })
  snapshot: any;

  @CreateDateColumn()
  createdAt: Date;
}
