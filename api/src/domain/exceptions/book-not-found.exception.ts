import { DomainException } from './domain.exception';

export class BookNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Book with id ${id} not found`);
  }
}
