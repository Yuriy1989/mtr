import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Dimension } from './dimension.entity';

@Entity('dimension_alias')
export class DimensionAlias {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string; // «кг», «килограмм», «kg», «мм», «миллиметр», ...

  @ManyToOne(() => Dimension, (d) => d.aliases, { onDelete: 'CASCADE' })
  dimension: Dimension;
}
