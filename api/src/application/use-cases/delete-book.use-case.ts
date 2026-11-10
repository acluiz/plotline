import { Inject, Injectable } from '@nestjs/common';
import { BookNotFoundException } from '../../domain/exceptions/book-not-found.exception';
import {
  BOOK_REPOSITORY,
  type BookRepository,
} from '../../domain/repositories/book.repository';

@Injectable()
export class DeleteBookUseCase {
  constructor(
    @Inject(BOOK_REPOSITORY)
    private readonly bookRepository: BookRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.bookRepository.delete(id);
    if (!deleted) {
      throw new BookNotFoundException(id);
    }
  }
}
