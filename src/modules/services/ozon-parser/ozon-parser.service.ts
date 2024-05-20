import { Injectable, Logger } from '@nestjs/common';
import { type Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import Stealth from 'puppeteer-extra-plugin-stealth';
import { BookPage } from './ozon-parser.types';

@Injectable()
export class OzonParser {
  protected logger = new Logger(OzonParser.name);

  constructor() {
    puppeteer.use(Stealth());
  }

  public isOzonUrl(url: string): boolean {
    try {
      const u = new URL(url);
      return u.host === 'ozon.ru';
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }

  private async confimAge(page: Page): Promise<void> {
    const isConfirmationRequired = await page.evaluate(() =>
      // This is valid call in terms of puppeteer
      // @ts-ignore
      window.find('Подтвердите возраст'),
    );
    if (!isConfirmationRequired) return;
    const input = await page.waitForSelector('input');
    await input?.type('01012000');
    const button = await page.waitForSelector('button');
    await button?.click();
    await page.waitForNetworkIdle();
  }

  private async launchBrowser() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    return { browser, page };
  }

  private async handleCFBlock(page: Page) {
    const isBlockendByCF = await page
      .title()
      .then((title) => title === 'Доступ ограничен');

    if (!isBlockendByCF) return;

    const btn = await page.waitForSelector('button');
    btn?.click();
  }

  public async parseBook(url: string): Promise<BookPage> {
    const { browser, page } = await this.launchBrowser();
    // Open page
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForNetworkIdle();

    // Handle CF block
    await this.handleCFBlock(page);
    await page.waitForNetworkIdle();
    await this.confimAge(page);

    let titleSelector = await page.waitForSelector(
      'div[data-widget="webProductHeading"] > h1',
      {
        timeout: 3000,
      },
    );

    // This and next selecter's timeout set to 500 because page already loaded
    const descriptionSelector = await page
      .waitForSelector('#section-description', { timeout: 500 })
      .catch((e) => {
        this.logger.error(e);
        return null;
      });

    const title: string | undefined | null = await titleSelector
      ?.evaluate((el) => el.textContent)
      .then((t) => t?.trim());

    if (!title) {
      this.logger.error("Can't find title on page");
      throw new Error(
        'Что-то пошло не так со сбором информации по книге. Посмотрите логи СУКАААААА',
      );
    }

    const imageSelector = await page.waitForSelector(
      `img[fetchpriority="high"]`,
      { timeout: 1000 },
    );

    const description: string | null | undefined = await descriptionSelector
      ?.evaluate((el) => el.textContent)
      ?.then((d) => d?.replace('Описание', '').trim());

    const imageUrl = await imageSelector?.evaluate((i) => i.src);

    if (!imageUrl) {
      throw new Error('Image not found on page');
    }

    await browser.close();

    return {
      title,
      description: description ?? 'У этой книги нет описания((',
      link: url,
      image: imageUrl,
    };
  }
}
