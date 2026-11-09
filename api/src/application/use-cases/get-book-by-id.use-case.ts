import { Inject, Injectable } from '@nestjs/common';
import { BookNotFoundException } from '../../domain/exceptions/book-not-found.exception';
import {
  BOOK_REPOSITORY,
  type BookRepository,
} from '../../domain/repositories/book.repository';
import { BookOutput, toBookOutput } from '../dto/book.output';

@Injectable()
export class GetBookByIdUseCase {
  constructor(
    @Inject(BOOK_REPOSITORY)
    private readonly bookRepository: BookRepository,
  ) {}

  async execute(id: string): Promise<BookOutput> {
    const book = await this.bookRepository.findById(id);
    if (!book) {
      throw new BookNotFoundException(id);
    }
    return toBookOutput(book);
  }
}
