import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';

import { BookOutput } from '../dto/book.output';
import { CreateBookDto } from '../dto/create-book.dto';

import { CreateBookUseCase } from '../use-cases/create-book.use-case';
import { ListBooksUseCase } from '../use-cases/list-books.use-case';

@Controller('books')
export class BooksController {
  constructor(
    private readonly listBooksUseCase: ListBooksUseCase,
    private readonly createBookUseCase: CreateBookUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBookDto): Promise<BookOutput> {
    return this.createBookUseCase.execute(dto);
  }

  @Get()
  list(): Promise<BookOutput[]> {
    return this.listBooksUseCase.execute();
  }
}
