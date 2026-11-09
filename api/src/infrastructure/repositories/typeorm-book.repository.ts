import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../../domain/entities/book.entity';
import { BookRepository } from '../../domain/repositories/book.repository';
import { BookOrmEntity } from '../entities/book.orm-entity';
import { BookMapper } from '../mappers/book.mapper';

@Injectable()
export class TypeOrmBookRepository implements BookRepository {
  constructor(
    @InjectRepository(BookOrmEntity)
    private readonly repository: Repository<BookOrmEntity>,
  ) {}

  async save(book: Book): Promise<Book> {
    const saved = await this.repository.save(BookMapper.toOrm(book));
    return BookMapper.toDomain(saved);
  }
}
