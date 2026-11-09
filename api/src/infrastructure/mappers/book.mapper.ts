import { Book } from '../../domain/entities/book.entity';
import { ReadingStatus } from '../../domain/vo/reading-status';
import { BookOrmEntity } from '../entities/book.orm-entity';

export class BookMapper {
  static toDomain(entity: BookOrmEntity): Book {
    return Book.restore({
      id: entity.id,
      title: entity.title,
      author: entity.author,
      pages: entity.pages,
      genre: entity.genre,
      status: entity.status as ReadingStatus,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toOrm(book: Book): BookOrmEntity {
    const entity = new BookOrmEntity();
    entity.id = book.id;
    entity.title = book.title;
    entity.author = book.author;
    entity.pages = book.pages;
    entity.genre = book.genre;
    entity.status = book.status;
    entity.createdAt = book.createdAt;
    entity.updatedAt = book.updatedAt;
    return entity;
  }
}
