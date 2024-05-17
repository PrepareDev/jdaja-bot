import { Injectable } from '@nestjs/common';
import { BookPage } from '../ozon-parser/ozon-parser.types';

@Injectable()
export class FormatterService {
  formatBookResponse(book: BookPage) {
    return `*${book.title}*\n\n*Описание*\n\n${book?.description?.slice(0, 700) ?? 'Нет описания'}${book?.description?.length > 700 ? '...' : ''}\n\n[Ссылка на OZON](${book.link})`;
  }
}
