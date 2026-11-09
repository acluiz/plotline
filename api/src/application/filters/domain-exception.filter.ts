import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { BookNotFoundException } from '../../domain/exceptions/book-not-found.exception';
import { InvalidBookException } from '../../domain/exceptions/invalid-book.exception';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter<DomainException> {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const httpException = this.toHttpException(exception);
    response
      .status(httpException.getStatus())
      .json(httpException.getResponse());
  }

  private toHttpException(exception: DomainException): HttpException {
    if (exception instanceof InvalidBookException) {
      return new BadRequestException(exception.message);
    }
    if (exception instanceof BookNotFoundException) {
      return new NotFoundException(exception.message);
    }
    return new InternalServerErrorException();
  }
}
