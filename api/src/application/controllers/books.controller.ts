import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { BookOutput } from '../dto/book.output';
import { CreateBookDto } from '../dto/create-book.dto';
import { CreateBookUseCase } from '../use-cases/create-book.use-case';

@Controller('books')
export class BooksController {
  constructor(private readonly createBookUseCase: CreateBookUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBookDto): Promise<BookOutput> {
    return this.createBookUseCase.execute(dto);
  }
}
