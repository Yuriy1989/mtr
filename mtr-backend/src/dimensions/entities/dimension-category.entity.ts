import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('dimension_category')
@Unique(['key'])
export class DimensionCategory {
  @PrimaryGeneratedColumn()
  id: number;

  // технический ключ: mass, length, count, area, volume, time, energy, other
  @Column()
  key: string;

  // отображаемое имя по-русски: "Масса", "Длина" и т.д.
  @Column()
  nameRu: string;

  // запас на будущее (необязательно)
  @Column({ nullable: true })
  nameEn: string | null;
}
