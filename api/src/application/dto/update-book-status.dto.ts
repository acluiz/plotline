import { IsEnum } from 'class-validator';
import { ReadingStatus } from '../../domain/vo/reading-status';

export class UpdateBookStatusDto {
  @IsEnum(ReadingStatus)
  status!: ReadingStatus;
}
