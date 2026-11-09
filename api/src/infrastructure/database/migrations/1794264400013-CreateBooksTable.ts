import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateBooksTable1794264400013 implements MigrationInterface {
  name = 'CreateBooksTable1794264400013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'books',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isNullable: false,
            default: 'gen_random_uuid()',
          },
          { name: 'title', type: 'varchar', isNullable: false },
          { name: 'author', type: 'varchar', isNullable: false },
          { name: 'pages', type: 'integer', isNullable: true },
          { name: 'genre', type: 'varchar', isNullable: true },
          {
            name: 'status',
            type: 'varchar',
            isNullable: false,
            default: "'WANT_TO_READ'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('books');
  }
}
