export enum ReadingStatus {
  WANT_TO_READ = 'WANT_TO_READ',
  READING = 'READING',
  READ = 'READ',
}

export function isReadingStatus(value: unknown): value is ReadingStatus {
  return Object.values(ReadingStatus).includes(value as ReadingStatus);
}
