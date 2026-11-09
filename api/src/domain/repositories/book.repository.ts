import { Book } from '../entities/book.entity';

export interface BookRepository {
  save(book: Book): Promise<Book>;
}

export const BOOK_REPOSITORY = Symbol('BOOK_REPOSITORY');
