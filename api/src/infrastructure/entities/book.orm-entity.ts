import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('books')
export class BookOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'varchar' })
  author!: string;

  @Column({ type: 'integer', nullable: true })
  pages!: number | null;

  @Column({ type: 'varchar', nullable: true })
  genre!: string | null;

  @Column({ type: 'varchar', default: 'WANT_TO_READ' })
  status!: string;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
