import { Inject, Injectable } from '@nestjs/common';
import { BookNotFoundException } from '../../domain/exceptions/book-not-found.exception';
import {
  BOOK_REPOSITORY,
  type BookRepository,
} from '../../domain/repositories/book.repository';
import { ReadingStatus } from '../../domain/vo/reading-status';
import { BookOutput, toBookOutput } from '../dto/book.output';

@Injectable()
export class UpdateBookStatusUseCase {
  constructor(
    @Inject(BOOK_REPOSITORY)
    private readonly bookRepository: BookRepository,
  ) {}

  async execute(id: string, status: ReadingStatus): Promise<BookOutput> {
    const book = await this.bookRepository.findById(id);
    if (!book) {
      throw new BookNotFoundException(id);
    }

    book.changeStatus(status);

    const saved = await this.bookRepository.save(book);
    return toBookOutput(saved);
  }
}
