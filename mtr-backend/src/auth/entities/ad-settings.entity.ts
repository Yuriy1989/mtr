import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ad_settings')
export class AdSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  enabled: boolean;

  @Column({ default: 'ldap://192.168.2.20:389' })
  url: string;

  @Column({ default: 'mfc.dom' })
  domain: string;

  @Column({ default: 'DC=mfc,DC=dom' })
  baseDn: string;

  @Column({ nullable: true })
  bindUsername?: string;

  @Column({ nullable: true })
  bindPassword?: string;

  @Column({ default: '${username}@${domain}' })
  userDnTemplate: string;

  @Column({ default: 5000 })
  timeout: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
