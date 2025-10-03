import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DimensionAlias } from './dimension-alias.entity';

@Entity('dimansion')
export class Dimension {
  @PrimaryGeneratedColumn()
  id: number;

  // Человеческое имя: «Килограмм», «Штука», «Метр»
  @Column()
  nameDimension: string;

  // Короткий код: kg, g, t, pcs/шт, m, mm, km, ...
  @Column({ nullable: true })
  code: string;

  // Категория нормализации: mass, length, count, area, volume, time, energy, other
  @Column({ nullable: true })
  category: string;

  // Является ли базовой единицей категории (например, для length базовой будет "m")
  @Column({ type: 'boolean', default: false })
  isBase: boolean;

  // Коэффициент перевода к базовой единице категории (для мм → м: 0.001; для кг → кг: 1)
  @Column({ type: 'decimal', precision: 18, scale: 9, nullable: true })
  toBaseFactor: string | null;

  @OneToMany(() => DimensionAlias, (a) => a.dimension, { cascade: true })
  aliases: DimensionAlias[];
}
