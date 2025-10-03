import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('filials')
export class Filial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nameFilial: string;
}
