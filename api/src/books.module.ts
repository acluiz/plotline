import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksController } from './application/controllers/books.controller';
import { CreateBookUseCase } from './application/use-cases/create-book.use-case';
import { DeleteBookUseCase } from './application/use-cases/delete-book.use-case';
import { GetBookByIdUseCase } from './application/use-cases/get-book-by-id.use-case';
import { ListBooksUseCase } from './application/use-cases/list-books.use-case';
import { UpdateBookStatusUseCase } from './application/use-cases/update-book-status.use-case';
import { UpdateBookUseCase } from './application/use-cases/update-book.use-case';
import { BOOK_REPOSITORY } from './domain/repositories/book.repository';
import { BookOrmEntity } from './infrastructure/entities/book.orm-entity';
import { TypeOrmBookRepository } from './infrastructure/repositories/typeorm-book.repository';

@Module({
  imports: [TypeOrmModule.forFeature([BookOrmEntity])],
  controllers: [BooksController],
  providers: [
    CreateBookUseCase,
    ListBooksUseCase,
    GetBookByIdUseCase,
    UpdateBookUseCase,
    UpdateBookStatusUseCase,
    DeleteBookUseCase,
    { provide: BOOK_REPOSITORY, useClass: TypeOrmBookRepository },
  ],
})
export class BooksModule {}
